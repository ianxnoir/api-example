import { FormTemplateDto, FormTemplateFieldItemDto } from "../api/content/dto/formTemplate.dto";
import { DedicateDataFieldEnum, ProductInterestFieldId, ProductInterestOtherFieldId } from "./enum/dedicateDataField.enum";
import * as crypto from "crypto";
import { FairRegistration } from "../../dao/FairRegistration";
import { ValidationUtil } from "./validation.util";
import { FormProductInterestOptionsDto } from "./dto/formProductInterestOptions.dto";

export class FormCommonUtil {
    public static retrieveGenericFieldValueFromFormTemplate(
        fieldId: string,
        fieldValue: string,
        formTemplateFieldItemDto: FormTemplateFieldItemDto): string | null {
        switch (formTemplateFieldItemDto.field_type) {
            case "generic-hktdc-checkbox":
            case "generic-radio":
                return FormCommonUtil.retrieveLabelByOptionId(fieldValue, formTemplateFieldItemDto)
            case "generic-dropdown":
                return FormCommonUtil.retrieveLabelByOptionValue(fieldValue, formTemplateFieldItemDto)
            case "generic-acceptance":
                return FormCommonUtil.retrieveAcceptanceText(fieldValue, formTemplateFieldItemDto)
            default:
                return null
        }
    }

    public static retrieveLabelByOptionId(
        fieldValue: string,
        formTemplateFieldItemDto: FormTemplateFieldItemDto): string | null {

        if (formTemplateFieldItemDto.options) {
            const retrievedOption = formTemplateFieldItemDto.options.find((x: { id: string; }) => x.id == fieldValue)
            if (retrievedOption) {
                return retrievedOption.label
            }
        }
        return null
    }

    public static retrieveLabelByOptionValue(
        fieldValue: string,
        formTemplateFieldItemDto: FormTemplateFieldItemDto): string | null {

        if (formTemplateFieldItemDto.options) {
            const retrievedOption = formTemplateFieldItemDto.options.find((x: { value: string; }) => x.value == fieldValue)
            if (retrievedOption) {
                return retrievedOption.label
            }
        }
        return null
    }

    public static retrieveAcceptanceText(
        fieldValue: string,
        formTemplateFieldItemDto: FormTemplateFieldItemDto): string | null {

        if (formTemplateFieldItemDto.acceptance_text) {
            return formTemplateFieldItemDto.acceptance_text
        }
        return null
    }

    public static encryptPassword(password: string, passwordPublicKey: string) {
        const encryptedData = crypto.publicEncrypt(
            {
                key: passwordPublicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
                oaepHash: "sha256",
            },
            Buffer.from(password)
        );
        return encryptedData.toString("base64")
    }

    public static convertFairRegToFormDataJson(fairReg: FairRegistration, formTemplate: FormTemplateDto): string {
        let formData = {}

        const formTemplateDict = ValidationUtil.convertFormTemplateToTemplateDictionary(formTemplate)

        Object.keys(formTemplateDict).forEach(fieldId => {
            switch (fieldId) {
                case (ProductInterestFieldId.br_bm_product_interest):
                    formData = {
                        ...formData,
                        [DedicateDataFieldEnum.br_bm_product_interest]: FormCommonUtil.convertFairRegToFieldData(fairReg, DedicateDataFieldEnum.br_bm_product_interest, formTemplateDict[fieldId]),
                        [DedicateDataFieldEnum.br_bm_product_interest_other]: FormCommonUtil.convertFairRegToFieldData(fairReg, DedicateDataFieldEnum.br_bm_product_interest_other, formTemplateDict[fieldId]),
                    }
                    break
                case (ProductInterestFieldId.br_bm_product_interest_ip):
                    formData = {
                        ...formData,
                        [DedicateDataFieldEnum.br_bm_product_interest_ip]: FormCommonUtil.convertFairRegToFieldData(fairReg, DedicateDataFieldEnum.br_bm_product_interest_ip, formTemplateDict[fieldId]),
                        [DedicateDataFieldEnum.br_bm_product_interest_ip_other]: FormCommonUtil.convertFairRegToFieldData(fairReg, DedicateDataFieldEnum.br_bm_product_interest_ip_other, formTemplateDict[fieldId]),
                    }
                    break
                case (ProductInterestFieldId.br_bm_product_interest_licensing):
                    formData = {
                        ...formData,
                        [DedicateDataFieldEnum.br_bm_product_interest_licensing]: FormCommonUtil.convertFairRegToFieldData(fairReg, DedicateDataFieldEnum.br_bm_product_interest_licensing, formTemplateDict[fieldId]),
                        [DedicateDataFieldEnum.br_bm_product_interest_licensing_other]: FormCommonUtil.convertFairRegToFieldData(fairReg, DedicateDataFieldEnum.br_bm_product_interest_licensing_other, formTemplateDict[fieldId]),
                    }
                    break
                default:
                    formData = {
                        ...formData,
                        [fieldId]: FormCommonUtil.convertFairRegToFieldData(fairReg, fieldId, formTemplateDict[fieldId])
                    }
                    break
            }
        })

        return JSON.stringify(ValidationUtil.unflattenFormData(formData))
    }

