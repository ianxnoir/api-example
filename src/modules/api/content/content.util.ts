import { VepErrorMsg } from "../../../config/exception-constant"
import { VepError } from "../../../core/exception/exception"
import { CouncilwiseDataDto, CouncilwiseDataResponseDto } from "./dto/councilwiseDataResp.dto"
import { OverseasBranchOfficeDto } from "./dto/overseasBranchOffice.dto"

export class ContentUtil {
    public static retieveFairSettingByKey<T>(fairCode: string, fairSetting: any, key: string): T {
        const fairSettingValue = fairSetting[key] as T
        if (!fairSettingValue) {
            throw new VepError(VepErrorMsg.ContentService_FairSettingKeyError, `key ${key} could not be found in fairSetting, fairCode: ${fairCode}`)
        }
        return fairSettingValue
    }

    public static retrieveShortSlugForProfileEdit(fairCode: string, fairSetting: any, fairParticipantTypeId: number, isAdmin: boolean = false): string {
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

        return ContentUtil.retieveFairSettingByKey<string>(fairCode, fairSetting, fairSettingKey)
    }

    public static retrieveFormSlugForProfileEdit(fairCode: string, fairSetting: any, fairParticipantTypeId: number, lang: 'en' | 'tc' | 'sc', isAdmin: boolean = false): string {
        const slug = ContentUtil.retrieveShortSlugForProfileEdit(fairCode, fairSetting, fairParticipantTypeId, isAdmin)
        return `/event/${fairCode}/${lang}/form/${slug}/`
    }

    public static convertToFullPathSlug(fairCode: string, lang: string, shortSlug: string){
        if (shortSlug){
            return `/event/${fairCode}/${lang}/form/${shortSlug}/`
        } else {
            return ''
        }
    }

    public static retrieveOverseasBranchOfficeFromJurisdiction(jurisdictionCodeData : CouncilwiseDataResponseDto, overseasBranchOfficeDto: OverseasBranchOfficeDto) : string {
        const country : CouncilwiseDataDto = jurisdictionCodeData[overseasBranchOfficeDto.addressCountryCode]
        if (!!country?.code && country?.code.length > 0) {
            return country.code[0]
        } else if (country !== undefined) { // mapped but can further map wt province code
            const province = country[overseasBranchOfficeDto.stateOrProvinceCode]
            if (!!province?.code && province?.code.length > 0) {
                return province.code[0]
            } else if (province !== undefined) { // mapped but can further map wt city code
                const city = province[overseasBranchOfficeDto.cityCode]
                if (!!city?.code && city?.code.length > 0) {
                    return city.code[0]
                }
            }
        }
        return ''
    }
}