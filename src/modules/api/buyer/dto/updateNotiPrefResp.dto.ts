export class UpdateNotiPrefRespDto {
    isSuccess: boolean
    preferredLanguage: "en" | "tc" | "sc"
    preferredChannels: ("EMAIL" | "APP_PUSH" | "WECHAT" | "SMS" | "WHATSAPP")[]
}