    public static convertFairRegToFieldData(fairReg: FairRegistration, fieldId: string, formFieldTemplate: FormTemplateFieldItemDto): unknown {
        if (Object.values(DedicateDataFieldEnum).includes(fieldId)) {
            return FormCommonUtil.convertFairRegToDedicatedFieldData(fairReg, fieldId, formFieldTemplate)
        } else {
            return FormCommonUtil.convertFairRegToGenericFieldData(fairReg, fieldId, formFieldTemplate)
        }
    }

    public static convertFairRegToDedicatedFieldDataStrArray(fairReg: FairRegistration, fieldId: string, formFieldTemplate: FormTemplateFieldItemDto): string[] {
        let resultArray: string[] = []
        switch (fieldId) {
            case DedicateDataFieldEnum.br_title:
                resultArray = fairReg.title ? [fairReg.title] : []
                break
            case DedicateDataFieldEnum.br_first_name:
                resultArray = fairReg.firstName ? [fairReg.firstName] : []
                break
            case DedicateDataFieldEnum.br_last_name:
                resultArray = fairReg.lastName ? [fairReg.lastName] : []
                break
            case DedicateDataFieldEnum.br_email:
                resultArray = fairReg.fairParticipant?.emailId ? [fairReg.fairParticipant?.emailId] : []
                break
            case DedicateDataFieldEnum.br_position:
                resultArray = fairReg.position ? [fairReg.position] : []
                break
            case DedicateDataFieldEnum.br_country_code_mobile:
                // retrieve from form field template's options by label (pattern example "+852 ")
                const mobilePhoneCountryCodeKey = `+${fairReg.mobilePhoneCountryCode}`
                const mobilePhoneCountryCodeOption = formFieldTemplate.options.find((x: { label: string; }) => x.label.includes(mobilePhoneCountryCodeKey))
                resultArray = mobilePhoneCountryCodeOption?.value ? [mobilePhoneCountryCodeOption?.value] : []
                break
            case DedicateDataFieldEnum.br_mobile_number:
                resultArray = fairReg.mobilePhoneNumber ? [fairReg.mobilePhoneNumber] : []
                break
            case DedicateDataFieldEnum.br_company_name:
                resultArray = fairReg.companyName ? [fairReg.companyName] : []
                break
            case DedicateDataFieldEnum.br_country_code_company:
                // retrieve from form field template's options by label (pattern example "+852 ")
                const companyPhoneCountryCodeKey = `+${fairReg.companyPhoneCountryCode}`
                const companyPhoneCountryCodeOption = formFieldTemplate.options.find((x: { label: string; }) => x.label.includes(companyPhoneCountryCodeKey))
                resultArray = companyPhoneCountryCodeOption?.value ? [companyPhoneCountryCodeOption?.valuee] : []
                break
            case DedicateDataFieldEnum.br_area_code_company:
                resultArray = fairReg.companyPhoneAreaCode ? [fairReg.companyPhoneAreaCode] : []
                break
            case DedicateDataFieldEnum.br_company_number:
                resultArray = fairReg.companyPhonePhoneNumber ? [fairReg.companyPhonePhoneNumber] : []
                break
            case DedicateDataFieldEnum.br_extension_company:
                resultArray = fairReg.companyPhoneExtension ? [fairReg.companyPhoneExtension] : []
                break
            case DedicateDataFieldEnum.br_company_website:
                resultArray = fairReg.companyWebsite ? [fairReg.companyWebsite] : []
                break
            case DedicateDataFieldEnum.br_company_background:
                resultArray = fairReg.companyBackground ? [fairReg.companyBackground] : []
                break
            case DedicateDataFieldEnum.br_address_line_1:
                resultArray = fairReg.addressLine1 ? [fairReg.addressLine1] : []
                break
            case DedicateDataFieldEnum.br_address_line_2:
                resultArray = fairReg.addressLine2 ? [fairReg.addressLine2] : []
                break
            case DedicateDataFieldEnum.br_address_line_3:
                resultArray = fairReg.addressLine3 ? [fairReg.addressLine3] : []
                break
            case DedicateDataFieldEnum.br_address_line_4:
                resultArray = fairReg.addressLine4 ? [fairReg.addressLine4] : []
                break
            case DedicateDataFieldEnum.br_address_postal_code:
                resultArray = fairReg.postalCode ? [fairReg.postalCode] : []
                break
            case DedicateDataFieldEnum.br_address_country:
                resultArray = fairReg.addressCountryCode ? [fairReg.addressCountryCode] : []
                break
            case DedicateDataFieldEnum.br_address_state:
                resultArray = fairReg.stateOrProvinceCode ? [fairReg.stateOrProvinceCode] : []
                break
            case DedicateDataFieldEnum.br_address_city:
                resultArray = fairReg.cityCode ? [fairReg.cityCode] : []
                break
            case DedicateDataFieldEnum.br_business_nature:
                resultArray = fairReg.fairRegistrationNobs.map(y => y.fairRegistrationNobCode) ?? []
                break
            case DedicateDataFieldEnum.br_bm_target_supplier: // Product Strategy
                resultArray = fairReg.fairRegistrationProductStrategies.map(y => y.fairRegistrationProductStrategyCode) ?? []
                break
            case DedicateDataFieldEnum.br_bm_prefer_supplier_country: // Target/ Preferred Market(s)
                resultArray = fairReg.fairRegistrationPreferredSuppCountryRegions.map(y => y.fairRegistrationPreferredSuppCountryRegionCode) ?? []
                break
            case DedicateDataFieldEnum.br_consent_registration_detail: // "br_consent_9701", Consent: Registration Details Consent
                resultArray = fairReg.registrationDetailConsent == "Y" ? ["true"] : ["false"]
                break
            case DedicateDataFieldEnum.br_concent_privacy_policy_statement: // "br_consent_9908", Consent: Privacy Policy Statement
                resultArray = fairReg.badgeConsent == "Y" ? ["true"] : ["false"]
                break
            case DedicateDataFieldEnum.br_concent_eu_eea_clause: // "br_consent_9905", Consent: EU / EA Clause
                resultArray = fairReg.euConsentStatus == "Y" ? ["true"] : ["false"]
                break
            case DedicateDataFieldEnum.br_concent_click2match: //  "br_consent_9602", Consent: Click2Match
                resultArray = fairReg.c2mConsent == "Y" ? ["true"] : ["false"]
                break
            // pass through case, not handling on this function
            case DedicateDataFieldEnum.br_outlets_no:
            case DedicateDataFieldEnum.br_upload_photo:
            case DedicateDataFieldEnum.br_company_logo:
            case DedicateDataFieldEnum.br_hotel_list:
            case DedicateDataFieldEnum.br_room_type:
            case DedicateDataFieldEnum.br_bm_product_interest:
            case DedicateDataFieldEnum.br_bm_product_interest_licensing:
            case DedicateDataFieldEnum.br_bm_product_interest_ip:
            case DedicateDataFieldEnum.br_bm_product_interest_other:
            case DedicateDataFieldEnum.br_bm_product_interest_ip_other:
            case DedicateDataFieldEnum.br_bm_product_interest_licensing_other:
                break;
            case DedicateDataFieldEnum.br_password:
            case DedicateDataFieldEnum.br_confirm_password:
                break; // no need handling, default empty password
            case DedicateDataFieldEnum.br_bm_prefer_timeslot:
            case DedicateDataFieldEnum.br_sbe_event_list:
                break; // no need handling, default empty array
            default:
                break;
        }
        return resultArray
    }

