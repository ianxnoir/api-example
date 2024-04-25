import { Injectable, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import { Repository } from 'typeorm';
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
import { Logger, S3Service } from '../../core/utils';
import { RegistrationRequestDto, UpdateRegistrationStatusRequestDto, UpdateRegistrationStatusResponseDto, BulkUpdateRegistrationStatusRequestDto, RegistrationRequestV2Dto } from './dto/RegistrationRequest.dto';
import { FairRegistration } from '../../dao/FairRegistration';
import { ContentService } from '../api/content/content.service';
import { BusinessRuleFormValidationService } from '../formValidation/businessRuleFormValidation.service';
import { FormSubmitDataDto } from '../formValidation/dto/formSubmitData.dto';
import { ValidationUtil } from '../formValidation/validation.util';
import { WordpressFormValidationService } from '../formValidation/wordpressFormValidation.service';
import { SubmitFormRequestDto } from './dto/SubmitFormRequestDto.dto';
import { SubmitFormResponseDto } from './dto/SubmitFormResponse.dto';
import { SSOUserHeadersDto } from '../../core/decorator/ssoUser.decorator';
import { FairDbService } from '../fairDb/fairDb.service';
import { C2MParticipantStatusDto, C2MParticipantStatusListDto, C2MParticipantStatusListItemDto, Click2MatchStatusIdEnum } from './dto/updateCToMParticipantStatus.dto';
import { FairRegistrationRemarkReqDto } from './dto/updateFairRegistration.dto';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { FORM_SUBMISSION_STATUS, SUBMIT_TYPE, VALIDATION_STATUS, FORM_SUBMISSION_KEY_EXPIRATION_TIME_IN_MINUTE } from './dto/SubmitForm.enum';
import { InvalidateRegistrationReqDto } from './dto/invalidateRegistrationReq.dto';
import { RegistrationStatus } from '../profile/dto/fairRegistration.enum';
import { DedicateDataFieldEnum } from '../formValidation/enum/dedicateDataField.enum';
import { RegistrationUtil } from './registration.util';
import { FormTemplateDto, MuiltiLangFormTemplate } from '../api/content/dto/formTemplate.dto';
import { FormSubmitMetaData } from '../formValidation/dto/formSubmitMetaData.dto';
import { v4 as uuidv4 } from 'uuid';
import { ElasticacheService } from '../../core/elasticache/elasticache.service';
import { FormSubmissionValueDto } from './dto/formSubmissionValue.dto';
import { GetUploadFilePresignedUrlReqDto } from './dto/getUploadFilePresignedUrlReq.dto';
import { FormFileContentType } from '../../core/utils/enum/formFileContentType.enum';
import { GetUploadFilePresignedUrlRespDto } from './dto/getUploadFilePresignedUrlResp.dto';
import { XTraceDto } from '../../core/decorator/xTraceId.decorator';
import { VerifyRegFormLinkReqDto } from './dto/verifyRegFormLinkReq.dto';
import { VerifyRegFormLinkRespDto } from './dto/verifyRegFormLinkResp.dto';
import { FairRegistrationFormSubmission } from '../../dao/FairRegistrationFormSubmission';
import { FormCommonUtil } from '../formValidation/formCommon.util';
import { FORM_TYPE } from '../formValidation/enum/formType.enum';
import { RegFormLinkDbService } from '../fairDb/regFormLinkDb.service';
import { GenerateRegFormLinkReqDto } from './dto/GenerateRegFormLinkReq.dto';
import { GenerateRegFormLinkRespDto, RegFormLinkTask, RegFormLinkValidationErrorDto } from './dto/GenerateRegFormLinkResp.dto';
import { RegFormLinkTaskEntrySummaryDto } from './dto/RegFormLinkTaskEntrySummaryDto.dto';
import { QueryRegFormLinkReqDto } from './dto/QueryRegFormLinkReq.dto';
import { QueryRegFormLinkRespDto } from './dto/QueryRegFormLinkResp.dto';
import { FairRegistrationFormLinkTask } from '../../dao/FairRegistrationFormLinkTask';
import { BusinessRuleFormValidationCode, ThrowExceptionBusinessRuleFormValidationCode } from '../formValidation/enum/businessRuleFormValidationCode.enum';
import { CouncilwiseDataType, FairSettingKeyEnum, GeneralDefinitionDataRequestDTOType } from '../api/content/content.enum';
import { ContentUtil } from '../api/content/content.util';
import { FIELD_TYPE } from '../formValidation/enum/fieldType.enum';
import { RegFormLinkUtil } from './regFormLink.util';
import { CouncilwiseDataResponseDto } from '../api/content/dto/councilwiseDataResp.dto';
import { SubmitAORFormRequestDto } from './dto/SubmitAORFormRequestDto.dto';
import { BuyerService } from '../api/buyer/buyer.service';
import { SsoPrefillDto } from '../api/buyer/dto/ssoPrefill.dto';
import { FormDataDictionaryDto } from '../formValidation/dto/formDataDicionary.dto';
import { SubmitAORFormResponseDto, SubmitAORFormResponseResultArrayDto } from './dto/SubmitAORFormResponse.dto';
import { SubmitCombinedFairFormRequestDto } from './dto/SubmitCombinedFairFormRequestDto.dto';
import { SubmitCombinedFairFormResponseDto } from './dto/SubmitCombinedFairFormResponse.dto';
import { FairService } from '../fair/fair.service';
import { FairNameDto, GetCombinedFairListRespDto, MultiLangNameDto } from '../profile/dto/getCombineFairListResp.dto';
import { EditFormDataDto } from '../formValidation/dto/editFormData.dto';
import { EditFormOptionMetadata } from '../formValidation/dto/editFormOptionMetadata.dto';
import { SqsService } from '../sqs/sqs.service';
import { AORFairSettingObjDto } from './dto/AORFairSettingObj.dto';
import { SubmitShortRegReqDto } from './dto/submitShortRegReq.dto';
import { SubmitShortRegRespDto } from './dto/submitShortRegResp.dto';
import { EligibilityService } from './eligibility.service';
import { EligibilityUtil } from './eligibility.util';
import { SubmitFormUserActivityDto } from './dto/submitFormUserActivity.dto';
import { MultiLangTemplateHandler } from './MultiLangHandler';
import { FairRegistrationPregeneration } from '../../dao/FairRegistrationPregeneration';
import { constant } from '../../config/constant';
import { RegistrationDataSqsJsonFieldEnum } from './dto/RegistrationDataSqsJson.enum';
@Injectable()
export class RegistrationService {
  baseURL: string;
  checkExhibitorUrl: string;
  checkEmailExistsInSsoUrl: string;
  passwordPublicKey: string;
  uploadFileBucket: string;
  saltKeyForRegFormLink: string;
  regFormLinkHost: string;
  api_call: string = 'api_call';
  exception_raised: string = 'exception_raised';
  constructor(
    private logger: Logger,
    private configService: ConfigService,
    private contentService: ContentService,
    private buyerService: BuyerService,
    private s3Service: S3Service,
    private sqsService: SqsService,
    private eligibilityService: EligibilityService,
    private fairService: FairService,
    private fairDbService: FairDbService,
    private regFormLinkDbService: RegFormLinkDbService,
    private elastiCacheService: ElasticacheService,
    private wordpressFormValidationService: WordpressFormValidationService,
    private businessRuleFormValidationService: BusinessRuleFormValidationService,
    @InjectRepository(FairRegistrationFormSubmission) private FairRegistrationFormSubmissionRepository: Repository<FairRegistrationFormSubmission>,
  ) {
    this.logger.setContext(RegistrationService.name);
    this.baseURL = this.configService.get<any>('api.CONTENT_SERVICE_URI');
    this.checkExhibitorUrl = this.configService.get<any>('api.EXHIBITOR_SERVICE_URI');
    this.checkEmailExistsInSsoUrl = this.configService.get<any>('api.BUYER_SERVICE_URI');
    this.regFormLinkHost = this.configService.get<any>('regFormLink.host');
    this.passwordPublicKey = Buffer.from(this.configService.get<string>('registration.PASSWORD_PUBLIC_KEY') || '', 'base64').toString()
    this.uploadFileBucket = this.configService.get<any>('form.uploadFileBucket');
    this.saltKeyForRegFormLink = this.configService.get<any>('ssm.saltKey');
  }

  public async updateCToMParticipantStatus(adminUser: AdminUserDto, registrationRecordId: number, c2MParticipantStatusDto: C2MParticipantStatusDto) {

    if (!registrationRecordId || !c2MParticipantStatusDto?.status) {
      throw new VepError(VepErrorMsg.Validation_Error, 'Parameter missing')
    }

    if (!(c2MParticipantStatusDto.status in Click2MatchStatusIdEnum)) {
      this.logger.error(`Wrong parameter status [c2MParticipantStatusDto.status: ${c2MParticipantStatusDto.status} ]`)
      throw new VepError(VepErrorMsg.Validation_Error, 'Wrong parameter status')
    }

    let fairReg = await this.fairDbService.queryFairRegByFairParticipantRegId(registrationRecordId);
    if (!fairReg) {
      throw new VepError(VepErrorMsg.Database_Error, 'Cannot find the Fair Registration record by id')
    }

    this.checkUserValidToUpdate(adminUser, fairReg)

    if (fairReg.c2mParticipantStatusId == c2MParticipantStatusDto.status.toString()) {
      throw new VepError(VepErrorMsg.Validation_Error, 'The c2m Participant Status Id is already updated')
    }

    let updateResult = await this.fairDbService.updateFairParticipantRegistrationRecordStatusById(registrationRecordId, c2MParticipantStatusDto);
    
    let afterUpdate = await this.fairDbService.queryFairRegByFairParticipantRegId(registrationRecordId);
    if (updateResult) {
      return {
        isSuccess: true,
        "user-activity": {
          registrationNo: `${fairReg.serialNumber}${fairReg.projectYear?.substring(fairReg.projectYear.length - 2)}${fairReg.sourceTypeCode}${fairReg.visitorTypeCode}${fairReg.projectNumber}`,
          actionType: 'Update Buyer C2M Status',
          beforeUpdate: fairReg,
          afterUpdate
        }
      }
    }
    this.logger.log(`Cannot update the Fair Registration record status by id [updateResult: ${JSON.stringify(updateResult)}]`)
    throw new VepError(VepErrorMsg.Database_Error, 'Cannot update the Fair Registration record status by id')
  }

  public async updateCToMParticipantStatusList(adminUser: AdminUserDto, c2MParticipantStatusListDto: C2MParticipantStatusListDto) {
    let c2MParticipantStatusList = c2MParticipantStatusListDto?.actions

    if (!c2MParticipantStatusList || !c2MParticipantStatusList?.length) {
      throw new VepError(VepErrorMsg.Validation_Error, 'Parameter missing')
    }

    let fairParticipantRegIds = c2MParticipantStatusList.map(function (item) { return item.registrationRecordId });

    let fairReg = await this.fairDbService.queryFairRegByFairParticipantRegIds(fairParticipantRegIds);

    //checking 
    this.checkingStatusListWithIds(adminUser, c2MParticipantStatusList, fairReg)

    let updateResult = await this.fairDbService.updateFairParticipantRegistrationRecordStatusListByIds(c2MParticipantStatusList);

    let afterUpdate = await this.fairDbService.queryFairRegByFairParticipantRegIds(fairParticipantRegIds);

    if (updateResult) {
      return { 
        isSuccess: true,
        "user-activity": fairReg?.map(item => {
          let after = afterUpdate?.find(_item => _item.id == item.id);
          return {
            registrationNo: `${item.serialNumber}${item.projectYear?.substring(item.projectYear.length - 2)}${item.sourceTypeCode}${item.visitorTypeCode}${item.projectNumber}`,
            actionType: 'Update Buyer C2M Status',
            beforeUpdate: item,
            afterUpdate: after
          }
        })
      }
    } else {
      this.logger.error(`Cannot update any Fair Registration record by Ids [updateResult: ${JSON.stringify(updateResult)}]`)
      throw new VepError(VepErrorMsg.Database_Error, 'Cannot update any Fair Registration record by Ids')
    }
  }

  private checkUserValidToUpdate(adminUser: AdminUserDto, fairReg: FairRegistration) {
    const isSuperUser = false

    if (!isSuperUser && !adminUser.fairAccessList.split(',').find(x => x == fairReg.fairCode)) {
      throw new VepError(VepErrorMsg.Invalid_Operation, `Could not update the fair registration, fairReg fairCode: ${fairReg.fairCode}, user is allowed to access fair ${adminUser.fairAccessList}`)
    }

    if (fairReg.overseasBranchOffice) {
      if (!isSuperUser && adminUser.branchOfficeUser == 1 && adminUser.branchOffice != fairReg.overseasBranchOffice) {
        throw new VepError(VepErrorMsg.Invalid_Operation, `Could not update the fair registration, fairReg branch office code: ${fairReg.overseasBranchOffice}, user is ${adminUser.branchOffice} branch office user`)
      }
    }
  }

  public checkingStatusListWithIds(adminUser: AdminUserDto, c2MParticipantStatusList: C2MParticipantStatusListItemDto[], fairReg: FairRegistration[] | undefined) {

    if (!fairReg) {
      this.logger.error('Parameter missing')
      throw new VepError(VepErrorMsg.Validation_Error, 'Parameter missing')
    }

    let statusListCounter: number = c2MParticipantStatusList.length
    if (fairReg.length != statusListCounter) {
      this.logger.error(`Cannot find all Fair Registration record by Ids or duplicated Ids [fairReg.length: ${fairReg.length} , statusListCounter: ${statusListCounter} ]`)
      throw new VepError(VepErrorMsg.Validation_Error, 'Cannot find all Fair Registration record by Ids or duplicated Ids')
    }
    let idStatusMapping = new Map()
    c2MParticipantStatusList.map(item => {
      if (!(item.status in Click2MatchStatusIdEnum)) {
        this.logger.error(`Wrong parameter status [fairReg.length: ${item.status} ]`)
        throw new VepError(VepErrorMsg.Validation_Error, 'Wrong parameter status')
      }

      idStatusMapping.set(item.registrationRecordId.toString(), item.status);
    })

    fairReg.map(item => {
      this.checkUserValidToUpdate(adminUser, item)

      let statusId = idStatusMapping.get(item.id.toString())
      if (!statusId || item.c2mParticipantStatusId == statusId) {
        this.logger.error(`The c2m Participant Status Id is already updated [statusId: ${statusId} , item.c2mParticipantStatusId: ${item.c2mParticipantStatusId}]`)
        throw new VepError(VepErrorMsg.Validation_Error, 'The c2m Participant Status Id is already updated')
      }
    })
  }

  // form submission key is created on step 1 and will expired after 15 min, user need to finish step 2 ~ 4 in this period
  createFormSubmissionKey() : string {
    return `form_submission_${uuidv4()}`;
  }

  // set key/value to redis
  setElastiCacheKeyValue = async (key: string, value: string, expirationTime? : number): Promise<Optional<any>> => {
    let redisKeyId : string = key;
    let redisValue : string = value;
    let setElastiCacheRes = await this.elastiCacheService.setCache(redisKeyId, redisValue, expirationTime);
    if (setElastiCacheRes !== 'OK') {
      throw new VepError(VepErrorMsg.Set_ElastiCache_Error, `Failed to set elastiCache: ${setElastiCacheRes}`);
    }
    return true;
  };

  // get key/value from redis
  getElastiCacheKeyValue = async (key: string): Promise<Optional<any>> => {
    let redisKeyId : string = key;
    let getElastiCacheRes = await this.elastiCacheService.getCache(redisKeyId);
    // If result neither null or valid value, may represents a system error 
    if (!getElastiCacheRes && getElastiCacheRes !== null) { 
      throw new VepError(VepErrorMsg.Get_ElastiCache_Error, `Failed to get elastiCache: ${getElastiCacheRes}`);
    }
    return getElastiCacheRes;
  };

  // convert redisContent back to FormSubmissionValueDto
  convertSubmissionValue(cachedSubmissionValue: any) {
    let parsedSubmissionValue : {[key:string]:string} ;
    try {
      parsedSubmissionValue = JSON.parse(cachedSubmissionValue)
      if (!parsedSubmissionValue) {
        throw new VepError(VepErrorMsg.Invalid_Submission_Value_Error);
      } 
      return new FormSubmissionValueDto(parsedSubmissionValue);
    } catch (err) {
      throw new VepError(VepErrorMsg.Convert_Submission_Value_Error, err.message);
    }
  };

  // Insert into DB table fairRegistrationFormSubmission (For Replay Failed Buyer Registration Submission)
  insertFormSubmissionRecord = async (record: { [key: string]: string | Date }) => {
    await this.FairRegistrationFormSubmissionRepository
      .createQueryBuilder()
      .insert()
      .into(FairRegistrationFormSubmission)
      .values(
        [record]
      )
      .execute();
  }

  // Get Form Type by fairCode, slug and lang
  public async getFormType(fairCode: string, slug: string, lang: string) {
    try {
      const formType = await axios.get(this.baseURL + `/wordpress/formTemplate?fair=${fairCode}&slug=${slug}&lang=${lang}`);
      const formTypeData = JSON.parse(formType?.data?.data)?.data.form_data.form_type;
      return formTypeData;
    } catch (error) {
      throw new VepError(VepErrorMsg.Form_Details_Not_Found_Error, error?.response?.data ? (error?.response?.data?.error?.message) : error.message);
    }
  }

  // Check Registation Eligibility Result
  public async checkEligibility(ssoUser: SSOUserHeadersDto | null, @Query() query: RegistrationRequestDto, xTrace: XTraceDto): Promise<any> {
    this.logger.INFO(xTrace.xTraceId, this.api_call, `[FairServerice] Request body: ${JSON.stringify(query)}, Request ID: ${xTrace?.xRequestId}`, this.checkEligibility.name)
    try {
      const fairSettingData = await this.contentService.retrieveFairSetting(query.fairCode);
      let fairSettingDetails = EligibilityUtil.prepareFairSettingDetails(fairSettingData);

      const formTemplate = await this.contentService.retrieveFormTemplate(query.fairCode, query.slug, query.lang)
      const formType = formTemplate.form_data.form_type;

      return await this.eligibilityService.prepareEligibilityResponse(fairSettingDetails, ssoUser, query, formType, xTrace)
    } catch (error) {
      commonExceptionHandling(error)
    }
  }

  // Check Registation Eligibility Result, use short
  public async checkEligibilityV2(ssoUser: SSOUserHeadersDto | null, @Query() query: RegistrationRequestV2Dto, xTrace: XTraceDto): Promise<any> {
    this.logger.INFO(xTrace.xRequestId, this.api_call, `[FairServerice] Request body: ${JSON.stringify(query)}, Request ID: ${xTrace?.xRequestId}`, this.checkEligibilityV2.name)
    try {
      const fairSettingData = await this.contentService.retrieveFairSetting(query.fairCode);
      let fairSettingDetails = EligibilityUtil.prepareFairSettingDetails(fairSettingData);

      const formTemplate = await this.contentService.retrieveFormTemplateByShortSlug(query.fairCode, query.slug, query.lang)
      const formType = formTemplate.form_data.form_type;

      return await this.eligibilityService.prepareEligibilityResponse(fairSettingDetails, ssoUser, query, formType, xTrace)
    } catch (error) {
      commonExceptionHandling(error)
    }
  }

  public async generateRegNo(
    formSubmissionKey: string, 
    projectYear: string, 
    projectNumber: string, 
    sourceTypeCode: string, 
    visitorTypeCode: string,
    xTrace?: XTraceDto){

      const fairRegPreGen: FairRegistrationPregeneration = new FairRegistrationPregeneration()
      fairRegPreGen.formSubmissionKey = formSubmissionKey
      fairRegPreGen.projectYear = projectYear
      fairRegPreGen.projectNumber = projectNumber
      fairRegPreGen.sourceTypeCode = sourceTypeCode
      fairRegPreGen.visitorTypeCode = visitorTypeCode
      fairRegPreGen.createdBy = "SYSTEM"
      fairRegPreGen.lastUpdatedBy = "SYSTEM"
  
      const insertResult = await this.fairDbService.generateRegistrationNo(fairRegPreGen)
  
      const insertResultWithformSubmissionKey = {
        ...insertResult,
        serialNumber: insertResult.serialNumber.toString().padStart(6, '0'),
        formSubmissionKey,
      }
      if (xTrace)
        this.logger.INFO(xTrace.xRequestId, '', `Generated serial no: ${insertResult.serialNumber}, formSubmissionKey: ${formSubmissionKey}`, this.generateRegNo.name, insertResultWithformSubmissionKey)

    return insertResultWithformSubmissionKey
  }

  public async submitForm(ssoUser: SSOUserHeadersDto | null, request: SubmitFormRequestDto, xForwardedForStr: string, xTrace : XTraceDto): Promise<SubmitFormResponseDto> {
    this.logger.INFO(xTrace.xRequestId, '', `request: ${JSON.stringify(request)}, xForwardedForStr: ${xForwardedForStr}`, this.submitForm.name, { formSubmissionKey: request.formSubmissionKey })
    let userActivity: SubmitFormUserActivityDto = { xRequestId: xTrace.xRequestId, formSubmissionKey: request.formSubmissionKey!, slug: request.slug, formType: "", registrationList: [] }

    // param check
    const visitorTypeQueryResult = await this.fairDbService.retrieveVisitorTypeByVisitorTypeCode(request.visitorType)
    if (visitorTypeQueryResult.length == 0) {
      throw new VepError(VepErrorMsg.Form_Validation_VisitorTypeInvalid, `Invalid Submit Form Param, visitorType: ${request.visitorType}`)
    }

    //reg link check
    const regLinkCheckQuery: VerifyRegFormLinkReqDto = {
      fairCode: request.fairCode,
      slug: request.slug,
      lang: request.lang,
      visitorType: request.visitorType,
      country: request.country,
      refOffice: request.refOffice,
      refCode: request.refCode,
      regLinkId: request.regLinkId,
    }
    await this.verifyRegFormLink(regLinkCheckQuery)

    let isSubmitSuccess = false
    let registrationNo = ''
    const formData: FormSubmitDataDto = this.convertFromSubmitFormRequest(request)

    const formDataDict = ValidationUtil.convertFormToDictionary(formData);
    const isLoggedin = RegistrationUtil.checkIsLoggedIn(ssoUser);

    const ssoUserEmail = ssoUser?.emailId
    const formDataEmail = formDataDict[DedicateDataFieldEnum.br_email]?.data as string

    if (ssoUserEmail && formDataEmail && ssoUserEmail != formDataEmail) {
      throw new VepError(VepErrorMsg.SubmitForm_Email_Invalid, `Email is not match between jwt payload and form submission data, ssoUserEmail ${ssoUserEmail}, formDataEmail ${formDataEmail}`)
    }

    const userEmail = ssoUserEmail ?? formDataEmail

    if (!userEmail) {
      throw new VepError(VepErrorMsg.SubmitForm_Email_NotFound, `Missing field data with field id ${DedicateDataFieldEnum.br_email}`)
    }

    // temp logic: allow use dummy form template
    let formTemplate: FormTemplateDto = new FormTemplateDto()
    let useDummy: 'true' | 'false' = 'false'
    formTemplate = await this.contentService.retrieveFormTemplate(request.fairCode, RegistrationUtil.convertToFullPathSlug(request.fairCode, request.lang, request.slug), request.lang);

    const multiLangTemplate: MuiltiLangFormTemplate = await this.contentService.returnMultiLangTemplate(request.fairCode, request.lang, request.slug, formTemplate)
    const multiLangFormTemplateHandler = new MultiLangTemplateHandler(multiLangTemplate, request.lang)

    this.addParamFromFormTemplate(formData, formTemplate)
    userActivity.formType = formTemplate.form_data.form_type

    const isValidateStepOnly = (request.step != formTemplate.form_data.form_obj.length);
    const stepIdToSubmit = formTemplate.form_data.form_obj[request.step - 1]?.form_id ?? ""
    if (stepIdToSubmit === "") {
      throw new VepError(VepErrorMsg.Validation_Error, `step is not valid, step: ${request.step}, form step length: ${formTemplate.form_data.form_obj.length}`)
    }

    // eligibility check
    const fairCode = request.fairCode
    const fairSettingData = await this.contentService.retrieveFairSetting(fairCode);
    const fairSettingDetails = EligibilityUtil.prepareFairSettingDetails(fairSettingData)
    const eligibilityQuery: RegistrationRequestDto = {
      fairCode,
      emailId: userEmail,
      lang: request.lang,
      slug: request.slug,
      useDummy
    };

    const result = await this.eligibilityService.prepareEligibilityResponse(fairSettingDetails, ssoUser, eligibilityQuery, formTemplate.form_data.form_type, xTrace)
    if (!result.eligibility) {
      throw new VepError(
        VepErrorMsg.Registration_Not_Eligible,
        `User could not register to fair [${fairCode}], code: ${result?.code}, formType [${formData.formType}], ssouid: [${ssoUser?.ssoUid}], emailId: [${eligibilityQuery.emailId}]`
      );
    }
    // end eligibility check

    const isValidateFirstStep = (request.step === 1)
    let formSubmissionKey = request.formSubmissionKey ?? ""
    const formSubmissionValue = new FormSubmissionValueDto({
      fair_Code: fairCode,
      fiscal_year: ContentUtil.retieveFairSettingByKey<string>(fairCode, fairSettingData, FairSettingKeyEnum.fiscalYear),
      form_id: formData.slug,
      file_upload_s3: ''
    });

    // form submission key check
    // TODO: always validate form submission key
    if (formSubmissionKey || !isValidateFirstStep) {
      // existence check: starting from form step 2, form submission key is required in request body 
      if (!formSubmissionKey) {
        throw new VepError(VepErrorMsg.Registration_Missing_Form_Submission_Key, `Missing form submission key in request`);
      }

      // validation and expiration check
      const cacheResult = await this.elastiCacheService.getElastiCacheKeyValue(formSubmissionKey);
      if (cacheResult === null) {
        // If the key is not expired, it is valid. Else, user should restart
        throw new VepError(VepErrorMsg.Submission_Key_Not_Found);
      } else {
        // renew expiration time of form submission key, 
        await this.elastiCacheService.setElastiCacheKeyValue(formSubmissionKey, cacheResult, FORM_SUBMISSION_KEY_EXPIRATION_TIME_IN_MINUTE * 60)
      }
    }

    //wordpress form validation rule validation logic
    const formSubmitMetaData: FormSubmitMetaData = {
      isLoggedin,
      stepToSubmit: request.step,
      stepIdToSubmit,
      totalStep: formTemplate.form_data.form_obj.length,
      isValidateStepOnly,
      xForwardedForStr,
    }
    const wpFormResult = await this.wordpressFormValidationService.validateFormByWordpressRule(formTemplate, formData, formSubmitMetaData)
    if (wpFormResult.formStepValidStatus.find((x) => !x.isStepValid)) {
      return {
        ...wpFormResult,
        submitType: request.submitType,
        validationStatus: isValidateStepOnly ? VALIDATION_STATUS.STEP_FAILED : VALIDATION_STATUS.FORM_FAILED,
        isSubmitSuccess,
        formSubmissionKey,
        slug: request.slug,
        "user-activity": userActivity,
      };
    }

    //business rule validation logic
    const brFormResult = await this.businessRuleFormValidationService.validateFormByBusinessRule(formData.formType, formDataDict, formSubmitMetaData);
    if (brFormResult.formValidationError.find((x) => ThrowExceptionBusinessRuleFormValidationCode.includes(x.formValidationErrorCode as BusinessRuleFormValidationCode)) ){
      throw new VepError(VepErrorMsg.Unhandled_Business_Rule_Error, `Fail to handle following error, error list: ${JSON.stringify(brFormResult.formValidationError)}`)
    } else if (brFormResult.formStepValidStatus.find((x) => !x.isStepValid)) {
      return {
        ...brFormResult,
        submitType: request.submitType,
        validationStatus: isValidateStepOnly ? VALIDATION_STATUS.STEP_FAILED : VALIDATION_STATUS.FORM_FAILED,
        isSubmitSuccess,
        formSubmissionKey,
        slug: request.slug,
        "user-activity": userActivity,
      };
    }

    if (request.submitType == SUBMIT_TYPE.SUBMIT) {
      const overseasBranchOfficeDto = {
        addressCountryCode: formDataDict[DedicateDataFieldEnum.br_address_country]?.data as string ?? '',
        stateOrProvinceCode: formDataDict[DedicateDataFieldEnum.br_address_state]?.data as string ?? '',
        cityCode: formDataDict[DedicateDataFieldEnum.br_address_city]?.data as string ?? ''
      }

      const jurisdictionCodeData: CouncilwiseDataResponseDto = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
        GeneralDefinitionDataRequestDTOType.code,
        CouncilwiseDataType['office-jurisdiction'],
        overseasBranchOfficeDto.addressCountryCode
      )

      const overseasBranchOffice = ContentUtil.retrieveOverseasBranchOfficeFromJurisdiction(jurisdictionCodeData, overseasBranchOfficeDto)

      // Registration Logic
      const additionalInfo: { [key: string]: string | null } = {
        fairCode,
        projectYear: fairSettingData.vms_project_year,
        projectNumber: fairSettingData.vms_project_no,
        fiscalYear: fairSettingData.fiscal_year,
        visitorTypeCode: request.visitorType,
        participantType: RegistrationUtil.convertParticipantTypeToDigit(formData.formType),
        ssoUid: ssoUser?.ssoUid ?? null,
        encryptedPassword: formDataDict[DedicateDataFieldEnum.br_password]?.data ? FormCommonUtil.encryptPassword(formDataDict[DedicateDataFieldEnum.br_password]?.data as string, this.passwordPublicKey) : "",
        fairType: fairSettingData.fair_type,
        lang: request.lang,
        overseasBranchOffice,
        referenceOverseasOffice: request.refOffice,
        referenceCode: request.refCode,
        formSubmissionKey,
      }

      // insert DB record (table: fairRegistrationFormSubmission)
      const now: Date = new Date();
      const formSubmissionInfo: { [key: string]: string | Date } = {
        ssoUid: ssoUser?.ssoUid ?? '',
        emailId: userEmail,
        fairCode,
        fiscalYear: fairSettingData.fiscal_year,
        sqsMessage: '',
        status: FORM_SUBMISSION_STATUS.PENDING,
        log: '',
        maxRetry: '3',
        retryCount: '0',
        retryIntervalSec: '30',
        createdBy: "SYSTEM",
        creationTime: now,
        lastUpdatedBy: "SYSTEM",
        lastUpdatedTime: now,
      }

      try {
        await this.insertFormSubmissionRecord(formSubmissionInfo);
      } catch (error) {
        throw new VepError(VepErrorMsg.Insert_Form_Submission_Record_Error, error.message);
      }

      // copy file from temp path to fr-content root
      const formTemplateDict = ValidationUtil.convertFormTemplateToTemplateDictionary(formTemplate)
      const fileFieldIdList = Object.keys(formTemplateDict).reduce(
        (aggResult: string[], fieldId: string) => {
          if (formTemplateDict[fieldId].field_type == FIELD_TYPE["hktdc-file-upload"]) {
            aggResult.push(fieldId)
          }
          return aggResult
        }, [])
      if (fileFieldIdList.length > 0) {
        fileFieldIdList.forEach(fileFieldId => {
          const tempFileS3Key = (formDataDict[fileFieldId]?.data as string) ?? "";
          if (tempFileS3Key) {
            const newFileName = tempFileS3Key.replace('/temp', '')
            this.s3Service.copyFile(this.uploadFileBucket, newFileName, tempFileS3Key)
            formDataDict[fileFieldId].data = newFileName
          }
        })
      }

      // convert country code to tel code
      let countryCodeToCheckTelCode: string[] = []
      if (formDataDict[DedicateDataFieldEnum.br_country_code_mobile]?.data) {
        countryCodeToCheckTelCode.push(formDataDict[DedicateDataFieldEnum.br_country_code_mobile]?.data as string)
      }
      if (formDataDict[DedicateDataFieldEnum.br_country_code_company]?.data) {
        countryCodeToCheckTelCode.push(formDataDict[DedicateDataFieldEnum.br_country_code_company]?.data as string)
      }
      if (countryCodeToCheckTelCode.length > 0) {
        const iddCodeData = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
          GeneralDefinitionDataRequestDTOType.tel,
          CouncilwiseDataType['idd-country'],
          countryCodeToCheckTelCode.join(',')
        )

        if (formDataDict[DedicateDataFieldEnum.br_country_code_mobile]?.data) {
          formDataDict[DedicateDataFieldEnum.br_country_code_mobile].data = iddCodeData[formDataDict[DedicateDataFieldEnum.br_country_code_mobile]?.data as string].code
        }
        if (formDataDict[DedicateDataFieldEnum.br_country_code_company]?.data) {
          formDataDict[DedicateDataFieldEnum.br_country_code_company].data = iddCodeData[formDataDict[DedicateDataFieldEnum.br_country_code_company]?.data as string].code
        }
      }

      // retrieve serial no.
      const { serialNumber, projectYear, sourceTypeCode, visitorTypeCode, projectNumber } = await this.generateRegNo(request.formSubmissionKey!, fairSettingData.vms_project_year, fairSettingData.vms_project_no, constant.submitFormDefaultValue.SourceTypeCode, request.visitorType, xTrace)
      additionalInfo[RegistrationDataSqsJsonFieldEnum.serialNumber] = serialNumber
      registrationNo = `${serialNumber}${projectYear.substring(projectYear.length - 2)}${sourceTypeCode}${visitorTypeCode}${projectNumber}`

      const sqsJsonData = RegistrationUtil.convertDictionaryToSqsJson(formDataDict, additionalInfo, multiLangFormTemplateHandler);
      this.logger.INFO(xTrace.xRequestId, '', `sqsJsonData: ${JSON.stringify(sqsJsonData)}`, this.submitForm.name, { formSubmissionKey })

      isSubmitSuccess = true;
        
      const sqsResultSuccess = await this.sqsService.sendSQSJsonToRegistrationQueue(sqsJsonData,xTrace.xRequestId);
      if (!sqsResultSuccess){
        this.logger.FATAL(xTrace.xRequestId, '', 'Error in sending registration sqs, ', this.submitForm.name, { formSubmissionKey })
      }

      if (isSubmitSuccess) {
        userActivity.registrationList.push({ fairCode, registrationNo })

        const isDeleted = await this.elastiCacheService.deleteElastiCacheKeyValue(formSubmissionKey)

        const message = `Completed invokeLambda, try delete form submission key from cache: ${isDeleted}. False implies that the key do not exist.`

        this.logger.INFO(xTrace.xRequestId, '', message, this.submitForm.name, { formSubmissionKey})
      }
    }

    //TODO: do not generate formSubmissionKey in submit form api
    if (isValidateFirstStep && !formSubmissionKey) {
      formSubmissionKey = this.createFormSubmissionKey();
      // insert form submission key into redis
      try {
        await this.setElastiCacheKeyValue(formSubmissionKey, JSON.stringify(formSubmissionValue), FORM_SUBMISSION_KEY_EXPIRATION_TIME_IN_MINUTE * 60)
      } catch (error) {
        if (error.name === 'VepError') {
          throw new VepError(error.vepErrorMsg, error.errorDetail);
        }
        throw new VepError(VepErrorMsg.Access_ElastiCache_Error, error.message);
      }
    }

    return {
      ...brFormResult,
      submitType: request.submitType,
      validationStatus: isValidateStepOnly ? VALIDATION_STATUS.STEP_PASSED : VALIDATION_STATUS.FORM_PASSED,
      isSubmitSuccess,
      formSubmissionKey,
      registrationNo,
      slug: request.slug,
      "user-activity": userActivity,
    };
  }

  public async submitAORForm(request: SubmitAORFormRequestDto, xForwardedForStr: string, xTrace: XTraceDto): Promise<SubmitAORFormResponseDto> {
    this.logger.INFO(xTrace.xRequestId, '', `request: ${JSON.stringify(request)}, xForwardedForStr: ${xForwardedForStr}`, this.submitAORForm.name, { formSubmissionKey: request.formSubmissionKey })
    let userActivity: SubmitFormUserActivityDto = { xRequestId: xTrace.xRequestId, formSubmissionKey: request.formSubmissionKey!, slug: request.slug, formType: "", registrationList: [] }
    let ssoUser : SSOUserHeadersDto | null = null

    let isSubmitSuccess = false
    const formData: FormSubmitDataDto = this.convertFromSubmitFormRequest(request)
    let registrationResultArray: SubmitAORFormResponseResultArrayDto[] = []

    //reg link check
    const regLinkCheckQuery: VerifyRegFormLinkReqDto = {
      fairCode: request.fairCode,
      slug: request.slug,
      lang: request.lang,
      visitorType: request.visitorType,
      country: request.country,
      refOffice: request.refOffice,
      refCode: request.refCode,
      regLinkId: request.regLinkId,
    }
    await this.verifyRegFormLink(regLinkCheckQuery)

    const formDataDict = ValidationUtil.convertFormToDictionary(formData);
    let isLoggedin = false
    let ssoInfo: SsoPrefillDto | null = null

    // temp logic: allow use dummy form template
    let formTemplate: FormTemplateDto = new FormTemplateDto()
    let useDummy: 'true' | 'false' = 'false'

    formTemplate = await this.contentService.retrieveFormTemplate(request.fairCode, RegistrationUtil.convertToFullPathSlug(request.fairCode, request.lang, request.slug), request.lang);
    const multiLangTemplate: MuiltiLangFormTemplate = await this.contentService.returnMultiLangTemplate(request.fairCode, request.lang, request.slug, formTemplate)
    const multiLangFormTemplateHandler = new MultiLangTemplateHandler(multiLangTemplate, request.lang)
    //will throw error if fail to retreive profile
    try {
      const emailId = formDataDict['br_email']?.data as string ?? ''
      if (emailId){
        ssoInfo = await this.buyerService.getSsoProfileByEmail(emailId);
        isLoggedin = true
        ssoUser = new SSOUserHeadersDto()
        //Assumption: frontend must pass ssouid in form while submit stage.
        ssoUser.ssoUid = ssoInfo.ssoUid
        ssoUser.emailId = ssoInfo.email
        ssoUser.firstName = ssoInfo.firstName
        ssoUser.lastName = ssoInfo.lastName
      }
    } catch (ex){
      this.logger.log(`Fail to retrieve sso profile with email ${formDataDict['br_email']}`)
    }

    this.addParamFromFormTemplate(formData, formTemplate)
    userActivity.formType = formTemplate.form_data.form_type

    const isValidateStepOnly = (request.step != formTemplate.form_data.form_obj.length);
    const stepIdToSubmit = formTemplate.form_data.form_obj[request.step - 1]?.form_id ?? ""
    if(stepIdToSubmit === ""){
      throw new VepError(VepErrorMsg.Validation_Error, `step is not valid, step: ${request.step}, form step length: ${formTemplate.form_data.form_obj.length}`)
    }

    let formSubmissionKey = request.formSubmissionKey ?? ""

    // form submission key check

    if (!formSubmissionKey) {
      throw new VepError(VepErrorMsg.Registration_Missing_Form_Submission_Key, `Missing form submission key in request`);
    }

    // validation and expiration check
    const cacheResult = await this.elastiCacheService.getElastiCacheKeyValue(formSubmissionKey);
    if (cacheResult === null) {
      // If the key is not expired, it is valid. Else, user should restart
      throw new VepError(VepErrorMsg.Submission_Key_Not_Found);
    } else {
      // renew expiration time of form submission key,
      await this.elastiCacheService.setElastiCacheKeyValue(formSubmissionKey, cacheResult, FORM_SUBMISSION_KEY_EXPIRATION_TIME_IN_MINUTE * 60);
    }


    //wordpress form validation rule validation logic
    const formSubmitMetaData: FormSubmitMetaData = {
      isLoggedin,
      stepToSubmit: request.step,
      stepIdToSubmit,
      totalStep: formTemplate.form_data.form_obj.length,
      isValidateStepOnly,
      xForwardedForStr,
    }
    const wpFormResult = await this.wordpressFormValidationService.validateFormByWordpressRule(formTemplate, formData, formSubmitMetaData)
    if (wpFormResult.formStepValidStatus.find((x) => !x.isStepValid)) {
      return {
        ...wpFormResult,
        submitType: request.submitType,
        validationStatus: isValidateStepOnly ? VALIDATION_STATUS.STEP_FAILED : VALIDATION_STATUS.FORM_FAILED,
        isSubmitSuccess,
        formSubmissionKey,
        slug: request.slug,
        "user-activity": userActivity,
      };
    }

    //fill sso data form if logged in
    if (isLoggedin){
      this.fillObjectWithSSORequiredField(formDataDict, ssoInfo)
    }

    //business rule validation logic
    const brFormResult = await this.businessRuleFormValidationService.validateFormByBusinessRule(formData.formType, formDataDict, formSubmitMetaData);
    if (brFormResult.formValidationError.find((x) => ThrowExceptionBusinessRuleFormValidationCode.includes(x.formValidationErrorCode as BusinessRuleFormValidationCode)) ){
      throw new VepError(VepErrorMsg.Unhandled_Business_Rule_Error, `Fail to handle following error, error list: ${JSON.stringify(brFormResult.formValidationError)}`)
    } else if (brFormResult.formStepValidStatus.find((x) => !x.isStepValid)) {
      return {
        ...brFormResult,
        submitType: request.submitType,
        validationStatus: isValidateStepOnly ? VALIDATION_STATUS.STEP_FAILED : VALIDATION_STATUS.FORM_FAILED,
        isSubmitSuccess,
        formSubmissionKey,
        slug: request.slug,
        "user-activity": userActivity,
      };
    }


    // convert country code to tel code
    let countryCodeToCheckTelCode: string[] = [];
    if (formDataDict[DedicateDataFieldEnum.br_country_code_mobile]?.data) {
      countryCodeToCheckTelCode.push(formDataDict[DedicateDataFieldEnum.br_country_code_mobile]?.data as string);
    }
    if (formDataDict[DedicateDataFieldEnum.br_country_code_company]?.data) {
      countryCodeToCheckTelCode.push(formDataDict[DedicateDataFieldEnum.br_country_code_company]?.data as string);
    }
    if (countryCodeToCheckTelCode.length > 0) {
      const iddCodeData = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
        GeneralDefinitionDataRequestDTOType.tel,
        CouncilwiseDataType['idd-country'],
        countryCodeToCheckTelCode.join(',')
      );

      if (formDataDict[DedicateDataFieldEnum.br_country_code_mobile]?.data) {
        formDataDict[DedicateDataFieldEnum.br_country_code_mobile].data = iddCodeData[formDataDict[DedicateDataFieldEnum.br_country_code_mobile]?.data as string].code;
      }
      if (formDataDict[DedicateDataFieldEnum.br_country_code_company]?.data) {
        formDataDict[DedicateDataFieldEnum.br_country_code_company].data = iddCodeData[formDataDict[DedicateDataFieldEnum.br_country_code_company]?.data as string].code;
      }
    }

    if (request.submitType == SUBMIT_TYPE.SUBMIT) {
      const userEmail = ssoUser?.emailId ?? formDataDict[DedicateDataFieldEnum.br_email]?.data as string
      if (!userEmail) {
        throw new VepError(VepErrorMsg.SubmitForm_Email_NotFound, `Missing field data with field id ${DedicateDataFieldEnum.br_email}`)
      }

      //Assumption must have fair_list when submit
      let formTemplateDict  = ValidationUtil.convertFormTemplateToTemplateDictionary(formTemplate)

      const fairListFieldId = Object.keys(formTemplateDict).find((fieldId)=> {
        return formTemplateDict[fieldId].field_type == FIELD_TYPE["fair_list"]
      } )

      if (!fairListFieldId) {
        throw new VepError(VepErrorMsg.Aor_Form_Missing_Fair_List)
      }

      //Should be per fair in fieldlist
      let registerFairList: Array<string> = formDataDict[fairListFieldId] ? formDataDict[fairListFieldId].data as Array<string> : []

      let fairSettingDataObjArray : Array<AORFairSettingObjDto> = []
      //check all fair eligibility before registration
      for (const currentFairCode of registerFairList) {
        const fairSettingData = await this.contentService.retrieveFairSetting(currentFairCode);
        const fairSettingDetails = EligibilityUtil.prepareFairSettingDetails(fairSettingData)
        const eligibilityQuery: RegistrationRequestDto = {
          fairCode: currentFairCode,
          emailId: userEmail,
          lang: request.lang,
          slug: request.slug,
          useDummy
        };
        //AOR check Eligibility as registering organic buyer
        const result = await this.eligibilityService.prepareEligibilityResponse(fairSettingDetails, ssoUser, eligibilityQuery, FORM_TYPE.AOR, xTrace);
        fairSettingDataObjArray.push({
          fairCode: currentFairCode,
          fairSettingData,
          eligibility: result.eligibility ? true : false,
          eligibilityFailCode: result.code
        });
      }


      let sqsJsonArray = []
      for (const currentFairObj of fairSettingDataObjArray) {
        const currentFairCode = currentFairObj.fairCode
        const fairSettingData = currentFairObj.fairSettingData as any;

        // Registration Logic
        const additionalInfo: { [key: string]: string | null } = {
          fairCode:currentFairCode,
          projectYear: fairSettingData.vms_project_year,
          fiscalYear: fairSettingData.fiscal_year,
          projectNumber: fairSettingData.vms_project_no,
          visitorTypeCode: request.visitorType,
          participantType: RegistrationUtil.convertParticipantTypeToDigit(FORM_TYPE.ORGANIC_BUYER),
          ssoUid: ssoUser?.ssoUid ?? null,
          encryptedPassword: formDataDict[DedicateDataFieldEnum.br_password]?.data ? FormCommonUtil.encryptPassword(formDataDict[DedicateDataFieldEnum.br_password]?.data as string, this.passwordPublicKey) : '',
          fairType: fairSettingData?.fair_type ?? '',
          lang: request.lang,
          referenceOverseasOffice: request.refOffice,
          referenceCode: request.refCode,
          formSubmissionKey
        };

        // insert DB record (table: fairRegistrationFormSubmission)
        const now: Date = new Date();
        const formSubmissionInfo: { [key: string]: string | Date } = {
          ssoUid: ssoUser?.ssoUid ?? '',
          emailId: userEmail,
          fairCode: currentFairCode,
          fiscalYear: fairSettingData.fiscal_year,
          sqsMessage: '',
          status: FORM_SUBMISSION_STATUS.PENDING,
          log: '',
          maxRetry: '3',
          retryCount: '0',
          retryIntervalSec: '30',
          createdBy: 'SYSTEM',
          creationTime: now,
          lastUpdatedBy: 'SYSTEM',
          lastUpdatedTime: now
        };


        // copy file from temp path to fr-content root
        const formTemplateDict = ValidationUtil.convertFormTemplateToTemplateDictionary(formTemplate);
        const fileFieldIdList = Object.keys(formTemplateDict).reduce(
          (aggResult: string[], fieldId: string) => {
            if (formTemplateDict[fieldId].field_type == FIELD_TYPE['hktdc-file-upload']) {
              aggResult.push(fieldId);
            }
            return aggResult;
          }, []);
        if (fileFieldIdList.length > 0) {
          fileFieldIdList.forEach(fileFieldId => {
            const tempFileS3Key = (formDataDict[fileFieldId]?.data as string) ?? '';
            if (tempFileS3Key) {
              const newFileName = tempFileS3Key.replace('/temp', '');
              this.s3Service.copyFile(this.uploadFileBucket, newFileName, tempFileS3Key);
              formDataDict[fileFieldId].data = newFileName;
            }
          });
        }

        let registrationNo = ""
        if (currentFairObj.eligibility) {
        // retrieve serial no.
          const { serialNumber, projectYear, sourceTypeCode, visitorTypeCode, projectNumber } = await this.generateRegNo(request.formSubmissionKey!, fairSettingData.vms_project_year, fairSettingData.vms_project_no, constant.submitFormDefaultValue.SourceTypeCode, request.visitorType, xTrace)
          additionalInfo[RegistrationDataSqsJsonFieldEnum.serialNumber] = serialNumber
          registrationNo = `${serialNumber}${projectYear.substring(projectYear.length - 2)}${sourceTypeCode}${visitorTypeCode}${projectNumber}`
        }
        const sqsJsonData = RegistrationUtil.convertDictionaryToSqsJson(formDataDict, additionalInfo, multiLangFormTemplateHandler);
        this.logger.INFO(xTrace.xRequestId, '', `sqsJsonData: ${JSON.stringify(sqsJsonData)}`, this.submitForm.name, { formSubmissionKey })

        const fairDisplayName: MultiLangNameDto = {
          en: fairSettingData.fair_display_name?.en,
          tc: fairSettingData.fair_display_name?.tc,
          sc: fairSettingData.fair_display_name?.sc,
        }

        if (currentFairObj.eligibility) {
          try {
            await this.insertFormSubmissionRecord(formSubmissionInfo);
          } catch (error) {
            throw new VepError(VepErrorMsg.Insert_Form_Submission_Record_Error, error.message);
          }
          userActivity.registrationList.push({ fairCode: currentFairCode, registrationNo })
          sqsJsonArray.push({
            currentFairCode,
            fairDisplayName,
            registrationNo,
            sqsJsonData:sqsJsonData})
        } else {
          registrationResultArray.push({
            fairCode: currentFairCode,
            fairDisplayName,
            isReg: false,
            registrationNo: "",
            error: currentFairObj.eligibilityFailCode
          })
          await this.sqsService.sendSQSJsonToRegistrationDeadQueue(sqsJsonData)
        }
      }

      if (sqsJsonArray.length > 0) {
         await this.fairDbService.insertParticipantIfEmailNotExist(formDataDict['br_email']?.data as string ?? '');
      }

      let lambdaResults = await Promise.all(sqsJsonArray.map(async (sqsJsonData) => {
        const sqsResultSuccess = await this.sqsService.sendSQSJsonToRegistrationQueue(sqsJsonData.sqsJsonData,xTrace.xRequestId);
        if (!sqsResultSuccess){
          this.logger.FATAL(xTrace.xRequestId, '', 'Error in sending registration sqs, ', this.submitAORForm.name, { formSubmissionKey })
        }

        return {
          fairCode: sqsJsonData.currentFairCode,
          fairDisplayName: sqsJsonData.fairDisplayName,
          isReg: sqsJsonData.registrationNo ? true : false,
          registrationNo: sqsJsonData.registrationNo,
          error: ""
        };
      }));

      registrationResultArray = registrationResultArray.concat(lambdaResults)
      //If Any submit success, delete key from cache
      if (isSubmitSuccess) {
        const isDeleted = await this.elastiCacheService.deleteElastiCacheKeyValue(formSubmissionKey);

        const message = `Completed invokeLambda, try delete form submission key from cache: ${isDeleted}. False implies that the key do not exist.`;

        this.logger.INFO(xTrace.xRequestId, '', message, this.submitForm.name, { formSubmissionKey });

      }

    }
    return {
      ...brFormResult,
      submitType: request.submitType,
      validationStatus: isValidateStepOnly ? VALIDATION_STATUS.STEP_PASSED : VALIDATION_STATUS.FORM_PASSED,
      isSubmitSuccess,
      formSubmissionKey,
      registrationResultArray: registrationResultArray,
      slug: request.slug,
      "user-activity": userActivity,
    };
  }

  public async submitCombinedFairForm(ssoUser: SSOUserHeadersDto, request: SubmitCombinedFairFormRequestDto, xForwardedForStr: string, xTrace: XTraceDto): Promise<SubmitCombinedFairFormResponseDto> {
    this.logger.INFO(xTrace.xRequestId, '', `request: ${JSON.stringify(request)}, xForwardedForStr: ${xForwardedForStr}`, this.submitCombinedFairForm.name, { formSubmissionKey: request.formSubmissionKey })
    let userActivity: SubmitFormUserActivityDto = { xRequestId: xTrace.xRequestId, formSubmissionKey: request.formSubmissionKey!, slug: request.slug, formType: "", registrationList: [] }
    let fromFairCode = request.fairCode

    //check toRegisterFairCode is combined fair of fairCode
    try {
      const { data } = await this.fairService.getWordpressCombinedFairSettings(fromFairCode);
      const combinedFairDataObj = JSON.parse(data.data)
      let combinedFair: GetCombinedFairListRespDto = {
        combinationName: combinedFairDataObj.data["combination_name"],
        fairList: combinedFairDataObj.data["combined-fair"].map(
          (x: { url: string }) => {
            return new FairNameDto(x.url)
          }
        )
      }
      if (!combinedFair.fairList.map(fairListDto => fairListDto.fairCode).includes(request.toRegisterFairCode)){
         throw new VepError(VepErrorMsg.To_Fair_Code_Not_Combined_Fair, `${request.toRegisterFairCode} is not combined fair with ${fromFairCode}`)
      }
    } catch {
      throw new VepError(VepErrorMsg.To_Fair_Code_Not_Combined_Fair, `${request.toRegisterFairCode} is not combined fair with ${fromFairCode}`)
    }


    let isSubmitSuccess = false
    let registrationNo = ''
    let formData: FormSubmitDataDto = new FormSubmitDataDto()

    formData.data = JSON.parse(request.formDataJson)
    formData.fairCode = request.toRegisterFairCode
    formData.visitorType = ''
    formData.slug = request.slug
    formData.country = ''
    formData.refOffice = ''
    formData.refCode = ''
    formData.captcha = request.captcha

    const formDataDict = ValidationUtil.convertFormToDictionary(formData);

    const userEmail = ssoUser?.emailId ?? formDataDict[DedicateDataFieldEnum.br_email]?.data as string

    if (!userEmail) {
      throw new VepError(VepErrorMsg.SubmitForm_Email_NotFound, `Missing field data with field id ${DedicateDataFieldEnum.br_email}`)
    }

    //get organic buyer slug
    const fairSetting = await this.contentService.retrieveFairSetting(request.toRegisterFairCode);
    let formSlug = ContentUtil.retrieveFormSlugForProfileEdit(request.toRegisterFairCode, fairSetting, 1, request.lang)

    // temp logic: allow use dummy form template
    let formTemplate: FormTemplateDto = new FormTemplateDto()
    let useDummy: 'true' | 'false' = 'false'
    formTemplate = await this.contentService.retrieveFormTemplate(request.toRegisterFairCode, formSlug, request.lang);
    const multiLangTemplate: MuiltiLangFormTemplate =  await this.contentService.returnMultiLangTemplate(request.fairCode, request.lang, request.slug, formTemplate)
    const multiLangFormTemplateHandler = new MultiLangTemplateHandler(multiLangTemplate, request.lang)

    // eligibility check
    const toFairCode = request.toRegisterFairCode
    const toFairSettingData = await this.contentService.retrieveFairSetting(toFairCode);
    const toFairSettingDetails = EligibilityUtil.prepareFairSettingDetails(toFairSettingData)
    const eligibilityQuery: RegistrationRequestDto = {
      fairCode: toFairCode,
      emailId: userEmail,
      lang: request.lang,
      slug: request.slug,
      useDummy
    };

    const result = await this.eligibilityService.prepareEligibilityResponse(toFairSettingDetails, ssoUser, eligibilityQuery, FORM_TYPE.ORGANIC_BUYER, xTrace)
    if (!result.eligibility) {
      throw new VepError(
        VepErrorMsg.Registration_Not_Eligible,
        `User could not register to fair [${toFairCode}], code: ${result?.code}, formType [${formData.formType}], ssouid: [${ssoUser?.ssoUid}], emailId: [${eligibilityQuery.emailId}]`
      );
    }
    // end eligibility check

    this.addParamFromFormTemplate(formData, formTemplate)
    userActivity.formType = formTemplate.form_data.form_type

    let formSubmissionKey = request.formSubmissionKey ?? ""

    if (!formSubmissionKey) {
      throw new VepError(VepErrorMsg.Registration_Missing_Form_Submission_Key, `Missing form submission key in request`);
    }

    // validation and expiration check
    const cacheResult = await this.elastiCacheService.getElastiCacheKeyValue(formSubmissionKey);
    if (cacheResult === null) {
      // If the key is not expired, it is valid. Else, user should restart
      throw new VepError(VepErrorMsg.Submission_Key_Not_Found);
    } else {
      // renew expiration time of form submission key,
      await this.elastiCacheService.setElastiCacheKeyValue(formSubmissionKey, cacheResult, FORM_SUBMISSION_KEY_EXPIRATION_TIME_IN_MINUTE * 60);
    }

    // validate with edit form logic
    // strip sso field and field with edit_in_profile != true
    let additionalOption: EditFormOptionMetadata = {
      showAllConsent: true
    }

    const editFormData: EditFormDataDto = {
      data: this.wordpressFormValidationService.stripDataForEditFormValidationWithOption(formTemplate, request.formDataJson, additionalOption)
    }

    const editFormValidationErrors = await this.wordpressFormValidationService.editFormValidationWithOption(formTemplate, editFormData, additionalOption)

    if (editFormValidationErrors.length > 0) {
      return {
        isSubmitSuccess: false,
        formValidationError: editFormValidationErrors,
        formSubmissionKey,
        slug: request.slug,
        "user-activity": userActivity,
      }
    }


    // retrieve fair reg by fromfairCode, fiscalYear and ssouid
    const fromFairSetting = await this.contentService.retrieveFairSetting(fromFairCode);
    const fiscalYear = ContentUtil.retieveFairSettingByKey<string>(fromFairCode, fromFairSetting, FairSettingKeyEnum.fiscalYear)
    const fromFairRegDetail = await this.fairDbService.getSSOAutoHandlingField(ssoUser.ssoUid, fromFairCode, fiscalYear)

    if (!fromFairRegDetail) {
      throw new VepError(VepErrorMsg.Fail_To_Get_From_Fair_Code, "Cannot find fair code registration detail")
    }

    // Registration Logic -- Assumption: Register visitor type code always 01 for combined fair
    const combinedFairVisitorTypeCode = "01"

    const additionalInfo: { [key: string]: string | null } = {
      fairCode: toFairCode,
      projectYear: toFairSettingData.vms_project_year,
      projectNumber: toFairSettingData.vms_project_no,
      fiscalYear: toFairSettingData.fiscal_year,
      visitorTypeCode: combinedFairVisitorTypeCode,
      participantType: RegistrationUtil.convertParticipantTypeToDigit(formData.formType),
      ssoUid: ssoUser?.ssoUid ?? null,
      fairType: toFairSettingData.fair_type,
      lang: request.lang,
      formSubmissionKey,
    }

      // insert DB record (table: fairRegistrationFormSubmission)
      const now: Date = new Date();
      const formSubmissionInfo: {[key:string]:string|Date} = {
        ssoUid: ssoUser?.ssoUid ?? '',
        emailId: userEmail,
        fairCode: toFairCode,
        fiscalYear: toFairSettingData.fiscal_year,
        sqsMessage: '',
        status: FORM_SUBMISSION_STATUS.PENDING,
        log: '',
        maxRetry: '3',
        retryCount: '0',
        retryIntervalSec: '30',
        createdBy: "SYSTEM",
        creationTime: now,
        lastUpdatedBy: "SYSTEM",
        lastUpdatedTime: now,
        formSubmissionKey: formSubmissionKey ?? null
      }

    try {
      await this.insertFormSubmissionRecord(formSubmissionInfo);
    } catch (error) {
      throw new VepError(VepErrorMsg.Insert_Form_Submission_Record_Error, error.message);
    }

    // copy file from temp path to fr-content root
    const formTemplateDict = ValidationUtil.convertFormTemplateToTemplateDictionary(formTemplate)
    const fileFieldIdList = Object.keys(formTemplateDict).reduce(
      (aggResult: string[], fieldId: string) => {
        if (formTemplateDict[fieldId].field_type == FIELD_TYPE["hktdc-file-upload"]) {
          aggResult.push(fieldId)
        }
        return aggResult
      }, [])
    if (fileFieldIdList.length > 0) {
      fileFieldIdList.forEach(fileFieldId => {
        const tempFileS3Key = (formDataDict[fileFieldId]?.data as string) ?? "";
        if (tempFileS3Key) {
          const newFileName = tempFileS3Key.replace('/temp', '')
          this.s3Service.copyFile(this.uploadFileBucket, newFileName, tempFileS3Key)
          formDataDict[fileFieldId].data = newFileName
        }
      })
    }

      // Fill Sso field
      this.replaceFormDataWithSSORequiredFieldFromDb(formDataDict,fromFairRegDetail)

      // retrieve serial no.
      const { serialNumber, projectYear, sourceTypeCode, visitorTypeCode, projectNumber } = await this.generateRegNo(request.formSubmissionKey!, toFairSettingData.vms_project_year, toFairSettingData.vms_project_no, constant.submitFormDefaultValue.SourceTypeCode, combinedFairVisitorTypeCode, xTrace)
      additionalInfo[RegistrationDataSqsJsonFieldEnum.serialNumber] = serialNumber
      registrationNo = `${serialNumber}${projectYear.substring(projectYear.length - 2)}${sourceTypeCode}${visitorTypeCode}${projectNumber}`

      const sqsJsonData = RegistrationUtil.convertDictionaryToSqsJson(formDataDict, additionalInfo, multiLangFormTemplateHandler);
      this.logger.INFO(xTrace.xRequestId, '', `sqsJsonData: ${JSON.stringify(sqsJsonData)}`, this.submitForm.name, { formSubmissionKey })

      isSubmitSuccess = true;
      const sqsResultSuccess = await this.sqsService.sendSQSJsonToRegistrationQueue(sqsJsonData,xTrace.xRequestId);
      if (!sqsResultSuccess){
        this.logger.FATAL(xTrace.xRequestId, '', 'Error in sending registration sqs, ', this.submitCombinedFairForm.name, { formSubmissionKey })
      }

      if (isSubmitSuccess) {
        userActivity.registrationList.push({ fairCode: toFairCode, registrationNo })

        const isDeleted = await this.elastiCacheService.deleteElastiCacheKeyValue(formSubmissionKey)

        const message = `Completed invokeLambda, try delete form submission key from cache: ${isDeleted}. False implies that the key do not exist.`

        this.logger.INFO(xTrace.xRequestId, '', message, this.submitForm.name, { formSubmissionKey });
      }


    return {
      isSubmitSuccess,
      formSubmissionKey,
      registrationNo,
      slug: request.slug,
      formValidationError: editFormValidationErrors,
      "user-activity": userActivity,
    };

  }

  public async submitShortRegistration(request: SubmitShortRegReqDto): Promise<SubmitShortRegRespDto>{

    let ssoInfo: SsoPrefillDto | null = null
    let ssoUser : SSOUserHeadersDto = new SSOUserHeadersDto()
    let formDataDict: FormDataDictionaryDto = {}
    let registrationNo = ''
    const useDummy = 'false'
    let isSubmitSuccess = false

    ssoInfo = await this.buyerService.getSsoProfile(request.ssoUid)

    if(ssoInfo == null){
      throw new VepError(VepErrorMsg.Participant_Import_Invalid_SSO_Email_Error,"Fail to retrieve ssouid profile")
    }

    ssoUser.ssoUid = request.ssoUid
    ssoUser.emailId = ssoInfo.email
    ssoUser.firstName = ssoInfo.firstName
    ssoUser.lastName = ssoInfo.lastName

    // eligibility check
    const fairCode = request.fairCode
    const fairSettingData = await this.contentService.retrieveFairSetting(fairCode);
    const fairSettingDetails = EligibilityUtil.prepareFairSettingDetails(fairSettingData)
    const eligibilityQuery: RegistrationRequestDto = {
      fairCode,
      emailId: ssoUser.emailId,
      lang: 'en',
      slug: "",
      useDummy
    };

    const result = await this.eligibilityService.prepareEligibilityResponse(fairSettingDetails, ssoUser, eligibilityQuery, FORM_TYPE.SEMINAR_SHORT)
    if (!result.eligibility) {
      throw new VepError(
        VepErrorMsg.Registration_Not_Eligible,
        `User could not register to fair [${fairCode}], code: ${result?.code}, formType [${FORM_TYPE.ORGANIC_BUYER}], ssouid: [${ssoUser?.ssoUid}], emailId: [${eligibilityQuery.emailId}]`
      );
    }
    // end eligibility check

    this.fillObjectWithSSORequiredField(formDataDict,ssoInfo)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_consent_registration_detail, request.registrationDetailConsent?'Y':'N')
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_concent_privacy_policy_statement, request.badgeConsent?'Y':'N')
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_concent_eu_eea_clause, request.euConsentStatus?'Y':'N')
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_concent_click2match, request.c2mConsent?'Y':'N')

    // default visitor type: 30 - Seminar Visitor
    const seminarVisitorTypeCode = "30"
    const formSubmissionKey = this.createFormSubmissionKey()

    const additionalInfo: { [key: string]: string | null } = {
      fairCode:request.fairCode,
      projectYear: fairSettingData.vms_project_year,
      fiscalYear: fairSettingData.fiscal_year,
      projectNumber: fairSettingData.vms_project_no,
      visitorTypeCode: seminarVisitorTypeCode,
      participantType: RegistrationUtil.convertParticipantTypeToDigit(FORM_TYPE.ORGANIC_BUYER),
      ssoUid: ssoUser?.ssoUid ?? null,
      encryptedPassword: formDataDict[DedicateDataFieldEnum.br_password]?.data ? FormCommonUtil.encryptPassword(formDataDict[DedicateDataFieldEnum.br_password]?.data as string, this.passwordPublicKey) : '',
      fairType: fairSettingData?.fair_type ?? '',
      formSubmissionKey
    };

    const now: Date = new Date();
    const formSubmissionInfo: { [key: string]: string | Date } = {
      ssoUid: ssoUser.ssoUid,
      emailId: ssoUser.emailId,
      fairCode: request.fairCode,
      fiscalYear: fairSettingData.fiscal_year,
      sqsMessage: '',
      status: FORM_SUBMISSION_STATUS.PENDING,
      log: '',
      maxRetry: '3',
      retryCount: '0',
      retryIntervalSec: '30',
      createdBy: 'SYSTEM',
      creationTime: now,
      lastUpdatedBy: 'SYSTEM',
      lastUpdatedTime: now
    };

    try {
      await this.insertFormSubmissionRecord(formSubmissionInfo);
    } catch (error) {
      throw new VepError(VepErrorMsg.Insert_Form_Submission_Record_Error, error.message);
    }
    const multiLangTemplate: MuiltiLangFormTemplate =  new MuiltiLangFormTemplate()
    multiLangTemplate.formEn = new FormTemplateDto()
    const multiLangFormTemplateHandler = new MultiLangTemplateHandler(multiLangTemplate)

    // retrieve serial no.
    const { serialNumber, projectYear, sourceTypeCode, visitorTypeCode, projectNumber } = await this.generateRegNo(formSubmissionKey, fairSettingData.vms_project_year, fairSettingData.vms_project_no, constant.submitFormDefaultValue.SourceTypeCode, seminarVisitorTypeCode)
    additionalInfo[RegistrationDataSqsJsonFieldEnum.serialNumber] = serialNumber
    registrationNo = `${serialNumber}${projectYear.substring(projectYear.length - 2)}${sourceTypeCode}${visitorTypeCode}${projectNumber}`

    const sqsJsonData = RegistrationUtil.convertDictionaryToSqsJson(formDataDict, additionalInfo, multiLangFormTemplateHandler);
    this.logger.INFO('', '', `sqsJsonData: ${JSON.stringify(sqsJsonData)}`, this.submitShortRegistration.name, { formSubmissionKey })

    isSubmitSuccess = true;
    const sqsResultSuccess = await this.sqsService.sendSQSJsonToRegistrationQueue(sqsJsonData,'');
    if (!sqsResultSuccess){
      this.logger.FATAL('', '', 'Error in sending registration sqs, ', this.submitShortRegistration.name, { formSubmissionKey })
    }

    return {
      isSubmitSuccess,
      registrationNo,
      error: ""
    }
  }

  private convertFromSubmitFormRequest(request: SubmitFormRequestDto | SubmitAORFormRequestDto): FormSubmitDataDto {
    let formData: FormSubmitDataDto = new FormSubmitDataDto()

    formData.data = JSON.parse(request.formDataJson)
    formData.fairCode = request.fairCode
    formData.visitorType = request.visitorType
    formData.slug = request.slug
    formData.country = request.country
    formData.refOffice = request.refOffice
    formData.refCode = request.refCode
    formData.captcha = request.captcha

    return formData
  }

  private addParamFromFormTemplate(formData: FormSubmitDataDto, formTemplate: FormTemplateDto) {
    formData.formType = formTemplate.form_data.form_type
  }

  public async updateFairRegistrationById(adminUser: AdminUserDto, registrationRecordId: number, fairRegistrationRemarkReqDto: FairRegistrationRemarkReqDto): Promise<any> {
    try {
      let fairRegistration = await this.fairDbService.queryFairRegByFairParticipantRegId(registrationRecordId)
      if (fairRegistration == null) {
        this.logger.error(`cannot get the fairRegistrationData: [fairRegistration ${JSON.stringify(fairRegistration)} ]`)
        throw new VepError(VepErrorMsg.Validation_Error, "Cannot get the fair Registration Data ");
      }

      this.checkUserValidToUpdate(adminUser, fairRegistration)

      if (fairRegistrationRemarkReqDto?.cbmRemark == null && fairRegistrationRemarkReqDto?.vpRemark == null && fairRegistrationRemarkReqDto?.generalBuyerRemark == null) {
        // user should be able to update remark fields as "" but not null or undefined
        this.logger.error(`cannot find a field to update: [cbmRemark ${JSON.stringify(fairRegistrationRemarkReqDto?.cbmRemark)} , vpRemark ${JSON.stringify(fairRegistrationRemarkReqDto?.vpRemark)} , generalBuyerRemark ${JSON.stringify(fairRegistrationRemarkReqDto?.generalBuyerRemark)} ]`)
        throw new VepError(VepErrorMsg.Validation_Error, "cannot find a field to update");
      }

      let updateResult = await this.fairDbService.updateFairRegRemarkById(registrationRecordId, fairRegistrationRemarkReqDto)
      
      let afterUpdate = await this.fairDbService.queryFairRegByFairParticipantRegId(registrationRecordId);
      if (updateResult?.affected) {
        return { 
          isSuccess: true,
          "user-activity": {
            registrationNo: `${fairRegistration.serialNumber}${fairRegistration.projectYear?.substring(fairRegistration.projectYear.length - 2)}${fairRegistration.sourceTypeCode}${fairRegistration.visitorTypeCode}${fairRegistration.projectNumber}`,
            beforeUpdate: fairRegistration,
            afterUpdate
          }
        }
      }

      this.logger.error(`Cannot update any record [updateResult?.affected: ${updateResult?.affected}]`)
      throw new VepError(VepErrorMsg.Database_Error, "Cannot update any record")
    } catch (error) {
      throw error instanceof VepError ? error : new VepError(VepErrorMsg.Database_Error, error.message)
    }
  }

  checkStateTransactionAndGetC2mStatus = (currentStatus: string, nextStatus: string): string => {
    const stateTransactionObj: {
      [key: string]: Array<string>
    } = {
      "1": ["2", "3"],
      "2": [],
      "3": [],
      "5": []
    };
    const regC2mStatusObj: {
      [key: string]: string
    } = {
      //"1": "",
      "2": "4",
      "3": "4",
      //"5": "",
    }
    if (stateTransactionObj[currentStatus] && stateTransactionObj[currentStatus].indexOf(nextStatus) > -1 && regC2mStatusObj[nextStatus])
      return regC2mStatusObj[nextStatus];
    throw new VepError(VepErrorMsg.Registration_Status_Error, "Invalid State Transaction");
  }


  checkRegStatus = async (regIdStatusList: { registrationRecordId: number, status: number }[], adminUser: AdminUserDto): Promise<{ registrationRecordId: string, status: string, c2m: string }[]> => {
    let regIds = regIdStatusList.map(regIdStatus => regIdStatus.registrationRecordId);
    let statusIds = regIdStatusList.map(regIdStatus => regIdStatus.status).filter((status, idx, arr) => {
      return arr.indexOf(status) == idx;
    });
    if (regIds.find((regId, idx) => {
      return regIds.indexOf(regId) != idx;
    })) {
      throw new VepError(VepErrorMsg.Registration_Status_Error, "Fair Registration ID Duplicate");
    }
    if (statusIds.find(status => {
      return [1, 2, 3, 5].indexOf(status) < 0;
    })) {
      throw new VepError(VepErrorMsg.Registration_Status_Error, "Fair Registration Status Invalid");
    }
    const fairReg = await this.fairDbService.queryFairRegByFairParticipantRegIds(regIds);
    const regStatus = await this.fairDbService.queryFairRegStatusByRegStatusIds(statusIds)
    if (!fairReg || fairReg.length != regIds.length)
      throw new VepError(VepErrorMsg.Registration_Status_Error, "Fair Registration Not Found");
    if (!regStatus || regStatus.length != statusIds.length)
      throw new VepError(VepErrorMsg.Registration_Status_Error, "Fair Registration Status Not Found");
    let fairRegObj: {
      [key: string]: FairRegistration
    } = {};
    fairReg.forEach(row => {
      fairRegObj[row.id] = row;
    })
    const checkStateTransactionAndGetC2mStatus = this.checkStateTransactionAndGetC2mStatus;
    const statusUpdateArr = regIdStatusList.map(regIdStatus => {
      let { registrationRecordId, status } = regIdStatus;

      this.checkUserValidToUpdate(adminUser, fairRegObj[regIdStatus.registrationRecordId.toString()])

      return {
        registrationRecordId: registrationRecordId.toString(),
        status: status.toString(),
        c2m: checkStateTransactionAndGetC2mStatus(fairRegObj[regIdStatus.registrationRecordId.toString()].fairRegistrationStatusId || "null", regIdStatus.status.toString())
      }
    })
    return statusUpdateArr;
  }

  public async updateStatus(adminUser: AdminUserDto, registrationRecordId: number, request: UpdateRegistrationStatusRequestDto): Promise<UpdateRegistrationStatusResponseDto> {
    this.logger.log(`updateStatus: ${JSON.stringify(request)}`);
    const regIdStatus = [{ registrationRecordId, status: request.status }];
    const updateParams = await this.checkRegStatus(regIdStatus, adminUser);
    return await this.fairDbService.updateRegistrationStatusByRegId(updateParams);
    //let result = updateResult ? 'success' : 'fail';
    //return new Promise<UpdateRegistrationStatusResponseDto>((resolve, reject) => { resolve({ result }) });
  }

  public async bulkUpdateStatus(adminUser: AdminUserDto, request: BulkUpdateRegistrationStatusRequestDto): Promise<UpdateRegistrationStatusResponseDto> {
    this.logger.log(`bulkUpdateStatus: ${JSON.stringify(request)}`);
    const regIdStatus = request.actions;
    const updateParams = await this.checkRegStatus(regIdStatus, adminUser);
    return await this.fairDbService.updateRegistrationStatusByRegId(updateParams);
    //let result = updateResult ? 'success' : 'fail';
    //return new Promise<UpdateRegistrationStatusResponseDto>((resolve, reject) => { resolve({ result }) });
  }

  public async invalidateRegistration(invalidateRegReqDto: InvalidateRegistrationReqDto) {
    const fairRegList = await this.fairDbService.queryFairRegByFairCodeEmail(invalidateRegReqDto.contactEmail, invalidateRegReqDto.fairCode, invalidateRegReqDto.fiscalYear)

    let regIdStatusList: { registrationRecordId: string, status: string }[] = []

    fairRegList.forEach(fairReg => {
      if (
        fairReg.fairRegistrationStatus.fairRegistrationStatusCode != RegistrationStatus.REJECTED
        && fairReg.fairRegistrationStatus.fairRegistrationStatusCode != RegistrationStatus.CANCELLED
      ) {
        regIdStatusList.push({
          registrationRecordId: fairReg.id,
          status: "2"
        })
      }
    })

    const isSuccess = await this.fairDbService.invalidateFairRegistration(regIdStatusList)

    return {
      isSuccess
    }
  }

  public async getUploadFilePresignedUrl(ssoUser: SSOUserHeadersDto | null, query: GetUploadFilePresignedUrlReqDto): Promise<GetUploadFilePresignedUrlRespDto> {
    const contentType = FormFileContentType[query.fileType]
    const keyPrefix = ssoUser ? ssoUser.ssoUid : (query.formSubmissionKey ? query.formSubmissionKey : uuidv4())
    const s3FileKey = `${keyPrefix}_${uuidv4()}.${query.fileType}`
    return {
      s3FileKey,
      presignedUrl: await this.s3Service.getPresignedPutObjectUrl(this.uploadFileBucket, s3FileKey, contentType)
    }
  }

  public async verifyRegFormLink(query: VerifyRegFormLinkReqDto): Promise<VerifyRegFormLinkRespDto> {
    const hashedValue = RegFormLinkUtil.generateHash({
      fairCode: query.fairCode,
      slug: query.slug,
      visitorType: query.visitorType ?? '',
      country: query.country ?? '',
      refOverseasOffice: query.refOffice ?? '',
      refCode: query.refCode ?? '',
      saltKey: this.saltKeyForRegFormLink
    })
    let isValid = (hashedValue == query.regLinkId) 

    if (!isValid) {
      const regLink = await this.regFormLinkDbService.retrieveRegLink(query.fairCode, query.regLinkId)

      isValid = (regLink != undefined && regLink.fairRegistrationFormLinkTaskEntries.length > 0)
        && (
          (regLink.fairCode == query.fairCode)
          && (regLink.slug == query.slug)
          && (regLink.fairRegistrationFormLinkTaskEntries[0].visitorType == query.visitorType)
          && ((regLink.country?.toLocaleLowerCase() ?? "") == (query.country?.toLocaleLowerCase() ?? ""))
          && ((regLink.fairRegistrationFormLinkTaskEntries[0].refOverseasOffice?.toLocaleLowerCase() ?? "") == (query.refOffice?.toLocaleLowerCase() ?? ""))
          && ((regLink.fairRegistrationFormLinkTaskEntries[0].refCode ?? "") == (query.refCode ?? ""))
        )
    }

    if (isValid) {
      return {
        fairCode: query.fairCode,
        projectYear: "",
        lang: query.lang,
        slug: query.slug,
        fullPath: RegistrationUtil.convertToFullPathSlug(query.fairCode, query.lang, query.slug),
        visitorType: query.visitorType,
        country: query.country?.toLocaleLowerCase() ?? "",
        refOffice: query.refOffice?.toLocaleUpperCase() ?? "",
        refCode: query.refCode ?? "",
        regLinkId: query.regLinkId,
        creationTime: new Date(),
        lastUpdatedTime: new Date(),
      }
    } else {
      throw new VepError(VepErrorMsg.Invalid_Reg_Form_Link, "Fair Reg Link invalid");
    }

  }
  
  // eRegFormLink - Generate request and insert db
  public async generateRegFormLink(query: GenerateRegFormLinkReqDto, adminUser: AdminUserDto): Promise<GenerateRegFormLinkRespDto> {
    let response = new GenerateRegFormLinkRespDto()

    query.refOverseasOffice = query.refOverseasOffice?.toLowerCase()

    if (query.refCode) {
      query.refCode = RegFormLinkUtil.parseRefCode(query.refCode) ;
    }

    // param check
    const visitorTypeListQueryResult = await this.fairDbService.retrieveVisitorTypeCodeList()
    if (visitorTypeListQueryResult.length == 0) {
      throw new VepError(VepErrorMsg.Database_Error, 'No result found for querying fairDbService.VisitorType.visitorTypeCode')
    } 
    const visitorTypeList = visitorTypeListQueryResult.map((each)=>(each.visitorTypeCode))

    const regFormLinkValidationErrorCode : RegFormLinkValidationErrorDto[] = RegFormLinkUtil.validateRegFormLinkReqDto(query, visitorTypeList)
    if (regFormLinkValidationErrorCode.length > 0) {
      return {
        isSubmitSuccess : false,
        regFormLinkValidationError: regFormLinkValidationErrorCode,
        regFormLinkTask: new RegFormLinkTask()
      }
    }

    // prepare regFormLink summary
    const regFormLinkTaskEntrySummaries : RegFormLinkTaskEntrySummaryDto[] = RegFormLinkUtil.prepareFormLinkTaskEntry(query, this.saltKeyForRegFormLink)
    
    if (regFormLinkTaskEntrySummaries.length > 0) {
      response.regFormLinkTask = await this.regFormLinkDbService.insertRegLink(query, regFormLinkTaskEntrySummaries, adminUser.emailAddress)
      response.isSubmitSuccess = true
    }
      
    return response
  }

  // eRegFormLink - Query previous generation result
  public async queryRegFormLink(query: QueryRegFormLinkReqDto): Promise<QueryRegFormLinkRespDto[]> {

    const queryRegFormLinkTaskList: FairRegistrationFormLinkTask[] | undefined = await this.regFormLinkDbService.queryRegLink(query)

    if (!queryRegFormLinkTaskList)
      throw new VepError(VepErrorMsg.Query_Reg_Form_Link_Error, "Invalid sql query result found");

    return queryRegFormLinkTaskList?.map( task => RegFormLinkUtil.generateRegFormLinkOnOneTask(task, this.regFormLinkHost))
  }

  // eRegFormLink - Count previous generation result
  public async countRegFormLink(): Promise<number> {
    return await this.regFormLinkDbService.countRegLink()
  }

  private fillObjectWithSSORequiredField(formDataDict: FormDataDictionaryDto,ssoInfo: SsoPrefillDto | null) {
     if (ssoInfo !== null){
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_email, ssoInfo!.email)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_title, ssoInfo!.title)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_first_name, ssoInfo!.firstName)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_last_name, ssoInfo!.lastName)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_position, ssoInfo!.position)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_company_name, ssoInfo!.companyName)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_line_1, ssoInfo!.addressLine1)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_line_2, ssoInfo!.addressLine2)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_line_3, ssoInfo!.addressLine3)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_line_4, ssoInfo!.addressLine4)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_postal_code, ssoInfo!.postalCode)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_country, ssoInfo!.countryCode)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_state, ssoInfo!.stateOrProvinceCode)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_city, ssoInfo!.cityCode)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_country_code_mobile, ssoInfo!.mobilePhoneCountryCode)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_mobile_number, ssoInfo!.mobilePhoneNumber)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_country_code_company, ssoInfo!.companyPhoneCountryCode)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_area_code_company, ssoInfo!.companyPhoneAreaCode)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_company_number, ssoInfo!.companyPhonePhoneNumber)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_extension_company, ssoInfo!.companyPhoneExtension)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_company_website, ssoInfo!.companyWebsite)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_company_background, ssoInfo!.companyBackground)
       this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_business_nature, ssoInfo!.natureOfBusiness)
     }
  }

  private replaceFormDataWithSSORequiredFieldFromDb(formDataDict: FormDataDictionaryDto,registrationRecord: FairRegistration){
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_email, registrationRecord.fairParticipant.emailId)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_title, registrationRecord.title)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_first_name, registrationRecord.firstName)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_last_name, registrationRecord.lastName)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_position, registrationRecord.position)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_company_name, registrationRecord.companyName)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_line_1, registrationRecord.addressLine1)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_line_2, registrationRecord.addressLine2)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_line_3, registrationRecord.addressLine3)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_line_4, registrationRecord.addressLine4)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_postal_code, registrationRecord.postalCode)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_country, registrationRecord.country)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_state, registrationRecord.stateOrProvinceCode)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_address_city, registrationRecord.cityCode)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_country_code_mobile, registrationRecord.mobilePhoneCountryCode)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_mobile_number, registrationRecord.mobilePhoneNumber)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_country_code_company, registrationRecord.companyPhoneCountryCode)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_area_code_company, registrationRecord.companyPhoneAreaCode)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_company_number, registrationRecord.companyPhonePhoneNumber)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_extension_company, registrationRecord.companyPhoneExtension)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_company_website, registrationRecord.companyWebsite)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_company_background, registrationRecord.companyBackground)
    this.replaceFormDataDictWithValue(formDataDict,DedicateDataFieldEnum.br_business_nature, registrationRecord.fairRegistrationNobs.map((nob) => nob.fairRegistrationNobCode))

  }

  private replaceFormDataDictWithValue(formDataDict: FormDataDictionaryDto,keyName: string,replaceValue : unknown){
    formDataDict[keyName] = {
      key:keyName,
      data: replaceValue
    }
  }

  public static isVepError = isVepError
}


function commonExceptionHandling(error: any) {
  isVepError(error)
  throw new VepError(VepErrorMsg.Check_Registration_Eligibility_Error, error.response.data.message);
}

function isVepError(error: any) {
  if (error.name === 'VepError') {
    throw new VepError(error.vepErrorMsg, error.message);
  }
}