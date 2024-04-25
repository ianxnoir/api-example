import { FairRegistration } from "../../../dao/FairRegistration"

export class ProfileForEditRespDto {
    formDataJson: string
    slug: string
    fairCode: string

    constructor(formDataJson: string, slug: string, fairCode: string) {
        this.formDataJson = formDataJson
        this.slug = slug
        this.fairCode = fairCode
    }
}

export class ProfileForBackendEditRespDto extends ProfileForEditRespDto {
    showBuyerPreference: boolean
    preferredLanguage: "en" | "tc" | "sc" | ""
    preferredChannels: ("EMAIL" | "APP_PUSH" | "WECHAT" | "SMS" | "WHATSAPP")[]
    overseasBranchOfficer: string
    referenceOverseasOffice: string
    referenceCode: string

    constructor(
        formDataJson: string,
        slug: string,
        fairCode: string,
        fairReg: FairRegistration,
        referenceOverseasOffice: string,
        showBuyerPreference?: boolean,
        preferredLanguage?: "en" | "tc" | "sc",
        preferredChannels?: ("EMAIL" | "APP_PUSH" | "WECHAT" | "SMS" | "WHATSAPP")[]
        ) {
        super(formDataJson, slug, fairCode)
        this.overseasBranchOfficer = fairReg.overseasBranchOfficer ?? ""
        this.referenceOverseasOffice = referenceOverseasOffice
        this.referenceCode = fairReg.referenceCode ?? ""  

        this.showBuyerPreference = showBuyerPreference ?? false
        this.preferredLanguage = preferredLanguage ?? ""
        this.preferredChannels = preferredChannels ?? []
    }
}