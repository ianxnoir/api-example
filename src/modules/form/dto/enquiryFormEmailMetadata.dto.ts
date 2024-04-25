import { Moment } from "moment"
import { FairSettingMultiLangDto } from "../../api/content/dto/fairSettingMultiLang.dto"
import { LANG } from "../../registration/dto/SubmitForm.enum"

export class EnquiryFormEmailMetadataDto {
    serialNo: string
    currentDateTime: Moment
    formUserEmail: string
    adminReceiverEmailList: string[]
    fairShortName: FairSettingMultiLangDto
    fairCode: string
    lang: LANG
    emailHeader: FairSettingMultiLangDto
    emailFooter: FairSettingMultiLangDto
    emailAddress: string
}