import { CouncilwiseDataType, GeneralDefinitionDataRequestDTOType, SsoDataType } from "../api/content/content.enum";
import { ContentService } from "../api/content/content.service";
import { CouncilwiseDataResponseDto } from "../api/content/dto/councilwiseDataResp.dto";
import { FieldData, FormDataDictionaryDto } from "./dto/formDataDicionary.dto";
import { BusinessRuleFormValidationCode } from "./enum/businessRuleFormValidationCode.enum"
import { DedicateDataFieldEnum } from "./enum/dedicateDataField.enum";
import moment from "moment";
import { SeminarRegistrationFormDataDto } from "./dto/seminarRegistrationFormData.dto";
import { ContentCacheService } from '../api/content/content-cache.service';

export class BusinessRuleField {
    protected formValidationErrorCode: BusinessRuleFormValidationCode
    protected fieldData: unknown
    protected isRequired: boolean
    protected promiseQueue: Promise<BusinessRuleFormValidationCode>[] = []

    constructor(
        protected formType: string,
        protected fieldDataObj: FieldData,
        protected additionalData: FormDataDictionaryDto = {}
    ) {
        this.formValidationErrorCode = BusinessRuleFormValidationCode.VALIDATION_PASSED
        this.fieldData = fieldDataObj?.data ?? undefined
        this.isRequired = false

        Object.keys(additionalData).forEach(relatedFieldKey => {
            if (this.fieldData && !(additionalData[relatedFieldKey]?.data ?? "")) {
                this.formValidationErrorCode = BusinessRuleFormValidationCode.RELATED_FIELD_MISSING
            }
        })
    }

    private EmptyErrorCode(): boolean {
        return this.formValidationErrorCode === BusinessRuleFormValidationCode.VALIDATION_PASSED
    }

    checkRequired() {
        if (!this.EmptyErrorCode()) {
            return this;
        }

        this.isRequired = true

        if (this.fieldData == undefined) {
            this.formValidationErrorCode = BusinessRuleFormValidationCode.FIELD_REQUIRED
        }

        return this
    }

    checkRequiredInFormType(formTypeList: string[]) {
        if (!this.EmptyErrorCode()) {
            return this;
        }

        if (formTypeList.find(x => x == this.formType)) {
            this.isRequired = true
            if (this.fieldData == undefined) {
                this.formValidationErrorCode = BusinessRuleFormValidationCode.FIELD_REQUIRED_BY_FORMTYPE
            }
        }

        return this
    }

    checkTextLength(minLength: number, maxLength: number) {
        if (!this.EmptyErrorCode()) {
            return this;
        }

        if (!this.isRequired && !this.fieldData) {
            return this;
        }

        const textFieldData = (this.fieldData as string).toString()
        if (minLength > textFieldData.length || maxLength < textFieldData.length) {
            this.formValidationErrorCode = BusinessRuleFormValidationCode.DATA_LENGTH_INVALID
        }
        return this;
    }

    checkRegExp(regexp: RegExp) {
        if (!this.isRequired && !this.fieldData) {
            return this;
        }

        const textFieldData = (this.fieldData as string ?? "").toString()
        if (this.EmptyErrorCode() && regexp) {
            if (!regexp.test(textFieldData)) {
                this.formValidationErrorCode = BusinessRuleFormValidationCode.DATA_NOT_MATCH_REGEXP
            }
        }
        return this;
    }

    checkCouncilwiseData(
        contentCacheService: ContentCacheService,
        requestType: GeneralDefinitionDataRequestDTOType,
        dataType: CouncilwiseDataType,
        multipleSelection: boolean = false
    ) {
        // note: ([] == "") => true, handled multipleSelection == true
        if (!this.isRequired && (this.fieldData == undefined || this.fieldData == "")) {
            return this;
        }

        if (!this.EmptyErrorCode()) {
            return this;
        }

        const dataStrToCheck = Array.isArray(this.fieldData) ? this.fieldData.join(',') : this.fieldData as string

        this.promiseQueue.push(
            new Promise(async (resolve, reject) => {
                try {
                    const result = await contentCacheService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
                        requestType,
                        dataType,
                        dataStrToCheck
                    )
                    let isValid = true
                    if (multipleSelection) {
                        dataStrToCheck.split(',').forEach(data => {
                            if (!result[data]) {
                                isValid = false
                            }
                        })
                    } else {
                        if (!result[dataStrToCheck]) {
                            isValid = false
                        }
                    }
                    if (isValid) {
                        resolve(BusinessRuleFormValidationCode.VALIDATION_PASSED)
                    } else {
                        resolve(BusinessRuleFormValidationCode.COUNCILWIDE_DATA_VALIDATION_FAILED)
                    }
                } catch {
                    resolve(BusinessRuleFormValidationCode.COUNCILWIDE_DATA_VALIDATION_FAILED)
                }
            })
        )

