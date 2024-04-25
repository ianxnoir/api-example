import { Injectable} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import moment from "moment";
import { VepErrorMsg } from "../../config/exception-constant";
import { ElasticacheService } from "../../core/elasticache/elasticache.service";
import { VepError } from "../../core/exception/exception";
import { FairSettingKeyEnum } from "../api/content/content.enum";
import { ContentService } from "../api/content/content.service";
import { ContentUtil } from "../api/content/content.util";
import { FairSettingMultiLangDto } from "../api/content/dto/fairSettingMultiLang.dto";
import { FormTemplateDto } from "../api/content/dto/formTemplate.dto";
import { ExhibitorService } from "../api/exhibitor/exhibitor.service";
import { SystemTemplate } from "../api/notification/dto/systemTemplate.dto";
import { NotificationService } from "../api/notification/notification.service";
import { CustomFormSubmitDataDto } from "../formValidation/dto/customFormSubmitData.dto";
import { FormDataDictionaryDto } from "../formValidation/dto/formDataDicionary.dto";
import { FormSubmitMetaData } from "../formValidation/dto/formSubmitMetaData.dto";
import { DedicateDataFieldEnum } from "../formValidation/enum/dedicateDataField.enum";
import { ValidationUtil } from "../formValidation/validation.util";
import { WordpressFormValidationService } from "../formValidation/wordpressFormValidation.service";
import { FORM_SUBMISSION_KEY_EXPIRATION_TIME_IN_MINUTE, SUBMIT_TYPE, VALIDATION_STATUS } from "../registration/dto/SubmitForm.enum";
import { RegistrationUtil } from "../registration/registration.util";
import { SqsService } from "../sqs/sqs.service";
import { EnquiryFormContentItem, EnquiryFormEmailDto } from "./dto/enquiryFormEmail.dto";
import { EnquiryFormEmailMetadataDto } from "./dto/enquiryFormEmailMetadata.dto";
import { SubmitEnquiryFormReqDto } from "./dto/submitEnquiryFormReq.dto";
import { FormUtil } from "./form.util";
import { Logger } from "../../core/utils";
import { MultiLangTemplateHandler } from "../registration/MultiLangHandler";

@Injectable()
export class EnquiryFormService {
    passwordPublicKey: string;
    private internalSystemTemplateId: string;
    private externalSystemTemplateId: string;
    private configReceiverEmail: string[];

    constructor(
        private logger: Logger,
        private configService: ConfigService,
        private wordpressFormValidationService: WordpressFormValidationService,
        private contentService: ContentService,
        private exhibitorService: ExhibitorService,
        private notificationService: NotificationService,
        private elastiCacheService: ElasticacheService,
        private sqsService: SqsService,
    ) {
        this.logger.setContext(EnquiryFormService.name)
        this.passwordPublicKey = Buffer.from(this.configService.get<string>('registration.PASSWORD_PUBLIC_KEY') || '', 'base64').toString()
        this.internalSystemTemplateId = this.configService.get<string>('form.enquiry.internalTemplateId') || ''
        this.externalSystemTemplateId = this.configService.get<string>('form.enquiry.externalTemplateId') || ''
        this.configReceiverEmail = this.configService.get<string[]>('form.enquiry.receiverList') || []
    }

