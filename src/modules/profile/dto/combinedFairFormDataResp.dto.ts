import { ShowInProfileDto } from "../../formValidation/dto/buyerDetailEntry.dto"
import { MultiLangNameDto } from "./getCombineFairListResp.dto"
import { FairParticipantRegistrationNestedObject } from "./ParticipantRegistrationDetail.dto"

export class FormDataPerFair {
    fairCode: string
    fiscalYear: string
    fairDisplayName: MultiLangNameDto
    fairRegistrationToggle: boolean
    vmsProjectCode: string
    vmsProjectYear: string
    fairRegistrationStartDatetime: string
    fairRegistrationEndDatetime: string
    isRegistered: boolean
    formSlug: string
    showInProfileDataList: ShowInProfileDto[]
    errorMessage: string
}

export class CombinedFairFormDataRespDto {
    companyName: string
    addressCountryCode: FairParticipantRegistrationNestedObject
    emailId: string
    mobilePhoneCountryCode: string
    mobilePhoneNumber: string
    companyWebsite: string
    companyBackground: string
    nob: FairParticipantRegistrationNestedObject[]
    title: string
    firstName: string
    lastName: string
    initial: string
    displayName: string
    position: string
    formDataPerFair: FormDataPerFair[]
}