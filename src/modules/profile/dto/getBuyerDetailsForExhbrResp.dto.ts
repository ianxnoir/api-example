import { BuyerDetailEntryDto } from "../../formValidation/dto/buyerDetailEntry.dto"
import { FairParticipantRegistrationNestedObject } from "./ParticipantRegistrationDetail.dto"

export class GetBuyerDetailsForExhbrRespDto {
    title: string
    firstName: string
    lastName: string
    addressCountryCode: FairParticipantRegistrationNestedObject
    ssoUid: string
    emailId: string
    fairCode: string
    fiscalYear: string
    displayName: string
    initial: string
    position: string
    companyName: string
    dataPerFair: BuyerDetailEntryDto[]
    errorMessage: string
}