        return this
    }

    checkCouncilStateProvince(
        contentService: ContentService
    ) {
        if (!this.isRequired && (this.fieldData == undefined || this.fieldData == "")) {
            return this;
        }

        if (!this.EmptyErrorCode()) {
            return this;
        }

        this.promiseQueue.push(
            new Promise(async (resolve, reject) => {
                try {
                    const result = await contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
                        GeneralDefinitionDataRequestDTOType.code,
                        CouncilwiseDataType.province,
                        this.fieldData as string,
                        { countryId: this.additionalData[DedicateDataFieldEnum.br_address_country].data as string}
                    )
                    if (result[this.fieldData as string]) {
                        resolve(BusinessRuleFormValidationCode.VALIDATION_PASSED)
                    } else {
                        resolve(BusinessRuleFormValidationCode.COUNCILWIDE_DATA_VALIDATION_FAILED)
                    }
                } catch {
                    resolve(BusinessRuleFormValidationCode.COUNCILWIDE_DATA_VALIDATION_FAILED)
                }
            })
        )

        return this
    }

    checkCouncilCity(
        contentService: ContentService
    ) {
        if (!this.isRequired && (this.fieldData == undefined || this.fieldData == "")) {
            return this;
        }

        if (!this.EmptyErrorCode()) {
            return this;
        }

        this.promiseQueue.push(
            new Promise(async (resolve, reject) => {
                try {
                    const result = await contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
                        GeneralDefinitionDataRequestDTOType.code,
                        CouncilwiseDataType.city,
                        this.fieldData as string,
                        {
                            countryId: this.additionalData[DedicateDataFieldEnum.br_address_country].data as string,
                            provinceId: this.additionalData[DedicateDataFieldEnum.br_address_state].data as string
                        }
                    )
                    if (result[this.fieldData as string]) {
                        resolve(BusinessRuleFormValidationCode.VALIDATION_PASSED)
                    } else {
                        resolve(BusinessRuleFormValidationCode.COUNCILWIDE_DATA_VALIDATION_FAILED)
                    }
                } catch {
                    resolve(BusinessRuleFormValidationCode.COUNCILWIDE_DATA_VALIDATION_FAILED)
                }
            })
        )

        return this
    }

    checkSsoData(
        contentService: ContentService,
        requestType: GeneralDefinitionDataRequestDTOType,
        dataType: SsoDataType
    ) {
        if (!this.isRequired && (this.fieldData == undefined || this.fieldData == "")) {
            return this;
        }

        if (!this.EmptyErrorCode()) {
            return this;
        }

        this.promiseQueue.push(
            new Promise(async (resolve, reject) => {
                try {
                    const result = await contentService.retrieveSsoDataBy<CouncilwiseDataResponseDto>(
                        requestType,
                        dataType,
                        this.fieldData as string
                    )
                    if (result[this.fieldData as string]) {
                        resolve(BusinessRuleFormValidationCode.VALIDATION_PASSED)
                    } else {
                        resolve(BusinessRuleFormValidationCode.SSO_DATA_VALIDATION_FAILED)
                    }
                } catch {
                    resolve(BusinessRuleFormValidationCode.SSO_DATA_VALIDATION_FAILED)
                }
            })
        )

        return this
    }

    checkSsoStateProvince(
        contentService: ContentService,
    ) {
        if (!this.isRequired && (this.fieldData == undefined || this.fieldData == "")) {
            return this;
        }

        if (!this.EmptyErrorCode()) {
            return this;
        }

        this.promiseQueue.push(
            new Promise(async (resolve, reject) => {
                try {
                    const result = await contentService.retrieveSsoDataBy<CouncilwiseDataResponseDto>(
                        GeneralDefinitionDataRequestDTOType.code,
                        SsoDataType.provinceV2,
                        this.fieldData as string,
                        { 
                            countryId: this.additionalData[DedicateDataFieldEnum.br_address_country].data as string
                        }
                    )
                    if (result[this.fieldData as string]) {
                        resolve(BusinessRuleFormValidationCode.VALIDATION_PASSED)
                    } else {
                        resolve(BusinessRuleFormValidationCode.SSO_DATA_VALIDATION_FAILED)
                    }
                } catch {
                    resolve(BusinessRuleFormValidationCode.SSO_DATA_VALIDATION_FAILED)
                }
            })
        )

        return this
    }

    checkSsoCity(
        contentService: ContentService,
    ) {
        if (!this.isRequired && (this.fieldData == undefined || this.fieldData == "")) {
            return this;
        }

        if (!this.EmptyErrorCode()) {
            return this;
        }

        this.promiseQueue.push(
            new Promise(async (resolve, reject) => {
                try {
                    const result = await contentService.retrieveSsoDataBy<CouncilwiseDataResponseDto>(
                        GeneralDefinitionDataRequestDTOType.code,
                        SsoDataType.cityV2,
                        this.fieldData as string,
                        {
                            countryId: this.additionalData[DedicateDataFieldEnum.br_address_country].data as string,
                            provinceId: this.additionalData[DedicateDataFieldEnum.br_address_state].data as string,
                        }
                    )
                    if (result[this.fieldData as string]) {
                        resolve(BusinessRuleFormValidationCode.VALIDATION_PASSED)
                    } else {
                        resolve(BusinessRuleFormValidationCode.SSO_DATA_VALIDATION_FAILED)
                    }
                } catch {
                    resolve(BusinessRuleFormValidationCode.SSO_DATA_VALIDATION_FAILED)
                }
            })
        )

        return this
    }

    checkProductInterest(
        contentService: ContentService
    ) {
        if (!this.isRequired && this.fieldData == undefined) {
            return this;
        }

        if (!this.EmptyErrorCode()) {
            return this;
        }

        const dataStrToCheck = Array.isArray(this.fieldData) ? this.fieldData.join(',') : this.fieldData as string

        this.promiseQueue.push(
            new Promise(async (resolve, reject) => {
                try {
                    const result = await contentService.retrieveStructureTagDataByTeCode(
                        dataStrToCheck
                    )
                    let isValid = true
                    dataStrToCheck.split(',').forEach(data => {
                        if (!result[data]) {
                            isValid = false
                        }
                    })
                    if (isValid) {
                        resolve(BusinessRuleFormValidationCode.VALIDATION_PASSED)
                    } else {
                        resolve(BusinessRuleFormValidationCode.COUNCILWIDE_DATA_VALIDATION_FAILED)
                    }
                } catch {
                    resolve(BusinessRuleFormValidationCode.COUNCILWIDE_DATA_VALIDATION_FAILED)
                }
            })
        )

        return this
    }

    checkPreferredTimeslotFormat() {
        if (!this.isRequired && this.fieldData == undefined) {
            return this;
        }

        if (!this.EmptyErrorCode()) {
            return this;
        }

        const dataArrayToCheck = this.fieldData as string[]

        dataArrayToCheck.forEach(timeslotStr => {
            const timeSlot = timeslotStr.split('|')
            if (timeSlot.length !== 2) {
                this.formValidationErrorCode = BusinessRuleFormValidationCode.INVALID_DATA_FORMAT
            } else {
                const startDatetime = moment(timeSlot[0])
                const endDatetime = moment(timeSlot[1])
                if(!startDatetime.isValid() || !endDatetime.isValid()){
                    this.formValidationErrorCode = BusinessRuleFormValidationCode.INVALID_DATA_FORMAT
                } else {
                    if (startDatetime.isAfter(endDatetime)){
                        this.formValidationErrorCode = BusinessRuleFormValidationCode.INVALID_DATA_FORMAT
                    }
                }
            }
        })

        return this
    }

    checkSbeEventList() {
        if (!this.isRequired && this.fieldData == undefined) {
            return this;
        }

        if (!this.EmptyErrorCode()) {
            return this;
        }

        const dataArrayToCheck = this.fieldData as SeminarRegistrationFormDataDto[]

        dataArrayToCheck.forEach(seminarReg => {
            if (!seminarReg.eventId || !seminarReg.seminarId) {
                this.formValidationErrorCode = BusinessRuleFormValidationCode.INVALID_DATA_FORMAT
            } 
        })

        return this
    }

    async getFormValidationErrorCode() {
        if (!this.formValidationErrorCode && this.promiseQueue.length > 0) {
            for (const promiseQueueItem of this.promiseQueue) {
                const promiseResult = await promiseQueueItem
                if (this.EmptyErrorCode() && (promiseResult != BusinessRuleFormValidationCode.VALIDATION_PASSED)) {
                    this.formValidationErrorCode = promiseResult
                }
            }
        }
        return this.formValidationErrorCode
    }
}