    public static convertFairRegToDedicatedFieldData(fairReg: FairRegistration, fieldId: string, formFieldTemplate: FormTemplateFieldItemDto): unknown {
        switch (fieldId) {
            case DedicateDataFieldEnum.br_title:
                return fairReg.title ?? ""
            case DedicateDataFieldEnum.br_first_name:
                return fairReg.firstName ?? ""
            case DedicateDataFieldEnum.br_last_name:
                return fairReg.lastName ?? ""
            case DedicateDataFieldEnum.br_email:
                return fairReg.fairParticipant?.emailId ?? ""
            case DedicateDataFieldEnum.br_position:
                return fairReg.position ?? ""

            case DedicateDataFieldEnum.br_country_code_mobile:
                // retrieve from form field template's options by label (pattern example "+852 ")
                const mobilePhoneCountryCodeKey = `+${fairReg.mobilePhoneCountryCode}`
                const mobilePhoneCountryCodeOption = formFieldTemplate.options.find((x: { label: string; }) => x.label.includes(mobilePhoneCountryCodeKey))
                return mobilePhoneCountryCodeOption?.value ?? ""
            case DedicateDataFieldEnum.br_mobile_number:
                return fairReg.mobilePhoneNumber ?? ""

            case DedicateDataFieldEnum.br_company_name:
                return fairReg.companyName ?? ""

            case DedicateDataFieldEnum.br_country_code_company:
                // retrieve from form field template's options by label (pattern example "+852 ")
                const companyPhoneCountryCodeKey = `+${fairReg.companyPhoneCountryCode}`
                const companyPhoneCountryCodeOption = formFieldTemplate.options.find((x: { label: string; }) => x.label.includes(companyPhoneCountryCodeKey))
                return companyPhoneCountryCodeOption?.value ?? ""
            case DedicateDataFieldEnum.br_area_code_company:
                return fairReg.companyPhoneAreaCode ?? ""
            case DedicateDataFieldEnum.br_company_number:
                return fairReg.companyPhonePhoneNumber ?? ""
            case DedicateDataFieldEnum.br_extension_company:
                return fairReg.companyPhoneExtension ?? ""
            case DedicateDataFieldEnum.br_company_website:
                return fairReg.companyWebsite ?? ""
            case DedicateDataFieldEnum.br_company_background:
                return fairReg.companyBackground ?? ""

            case DedicateDataFieldEnum.br_outlets_no:
                const outletNoResult = fairReg.fairRegistrationDynamicBms.filter(x => x.formFieldId == DedicateDataFieldEnum.br_outlets_no && x.value).map(y => y.value!)
                return outletNoResult.length > 0? outletNoResult[0] : ""

            case DedicateDataFieldEnum.br_upload_photo:
                return fairReg.fairRegistrationDynamicOthers.find(x => x.formFieldId == DedicateDataFieldEnum.br_upload_photo && x.value)?.value ?? ""
            case DedicateDataFieldEnum.br_company_logo:
                return fairReg.fairRegistrationDynamicOthers.find(x => x.formFieldId == DedicateDataFieldEnum.br_company_logo && x.value)?.value ?? ""

            case DedicateDataFieldEnum.br_hotel_list:
                const hotelResult = fairReg.fairRegistrationDynamicBms.filter(x => x.formFieldId == DedicateDataFieldEnum.br_hotel_list && x.value).map(y => y.value!)
                return hotelResult.length > 0 ? hotelResult[0] : ""
            case DedicateDataFieldEnum.br_room_type:
                const roomTypeResult = fairReg.fairRegistrationDynamicBms.filter(x => x.formFieldId == DedicateDataFieldEnum.br_room_type && x.value).map(y => y.value!)
                return roomTypeResult.length > 0 ? roomTypeResult[0] : ""

            case DedicateDataFieldEnum.br_address_line_1:
                return fairReg.addressLine1 ?? ""
            case DedicateDataFieldEnum.br_address_line_2:
                return fairReg.addressLine2 ?? ""
            case DedicateDataFieldEnum.br_address_line_3:
                return fairReg.addressLine3 ?? ""
            case DedicateDataFieldEnum.br_address_line_4:
                return fairReg.addressLine4 ?? ""
            case DedicateDataFieldEnum.br_address_postal_code:
                return fairReg.postalCode ?? ""
            case DedicateDataFieldEnum.br_address_country:
                return fairReg.addressCountryCode ?? "" // assume no need validate db field with form field template's options
            case DedicateDataFieldEnum.br_address_state:
                return fairReg.stateOrProvinceCode ?? "" // assume no need validate db field with form field template's options
            case DedicateDataFieldEnum.br_address_city:
                return fairReg.cityCode ?? "" // assume no need validate db field with form field template's options

            case DedicateDataFieldEnum.br_business_nature:
                return fairReg.fairRegistrationNobs.map(y => parseInt(y.fairRegistrationNobCode)) ?? []


            case DedicateDataFieldEnum.br_bm_product_interest:
            case DedicateDataFieldEnum.br_bm_product_interest_licensing:
            case DedicateDataFieldEnum.br_bm_product_interest_ip:
                // for each record in fairReg.fairRegistrationProductInterests, if teCode exists in form field template's options, add to array
                return fairReg.fairRegistrationProductInterests.filter(x => formFieldTemplate.options[x.teCode]).map(x => x.teCode) ?? []

            case DedicateDataFieldEnum.br_bm_product_interest_other:
                return fairReg.fairRegistrationDynamicOthers.find(x => x.formFieldId == ProductInterestOtherFieldId.br_bm_product_interest_other && x.value)?.value ?? ""
            case DedicateDataFieldEnum.br_bm_product_interest_ip_other:
                return fairReg.fairRegistrationDynamicOthers.find(x => x.formFieldId == ProductInterestOtherFieldId.br_bm_product_interest_ip_other && x.value)?.value ?? ""
            case DedicateDataFieldEnum.br_bm_product_interest_licensing_other:
                return fairReg.fairRegistrationDynamicOthers.find(x => x.formFieldId == ProductInterestOtherFieldId.br_bm_product_interest_licensing_other && x.value)?.value ?? ""

            case DedicateDataFieldEnum.br_bm_target_supplier: // Product Strategy
                return fairReg.fairRegistrationProductStrategies.map(y => y.fairRegistrationProductStrategyCode) ?? []
            case DedicateDataFieldEnum.br_bm_prefer_supplier_country: // Target/ Preferred Market(s)
                return fairReg.fairRegistrationPreferredSuppCountryRegions.map(y => y.fairRegistrationPreferredSuppCountryRegionCode) ?? []

            case DedicateDataFieldEnum.br_consent_registration_detail: // "br_consent_9701", Consent: Registration Details Consent
                return fairReg.registrationDetailConsent == "Y" ? true : false
            case DedicateDataFieldEnum.br_concent_privacy_policy_statement: // "br_consent_9908", Consent: Privacy Policy Statement
                return fairReg.badgeConsent == "Y" ? true : false
            case DedicateDataFieldEnum.br_concent_eu_eea_clause: // "br_consent_9905", Consent: EU / EA Clause
                return fairReg.euConsentStatus == "Y" ? true : false
            case DedicateDataFieldEnum.br_concent_click2match: //  "br_consent_9602", Consent: Click2Match
                return fairReg.c2mConsent == "Y" ? true : false

            case DedicateDataFieldEnum.br_password:
            case DedicateDataFieldEnum.br_confirm_password:
                return "" // no need handling, default empty password
            case DedicateDataFieldEnum.br_bm_prefer_timeslot:
                const timeslotResult = fairReg.fairRegistrationDynamicBms.filter(x => x.formFieldId == DedicateDataFieldEnum.br_bm_prefer_timeslot && x.value).map(y => y.value!)
                return timeslotResult.length > 0 ? timeslotResult : []
            case DedicateDataFieldEnum.br_sbe_event_list:
                return [] // no need handling, default empty array
            default:
                break;
        }
        return ""
    }