    public async submitEnquiryForm(request: SubmitEnquiryFormReqDto, xForwardedForStr: string): Promise<any> {
        const fullPathSlug = RegistrationUtil.convertToFullPathSlug(request.fairCode, request.lang, request.slug)
        // retrieve form template by fair code and slug
        let formTemplate: FormTemplateDto = await this.contentService.retrieveFormTemplate(request.fairCode, fullPathSlug, request.lang);

        const formSubmissionKey = request.formSubmissionKey ?? ""
        // check form submission key
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

        const isValidateStepOnly = (request.step != formTemplate.form_data.form_obj.length);
        const stepIdToSubmit = formTemplate.form_data.form_obj[request.step - 1]?.form_id ?? ""
        if (stepIdToSubmit === "") {
            throw new VepError(VepErrorMsg.Validation_Error, `step is not valid, step: ${request.step}, form step length: ${formTemplate.form_data.form_obj.length}`)
        }

        let isSubmitSuccess = false
        let serialNo = ""

        let formData = this.convertFromSubmitFormRequest(request)
        this.addParamFromFormTemplate(formData, formTemplate)

        const formSubmitMetaData: FormSubmitMetaData = {
            isLoggedin: false,
            stepToSubmit: request.step,
            stepIdToSubmit,
            totalStep: formTemplate.form_data.form_obj.length,
            isValidateStepOnly,
            xForwardedForStr,
        }

        // validate form data by common package
        const wpFormResult = await this.wordpressFormValidationService.validateFormByWordpressRule(formTemplate, formData, formSubmitMetaData)
        if (wpFormResult.formStepValidStatus.find((x) => !x.isStepValid)) {
            return {
                ...wpFormResult,
                submitType: request.submitType,
                validationStatus: isValidateStepOnly ? VALIDATION_STATUS.STEP_FAILED : VALIDATION_STATUS.FORM_FAILED,
                isSubmitSuccess,
                slug: request.slug,
                formSubmissionKey,
                serialNo,
            };
        }

        // if stepToSubmit = totalStepCount and request.type = SUBMIT, send email
        if (request.submitType == SUBMIT_TYPE.SUBMIT && formSubmitMetaData.stepToSubmit == formSubmitMetaData.totalStep) {
            const formDataDict = ValidationUtil.convertFormToDictionary(formData)
            // retrieve fair setting
            const fairSetting = await this.contentService.retrieveFairSetting(request.fairCode);
            // retrieve serial no from exhibitor service
            const enquiryFormEmailMetadata = await this.constructEnquiryFormMetadata(request, formDataDict, fairSetting, this.configReceiverEmail)

            serialNo = enquiryFormEmailMetadata.serialNo

            // retrieve internal and external email template
            // promise.all to reduce impact from notification service slow response
            const template = await Promise.all([
                this.notificationService.retrieveNotificationTemplate(this.internalSystemTemplateId),
                this.notificationService.retrieveNotificationTemplate(this.externalSystemTemplateId)
            ]).then(results => {
                return {
                    internalTemplate: results[0],
                    externalTemplate: results[1]
                }
            }).catch(ex => {
                throw new VepError(VepErrorMsg.EnquiryForm_SystemTemplateCouldNotFound, `Failed to retrieve system template, internalSystemTemplateId: ${this.internalSystemTemplateId} externalSystemTemplateId: ${this.externalSystemTemplateId}`)
            })

            // merge internal email
            const multiLangFormTemplate =  await this.contentService.returnMultiLangTemplate(request.fairCode, request.lang, request.slug, formTemplate)
            const multiLangFormTemplateHandler = new MultiLangTemplateHandler(multiLangFormTemplate, formData.lang)
            const formDataContentBlockItemList = FormUtil.constructEnquiryFormContentTable(formDataDict, multiLangFormTemplateHandler, request.lang)
            const internalEmail = this.constructEnquiryFormInternalEmail(formDataContentBlockItemList, enquiryFormEmailMetadata, template.internalTemplate)
            // send internal email
            await this.sqsService.sendEmailObjToSqs(internalEmail)

            // merge external email
            const externalEmail = this.constructEnquiryFormExternalEmail(enquiryFormEmailMetadata, template.externalTemplate)
            // send external email
            await this.sqsService.sendEmailObjToSqs(externalEmail)

            isSubmitSuccess = true

            if (isSubmitSuccess) {
                const isDeleted = await this.elastiCacheService.deleteElastiCacheKeyValue(formSubmissionKey)

                const message = `Completed sendEmailSqs, try delete form submission key from cache: ${isDeleted}. False implies that the key do not exist.`

                this.logger.INFO('', '', message, this.submitEnquiryForm.name, formSubmissionKey)
            }
        }

        return {
            ...wpFormResult,
            submitType: request.submitType,
            validationStatus: isValidateStepOnly ? VALIDATION_STATUS.STEP_PASSED : VALIDATION_STATUS.FORM_PASSED,
            isSubmitSuccess,
            slug: request.slug,
            formSubmissionKey,
            serialNo,
        };
    }

    private convertFromSubmitFormRequest(request: SubmitEnquiryFormReqDto): CustomFormSubmitDataDto {
        let formData: CustomFormSubmitDataDto = new CustomFormSubmitDataDto()
        formData.data = JSON.parse(request.formDataJson)
        formData.fairCode = request.fairCode
        formData.slug = request.slug
        formData.captcha = request.captcha
        return formData
    }

    private addParamFromFormTemplate(formData: CustomFormSubmitDataDto, formTemplate: FormTemplateDto) {
        formData.formType = formTemplate.form_data.form_type
    }

