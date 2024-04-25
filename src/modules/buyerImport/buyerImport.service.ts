import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, getManager } from 'typeorm';
import { Logger } from '../../core/utils';
import { BuyerImportUpdateRequestDto, GetFairRegistrationTaskReqDto } from './dto/buyerImportRequest.dto';
import { BuyerImportCreateTaskRequestDto } from './dto/buyerImportCreateTaskRequest.dto';
import { BuyerImportCreateTaskResponseDto } from './dto/buyerImportCreateTaskResponse.dto';
import { BuyerImportGetPresignedUrlResponseDto } from './dto/buyerImportGetPresignedUrlResponse.dto';
import { FairRegistrationImportTask } from '../../dao/FairRegistrationImportTask';
import { VepError } from '../../core/exception/exception';
import { VepErrorMsg } from '../../config/exception-constant';
import { S3Service } from '../../core/utils/s3.service';
import { DatabaseService } from '../../core/database/database.service';

import { v4 } from 'uuid';
import {
  participantTypeMap,
} from '../../config/constant';
import { constant } from '../../config/constant';
import { ConfigService } from '@nestjs/config';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { GetNextSerialNumberReqDto } from './dto/getNextSerialNumberRequest.dto';
import { FairRegistration } from '../../dao/FairRegistration';

@Injectable()
export class BuyerImportService {
  bucket: string = '';
  path: string = '';
  queuePath: string = '';
  failureReportPath: string = '';
  vepTemplatePath: string = '';
  contentType: string = '';
  visitorTypeToParticipantTypeMapping: participantTypeMap = {};
  constructor(
    private logger: Logger,
    @InjectRepository(FairRegistrationImportTask)
    private FairRegistrationImportTaskRepository: Repository<FairRegistrationImportTask>,
    @InjectRepository(FairRegistration)
    private FairRegistrationRepository: Repository<FairRegistration>,
    protected s3Service: S3Service,
    private configService: ConfigService,
    private databaseService: DatabaseService
  ) {
    this.logger.setContext(BuyerImportService.name);
    this.bucket = this.configService.get<string>('buyerImport.BUCKET') || '';
    this.path = this.configService.get<string>('buyerImport.PATH') || '';
    this.queuePath = this.configService.get<string>('buyerImport.QUEUE_PATH') || '';
    this.failureReportPath = this.configService.get<string>('buyerImport.FAILURE_REPORT_PATH') || '';
    this.vepTemplatePath = this.configService.get<string>('buyerImport.IMPORT_VEP_TEMPLATE_PATH') || '';
    this.contentType = this.configService.get<string>('buyerImport.CONTENT_TYPE') || '';
  }

  generateFairRegSQLQueryAndParam = (
    type: "COUNT" | "SELECT",
    pageIndexing: { offset: number, limit: number, reversed: boolean } | null,
    query: GetFairRegistrationTaskReqDto,
    currentUser: AdminUserDto
    ): { sql: string, param: any[] } => {
    const result = {
        sql: "",
        param: [] as any[]
    }

    switch (type) {
        case "COUNT":
            result.sql = `SELECT COUNT(*) AS recordCount FROM vepFairDb.fairRegistrationImportTask`
            break;
        case "SELECT":
            result.sql = `SELECT * FROM vepFairDb.fairRegistrationImportTask`
            break;
    }
        // where condition
        // only show the result when user has the fair code access tight
        // you may call getOpenFairs() to check the correctness of fairAccessList
        let userFairCode = currentUser.fairAccessList?.replace(/\s/, "")
        if(userFairCode && userFairCode.match(/^[\w\d,-_]+$/)){
          let fairCode = `'${userFairCode.split(',').join("','")}'`
          result.sql += ` WHERE fairCode IN ( ${fairCode} )`
        }
        // sorting 
        if (type == "SELECT") {
            this.contructFairRegSortingSQL(query, result, pageIndexing)
        }
        return result
  }

  contructFairRegSortingSQL = (
    query: GetFairRegistrationTaskReqDto,
    sqlQueryAndParam: { sql: string, param: any[] },
    pageIndexing: { offset: number, limit: number, reversed: boolean } | null
  ) => {

    let sortingField;
    if (pageIndexing?.reversed){
      sortingField = 'ASC'
    } else {
      sortingField = 'DESC'
    }

    sqlQueryAndParam.sql += ` ORDER BY creationTime ${sortingField}`
    if (pageIndexing) {
        sqlQueryAndParam.sql += ` LIMIT ${pageIndexing.limit} OFFSET ${pageIndexing.offset}`
    }
  }

