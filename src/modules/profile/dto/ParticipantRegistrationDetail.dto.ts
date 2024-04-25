class ParticipantRegistrationDetail {
    ssoUid: string | null
    fairCode: string | null
    fiscalYear: string | null
    emailId: string | null
    registrationNo: string | null
    title: string | null
    firstName: string | null
    lastName: string | null
    displayName: string | null
    initial: string | null
    position: string | null
    companyName: string | null
    addressCountryCode: FairParticipantRegistrationNestedObject | null
    addressLine1: string | null
    addressLine2: string | null
    addressLine3: string | null
    addressLine4: string | null
    postalCode: string | null
    stateOrProvinceCode: FairParticipantRegistrationNestedObject | null
    cityCode: FairParticipantRegistrationNestedObject | null
    companyPhoneCountryCode: string | null
    companyPhonePhoneNumber: string | null
    companyWebsite: string | null
    companyBackground: string | null
    mobilePhoneCountryCode: string | null
    mobilePhoneNumber: string | null

    nob: FairParticipantRegistrationNestedObject[]

    productInterest: FairParticipantRegistrationProductInterest[]
    otherProductCategories: FairParticipantRegistrationNestedObject[]
    
    productStrategy: string[]
    targetPreferredMarkets: FairParticipantRegistrationNestedObject[]

    numberOfOutlets: FairParticipantRegistrationNestedObject[]
    hotel: FairParticipantRegistrationNestedObject[]
    roomType: FairParticipantRegistrationNestedObject[]
    sourcingBudget: FairParticipantRegistrationNestedObject[]
    interestedIn: FairParticipantRegistrationNestedObject[]
    pricePoint: FairParticipantRegistrationNestedObject[]
    lowMOQ: FairParticipantRegistrationNestedObject[]
    fairVisit: FairParticipantRegistrationNestedObject[]
    preferredTimeslot: FairParticipantRegistrationNestedObject[]
    prescreeningByHKTDC: FairParticipantRegistrationNestedObject[]

    companyLogo: string | null
    profilePicture: string | null

    registrationType: string | null
    registrationStatus: string | null
    participantType: string | null
    click2MatchStatus: string | null

    overseasBranchOffice: string | null
}

class FairParticipantRegistrationNestedObject {
    code: string
    en: string
    tc: string
    sc: string
}

class FairParticipantRegistrationProductInterest {
    ia_id: string
    ia_en: string
    ia_tc: string
    ia_sc: string
    st: [StructureTag]
}

class StructureTag {
    st_id: string
    st_en: string
    st_tc: string
    st_sc: string
    te_code: string
}

export { ParticipantRegistrationDetail, FairParticipantRegistrationNestedObject, FairParticipantRegistrationProductInterest, StructureTag }