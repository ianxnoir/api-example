import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DatabaseService } from '../../core/database/database.service';
import { VepError } from '../../core/exception/exception';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { VepErrorMsg } from '../../config/exception-constant';
import { isEmpty } from 'class-validator';
import { v4 } from 'uuid';
import { PostCustomQuestionImportReqDto } from './dto/postCustomeQuestionImportRequest.dto';
import { PostCustomQuestionImportResDto } from './dto/postCustomeQuestionImportResponse.dto';
import { constant } from '../../config/constant';
import { S3Service } from '../../core/utils/s3.service';
import { CustomQuestionSqsService } from '../sqs/customQuestionSqs.service';

import {
    GetCustomQuestionsImportReqDto,
    GetCustomQuestionsReqDto,
    GetCustomQuestionsFilterLabelReqDto,
    UpdateCustomQuestionsFilterLabelReqDto,
    CustomQuestionsFilterLabelInnerStructureInterface
} from './dto/customeQuestionsRequest.dto';
import { CustomQuestionsGetPresignedUrlResponseDto } from './dto/customQuestionsGetPresignedUrlResponse.dto';
import { FairCustomQuestionImportTask } from '../../dao/FairCustomQuestionImportTask';
import { FairCustomQuestion } from '../../dao/FairCustomQuestion';
import { FairCustomQuestionFilter } from '../../dao/FairCustomQuestionFilter';
import { CustomQuestionImportGetPresignedUrlResponseDto } from './dto/customQuestionImportGetPresignedUrlResponse.dto';

@Injectable()
export class CustomQuestionsService {
    bucket: string = '';
    path: string = '';
    contentType: string = '';
    customQuestionTemplatePath: string = '';

    queuePath: string = '';
    failureReportPath: string = '';
    constructor(
        @InjectRepository(FairCustomQuestionImportTask)
        private CustomQuestionsImportTaskRepository: Repository<FairCustomQuestionImportTask>,
        @InjectRepository(FairCustomQuestion)
        private FairCustomQuestionRepository: Repository<FairCustomQuestion>,
        @InjectRepository(FairCustomQuestionFilter)
        private FairCustomQuestionFilterRepository: Repository<FairCustomQuestionFilter>,
        private configService: ConfigService,
        private sqsService: CustomQuestionSqsService,
        private s3Service: S3Service,
        private databaseService: DatabaseService
    ) {
        this.bucket = this.configService.get<string>('customQuestionImport.BUCKET') || '';
        this.path = this.configService.get<string>('customQuestionImport.PATH') || '';
        this.contentType = this.configService.get<string>('customQuestionImport.CONTENT_TYPE') || '';
        this.customQuestionTemplatePath = this.configService.get<string>('customQuestionImport.IMPORT_TEMPLATE_PATH') || '';
        this.queuePath = this.configService.get<string>('customQuestionImport.QUEUE_PATH') || '';
        this.failureReportPath = this.configService.get<string>('customQuestionImport.FAILURE_REPORT_PATH') || '';
    }

    generatSQLQueryAndParam = (
        type: "COUNT" | "SELECT",
        pageIndexing: { offset: number, limit: number } | null,
        query: GetCustomQuestionsReqDto | null,
        currentUser: AdminUserDto,
        tableName: string
    ): { sql: string, param: any[] } => {
        const result = { sql: "", param: [] as any[] }

        switch (type) {
            case "COUNT":
                result.sql = `SELECT COUNT(*) AS recordCount FROM vepFairDb.${tableName}`
                break;
            case "SELECT":
                let selectField = '*'
                if (tableName == 'fairCustomQuestion') {
                    selectField += ` ,(select concat(f.parentCategoryCode, ' - ', x.valueEn) from vepFairDb.${tableName} x where x.categoryCode = f.parentCategoryCode${query?.fairCode ? ` AND fairCode = "${query.fairCode}"` : ''}) parentCategory `
                }
                result.sql = `SELECT ${selectField} FROM vepFairDb.${tableName} f`
                break;
        }

        let userFairCode = currentUser.fairAccessList?.replace(/\s/, "")
        if (userFairCode && userFairCode.match(/^[\w\d,-_]+$/)) {
            let fairCode = `'${userFairCode.split(',').join("','")}'`
            result.sql += ` WHERE fairCode IN ( ${fairCode} )`
        }
        if (query?.fairCode && query?.projectYear) {
            result.sql += ` AND fairCode = "${query.fairCode}" AND projectYear="${query.projectYear}"`
        }
        if (type == "SELECT") {
            this.contructSortingSQL(query, result, pageIndexing, tableName)
        }
        return result
    }