  getBuyerImportTasks = async (currentUser: AdminUserDto, query: GetFairRegistrationTaskReqDto): Promise<Optional<any>> => {
    try { 
      const queryCountObj = this.generateFairRegSQLQueryAndParam("COUNT", null, query, currentUser)
      const countResult = await this.FairRegistrationImportTaskRepository.query(queryCountObj.sql, queryCountObj.param)
      const filteredRecordCount = countResult[0]["recordCount"]
      if (filteredRecordCount == 0){
        throw new VepError(VepErrorMsg.Registration_Task_List_Not_Found_Error);
      }
      const pageLimitOffSetObj = pageIndex(filteredRecordCount, query.size, query.pageNum)
      const querySelectObj = this.generateFairRegSQLQueryAndParam("SELECT", pageLimitOffSetObj, query, currentUser)
      const queryResult = await this.FairRegistrationImportTaskRepository.query(querySelectObj.sql, querySelectObj.param)
      return {
        total_size: filteredRecordCount,
        data: queryResult
      }
    } catch (error) {
      commonExceptionHandling(error);
    }
  };
  
  createBuyerImportTask = async (currentUser: AdminUserDto, query: BuyerImportCreateTaskRequestDto): Promise<Optional<any>> => {
    try {
      const taskId = v4();
      const uploadFileS3ObjectRefId = v4();

      const actionType = query.actionType;
      const fairCode = query.fairCode;
      const fiscalYear = query.fiscalYear;
      const projectYear = query.projectYear;
      const visitorTypeCode = query.visitorType;
      const sourceTypeCode = query.sourceType;
      let inputSerialNumberStart = null
      if(query.serialNumberStart && query.serialNumberStart != 0) {
        inputSerialNumberStart = query.serialNumberStart
      }

      if (isEmpty(actionType)) {
        throw new VepError(VepErrorMsg.Buyer_Import_Missing_ActionType_Error, 'Missing Action Type');
      }

      if (isEmpty(fairCode)) {
        throw new VepError(VepErrorMsg.Buyer_Import_Missing_FairCode_Error, 'Missing Fair');
      }

      if (isEmpty(projectYear)) {
        throw new VepError(VepErrorMsg.Buyer_Import_Missing_ProjectYear_Error, 'Missing Project Year');
      }

      if (isEmpty(fiscalYear)) {
        throw new VepError(VepErrorMsg.Buyer_Import_Missing_FiscalYear_Error, 'Missing Fiscal Year');
      }

      // task param
      let participantTypeId = 0;
      let tier = "";
      await this.fetchVisitorTypeToParticipantTypeMapping()

      switch (actionType) {
        case constant.actionType.INSERT_PAST_BUYER: {
          // without registration no.

          if (isEmpty(sourceTypeCode)) {
            throw new VepError(VepErrorMsg.Buyer_Import_Missing_SourceType_Error, 'Missing Source Type');
          }

          if (isEmpty(visitorTypeCode)) {
            throw new VepError(VepErrorMsg.Buyer_Import_Missing_VisitorType_Error, 'Missing Visitor Type');
          }

          // check visitorType
          // check participantType
          participantTypeId = this.visitorTypeToParticipantTypeMapping[visitorTypeCode].participantType;
          tier = this.visitorTypeToParticipantTypeMapping[visitorTypeCode].tier;
          if (!(visitorTypeCode in this.visitorTypeToParticipantTypeMapping)) {
            throw new VepError(VepErrorMsg.Buyer_Import_Invalid_Visitor_Type, 'Invalid visitor type')
          }
          break;
        }
        case constant.actionType.INSERT_ONSITE_BUYER: {
          // with registration no.
          participantTypeId = 99; // Reserved
          break;
        }
        case constant.actionType.VEP_INSERT_BUYER: {
          if (isEmpty(sourceTypeCode)) {
            throw new VepError(VepErrorMsg.Buyer_Import_Missing_SourceType_Error, 'Missing Source Type');
          }

          if (isEmpty(visitorTypeCode)) {
            throw new VepError(VepErrorMsg.Buyer_Import_Missing_VisitorType_Error, 'Missing Visitor Type');
          }

          participantTypeId = this.visitorTypeToParticipantTypeMapping[visitorTypeCode].participantType;
          tier = this.visitorTypeToParticipantTypeMapping[visitorTypeCode].tier;

          if (!(visitorTypeCode in this.visitorTypeToParticipantTypeMapping)) {
            throw new VepError(VepErrorMsg.Buyer_Import_Invalid_Visitor_Type, 'Invalid visitor type')
          }
          break;
        }
        case constant.actionType.VEP_UPDATE_BUYER: {
          participantTypeId = 99; // Reserved
          break;
        }
        case constant.actionType.INSERT_BUYER_WITH_BM_TENTATIVE: {
          participantTypeId = 99; // Reserved
          break;
        }
        default: {
          throw new VepError(VepErrorMsg.Buyer_Import_Unknown_Action_Type_Error, 'Unknown Action Type')
        }
      }

      const key = this.queuePath + uploadFileS3ObjectRefId;
      const url = await this.s3Service.getPresignedPutObjectUrl(this.bucket, key, this.contentType);

      // TO DO
      // - Validate fairCode
      // - Validate fiscalYear
      // - Validate projectYear
      // - Validate actionType
      // - Validate sourceType
      // - Validate visitorType
      // - Validate participantTypeId
      // - Validate tier
      let task: any = {
        taskId: taskId,
        originalFileName: query.originalFileName,
        uploadFileS3ObjectRefId: uploadFileS3ObjectRefId,
        failureReportS3ObjectRefId: "",
        fairCode: fairCode,
        fiscalYear: fiscalYear,
        projectYear: projectYear,
        actionType: actionType,
        sourceType: sourceTypeCode,
        visitorType: visitorTypeCode,
        participantTypeId: participantTypeId,
        tier: tier,
        serialNumberStart: inputSerialNumberStart,
        // numberOfRow: 0,
        status: constant.taskStatus.UPLOADING,
        createdBy: currentUser.emailAddress || constant.defaultUserName.SYSTEM,
        lastUpdatedBy: constant.defaultUserName.SYSTEM
      };
      
      const taskCreated: FairRegistrationImportTask = await this.FairRegistrationImportTaskRepository.save(task)
            .catch((error) => { 
              throw new VepError(VepErrorMsg.Create_Registration_Task_Error, error.message)
            });

      if (taskCreated) {
        let response: BuyerImportCreateTaskResponseDto = {
          presignedUrl: url,
          taskId: taskCreated?.taskId || '',
          originalFileName: taskCreated.originalFileName || '',
          uploadFileS3ObjectRefId: taskCreated.uploadFileS3ObjectRefId || '',
          fairCode: taskCreated.fairCode || '',
          fiscalYear: taskCreated.fiscalYear || '',
          projectYear: taskCreated.projectYear || '',
          actionType: taskCreated.actionType || '',
          sourceType: taskCreated.sourceType || '',
          visitorType: taskCreated.visitorType || '',
          participantTypeId: taskCreated.participantTypeId || '',
          tier: taskCreated.tier || '',
          serialNumberStart: taskCreated.serialNumberStart ? taskCreated.serialNumberStart.toString() : "",
          numberOfRow: taskCreated.numberOfRow ? taskCreated.numberOfRow.toString() : "",
          status: taskCreated.status || '',
          createdBy: taskCreated.createdBy || '',
          creationTime: taskCreated.creationTime ? taskCreated.creationTime.toUTCString() : ""
        }

        return response;
      } else {
        throw new VepError(VepErrorMsg.Buyer_Import_Unknown_Create_Task_Error, "Unknown Buyer Import Task Creation Error");
      }
    } catch (error) {
      commonExceptionHandling(error);
    }

      //return { url: url };
      // return await this.FairRegistrationImportTaskRepository.save(query).catch((error) => { throw new VepError    (VepErrorMsg.Create_Registration_Task_Error, error.message)}) ;
      // } catch (error) {
      //     commonExceptionHandling(error);
      // }

  };

