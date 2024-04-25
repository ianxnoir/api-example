import moment from "moment";
import { S3Service } from "../../core/utils";
import { FormFileContentType, ImgFileContentType } from "../../core/utils/enum/formFileContentType.enum";
import { FormTemplateFieldItemDto } from "../api/content/dto/formTemplate.dto";
import { CaptchaService } from "../captcha/captcha.service";
import { FormDataDictionaryDto } from "./dto/formDataDicionary.dto";
import { DedicateDataFieldEnum } from "./enum/dedicateDataField.enum";
import { WordpressFormValidationEnum } from "./enum/wordpressFormValidation.enum";
import { WordpressFieldValidationUtil } from "./wordpressFieldValidation.util";
import { ContentService } from '../api/content/content.service';

export class WordpressField {
    protected formValidationErrorCode: WordpressFormValidationEnum
    protected isRequired: boolean
    protected fieldData: unknown
    protected promiseQueue: Promise<WordpressFormValidationEnum>[] = []

    constructor(
        protected fieldName: string,
        protected fieldDef: FormTemplateFieldItemDto,
        protected formDataDict: FormDataDictionaryDto,
    ) {
        this.isRequired = false
        this.formValidationErrorCode = WordpressFormValidationEnum.VALIDATION_PASSED
        this.fieldData = undefined

        if (formDataDict[this.fieldName]) {
            if (formDataDict[this.fieldName].data !== undefined) {
                this.fieldData = formDataDict[this.fieldName].data
            }
        }
    }

    private EmptyErrorCode(): boolean{
        return this.formValidationErrorCode === WordpressFormValidationEnum.VALIDATION_PASSED
    }

    //#region Generic Checking
    checkRequired() {
        if (this.EmptyErrorCode() && this.fieldDef.required) {
            this.isRequired = true
            if (this.fieldData == undefined) {
                this.formValidationErrorCode = WordpressFormValidationEnum.FIELD_REQUIRED
            }
        }

        if (this.fieldDef.required_when && WordpressFieldValidationUtil.checkRequiredWhen(this.fieldDef.required_when, this.formDataDict)) {
            this.isRequired = true
            if (this.fieldData == undefined) {
                this.formValidationErrorCode = WordpressFormValidationEnum.FIELD_COMPLEX_REQUIRED
            }
        }

        return this;
    }

    checkTextLength() {
        if (!this.isRequired && !this.fieldData) {
            return this;
        }

        if (!this.EmptyErrorCode()) {
            return this;
        }

        const textFieldData = this.fieldData as string
        if (this.fieldDef.length) {
            if ((this.fieldDef.length.min ?? 0) > textFieldData.length || parseInt(this.fieldDef.length.max ?? "0") < textFieldData.length) {
                this.formValidationErrorCode = WordpressFormValidationEnum.DATA_LENGTH_INVALID
            }
        }

        return this;
    }

    checkTextRegExp() {
        if (!this.isRequired && !this.fieldData) {
            return this;
        }

        const textFieldData = this.fieldData as string
        if (this.EmptyErrorCode() && this.fieldDef.regular_expression) {
            try {
                const matches = textFieldData.match(new RegExp(this.fieldDef.regular_expression.slice(1, -1), "gi"))
                if (!matches) {
                    this.formValidationErrorCode = WordpressFormValidationEnum.DATA_NOT_MATCH_REGEXP
                }
            } catch (ex) {
                this.formValidationErrorCode = WordpressFormValidationEnum.REGEXP_INVALID
            }
        }
        return this;
    }

    checkNumberRange() {
        if (!this.isRequired && this.fieldData == undefined) {
            return this;
        }

        const numberFieldData = Number(this.fieldData!)

        if (this.fieldDef.minimum_value && Number(this.fieldDef.minimum_value) > numberFieldData) {
            this.formValidationErrorCode = WordpressFormValidationEnum.NUMBER_NOT_IN_VALID_RANGE
        }

        if (this.fieldDef.maximum_value && numberFieldData > Number(this.fieldDef.maximum_value)) {
            this.formValidationErrorCode = WordpressFormValidationEnum.NUMBER_NOT_IN_VALID_RANGE
        }

        return this
    }

