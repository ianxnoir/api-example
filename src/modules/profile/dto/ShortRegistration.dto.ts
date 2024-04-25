import { FairParticipantRegistrationNestedObject } from "./ParticipantRegistrationDetail.dto"

export class ShortRegistrationDto {
    ssoUid: string | null
    fairCode: string | null
    fiscalYear: string | null
    emailId: string | null
    registrationNo: string
    title: string | null
    firstName: string | null
    lastName: string | null
    displayName: string | null
    initial: string | null
    position: string | null
    companyName: string | null
    addressCountryCode: FairParticipantRegistrationNestedObject | null
    overseasBranchOffice: string | null
}