  updateRegistrationTaskStatus = async (headers: any, taskId: string, query: BuyerImportUpdateRequestDto): Promise<any> => {
    try {
      this.logger.log('The task Id  is ' + JSON.stringify(taskId) + ' and the headers is: ' + JSON.stringify(headers));
      const registrationRecord = await this.FairRegistrationImportTaskRepository.find({
        where: [{
          taskId: taskId,
        }]
      })

      if (registrationRecord != undefined && registrationRecord.length > 0){
        await this.FairRegistrationImportTaskRepository.update({ taskId: taskId }, { status: query.status }).catch((error) => {
          throw new VepError(VepErrorMsg.Database_Error, error.message);
        });
        return await this.FairRegistrationImportTaskRepository.findOne(taskId);
      } else {
          throw new VepError(VepErrorMsg.Task_Id_Not_Found_Error);
      }
    } catch (error) {
        commonExceptionHandling(error);
    }
  };

  getTaskByTaskId = async (taskId: string): Promise<FairRegistrationImportTask | undefined> => {
    const queryParam = {
      where: {
        taskId: taskId
      }
    }

    const task: FairRegistrationImportTask | undefined = await this.databaseService.findOne(this.FairRegistrationImportTaskRepository, queryParam, constant.segmentName.QUERY_FAIR_REGISTRATION_IMPORT_TASK_BY_TASK_ID);
    console.log(task);
    return task;
  }