    checkDateFormatAndRange() {
        if (!this.isRequired && this.fieldData == undefined) {
            return this;
        }

        const dateFieldData = moment(this.fieldData as string, 'YYYY-MM-DD', true)

        if (!dateFieldData.isValid()) {
            this.formValidationErrorCode = WordpressFormValidationEnum.DATE_INVALID_FORMAT
        }

        if (this.fieldDef.minDate) {
            const minDate = moment(this.fieldDef.minDate, 'YYYY-MM-DD', true)
            if (minDate.isAfter(dateFieldData)) {
                this.formValidationErrorCode = WordpressFormValidationEnum.DATE_NOT_IN_VALID_RANGE
            }
        }

        if (this.fieldDef.maxDate) {
            const maxDate = moment(this.fieldDef.minDate, 'YYYY-MM-DD', true)
            if (maxDate.isBefore(dateFieldData)) {
                this.formValidationErrorCode = WordpressFormValidationEnum.DATE_NOT_IN_VALID_RANGE
            }
        }

        return this;
    }

    checkTimeFormat() {
        if (!this.isRequired && this.fieldData == undefined) {
            return this;
        }

        const timeFieldData = moment(this.fieldData as string, 'hh:mm', true)

        if (!timeFieldData.isValid()) {
            this.formValidationErrorCode = WordpressFormValidationEnum.TIME_INVALID_FORMAT
        }

        return this;
    }

    checkSelectField() {
        if ((!this.isRequired && this.fieldData == undefined) || !this.EmptyErrorCode()) {
            return this;
        }

        if (this.fieldData == "") {
            return this;
        }

        const selectFieldData = this.fieldData as string

        if (this.fieldDef.options) {
            if (this.fieldDef.multiple_selection) {
                const selectionArray = selectFieldData.split(',')
                if (!selectionArray.reduce((result: boolean, currentValue) => {
                    if (!WordpressFieldValidationUtil.checkSelectValue(this.fieldDef.options, currentValue.trim())) {
                        result = result && false
                    }
                    return result
                }, true)) {
                    this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_SELECT_OPTION
                }

            } else {
                if (!WordpressFieldValidationUtil.checkSelectValue(this.fieldDef.options, selectFieldData)) {
                    this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_SELECT_OPTION
                }
            }
        }
        return this;
    }

    checkCheckBoxField() {
        if (!this.isRequired && !this.fieldData) {
            return this;
        }

        const checkBoxFieldData = this.fieldData as string

        if (this.fieldDef.options) {
            const selectionArray = checkBoxFieldData.split(',')
            if (!selectionArray.reduce((result: boolean, currentValue) => {
                if (!WordpressFieldValidationUtil.checkCheckboxValue(this.fieldDef.options, currentValue.trim())) {
                    result = false
                }
                return result
            }, true)) {
                this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_SELECT_OPTION
            }
        }

        return this;
    }

    /**To do: according to actual radio form field template, change the validation logic */
    checkRadioField() {
        if (!this.isRequired && !this.fieldData) {
            return this;
        }

        const radioFieldData = this.fieldData as string

        if (this.fieldDef.options) {
            if (!WordpressFieldValidationUtil.checkRadioValue(this.fieldDef.options, radioFieldData)) {
                this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_SELECT_OPTION
            }      
        }

        return this;
    }

    checkAcceptanceField() {
        if (!this.isRequired && !this.fieldData) {
            return this;
        }

        const acceptanceFieldData = this.fieldData as string

        if (!["Y", "N"].includes(acceptanceFieldData.toUpperCase())) {
            this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_ACCEPTANCE_OPTION
        }

        return this
    }
    //#endregion

    //#region Dedicated field checking
    validateTelCountryCode() {
        const telCountryCodeFieldData = this.fieldData as string

        if (this.EmptyErrorCode() && this.fieldDef.options) {
            if (!this.fieldDef.options.find((x: any) => x.value == telCountryCodeFieldData)) {
                this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_SELECT_OPTION
            }
        }

        return this
    }

    validateCountryCode() {
        const countryCodeFieldData = this.fieldData as string

        if (this.EmptyErrorCode() && this.fieldDef.options) {
            if (!this.fieldDef.options.find((x: any) => x.value == countryCodeFieldData)) {
                this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_SELECT_OPTION
            }
        }

        return this
    }

