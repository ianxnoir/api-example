import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger, S3Service } from "../../core/utils";
import { FormTemplateDto, FormTemplateFieldItemDto } from "../api/content/dto/formTemplate.dto";
import { CaptchaService } from "../captcha/captcha.service";
import { FormDataDictionaryDto } from "./dto/formDataDicionary.dto";
import { FormSubmitDataDto } from "./dto/formSubmitData.dto";
import { FormSubmitMetaData } from "./dto/formSubmitMetaData.dto";
import { FormValidationDto, FormValidationErrorDto } from "./dto/formValidation.dto";
import { ReservedFieldId } from './enum/dedicateDataField.enum';
import { FIELD_TYPE } from "./enum/fieldType.enum";
import { WordpressFormValidationEnum } from "./enum/wordpressFormValidation.enum";
import { ValidationUtil } from "./validation.util";
import { WordpressField } from "./wordpressField";
import { vepFormValidator, ValidationError } from "@vep-form/vep-form-validator"
import { CustomFormSubmitDataDto } from "./dto/customFormSubmitData.dto";
import { EditFormValidationErrorDto } from "./dto/editFormValidation.dto";
import { EditFormDataDto } from "./dto/editFormData.dto";
import { ContentService } from '../api/content/content.service';
import { EditFormOptionMetadata } from './dto/editFormOptionMetadata.dto';

@Injectable()
export class WordpressFormValidationService {
  private uploadBucketName: string
  constructor(
    private logger: Logger,
    private captchaService: CaptchaService,
    private s3Service: S3Service,
    private configService: ConfigService,
    private contentService: ContentService
  ) {
    this.logger.setContext(WordpressFormValidationService.name);
    this.uploadBucketName = this.configService.get<any>('form.uploadFileBucket');
  }

  private async backendFieldValidation(fieldId: string, fieldDef: FormTemplateFieldItemDto, formStepId: string, formDataDict: FormDataDictionaryDto, formSubmitMetaData: FormSubmitMetaData): Promise<FormValidationErrorDto | null> {
    let formValidationErrorCode = WordpressFormValidationEnum.VALIDATION_PASSED
    if (fieldDef.field_type.toLowerCase() == FIELD_TYPE["hktdc-file-upload"]) {
      formValidationErrorCode = await new WordpressField(fieldId, fieldDef, formDataDict).checkRequired().validateS3Field(this.s3Service, this.uploadBucketName).getFormValidationErrorCode()
    }
    if (fieldDef.field_type.toLowerCase() == FIELD_TYPE["fair_list"]) {
      formValidationErrorCode = await new WordpressField(fieldId, fieldDef, formDataDict).checkRequiredList().validateFairListCode(this.contentService).getFormValidationErrorCode()
    }


    if (formValidationErrorCode == WordpressFormValidationEnum.VALIDATION_PASSED) {
      return null
    } else {
      return {
        formStepId,
        fieldId,
        formValidationErrorType: fieldDef.field_type.toLowerCase(),
        formValidationErrorCode
      }
    }
  }

  private async validateCaptcha(formStepId: string, captchaStr: string, formSubmitMetaData: FormSubmitMetaData): Promise<FormValidationErrorDto | null> {
    const fieldId = ReservedFieldId.VEP_REG_FORM_CAPTCHA
    let formValidationErrorCode = WordpressFormValidationEnum.VALIDATION_PASSED

    let ip = ""
    if (!formSubmitMetaData.xForwardedForStr) {
      formValidationErrorCode = WordpressFormValidationEnum.X_FORWARDED_FOR_MISSING
    } else {
      ip = formSubmitMetaData.xForwardedForStr.split(',')[0].trim()
    }

    if (!captchaStr) {
      formValidationErrorCode = WordpressFormValidationEnum.CAPTCHA_MISSING
    }

    if (formValidationErrorCode == WordpressFormValidationEnum.VALIDATION_PASSED) {
      const captchaData = (captchaStr as string).split(',')

      try {
        const result = await this.captchaService.validateCaptcha({
          providerId: captchaData[0],
          verifyRequest: {
            ip,
            ticket: captchaData[1],
            randstr: captchaData[2] ?? ""
          }
        })
        if (result.success == true) {
          formValidationErrorCode = WordpressFormValidationEnum.VALIDATION_PASSED
        } else {
          formValidationErrorCode = WordpressFormValidationEnum.CAPTCHA_INVALID
        }
      } catch {
        formValidationErrorCode = WordpressFormValidationEnum.CAPTCHA_INVALID
      }
    }

    if (formValidationErrorCode == WordpressFormValidationEnum.VALIDATION_PASSED) {
      return null
    } else {
      return {
        formStepId,
        fieldId,
        formValidationErrorType: fieldId,
        formValidationErrorCode
      }
    }
  }

