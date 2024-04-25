import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { VepErrorMsg } from "../../config/exception-constant";
import { VepError } from "../../core/exception/exception";
import { CustomFormSubmission } from "../../dao/CustomFormSubmission";
import { CustomFormSubmissionFields } from "../../dao/CustomFormSubmissionFields";
import { ContentService } from "../api/content/content.service";
import { AdditionalValue,FormTemplateDto, MuiltiLangFormTemplate } from "../api/content/dto/formTemplate.dto";
import { CustomFormDbService } from "../fairDb/customFormDb.service";
import { CustomFormSubmitDataDto } from "../formValidation/dto/customFormSubmitData.dto";
import { FormDataDictionaryDto } from "../formValidation/dto/formDataDicionary.dto";
import { FormSubmitMetaData } from "../formValidation/dto/formSubmitMetaData.dto";
import { ValidationUtil } from "../formValidation/validation.util";
import { WordpressFormValidationService } from "../formValidation/wordpressFormValidation.service";
import { FORM_SUBMISSION_KEY_EXPIRATION_TIME_IN_MINUTE, SUBMIT_TYPE, VALIDATION_STATUS } from "../registration/dto/SubmitForm.enum";
import { SubmitCustomFormReqDto } from "./dto/submitCustomFormReq.dto";
import { SubmitCustomFormRespDto } from "./dto/submitCustomFormResp.dto";
import { RegistrationUtil } from "../registration/registration.util";
import { ElasticacheService } from "../../core/elasticache/elasticache.service";
import { Logger } from "../../core/utils";
import { MultiLangTemplateHandler } from "../registration/MultiLangHandler";
import { DedicateDataFieldEnum } from '../formValidation/enum/dedicateDataField.enum';
import { FairSettingKeyEnum } from "../api/content/content.enum";
@Injectable()
export class CustomFormService {
    passwordPublicKey: string;

    constructor(
        private logger: Logger,
        private configService: ConfigService,
        private wordpressFormValidationService: WordpressFormValidationService,
        private contentService: ContentService,
        private customFormDbService: CustomFormDbService,
        private elastiCacheService: ElasticacheService,
    ) {
        this.logger.setContext(CustomFormService.name)
        this.passwordPublicKey = Buffer.from(this.configService.get<string>('registration.PASSWORD_PUBLIC_KEY') || '', 'base64').toString()
    }