  getOriginalFilePresignedUrl = async (taskId: string): Promise<BuyerImportGetPresignedUrlResponseDto> => {
    const task: FairRegistrationImportTask | undefined = await this.getTaskByTaskId(taskId);

    let url = "";

    if (task?.uploadFileS3ObjectRefId) {
      const key = this.queuePath + task.uploadFileS3ObjectRefId;
      url = await this.s3Service.getPresignedGetObjectUrl(this.bucket, key);
    }

    let response: BuyerImportGetPresignedUrlResponseDto = {
      taskId: taskId,
      presignedUrl: url
    }

    return response;
  }

  getFailureReportDownloadUrl = async (taskId: string): Promise<BuyerImportGetPresignedUrlResponseDto> => {

    const task: FairRegistrationImportTask | undefined = await this.getTaskByTaskId(taskId);

    let url = "";

    if (task?.failureReportS3ObjectRefId) {
      const key = this.failureReportPath + task.failureReportS3ObjectRefId;
      url = await this.s3Service.getPresignedGetObjectUrl(this.bucket, key);
    }

    let response: BuyerImportGetPresignedUrlResponseDto = {
      taskId: taskId,
      presignedUrl: url
    }

    return response;
  }

  getVepBuyerTemplateDownloadUrl = async (actionType: string): Promise<BuyerImportGetPresignedUrlResponseDto> => {
    let key = "template/insert_vep_template.xlsx"
    switch (actionType) {
      case constant.actionType.INSERT_PAST_BUYER:
        key = 'template/insert_past_buyer_template.xlsx';
        break;
      case constant.actionType.INSERT_ONSITE_BUYER:
        key = 'template/insert_onsite_buyer_template.xlsx';
        break;
      case constant.actionType.VEP_INSERT_BUYER:
        key = 'template/vep_insert_buyer_template.xlsx';
        break;
      case constant.actionType.VEP_UPDATE_BUYER:
        key = 'template/vep_update_buyer_template.xlsx';
        break;
      case constant.actionType.INSERT_BUYER_WITH_BM_TENTATIVE:
        key = 'template/insert_buyer_with_bm_tentative_template.xlsx';
        break;
      default:
        key = this.vepTemplatePath
        break;
    }
    let url = await this.s3Service.getPresignedGetObjectUrl(this.bucket, key);
    let response: BuyerImportGetPresignedUrlResponseDto = {
      taskId: "",
      presignedUrl: url
    }
    return response;
  }

  getTimedOutTasks = async (): Promise<any> => {
    const MS_PER_MINUTE = 60000;
    const TIME_OUT_OLDER = new Date((new Date()).getTime() - (15 * MS_PER_MINUTE));
    const tasks: FairRegistrationImportTask[] = await this.FairRegistrationImportTaskRepository.find({
      where: {
        status: constant.taskStatus.UPLOADING,
        creationTime: LessThan(TIME_OUT_OLDER), 
      }
    });

    return tasks;
  }

  async timeoutUploadingTasks() {
    this.logger.debug("timeoutUploadingTasks");

    const tasks: FairRegistrationImportTask[] = await this.getTimedOutTasks();

      try {
        await getManager().transaction(async transactionalEntityManager => {
          await Promise.all(tasks.map(async (task): Promise<any> => {
            
              let existing: FairRegistrationImportTask | undefined = await this.FairRegistrationImportTaskRepository.findOne({
                where: [{ id: task.id }]
              });

              if (existing) {
                this.logger.log("Updating task status to FAILED, because of timeed out");
                existing.status = constant.taskStatus.FAILED;
                const failureReportS3ObjectRefId = v4() + ".txt";
                const data = "File upload timed out";
                const response = await this.s3Service.putObject(this.bucket, this.failureReportPath + failureReportS3ObjectRefId, data);
                existing.failureReportS3ObjectRefId = failureReportS3ObjectRefId;
                await transactionalEntityManager.save(existing);
                return response;
              }
          }))
        });
      } catch (error) {

      }

    return "";
  }