  private async validateFormStep(formTemplate: FormTemplateDto, formData: FormSubmitDataDto| CustomFormSubmitDataDto, formSubmitMetaData: FormSubmitMetaData): Promise<FormValidationDto> {
    let stepValidationDto = new FormValidationDto;

    const stepToValidate = formSubmitMetaData.stepToSubmit

    const formDataDict = ValidationUtil.convertFormToDictionary(formData);
    const formTemplateStep = formTemplate.form_data.form_obj[stepToValidate - 1]

    // common validation rules
    // use package vepFormValidator
    try {
      const resultValue = await vepFormValidator(formTemplate as any)
        .validate(
          formData.data,
          {
            step: stepToValidate,
            loggedIn: formSubmitMetaData.isLoggedin,
            backendMode: true,
          }
        )
      console.log(`resultValue: ${JSON.stringify(resultValue)}`)
    } catch (err: unknown) {
      const typedErr = <ValidationError>err
      const formValidationErrorList: FormValidationErrorDto[] = typedErr.inner?.map((inner) => ({
        formStepId: formTemplateStep.form_id,
        fieldId: inner.path ?? "",
        formValidationErrorType: inner.type ?? "",
        formValidationErrorCode: inner.message
      })) ?? []
      stepValidationDto.formValidationError = stepValidationDto.formValidationError.concat(formValidationErrorList)
    }

    // backend validation rules
    // if step has upload field, check file is valid, ignore other field as validated in vepFormValidator
    const formTemplateDict = ValidationUtil.convertFieldListToTemplateDictionary(formTemplateStep.field_items)

    for (let fieldKey of Object.keys(formTemplateDict)) {
      if (formTemplateDict[fieldKey].field_type == FIELD_TYPE["hktdc-file-upload"]) {
        const validationResult = await this.backendFieldValidation(fieldKey, formTemplateDict[fieldKey], formTemplateStep.form_id, formDataDict, formSubmitMetaData)
        if (validationResult) {
          stepValidationDto.formValidationError.push(validationResult)
        }
      }

      if (formTemplateDict[fieldKey].field_type == FIELD_TYPE['fair_list']) {
          const fairListResult = await this.backendFieldValidation(fieldKey, formTemplateDict[fieldKey], formTemplateStep.form_id, formDataDict, formSubmitMetaData);
          if (fairListResult) {
            stepValidationDto.formValidationError.push(fairListResult);
          }
      }
    }

    if (formTemplateStep.captcha) {
      const captchaValidationResult = await this.validateCaptcha(formTemplateStep.form_id, formData.captcha, formSubmitMetaData)
      if (captchaValidationResult) {
        stepValidationDto.formValidationError.push(captchaValidationResult)
      }
    }

    stepValidationDto.formStepValidStatus = [
      {
        formStepId: formTemplateStep.form_id,
        isStepValid: stepValidationDto.formValidationError.length == 0
      }
    ]
    return stepValidationDto
  }