    public async submitCustomForm(request: SubmitCustomFormReqDto, xForwardedForStr: string): Promise<SubmitCustomFormRespDto> {
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
            };
        }

        if (request.submitType == SUBMIT_TYPE.SUBMIT && formSubmitMetaData.stepToSubmit == formSubmitMetaData.totalStep) {
            const multiLangTemplate =  await this.contentService.returnMultiLangTemplate(request.fairCode, request.lang, request.slug, formTemplate)

            const settingHandler = await this.contentService.retrieveFairSettingHandlder(request.fairCode)
            const projectYear = settingHandler.retieveFairSettingStrByKey(FairSettingKeyEnum.vmsProjectYear).returnNonNullValue()
            formData.projectYear = projectYear

            // if stepToSubmit = totalStepCount and request.type = SUBMIT, store data to db
            const submissionDataObject = this.convertFormDataToSubmissionDataObject(formData, multiLangTemplate)
            isSubmitSuccess = await this.customFormDbService.saveCustomFormSubmission(submissionDataObject)
            if (isSubmitSuccess) {
                const isDeleted = await this.elastiCacheService.deleteElastiCacheKeyValue(formSubmissionKey)

                const message = `Completed customFormDbService, try delete form submission key from cache: ${isDeleted}. False implies that the key do not exist.`

                this.logger.INFO('', '', message, this.submitCustomForm.name, formSubmissionKey)
            }
        }

        return {
            ...wpFormResult,
            submitType: request.submitType,
            validationStatus: isValidateStepOnly ? VALIDATION_STATUS.STEP_PASSED : VALIDATION_STATUS.FORM_PASSED,
            isSubmitSuccess,
            slug: request.slug,
            formSubmissionKey,
        };
    }

    private convertFromSubmitFormRequest(request: SubmitCustomFormReqDto): CustomFormSubmitDataDto {
        let formData: CustomFormSubmitDataDto = new CustomFormSubmitDataDto()
        formData.data = JSON.parse(request.formDataJson)
        formData.fairCode = request.fairCode
        formData.slug = request.slug
        formData.lang = request.lang
        formData.captcha = request.captcha
        return formData
    }

    private addParamFromFormTemplate(formData: CustomFormSubmitDataDto, formTemplate: FormTemplateDto) {
        formData.formType = formTemplate.form_data.form_type
    }

    private convertFormDataToSubmissionDataObject(formData: CustomFormSubmitDataDto, multiLangFormTemplate: MuiltiLangFormTemplate): CustomFormSubmission {
        const formSubmissionDataObject = new CustomFormSubmission()
        formSubmissionDataObject.fairCode = formData.fairCode
        formSubmissionDataObject.projectYear = formData.projectYear
        formSubmissionDataObject.formType = formData.formType
        formSubmissionDataObject.slug = formData.slug
        formSubmissionDataObject.lang = formData.lang
        formSubmissionDataObject.createdBy = "SYSTEM"
        formSubmissionDataObject.lastUpdatedBy = "SYSTEM"

        const formDataDict = ValidationUtil.convertFormToDictionary(formData);

        const multiLangFormTemplateHandler = new MultiLangTemplateHandler(multiLangFormTemplate,formData.lang)

        let formSubmissionDataFieldList: CustomFormSubmissionFields[] = []
        let additionalValue : AdditionalValue = {
            countryCodeFieldData : formDataDict[DedicateDataFieldEnum.br_address_country]?.data as string ?? "" ,
            stateProvinceCodeFieldData : formDataDict[DedicateDataFieldEnum.br_address_state]?.data as string ?? "",
        }

        Object.keys(formDataDict).forEach(fieldId => {
            let fieldValue: unknown = formDataDict[fieldId]?.data ?? '';
            if (!Array.isArray(fieldValue)) {
                fieldValue = [fieldValue];
            }
            (fieldValue as Array<string>).forEach((valueItem: string) => {
                let submissionField = this.assembleCustomFormSubmissionField(formDataDict, fieldId, valueItem,additionalValue, multiLangFormTemplateHandler);
                if (submissionField.labelEn !== '' || submissionField.labelSc !== '' || submissionField.labelTc !== '') {
                    formSubmissionDataFieldList.push(submissionField);
                }
            });
        });

        formSubmissionDataObject.customFormSubmissionFields = formSubmissionDataFieldList
        return formSubmissionDataObject
    }

    private assembleCustomFormSubmissionField(
        formDataDict: FormDataDictionaryDto,
        fieldId: string,
        fieldValue: string,
        additionalValue: AdditionalValue,
        multiLangFormTemplateHandler: MultiLangTemplateHandler) {

        const customFormSubmissionFieldDataObject = new CustomFormSubmissionFields()
        customFormSubmissionFieldDataObject.formFieldId = fieldId
        customFormSubmissionFieldDataObject.createdBy = "SYSTEM"
        customFormSubmissionFieldDataObject.lastUpdatedBy = "SYSTEM"

        customFormSubmissionFieldDataObject.value = fieldValue

        const fieldDetail = multiLangFormTemplateHandler.getFieldDetail(fieldId, fieldValue,additionalValue)

        customFormSubmissionFieldDataObject.labelEn = fieldDetail.labelEn
        customFormSubmissionFieldDataObject.labelTc = fieldDetail.labelTc
        customFormSubmissionFieldDataObject.labelSc = fieldDetail.labelSc

        // if (formTemplateField.field_type == "password") {
        //     fieldValue = FormCommonUtil.encryptPassword(fieldValue, this.passwordPublicKey)
        //     customFormSubmissionFieldDataObject.value = fieldValue
        // }

        customFormSubmissionFieldDataObject.valueEn = fieldDetail.valueEn
        customFormSubmissionFieldDataObject.valueTc = fieldDetail.valueTc
        customFormSubmissionFieldDataObject.valueSc = fieldDetail.valueSc


        return customFormSubmissionFieldDataObject
    }


}