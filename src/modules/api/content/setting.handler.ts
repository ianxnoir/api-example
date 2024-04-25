import { VepErrorMsg } from "../../../config/exception-constant"
import { VepError } from "../../../core/exception/exception"
import { BooleanSettingByKey, ObjectSettingByKey, StringSettingByKey } from "./dto/settingByKey.dto"

export class SettingHandler {
    fairCode: string
    fairSetting: any

    constructor(fairCode: string, fairSetting: any){
        this.fairCode = fairCode
        this.fairSetting = fairSetting
    }

    public retieveFairSettingStrByKey(key: string): StringSettingByKey {
        return new StringSettingByKey(this.fairCode, key, this.fairSetting[key])
    }

    public retieveFairSettingBooleanByKey(key: string): BooleanSettingByKey {
        return new BooleanSettingByKey(this.fairCode, key, this.fairSetting[key])
    }

    public retieveFairSettingObjByKey<T>(key: string): ObjectSettingByKey<T> {
        return new ObjectSettingByKey<T>(this.fairCode, key, this.fairSetting[key])
    }

    public retrieveShortSlugForProfileEdit(fairParticipantTypeId: number, isAdmin: boolean = false): StringSettingByKey {
        let fairSettingKeyPrefix = ''
        switch (fairParticipantTypeId) {
            case 1: // Organic
                fairSettingKeyPrefix = 'profile_form_for_organic_buyer'
                break;
            case 2: // CIP
                fairSettingKeyPrefix = 'profile_form_for_cip_buyer'
                break;
            case 3: // MISSION
                fairSettingKeyPrefix = 'profile_form_for_mission_buyer'
                break;
            default:
                break;
        }
        if (fairSettingKeyPrefix === '') {
            throw new VepError(VepErrorMsg.Profile_Unable_To_Form_Template_Slug, `Could not retrieve fair setting key prefix, fairParticipantTypeId: ${fairParticipantTypeId} `)
        }

        const fairSettingKey = `${fairSettingKeyPrefix}${isAdmin ? '_admin' : ''}`

        return this.retieveFairSettingStrByKey(fairSettingKey)
    }
}