  fetchVisitorTypeToParticipantTypeMapping = async (): Promise<participantTypeMap> => {
    try {
      if (this.visitorTypeToParticipantTypeMapping == null || Object.keys(this.visitorTypeToParticipantTypeMapping).length === 0) {
        this.logger.log("Get config visitor-to-participant-mapping.json from:")
        this.logger.log("Bucket: " + this.configService.get<string>('s3.bucket') + ", Key: /_api-data/visitor-to-participant-mapping.json")

        const result = await this.s3Service.getFile("_api-data/visitor-to-participant-mapping.json", this.configService.get<string>('s3.bucket'))
      // participantType:
      // 9999 | 99: invalid type / Reserved
      // 1: Organic Buyer
      // 2: VIP - CIP Buyer
      // 3: VIP - Mission Buyer
      // 4: Exhibitor 
        this.visitorTypeToParticipantTypeMapping = JSON.parse(result)
      }

      return this.visitorTypeToParticipantTypeMapping;
    } catch (error) {
      this.logger.log("Error about getting this.visitorTypeToParticipantTypeMapping: ")
      this.logger.log(error)
      this.logger.log(this.visitorTypeToParticipantTypeMapping)
      this.visitorTypeToParticipantTypeMapping = JSON.parse('{"10":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"10 - Past Buyer - Dormant (Past 4 yrs or up buyers)"},"11":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"11 - Potential Buyers? (Never register/ Event Code/ Product Code)"},"12":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"12 - Airport Buffer Hall Visitor"},"13":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"13 - Octopus Cards (Premier Cards Programme) Visitor"},"14":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"14 - Roadshow Enquiry"},"15":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"15 - VP - Asia Miles"},"16":{"participantType":3,"formType":{"mission_buyer":"Mission"},"tier":"","displayName":"VIP - Mission Buyer","visitorDisplayName":"16 - VP - Buying Mission"},"17":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"17 - VP - Carpet Coverage"},"18":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"18 - VP - Dragon Lounge"},"19":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"19 - VP - Local TM"},"20":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"20 - VP - Offsite"},"21":{"participantType":2,"formType":{"cip_buyer":"CIP"},"tier":"","displayName":"VIP - CIP Buyer","visitorDisplayName":"21 - VP - Sponsored Buyer"},"22":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic - Past Buyer","visitorDisplayName":"22 - Top Importer"},"23":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"23 - Sponsorship"},"24":{"participantType":3,"formType":{"mission_buyer":"Mission"},"tier":"","displayName":"VIP - Mission Buyer","visitorDisplayName":"24 - Sponsorship - Hosted Guest (3 Nights)"},"25":{"participantType":3,"formType":{"mission_buyer":"Mission"},"tier":"","displayName":"VIP - Mission Buyer","visitorDisplayName":"25 - Sponsorship - Hosted Guest (4 Nights)"},"26":{"participantType":3,"formType":{"mission_buyer":"Mission"},"tier":"","displayName":"VIP - Mission Buyer","visitorDisplayName":"26 - Sponsorship - Buying Mission (Hotel)"},"27":{"participantType":3,"formType":{"mission_buyer":"Mission"},"tier":"","displayName":"VIP - Mission Buyer","visitorDisplayName":"27 - Sponsorship - Buying Mission (Cash)"},"28":{"participantType":3,"formType":{"mission_buyer":"Mission"},"tier":"","displayName":"VIP - Mission Buyer","visitorDisplayName":"28 - Sponsorship - Nominated Guest"},"29":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"29 - Paid Visitor"},"30":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"30 - Seminar Visitor"},"31":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"31 - Conference - Visitor"},"32":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"32 - Conference - Workshops Participants"},"33":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"33 - Marcom - Google SEM"},"34":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"34 - Marcom - Internal SMS"},"35":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"35 - Marcom - Facebook/WeChat"},"36":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"36 - Marcom - eDM"},"37":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"37 - Special Events Visitor"},"38":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"38 - Contingency Barcode Visitor"},"39":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"39 - Marcom - LinkedIn"},"40":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"40 - Marcom - Gmail"},"41":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"41 - Marcom - Yahoo SEM"},"42":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"42 - Marcom - Location based SMS"},"43":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"43 - Marcom - WeChat"},"44":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"44 - Marcom - Baidu SEM"},"45":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"45 - Marcom - Print Ad"},"46":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"46 - Marcom - Banner Ad"},"47":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"47 - Marcom - Mobile Ad"},"48":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"48 - Marcom - Event Listing Site"},"49":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"49 - Marcom - Others"},"50":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"50 - Online Media"},"51":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"51 - KOL"},"58":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"58 - Past Visitor - Inactive in DATES"},"59":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"59 - Octopus Cards (Fair New Buyer Programme) Visitor"},"61":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer","visitorDisplayName":"61 - VIP"},"62":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer","visitorDisplayName":"62 - VIP - Dragon Lounge"},"63":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer","visitorDisplayName":"63 - VIP - Speaker"},"70":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"70 - Deal Flow Visitors"},"71":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"71 - Workshop participants"},"72":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"72 - Fashion Show Attendee"},"73":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"73 - HK Asian Pop Music Festival Visitor"},"74":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"74 - Speaker"},"75":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"75 - Guest"},"76":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"76 - Oversea Delegation"},"77":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"77 - Mainland Delegation"},"00":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"00 - Onsite Registered Visitor"},"01":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"GENERAL","displayName":"Organic Buyer - General","visitorDisplayName":"01 - Visitor"},"02":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"02 - No Show Pre-reg Buyers"},"03":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"03 - Past Visitor (Last year)"},"04":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"04 - Past Visitor (2 years ago)"},"05":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"05 - Past Visitor (3 years ago)"},"06":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"06 - Past Visitor (Frequent Company)"},"07":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"07 - Past Visitor (Frequent Buyer)"},"08":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"08 - Past Visitor (Alternate fair - last year)"},"09":{"participantType":1,"formType":{"organic_buyer":"Organic","aor":"AOR","seminar_long":"Seminar Long Form"},"tier":"PAST","displayName":"Organic Buyer - Past Buyer","visitorDisplayName":"09 - Past Buyer - Dormant (Alternate Edition)"}}')
      return this.visitorTypeToParticipantTypeMapping;
    }
  }

