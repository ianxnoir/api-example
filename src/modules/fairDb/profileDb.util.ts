import { SelectQueryBuilder } from "typeorm"
import { FairRegistration } from "../../dao/FairRegistration"
import { FairRegistrationDynamicBm } from "../../dao/FairRegistrationDynamicBm";
import { FairRegistrationDynamicOthers } from "../../dao/FairRegistrationDynamicOthers";
import { FairRegistrationPreferredSuppCountryRegion } from "../../dao/FairRegistrationPreferredSuppCountryRegion";
import { FairRegistrationProductStrategy } from "../../dao/FairRegistrationProductStrategy";
import { FormTemplateFieldItemDto } from "../api/content/dto/formTemplate.dto";
import { FieldData } from "../formValidation/dto/formDataDicionary.dto";
import { FormCommonUtil } from "../formValidation/formCommon.util";
import { DynamicBmOtherEntry } from "./dto/prodileDb.util.dto";

export class ProfileDbUtil {
    public static whereSsoUidFairCodeFiscalYear(queryBuilder: SelectQueryBuilder<FairRegistration>, ssoUid: string, fairTuples: { fairCode: string, fiscalYear: string }[]) {
        fairTuples.forEach((fairTuple, idx) => {
            queryBuilder.orWhere(`(fp.ssoUid = :ssoUid${idx} AND r.fairCode = :fairCode${idx} AND r.fiscalYear = :fiscalYear${idx})`,
                { [`ssoUid${idx}`]: ssoUid, [`fairCode${idx}`]: fairTuple.fairCode, [`fiscalYear${idx}`]: fairTuple.fiscalYear })
        });
        return queryBuilder
    }

    public static convertToFairRegProductStrategyDao(fairReg: FairRegistration, productStrategyList: string[] | undefined, editedBy: string = "VEP INIT"): FairRegistrationProductStrategy[] {
        return (productStrategyList ?? []).map(
            (productStrategy) => {
                let productStrategyRecord = new FairRegistrationProductStrategy()
                productStrategyRecord.fairRegistrationId = fairReg.id
                productStrategyRecord.fairRegistrationProductStrategyCode = productStrategy
                productStrategyRecord.createdBy = editedBy
                productStrategyRecord.lastUpdatedBy = editedBy
                return productStrategyRecord
            }
        )
    }

    public static convertToFairRegPreferredSuppCountryRegion(fairReg: FairRegistration, targetPreferredMarkets: string[] | undefined, editedBy: string = "VEP INIT"): FairRegistrationPreferredSuppCountryRegion[] {
        return (targetPreferredMarkets ?? []).map(
            (targetPreferredMarket) => {
                let productStrategyRecord = new FairRegistrationPreferredSuppCountryRegion()
                productStrategyRecord.fairRegistrationId = fairReg.id
                productStrategyRecord.fairRegistrationPreferredSuppCountryRegionCode = targetPreferredMarket
                productStrategyRecord.createdBy = editedBy
                productStrategyRecord.lastUpdatedBy = editedBy
                return productStrategyRecord
            }
        )
    }

    public static convertToFairRegBMList(fairReg: FairRegistration, formFieldTemplate: FormTemplateFieldItemDto, formFieldData: FieldData, lastUpdatedBy: string): FairRegistrationDynamicBm[] {
        let dynamicBmList: FairRegistrationDynamicBm[] = []
        if (Array.isArray(formFieldData.data)) {
            formFieldData.data.forEach(element => {
                const fieldDataStr = (typeof element === "object") ? JSON.stringify(element) : (element as string)
                const entry = ProfileDbUtil.convertToDynamicBmOtherEntry(fairReg, formFieldTemplate, formFieldData.key, fieldDataStr, lastUpdatedBy)
                const dynamicBmObj = ProfileDbUtil.convertToDynamicBmEntryObj(entry)
                dynamicBmList.push(dynamicBmObj)
            });
        } else {
            const fieldDataStr = formFieldData.data as string
            const entry = ProfileDbUtil.convertToDynamicBmOtherEntry(fairReg, formFieldTemplate, formFieldData.key, fieldDataStr, lastUpdatedBy)
            const dynamicBmObj = ProfileDbUtil.convertToDynamicBmEntryObj(entry)
            dynamicBmList.push(dynamicBmObj)
        }
        return dynamicBmList
    }