    private async constructEnquiryFormMetadata(request: SubmitEnquiryFormReqDto, formDataDict: FormDataDictionaryDto, fairSetting: any, configReceiverEmail: string[]): Promise<EnquiryFormEmailMetadataDto> {
        const formUserEmail = formDataDict[DedicateDataFieldEnum.br_email]?.data as string

        if (!formUserEmail) {
            throw new VepError(VepErrorMsg.EnquiryForm_MissingUserEmail, `Could not find user email in form data`)
        }

        const { fairCode, lang } = request

        const fairSettingEmailAddress = ContentUtil.retieveFairSettingByKey<string>(fairCode, fairSetting, FairSettingKeyEnum.emailAddress)

        const adminReceiverEmailList = configReceiverEmail.length > 0 ? [...configReceiverEmail, fairSettingEmailAddress] : [fairSettingEmailAddress]

        return {
            serialNo: await this.exhibitorService.retrieveEnquiryFormSerialNo(),
            currentDateTime: moment(new Date()),
            formUserEmail,
            adminReceiverEmailList,
            fairShortName: ContentUtil.retieveFairSettingByKey<FairSettingMultiLangDto>(fairCode, fairSetting, FairSettingKeyEnum.fairShortName),
            emailHeader: ContentUtil.retieveFairSettingByKey<FairSettingMultiLangDto>(fairCode, fairSetting, FairSettingKeyEnum.emailHeader),
            emailFooter: ContentUtil.retieveFairSettingByKey<FairSettingMultiLangDto>(fairCode, fairSetting, FairSettingKeyEnum.emailFooter),
            emailAddress: fairSettingEmailAddress,
            fairCode,
            lang,
        }
    }

    private constructEnquiryFormInternalEmail(
        formDataContentBlockItemList: EnquiryFormContentItem[],
        metadata: EnquiryFormEmailMetadataDto,
        internalTemplate: SystemTemplate): EnquiryFormEmailDto {
        const contentBlockHTML = FormUtil.constructEnquiryFormContentBlockHTML(formDataContentBlockItemList)

        let emailTemplate = (internalTemplate.content.fairs.filter((emailTemplateContent) => emailTemplateContent.fairCode == metadata.fairCode))[0].content.email
        if (!emailTemplate.emailContentEn) {
            emailTemplate = (internalTemplate.content.fairs.filter((emailTemplateContent) => emailTemplateContent.fairCode == 'global'))[0].content.email
        }

        const emailKeyTemplateKey = FormUtil.getEmailTemplateKeyByLang(metadata.lang, emailTemplate, metadata)
        let emailSubject = emailKeyTemplateKey.emailSubject
        let emailContent = emailKeyTemplateKey.emailContent

        const placeholderObj = {
            fair_short_name_en: metadata.fairShortName.en,
            fair_short_name_tc: metadata.fairShortName.tc,
            fair_short_name_sc: metadata.fairShortName.sc,
            reference_no: metadata.serialNo,
            content_block: contentBlockHTML,
            record_create_datetime: FormUtil.convertDateTimeToDateTimeString(metadata.currentDateTime, metadata.lang),
        }

        for (const [key, value] of Object.entries(placeholderObj)) {
            emailSubject = emailSubject.replace(new RegExp(`{{${key}}}`, 'g'), value)
            emailContent = emailContent.replace(new RegExp(`{{${key}}}`, 'g'), value)
        }

        return {
            from: metadata.emailAddress,
            to: metadata.adminReceiverEmailList,
            replyTo: metadata.formUserEmail,
            emailSubject,
            emailContent
        }
    }

    private constructEnquiryFormExternalEmail(
        metadata: EnquiryFormEmailMetadataDto,
        externalTemplate: SystemTemplate): EnquiryFormEmailDto {
        let emailTemplate = (externalTemplate.content.fairs.filter((emailTemplateContent) => emailTemplateContent.fairCode == metadata.fairCode))[0].content.email
        if (!emailTemplate.emailContentEn) {
            emailTemplate = (externalTemplate.content.fairs.filter((emailTemplateContent) => emailTemplateContent.fairCode == 'global'))[0].content.email
        }

        const emailKeyTemplateKey = FormUtil.getEmailTemplateKeyByLang(metadata.lang, emailTemplate, metadata)
        let emailSubject = emailKeyTemplateKey.emailSubject
        let emailContent = emailKeyTemplateKey.emailContent

        const placeholderObj = {
            fair_short_name_en: metadata.fairShortName.en,
            fair_short_name_tc: metadata.fairShortName.tc,
            fair_short_name_sc: metadata.fairShortName.sc,
            reference_no: metadata.serialNo,
        }

        for (const [key, value] of Object.entries(placeholderObj)) {
            emailSubject = emailSubject.replace(new RegExp(`{{${key}}}`, 'g'), value)
            emailContent = emailContent.replace(new RegExp(`{{${key}}}`, 'g'), value)
        }

        return {
            from: metadata.emailAddress,
            to: metadata.formUserEmail,
            replyTo: "",
            emailSubject,
            emailContent
        }
    }
}