    public static convertFairRegToGenericFieldData(fairReg: FairRegistration, fieldId: string, formFieldTemplate: FormTemplateFieldItemDto): string | string[] {
        // assume all generic field stored in fairRegistrationDynamicBms or fairRegistrationDynamicOthers
        // if field id started with "br_bm_", search from fairRegistrationDynamicBms, else search from fairRegistrationDynamicOthers
        // if formFieldTemplate.multiple_selection is true, need convert to array
        const isMutliSelect = formFieldTemplate.multiple_selection ?? false

        if (fieldId.startsWith("br_bm_")) {
            if (isMutliSelect) {
                return fairReg.fairRegistrationDynamicBms.filter(x => x.formFieldId == fieldId && x.value).map(y => y.value!) ?? []
            } else {
                return fairReg.fairRegistrationDynamicBms.find(x => x.formFieldId == fieldId && x.value)?.value ?? ""
            }
        } else {
            if (isMutliSelect) {
                return fairReg.fairRegistrationDynamicOthers.filter(x => x.formFieldId == fieldId && x.value).map(y => y.value!) ?? []
            } else {
                return fairReg.fairRegistrationDynamicOthers.find(x => x.formFieldId == fieldId && x.value)?.value ?? ""
            }
        }
    }

    public static retrieveFormProductInterestOptions(formTemplate: FormTemplateDto | null): FormProductInterestOptionsDto {
        let productInterestOptionList: FormProductInterestOptionsDto = new FormProductInterestOptionsDto()

        if (!formTemplate ){
            return productInterestOptionList
        }

        const formTemplateDict = ValidationUtil.convertFormTemplateToTemplateDictionary(formTemplate)
        const formTemplateFieldIdList = Object.keys(formTemplateDict)

        if (formTemplateFieldIdList.includes(ProductInterestFieldId.br_bm_product_interest)) {
            productInterestOptionList.br_bm_product_interest = formTemplateDict[ProductInterestFieldId.br_bm_product_interest].options
            productInterestOptionList.productInterestFieldIdList.push(ProductInterestFieldId.br_bm_product_interest)
        }

        if (formTemplateFieldIdList.includes(ProductInterestFieldId.br_bm_product_interest_ip)) {
            productInterestOptionList.br_bm_product_interest_ip = formTemplateDict[ProductInterestFieldId.br_bm_product_interest_ip].options
            productInterestOptionList.productInterestFieldIdList.push(ProductInterestFieldId.br_bm_product_interest_ip)
        }

        if (formTemplateFieldIdList.includes(ProductInterestFieldId.br_bm_product_interest_licensing)) {
            productInterestOptionList.br_bm_product_interest_licensing = formTemplateDict[ProductInterestFieldId.br_bm_product_interest_licensing].options
            productInterestOptionList.productInterestFieldIdList.push(ProductInterestFieldId.br_bm_product_interest_licensing)
        }

        return productInterestOptionList
    } 