    contructSortingSQL = (
        query: GetCustomQuestionsReqDto | null,
        sqlQueryAndParam: { sql: string, param: any[] },
        pageIndexing: { offset: number, limit: number } | null,
        tableName: string
    ) => {
        let orderBy
        let sortingField = '';
        switch (tableName) {
            case 'fairCustomQuestion':
                if (!query?.sortBy) {
                    //default sorting, in ASC order
                    orderBy = 'questionNum, parentCategoryCode, sequence'
                } else {
                    orderBy = query.sortBy
                    orderBy += (query?.order == 'DESC') ? ' DESC ' : sortingField
                }
                break;
            case 'fairCustomQuestionImportTask':
                orderBy = 'creationTime DESC'
                // orderBy += sortingField
                break;
            default:
                break;
        }

        sqlQueryAndParam.sql += ` ORDER BY ${orderBy}`
        if (pageIndexing) {
            sqlQueryAndParam.sql += ` LIMIT ${pageIndexing.limit} OFFSET ${pageIndexing.offset}`
        }
    }

    getCustomQuestionsImportTasks = async (currentUser: AdminUserDto, query: GetCustomQuestionsImportReqDto): Promise<Optional<any>> => {
        try {
            const tableName = 'fairCustomQuestionImportTask'
            const queryCountObj = this.generatSQLQueryAndParam("COUNT", null, null, currentUser, tableName)
            const countResult = await this.CustomQuestionsImportTaskRepository.query(queryCountObj.sql, queryCountObj.param)
            const filteredRecordCount = countResult[0]["recordCount"]
            const pageLimitOffSetObj = pageIndex(query.size, query.pageNum)
            const querySelectObj = this.generatSQLQueryAndParam("SELECT", pageLimitOffSetObj, null, currentUser, tableName)
            const queryResult = await this.CustomQuestionsImportTaskRepository.query(querySelectObj.sql, querySelectObj.param)
            return {
                total_size: filteredRecordCount,
                data: queryResult
            }
        } catch (error) {
            commonExceptionHandling(error);
        }
    }

    getCustomQuestionTemplateDownloadUrl = async (): Promise<CustomQuestionImportGetPresignedUrlResponseDto> => {
        const key = this.customQuestionTemplatePath
        let url = await this.s3Service.getPresignedGetObjectUrl(this.bucket, key);
        let response: CustomQuestionImportGetPresignedUrlResponseDto = {
            taskId: "",
            presignedUrl: url
        }
        return response;
    }