    validateStateProvinceCode() {
        const countryCodeFieldData = this.formDataDict[DedicateDataFieldEnum.br_address_country]?.data as string
        const stateProvinceCodeFieldData = this.fieldData as string

        if (this.EmptyErrorCode() && this.fieldDef.options && this.fieldDef.options[0]) {
            if (!this.fieldDef.options[0][countryCodeFieldData]?.find((x: any) => x.value == stateProvinceCodeFieldData)) {
                this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_SELECT_OPTION
            }
        }

        return this
    }

    validateCityCode() {
        const countryCodeFieldData = this.formDataDict[DedicateDataFieldEnum.br_address_country]?.data as string
        const stateProvinceCodeFieldData = this.formDataDict[DedicateDataFieldEnum.br_address_state]?.data as string
        const cityCodeFieldData = this.fieldData as string

        if (this.EmptyErrorCode() && this.fieldDef.options && this.fieldDef.options[0]) {
            if (!this.fieldDef.options[0][countryCodeFieldData]?.[0][stateProvinceCodeFieldData]?.find((x: any) => x.value == cityCodeFieldData)) {
                this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_SELECT_OPTION
            }
        }

        return this
    }

    validatePasswordField() {
        return this.checkRequired().checkTextLength().checkTextRegExp();
    }

    validateConfirmPasswordField() {
        this.checkRequired().checkTextLength().checkTextRegExp();
        const confirmPasswordFieldData = this.fieldData as string
        const passwordField = this.formDataDict[DedicateDataFieldEnum.br_password]

        if (this.EmptyErrorCode() && passwordField?.data != confirmPasswordFieldData) {
            this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_CONFIRM_PASSWORD
        }
        return this
    }

    validateProductInterest() {
        if (this.EmptyErrorCode() && this.fieldDef.options) {
            const productInterestTeCodeFieldData = this.fieldData as string
            const productInterestTeCodeList: string[] = (productInterestTeCodeFieldData == "") ? [] : productInterestTeCodeFieldData.split(',')

            productInterestTeCodeList.forEach((teCode) => {
                if(!this.fieldDef.options[teCode]){
                    this.formValidationErrorCode = WordpressFormValidationEnum.INVALID_SELECT_OPTION
                }
            })
        }
        return this
    }
    //#endregion

    //#region field checking with promise queue
    validateS3Field(s3Service: S3Service, uploadBucketName: string) {
        // logic: try get file information from s3
        // check file path length, file extension is valid, total file size is valid

        if (!this.isRequired && !this.fieldData) {
            return this;
        }

        const fileFieldData = this.fieldData as string

        if (fileFieldData.length > 1024) {
            this.formValidationErrorCode = WordpressFormValidationEnum.FILE_PATH_EXCEED_LIMIT
        }

        if (this.EmptyErrorCode()) {
            this.promiseQueue.push(
                new Promise(async (resolve, reject) => {
                    try {
                        let s3FileKeyArray: string[] = []
                        if (this.fieldDef.multiple_files) {
                            s3FileKeyArray = fileFieldData.split(',')
                        } else {
                            s3FileKeyArray = [fileFieldData]
                        }
    
                        let aggFileSize = 0
    
                        for (let s3FileKey of s3FileKeyArray) {
                            const uploadFileHeadData = await s3Service.retrieveUploadFileHeadData(uploadBucketName, s3FileKey)
    
                            if (!uploadFileHeadData) {
                                resolve(WordpressFormValidationEnum.FILE_MISSING)
                            }

                            aggFileSize += Number(uploadFileHeadData["ContentLength"])
    
                            if (this.fieldDef.image_file_only) {
                                if (!Object.values(ImgFileContentType).includes(uploadFileHeadData["ContentType"])) {
                                    resolve(WordpressFormValidationEnum.FILE_INVALID_FILE_TYPE)
                                }
                            } else {
                                if (!Object.values(FormFileContentType).includes(uploadFileHeadData["ContentType"])) {
                                    resolve(WordpressFormValidationEnum.FILE_INVALID_FILE_TYPE)
                                }
                            }
                        }
    
                        let maxFileSize = Number(this.fieldDef.document_file_size! * 1024 * 1024)
    
                        if (this.fieldDef.image_file_only) {
                            maxFileSize = Number(this.fieldDef.image_file_size! * 1024 * 1024)
                        } 
    
                        if (aggFileSize > maxFileSize){
                            resolve(WordpressFormValidationEnum.FILE_INVALID_FILE_SIZE)
                        }
    
                        resolve(WordpressFormValidationEnum.VALIDATION_PASSED)
                    } catch (ex) {
                        console.log(`fail to validate upload file, fieldData: ${this.fieldData} err: ${JSON.stringify(ex)}`);
                        resolve(WordpressFormValidationEnum.FILE_FAIL_TO_VALIDATE)
                    }
                })
            )
        }

        return this;
    }