    public static retrieveProductInterestOptionsForValidation(formTemplate: FormTemplateDto): any {
        let productInterestOptionValidationList: any = {}
        const formTemplateDict = ValidationUtil.convertFormTemplateToTemplateDictionary(formTemplate)
        const formTemplateFieldIdList = Object.keys(formTemplateDict)

        if (formTemplateFieldIdList.includes(ProductInterestFieldId.br_bm_product_interest)) {
            productInterestOptionValidationList = {
                ...productInterestOptionValidationList,
                ...formTemplateDict[ProductInterestFieldId.br_bm_product_interest].options
            }
        }

        if (formTemplateFieldIdList.includes(ProductInterestFieldId.br_bm_product_interest_ip)) {
            productInterestOptionValidationList = {
                ...productInterestOptionValidationList,
                ...formTemplateDict[ProductInterestFieldId.br_bm_product_interest_ip].options
            }
        }

        if (formTemplateFieldIdList.includes(ProductInterestFieldId.br_bm_product_interest_licensing)) {
            productInterestOptionValidationList = {
                ...productInterestOptionValidationList,
                ...formTemplateDict[ProductInterestFieldId.br_bm_product_interest_licensing].options
            }
        }

        return productInterestOptionValidationList
    } 

    public static convertFormDataJsonProductInterestFieldIdToFormTemplateFieldId(formDataJsonProductInterestFieldId: string): string {
        switch (formDataJsonProductInterestFieldId) {
            case DedicateDataFieldEnum.br_bm_product_interest:
                return ProductInterestFieldId.br_bm_product_interest
            case DedicateDataFieldEnum.br_bm_product_interest_ip:
                return ProductInterestFieldId.br_bm_product_interest_ip
            case DedicateDataFieldEnum.br_bm_product_interest_licensing:
                return ProductInterestFieldId.br_bm_product_interest_licensing
            default:
                return formDataJsonProductInterestFieldId
        }
    }

    public static convertProductInterestFormDataJsonFieldIdToOtherId(formDataJsonProductInterestFieldId: string): string {
        switch (formDataJsonProductInterestFieldId) {
            case DedicateDataFieldEnum.br_bm_product_interest:
                return DedicateDataFieldEnum.br_bm_product_interest_other
            case DedicateDataFieldEnum.br_bm_product_interest_ip:
                return DedicateDataFieldEnum.br_bm_product_interest_ip_other
            case DedicateDataFieldEnum.br_bm_product_interest_licensing:
                return DedicateDataFieldEnum.br_bm_product_interest_licensing_other
            default:
                return formDataJsonProductInterestFieldId
        }
    }
}