    postCustomQuestionImportTasks = async (currentUser: AdminUserDto, query: PostCustomQuestionImportReqDto): Promise<Optional<any>> => {
        try {
            const taskId = v4();
            const uploadFileS3ObjectRefId = v4();

            const fairCode = query.fairCode;
            const fiscalYear = query.fiscalYear;
            const projectYear = query.projectYear;

            if (isEmpty(fairCode)) {
                throw new VepError(VepErrorMsg.Custom_Question_Import_Missing_FairCode_Error, 'Missing Fair');
            }

            if (isEmpty(projectYear)) {
                throw new VepError(VepErrorMsg.Custom_Question_Import_Missing_ProjectYear_Error, 'Missing Project Year');
            }

            if (isEmpty(fiscalYear)) {
                throw new VepError(VepErrorMsg.Custom_Question_Import_Missing_FiscalYear_Error, 'Missing Fiscal Year');
            }

            const key = this.path + uploadFileS3ObjectRefId;
            const url = await this.s3Service.getPresignedPutObjectUrl(this.bucket, key, this.contentType);

            let task: any = {
                taskId: taskId,
                originalFileName: query.originalFileName,
                uploadFileS3ObjectRefId: uploadFileS3ObjectRefId,
                failureReportS3ObjectRefId: "",
                fairCode: fairCode,
                fiscalYear: fiscalYear,
                projectYear: projectYear,
                status: constant.taskStatus.PENDING,
                createdBy: currentUser.emailAddress || constant.defaultUserName.SYSTEM,
                lastUpdatedBy: constant.defaultUserName.SYSTEM
            };

            const taskCreated: FairCustomQuestionImportTask = await this.CustomQuestionsImportTaskRepository.save(task)
                .catch((error) => {
                    throw new VepError(VepErrorMsg.Create_Custom_Question_Task_Error, error.message)
                });

            if (taskCreated) {
                let response: PostCustomQuestionImportResDto = {
                    presignedUrl: url,
                    taskId: taskCreated?.taskId || '',
                    originalFileName: taskCreated.originalFileName || '',
                    uploadFileS3ObjectRefId: taskCreated.uploadFileS3ObjectRefId || '',
                    failureReportS3ObjectRefId: taskCreated.failureReportS3ObjectRefId || '',
                    fairCode: taskCreated.fairCode || '',
                    fiscalYear: taskCreated.fiscalYear || '',
                    projectYear: taskCreated.projectYear || '',
                    status: taskCreated.status || '',
                    createdBy: taskCreated.createdBy || '',
                    creationTime: taskCreated.creationTime ? taskCreated.creationTime.toUTCString() : ""
                }

                return response;
            } else {
                throw new VepError(VepErrorMsg.Custom_Question_Import_Unknown_Create_Task_Error, "Unknown Custom Question Import Task Creation Error");
            }
        } catch (error) {
            commonExceptionHandling(error);
        }
    }

    triggerSqsMessage = async (taskId: string): Promise<any> => {
        const messageDuplcationId = `${taskId}-${v4()}`;

        await this.sqsService.sendMessage(messageDuplcationId, { taskId: taskId || '' })

        return { status: 200 }
    }

    getCustomQuestionsByFilters = async (currentUser: AdminUserDto, query: GetCustomQuestionsReqDto): Promise<Optional<any>> => {
        try {
            const tableName = 'fairCustomQuestion'
            const queryCountObj = this.generatSQLQueryAndParam("COUNT", null, query, currentUser, tableName)
            const countResult = await this.FairCustomQuestionRepository.query(queryCountObj.sql, queryCountObj.param)
            const filteredRecordCount = countResult[0]["recordCount"]
            const pageLimitOffSetObj = pageIndex(query.size, query.pageNum)
            const querySelectObj = this.generatSQLQueryAndParam("SELECT", pageLimitOffSetObj, query, currentUser, tableName)
            const queryResult = await this.FairCustomQuestionRepository.query(querySelectObj.sql, querySelectObj.param)
            return {
                total_size: filteredRecordCount,
                data: queryResult
            }
        } catch (error) {
            commonExceptionHandling(error);
        }
    }

    getCustomQuestionsFilterLabelList = async (currentUser: AdminUserDto, query: GetCustomQuestionsFilterLabelReqDto): Promise<Optional<any>> => {
        try {
            const conditions = { fairCode: query.fairCode, projectYear: query.year }
            const filterLabelResult = await this.FairCustomQuestionFilterRepository.find({
                where: conditions
            })

            return Array.from(Array(10).keys()).map(index => {
                const questionNum = index + 1
                const label = filterLabelResult.find(l => l.questionNum === questionNum)?.filterNameEn ?? `Question ${questionNum}`
                const key = `question${questionNum}`
                return {
                    label,
                    key,
                    data_type: "string"
                }
            })
            
        } catch (error) {
            commonExceptionHandling(error);
        }
    }