    validateCaptchaField(captchaService: CaptchaService, xForwardedFor: string) {
        // logic: get IP (header: x-forwarded-for[0]), providerId, ticket, randstr (fromData)
        // assume formData format: ${providerId},${ticket},${randstr}
        let ip = ""
        if (!xForwardedFor) {
            this.formValidationErrorCode = WordpressFormValidationEnum.X_FORWARDED_FOR_MISSING
        } else {
            ip = xForwardedFor.split(',')[0].trim()
        }

        if (!this.fieldData) {
            this.formValidationErrorCode = WordpressFormValidationEnum.CAPTCHA_MISSING
        }

        if (this.EmptyErrorCode()) {
            const captchaData = (this.fieldData as string).split(',')

            this.promiseQueue.push(
                new Promise(async (resolve, reject) => {
                    try {
                        const result = await captchaService.validateCaptcha({
                            providerId: captchaData[0],
                            verifyRequest: {
                                ip,
                                ticket: captchaData[1],
                                randstr: captchaData[2] ?? ""
                            }
                        })
                        if (result.success == true) {
                            resolve(WordpressFormValidationEnum.VALIDATION_PASSED)
                        } else {
                            resolve(WordpressFormValidationEnum.CAPTCHA_INVALID)
                        }
                    } catch {
                        resolve(WordpressFormValidationEnum.CAPTCHA_INVALID)
                    }
                })
            )
        }

        return this
    }

    checkRequiredList() {
        if (this.EmptyErrorCode() && this.fieldDef.required) {
            this.isRequired = true;
            if (this.fieldData == undefined || !Array.isArray(this.fieldData) || (this.fieldData as Array<unknown>).length === 0) {
                this.formValidationErrorCode = WordpressFormValidationEnum.FIELD_REQUIRED;
            }
        }

        if (this.fieldDef.required_when && WordpressFieldValidationUtil.checkRequiredWhen(this.fieldDef.required_when, this.formDataDict)) {
            this.isRequired = true;
            if (this.fieldData == undefined || !Array.isArray(this.fieldData) || (this.fieldData as Array<unknown>).length === 0) {
                this.formValidationErrorCode = WordpressFormValidationEnum.FIELD_COMPLEX_REQUIRED;
            }
        }

        return this;
    }

     validateFairListCode(contentService: ContentService){
        if (this.EmptyErrorCode() && Array.isArray(this.fieldData)) {
            let fairListCode = this.fieldData as Array<string>
            for (let fairCode of fairListCode){
                this.promiseQueue.push(
                  new Promise(async (resolve, reject) => {
                      try {
                          await contentService.retrieveFairSetting(fairCode)
                          resolve(WordpressFormValidationEnum.VALIDATION_PASSED)
                      } catch {
                          resolve(WordpressFormValidationEnum.FAIR_INVALID)
                      }
                  })
                )
            }
        }
        return this
    }
    //#endregion

    async getFormValidationErrorCode() {
        if (this.EmptyErrorCode() && this.promiseQueue.length > 0) {
            for (const promiseQueueItem of this.promiseQueue) {
                const promiseResult = await promiseQueueItem
                if (this.EmptyErrorCode() && promiseResult != WordpressFormValidationEnum.VALIDATION_PASSED) {
                    this.formValidationErrorCode = promiseResult
                }
            }
        }

        return this.formValidationErrorCode
    }
}