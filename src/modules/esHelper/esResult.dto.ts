export class filterOpenSearchFieldsDto {
    filterCountry?: string
    filterNob?: string
    filterProductCategory?: string
}

export class aggregateNestedOpenSearchFieldsDto {
    countrySymbol?: string
    natureofBusinessSymbols?: string
    productCategoryList?: string
}

export class EsResultDto {
    took: number
    timed_out: string
    _shards: ShardsDto
    hits: ESOuterHits
    aggregations: ESAggregationDto
}

export class ShardsDto {
    total: number
    successful: number
    skipped: number
    failed: number
}

export class ESOuterHits {
    total: TotalDto
    max_score: number
    hits: ESInnerHits<ESInnerHitsResponseDto>[]
}

export class TotalDto {
    value: number
    relation: string
}

export class ESInnerHits<ESInnerHitsResponseDto> {
    _index: string
    _type: string
    _id: string
    _score: number
    _source: ESInnerHitsResponseDto
}

export class ESInnerHitsResponseDto {
    fairParticipantId?: string
    firstName?: string
    lastName?: string
    initial?: string
    displayName?: string
    position?: string 
    companyName?: string
    country?: string
    countryCode?: string
    ssoUid?: string
    emailId?: string
    fairCode?: string
    fiscalYear?: string

    addressCountryCode?: MultiLanguageWithCodeDto
    addressLine1?: string
    addressLine2?: string
    addressLine3?: string
    addressLine4?: string
    badgeConsent?: string
    blacklisted?: string
    c2mConsent?: string
    c2mLogin?: string
    c2mMeetingLogin?: string
    c2mParticipantStatusId?: number
    cbmRemark?: string
    cityCode?: MultiLanguageWithCodeDto
    companyBackground?: string
    companyCcdid?: string
    companyPhoneAreaCode?: string
    companyPhoneCountryCode?: string
    companyPhoneExtension?: string
    companyPhonePhoneNumberv: string
    companyWebsite?: string
    correspondenceEmail?: string
    euConsentStatus?: string
    fairParticipantTypeId?: number
    fairRegistrationStatusId?: number
    fairRegistrationTypeId?: number
    formDataJson?: string
    formType?: string
    formSubmissionKey?: string
    formTemplateId?: string
    generalBuyerRemark?: string
    id?: number
    individualCcdid?: string
    mobilePhoneCountryCode?: string
    mobilePhoneNumber?: string
    nob?: [MultiLanguageWithCodeDto]
    overseasBranchOffice?: string
    overseasBranchOfficer?: string
    postalCode?: string
    productInterest?: [ProductInterestDetails]
    projectNumber?: string
    projectYear?: string
    promotionCode?: string
    referenceCode?: string
    registrationDetailConsent?: string
    registrationNoChecksum?: string
    registrationUrl?: string
    referenceOverseasOffice?: string
    serialNumber?: string
    sourceTypeCode?: string
    slug?: string
    stateOrProvinceCode?: MultiLanguageWithCodeDto
    tier?: string
    title?: string
    visitorTypeCode?: string
    vpRemark?: string
}

export class MultiLanguageWithCodeDto {
    code: string
    en: string
    tc: string
    sc: string
}

export class ProductInterestDetails {
    iaId: string
    iaEn: string
    iaTc: string
    iaSc: string
    stId: string
    stEn: string
    stTc: string
    stSc: string
    teCode: string
}

export class ESAggregationDto {
    [key: string]: ESNestedAggregationResult | ESAggregationResult
}

export class ESNestedAggregationResult {
    [key: string]: ESAggregationResult | string | undefined | unknown
}

export class ESAggregationResult{
    doc_count_error_upper_bound?: number
    sum_other_doc_count?: number
    buckets?: ESAggregationResultBucket[]
}

export class ESAggregationResultBucket{
    key: string
    doc_count: number
}

export class ESFairParticipantResponseDto {
    took: number
    timed_out: string
    _shards: ShardsDto
    hits: ESOuterHits
    aggregations: ESModifiedAggregationField
}

export class ESModifiedAggregationField {
    [key: string]: ESModifiedAggregationResult[]
}
export class ESModifiedAggregationResult{
    status: number
    id: string
    label: string
}