    getCustomQuestionsFilterLabel = async (currentUser: AdminUserDto, query: GetCustomQuestionsFilterLabelReqDto): Promise<Optional<any>> => {
        try {
            const conditions = { fairCode: query.fairCode, projectYear: query.year }
            const filterLabelResult = await this.FairCustomQuestionFilterRepository.find({
                where: conditions
            })
            const questionsResult = await this.FairCustomQuestionRepository.createQueryBuilder()
                .where(conditions)
                .groupBy('questionNum')
                .orderBy('questionNum')
                .getMany()

            return { questionsList: questionsResult, filterLabelList: filterLabelResult }
        } catch (error) {
            commonExceptionHandling(error);
        }
    }

    updateCustomQuestionsFilterLabel = async (currentUser: AdminUserDto, body: UpdateCustomQuestionsFilterLabelReqDto) => {
        try {
            const { fairCode, projectYear, fiscalYear, filtersData } = body
            if (!fairCode || !projectYear) {
                throw new VepError(VepErrorMsg.Custom_Questions_FilterLabel_NotFound_Error);
            }
            await this.FairCustomQuestionFilterRepository.delete({ fairCode, projectYear })
            if (filtersData.length) {
                let arr: CustomQuestionsFilterLabelInnerStructureInterface[] = [...filtersData] as CustomQuestionsFilterLabelInnerStructureInterface[]
                arr.forEach((x: any) => {
                    x.fairCode = fairCode;
                    x.projectYear = projectYear;
                    x.fiscalYear = fiscalYear;
                    x.createdBy = currentUser.emailAddress
                })
                await this.FairCustomQuestionFilterRepository.insert(arr)
            }
            return {
                status: 200,
            }
        } catch (error) {
            return {
                status: 400,
                message: error?.message ?? JSON.stringify(error)
            }
        }
    }

    getFailureReportDownloadUrl = async (taskId: string): Promise<CustomQuestionsGetPresignedUrlResponseDto> => {
        const task: FairCustomQuestionImportTask | undefined = await this.getTaskByTaskId(taskId);
        let url = "";
        if (task?.failureReportS3ObjectRefId) {
            const key = this.failureReportPath + task.failureReportS3ObjectRefId;
            url = await this.s3Service.getPresignedGetObjectUrl(this.bucket, key);
        }
        let response: CustomQuestionsGetPresignedUrlResponseDto = {
            taskId: taskId,
            presignedUrl: url
        }
        return response;
    }

    getOriginalFilePresignedUrl = async (taskId: string): Promise<CustomQuestionsGetPresignedUrlResponseDto> => {
        const task: FairCustomQuestionImportTask | undefined = await this.getTaskByTaskId(taskId);
        let url = "";
        if (task?.uploadFileS3ObjectRefId) {
            const key = this.path + task.uploadFileS3ObjectRefId;
            url = await this.s3Service.getPresignedGetObjectUrl(this.bucket, key);
        }
        let response: CustomQuestionsGetPresignedUrlResponseDto = {
            taskId: taskId,
            presignedUrl: url
        }
        return response;
    }

    getTaskByTaskId = async (taskId: string): Promise<FairCustomQuestionImportTask | undefined> => {
        const queryParam = { where: { taskId: taskId } }

        const task: FairCustomQuestionImportTask | undefined = await this.databaseService.findOne(
            this.CustomQuestionsImportTaskRepository,
            queryParam,
            constant.segmentName.QUERY_CUSTOM_QUESTIONS_IMPORT_TASK_BY_TASK_ID);
        console.log(task);
        return task;
    }
}

function commonExceptionHandling(error: any) {
    if (error.name === 'VepError') {
        throw new VepError(error.vepErrorMsg, error.errorDetail);
    }
    throw new VepError(VepErrorMsg.Participant_Import_Status_Error, error.response.data.message);
}

const pageIndex = (
    page_size: number,
    page: number,
): { offset: number, limit: number } => {
    let page_index = page - 1;
    const index_ac_start = page_index * page_size
    return {
        offset: index_ac_start,
        limit: page_size
    }
}