  public async validateFormByWordpressRule(formTemplate: FormTemplateDto, formData: FormSubmitDataDto | CustomFormSubmitDataDto, formSubmitMetaData: FormSubmitMetaData): Promise<FormValidationDto> {
    let formValidationDto = new FormValidationDto;
    formValidationDto = await this.validateFormStep(formTemplate, formData, formSubmitMetaData)
    return formValidationDto;
  }

  public stripDataForEditFormValidation(formTemplate: FormTemplateDto, formDataJson: string): any {
    const formData = JSON.parse(formDataJson)
    const schema = vepFormValidator(formTemplate as any, { editMode: true }).getYupSchema()
    return schema.cast(formData, { stripUnknown: true })
  }

  public async editFormValidation(formTemplate: FormTemplateDto, editFormData: EditFormDataDto): Promise<EditFormValidationErrorDto[]> {
    let formValidationErrorList: EditFormValidationErrorDto[] = []

    // common validation rules for edit form
    // use package vepFormValidator
    try {
      const resultValue = await vepFormValidator(formTemplate as any, { editMode: true })
        .validate(editFormData.data, { backendMode: true, })
      console.log(`resultValue: ${JSON.stringify(resultValue)}`)
    } catch (err: unknown) {
      const typedErr = <ValidationError>err
      formValidationErrorList = typedErr.inner?.map((inner) => ({
        fieldId: inner.path ?? "",
        formValidationErrorType: inner.type ?? "",
        formValidationErrorCode: inner.message
      })) ?? []
    }
    
    return formValidationErrorList
  }

  public async stripDataForAdminEditFormValidation(formTemplate: FormTemplateDto, formDataJson: string): Promise<any> {
    const formData = JSON.parse(formDataJson)
    const resultValue = await vepFormValidator(formTemplate as any).stripUnknownValues(formData, { backendMode: true, adminMode: true, })
    return resultValue
  }

  public async adminFormValidation(formTemplate: FormTemplateDto, editFormData: EditFormDataDto): Promise<EditFormValidationErrorDto[]> {
    let formValidationErrorList: EditFormValidationErrorDto[] = []

    // common validation rules for admin mode
    // use package vepFormValidator
    try {
      const resultValue = await vepFormValidator(formTemplate as any)
        .validate(editFormData.data, { backendMode: true, adminMode: true, })
      console.log(`resultValue: ${JSON.stringify(resultValue)}`)
    } catch (err: unknown) {
      const typedErr = <ValidationError>err
      formValidationErrorList = typedErr.inner?.map((inner) => ({
        fieldId: inner.path ?? "",
        formValidationErrorType: inner.type ?? "",
        formValidationErrorCode: inner.message
      })) ?? []
    }
    
    return formValidationErrorList
  }

  public stripDataForEditFormValidationWithOption(formTemplate: FormTemplateDto, formDataJson: string, options: EditFormOptionMetadata): any {
    const formData = JSON.parse(formDataJson)
    const schema = vepFormValidator(formTemplate as any, {editMode:true,...options}).getYupSchema()
    return schema.cast(formData, { stripUnknown: true })
  }

  public async editFormValidationWithOption(formTemplate: FormTemplateDto, editFormData: EditFormDataDto, options: EditFormOptionMetadata): Promise<EditFormValidationErrorDto[]> {
    let formValidationErrorList: EditFormValidationErrorDto[] = []

    // common validation rules for edit form
    // use package vepFormValidator
    try {
      const resultValue = await vepFormValidator(formTemplate as any, {editMode:true,...options})
        .validate(
          editFormData.data,
          {
            backendMode: true,
          }
        )
      console.log(`resultValue: ${JSON.stringify(resultValue)}`)
    } catch (err: unknown) {
      const typedErr = <ValidationError>err
      formValidationErrorList = typedErr.inner?.map((inner) => ({
        fieldId: inner.path ?? "",
        formValidationErrorType: inner.type ?? "",
        formValidationErrorCode: inner.message
      })) ?? []
    }

    return formValidationErrorList
  }

}