    public static convertToFairRegOtherList(fairReg: FairRegistration, formFieldTemplate: FormTemplateFieldItemDto, formFieldData: FieldData, lastUpdatedBy: string): FairRegistrationDynamicOthers[] {
        let dynamicOtherList: FairRegistrationDynamicOthers[] = []
        if (Array.isArray(formFieldData.data)) {
            formFieldData.data.forEach(element => {
                const fieldDataStr = (typeof element === "object") ? JSON.stringify(element) : (element as string)
                const entry = ProfileDbUtil.convertToDynamicBmOtherEntry(fairReg, formFieldTemplate, formFieldData.key, fieldDataStr, lastUpdatedBy)
                const dynamicOtherObj = ProfileDbUtil.convertToDynamicOthersObj(entry)
                dynamicOtherList.push(dynamicOtherObj)
            });
        } else {
            const fieldDataStr = formFieldData.data as string
            const entry = ProfileDbUtil.convertToDynamicBmOtherEntry(fairReg, formFieldTemplate, formFieldData.key, fieldDataStr, lastUpdatedBy)
            const dynamicOtherObj = ProfileDbUtil.convertToDynamicOthersObj(entry)
            dynamicOtherList.push(dynamicOtherObj)
        }
        return dynamicOtherList
    }

    public static convertToDynamicBmOtherEntry(fairReg: FairRegistration, formFieldTemplate: FormTemplateFieldItemDto, formFieldId: string, fieldDataStr: string, lastUpdatedBy: string): DynamicBmOtherEntry {
        const label = formFieldTemplate.label ?? ""
        const value = fieldDataStr
        let mappedValue = fieldDataStr

        if (["generic-hktdc-checkbox", "generic-radio", "generic-dropdown", "generic-acceptance"].includes(formFieldTemplate.field_type)) {
            // 2. dropdown, checkbox, radio
            mappedValue = FormCommonUtil.retrieveGenericFieldValueFromFormTemplate(formFieldId, fieldDataStr, formFieldTemplate) ?? ""
        }

        return {
            fairRegistrationId: fairReg.id,
            formFieldId,
            labelEn: label,
            labelTc: label,
            labelSc: label,
            value,
            valueEn: mappedValue,
            valueTc: mappedValue,
            valueSc: mappedValue,
            createdBy: lastUpdatedBy,
            lastUpdatedBy: lastUpdatedBy
        }
    }

    public static convertToDynamicBmEntryObj(entry: DynamicBmOtherEntry): FairRegistrationDynamicBm{
        let fairRegistrationDynamicBm: FairRegistrationDynamicBm = new FairRegistrationDynamicBm()

        fairRegistrationDynamicBm.fairRegistrationId = entry.fairRegistrationId
        fairRegistrationDynamicBm.formFieldId = entry.formFieldId
        fairRegistrationDynamicBm.labelEn = entry.labelEn
        fairRegistrationDynamicBm.labelTc = entry.labelTc
        fairRegistrationDynamicBm.labelSc = entry.labelSc
        fairRegistrationDynamicBm.value = entry.value
        fairRegistrationDynamicBm.valueEn = entry.valueEn
        fairRegistrationDynamicBm.valueTc = entry.valueTc
        fairRegistrationDynamicBm.valueSc = entry.valueSc
        fairRegistrationDynamicBm.createdBy = entry.createdBy
        fairRegistrationDynamicBm.lastUpdatedBy = entry.lastUpdatedBy

        return fairRegistrationDynamicBm
    }

    public static convertToDynamicOthersObj(entry: DynamicBmOtherEntry): FairRegistrationDynamicOthers{
        let fairRegistrationDynamicOthers: FairRegistrationDynamicOthers = new FairRegistrationDynamicOthers()

        fairRegistrationDynamicOthers.fairRegistrationId = entry.fairRegistrationId
        fairRegistrationDynamicOthers.formFieldId = entry.formFieldId
        fairRegistrationDynamicOthers.labelEn = entry.labelEn
        fairRegistrationDynamicOthers.labelTc = entry.labelTc
        fairRegistrationDynamicOthers.labelSc = entry.labelSc
        fairRegistrationDynamicOthers.value = entry.value
        fairRegistrationDynamicOthers.valueEn = entry.valueEn
        fairRegistrationDynamicOthers.valueTc = entry.valueTc
        fairRegistrationDynamicOthers.valueSc = entry.valueSc
        fairRegistrationDynamicOthers.createdBy = entry.createdBy
        fairRegistrationDynamicOthers.lastUpdatedBy = entry.lastUpdatedBy

        return fairRegistrationDynamicOthers
    }
}