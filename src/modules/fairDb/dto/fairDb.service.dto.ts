import { FairRegistrationDynamicBm } from "../../../dao/FairRegistrationDynamicBm";
import { FairRegistrationDynamicOthers } from "../../../dao/FairRegistrationDynamicOthers";
import { FairRegistrationPreferredSuppCountryRegion } from "../../../dao/FairRegistrationPreferredSuppCountryRegion";
import { FairRegistrationProductInterest } from "../../../dao/FairRegistrationProductInterest";
import { FairRegistrationProductStrategy } from "../../../dao/FairRegistrationProductStrategy";

export class QueryActiveFairParticipantRegistrationsQuery {
    ssoUid: string;
    fairCode: string;
    fiscalYear: string;
}

export class GenerateRegistrationNoDto {
    projectYear: string
    sourceTypeCode: string
    visitorTypeCode: string
    projectNumber: string
    formSubmissionKey: string
    createdBy: string
    lastUpdatedBy: string
}

export class RegNoPreGenObjectLiteral {
    projectYear: string
    sourceTypeCode: string
    visitorTypeCode: string
    projectNumber: string
    serialNumber: number
}

export class ProfileEditDto {
    overseasBranchOfficer?: string // only apply for backend update

    euConsentStatus?: 'Y' | 'N' // field id: "br_consent_9905", Consent: EU / EA Clause
    badgeConsent?: 'Y' | 'N' // field id: "br_consent_9908", Consent: Privacy Policy Statement
    c2mConsent?: 'Y' | 'N' // field id: "br_consent_9602", Consent: Click2Match
    registrationDetailConsent?: 'Y' | 'N'; // field id: "br_consent_9701", Consent: Registration Details Consent

    fairRegistrationProductStrategies?: FairRegistrationProductStrategy[];
    fairRegistrationPreferredSuppCountryRegions?: FairRegistrationPreferredSuppCountryRegion[];
    fairRegistrationProductInterests?: FairRegistrationProductInterest[];

    dynamicBmFieldIdToUpdate: string[]
    fairRegistrationDynamicBms: FairRegistrationDynamicBm[];

    dynamicOtherFieldIdToUpdate: string[]
    fairRegistrationDynamicOthers: FairRegistrationDynamicOthers[];

    lastUpdatedBy: string

    constructor() {
        this.dynamicBmFieldIdToUpdate = []
        this.fairRegistrationDynamicBms = []
        this.dynamicOtherFieldIdToUpdate = []
        this.fairRegistrationDynamicOthers = []
    }
}

export class EditResultDto {
    isSuccess: boolean
}