  getNextSerialNumber = async (query: GetNextSerialNumberReqDto): Promise<Optional<any>> => {
    try {
      let sql = "SELECT IFNULL(MAX(serialNumber), 0) + 1 AS nextSerialNumber FROM fairRegistration WHERE fairCode = ? AND projectYear = ? AND sourceTypeCode = ? AND visitorTypeCode = ?"
      let param = [query.fairCode, query.projectYear, query.sourceType, query.visitorType]
      const result = await this.FairRegistrationRepository.query(sql, param)
      const nextSerialNumber = result[0]["nextSerialNumber"]
      return {
        nextSerialNumber
      }
    } catch (error) {
      commonExceptionHandling(error);
    }
  }
}

function commonExceptionHandling(error: any){
    if(error.name === 'VepError'){
      throw new VepError(error.vepErrorMsg, error.errorDetail);
    }
      throw new VepError(VepErrorMsg.BuyerImport_Update_Status_Error, error.response.data.message);
  }
  
function isEmpty(property: any): boolean {
  if (property == "" || property == null || property === undefined) {
    return true;
  }

  return false;
}


/**
 * 
 * @param total_record  total record of filtered result
 * @param page_size  
 * @param page  (started from 1) 
 * @returns [offset, limit, reversed]
 */

 const pageIndex = (
  total_record: number,
  page_size: number,
  page: number
): { offset: number, limit: number, reversed: boolean } => {

  let page_index = page - 1;

  const index_ac_start = page_index * page_size
  // const index_ac_end = (page_index + 1) * page_size - 1

  // if (2 * page_index * page_size < total_record) {
      return {
          offset: index_ac_start,
          limit: page_size,
          reversed: false
      }
  // } 
  // else {
  //     let revised_offset = (total_record - index_ac_end - 1) < 0 ? 0 : (total_record - index_ac_end - 1);
  //     let revised_size = revised_offset == 0 && total_record % page_size > 0 ? total_record % page_size : page_size
  //     return {
  //         offset: revised_offset,
  //         limit: revised_size,
  //         reversed: false
  //     }
  // }
}