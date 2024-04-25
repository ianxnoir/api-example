import { VepErrorMsg } from "../../../config/exception-constant"
import { FairSettingKeyEnum } from "./content.enum"
import { SettingHandler } from "./setting.handler"

beforeAll(async () => {
    jest.clearAllMocks()
})

describe('SettingHandler retieveFairSettingStrByKey', () => {
    it('should return valid SettingStrByKey', () => {
        const fairSetting = { fiscal_year: "2223" }
        const settingHandler = new SettingHandler("hkjewellery", fairSetting)
        const fiscalYear = settingHandler.retieveFairSettingStrByKey(FairSettingKeyEnum.fiscalYear).returnNonNullValue()
        expect(fiscalYear).toBe(fairSetting.fiscal_year)
    })

    it('should return error when key is not found, SettingStrByKey', () => {
        const fairSetting = { fisacl_year: "2223" }
        const settingHandler = new SettingHandler("hkjewellery", fairSetting)
        try {
            settingHandler.retieveFairSettingStrByKey("").returnNonNullValue()
        } catch (ex) {
            expect(ex.message).toBe(VepErrorMsg.ContentService_FairSettingKeyError.message);
        }
    })
})

describe('SettingHandler retieveFairSettingObjByKey', () => {
    it('should return valid SettingStrByKey', () => {
        const fairSetting = { fair_display_name: { en: "Hong Kong International Jewellery Show", tc: "香港國際珠寶展", sc: "香港国际珠宝展" } }
        const settingHandler = new SettingHandler("hkjewellery", fairSetting)
        const fiscalYear = settingHandler.retieveFairSettingObjByKey(FairSettingKeyEnum.fairDisplayName).returnNonNullValue()
        expect(fiscalYear).toStrictEqual(fairSetting.fair_display_name)
    })

    it('should return error when key is not found, SettingStrByKey', () => {
        const fairSetting = { fair_display_name: { en: "Hong Kong International Jewellery Show", tc: "香港國際珠寶展", sc: "香港国际珠宝展" } }
        const settingHandler = new SettingHandler("hkjewellery", fairSetting)
        try {
            settingHandler.retieveFairSettingObjByKey("").returnNonNullValue()
        } catch (ex) {
            expect(ex.message).toBe(VepErrorMsg.ContentService_FairSettingKeyError.message);
        }
    })
})


describe('SettingHandler retrieveShortSlugForProfileEdit', () => {
    it('should return valid short slug', () => {
        const fairSetting = { 
            profile_form_for_organic_buyer: "organic_buyer_registration_form",
            profile_form_for_organic_buyer_admin: "organic_buyer_registration_form_admin",
            profile_form_for_cip_buyer: "cip_buyer_registration_form",
            profile_form_for_cip_buyer_admin: "cip_buyer_registration_form_admin",
            profile_form_for_mission_buyer: "mission_buyer_registration_form",
            profile_form_for_mission_buyer_admin: "mission_buyer_registration_form_admin",
        }
        const settingHandler = new SettingHandler("hkjewellery", fairSetting)

        const organicFormShortSlug = settingHandler.retrieveShortSlugForProfileEdit(1, false).returnNonNullValue()
        expect(organicFormShortSlug).toBe(fairSetting.profile_form_for_organic_buyer)
        const organicFormAdminShortSlug = settingHandler.retrieveShortSlugForProfileEdit(1, true).returnNonNullValue()
        expect(organicFormAdminShortSlug).toBe(fairSetting.profile_form_for_organic_buyer_admin)

        const cipFormShortSlug = settingHandler.retrieveShortSlugForProfileEdit(2, false).returnNonNullValue()
        expect(cipFormShortSlug).toBe(fairSetting.profile_form_for_cip_buyer)
        const cipFormAdminShortSlug = settingHandler.retrieveShortSlugForProfileEdit(2, true).returnNonNullValue()
        expect(cipFormAdminShortSlug).toBe(fairSetting.profile_form_for_cip_buyer_admin)

        const missionFormShortSlug = settingHandler.retrieveShortSlugForProfileEdit(3, false).returnNonNullValue()
        expect(missionFormShortSlug).toBe(fairSetting.profile_form_for_mission_buyer)
        const missionFormAdminShortSlug = settingHandler.retrieveShortSlugForProfileEdit(3, true).returnNonNullValue()
        expect(missionFormAdminShortSlug).toBe(fairSetting.profile_form_for_mission_buyer_admin)
    })

    it('should return error when fairParticipantTypeId is invalid', () => {
        const fairSetting = { 
            profile_form_for_organic_buyer: "",
            profile_form_for_organic_buyer_admin: "",
            profile_form_for_cip_buyer: "",
            profile_form_for_cip_buyer_admin: "",
            profile_form_for_mission_buyer: "",
            profile_form_for_mission_buyer_admin: "",
        }
        const settingHandler = new SettingHandler("hkjewellery", fairSetting)
        try {
            settingHandler.retrieveShortSlugForProfileEdit(4, false).returnNonNullValue()
        } catch (ex) {
            expect(ex.message).toBe(VepErrorMsg.Profile_Unable_To_Form_Template_Slug.message);
        }
    })
})