export enum CouncilwiseDataType {
    nob = 'nobV2',
    salutation = 'salutationV2',
    structureTag = 'structureTagV2',
    country = 'countryV2',
    province = 'provinceV2',
    city = 'cityV2',
    office = 'officeV2',
    'office-jurisdiction' = 'office-jurisdictionV2',
    'region-country' = 'region-countryV2',
    'target-marketV2' = 'target-marketV2',
    'product-stragetyV2' = 'product-stragetyV2',
    'raw-jsonV2' = 'raw-jsonV2',
    'idd-country' = 'idd-countryV2',
}

export enum CouncilwiseRawJsonType {
    country = 'COUNTRY',
    province = 'PROVINCE',
    city = 'CITY',
    district = 'DISTRICT',
    office = 'OFFICE',
    region = 'REGION',
    'office-jurisdiction' = 'OFFICE_JURISDICTION' ,
    'region-country' = 'REGION_COUNTRY' ,
    'idd-country' = 'IDD_COUNTRY' ,
    nob = 'NOB' ,
    salutation = 'SALUTATION',
    structureTag = 'STRUCTURETAG',
    'product-stragetyV2' = "PRODUCT_STRATEGY",
    'target-marketV2' = "TARGET_MARKET"
}

export enum SsoDataType {
    countryV2 = 'countryV2',
    provinceV2 = 'provinceV2',
    cityV2 = 'cityV2',
}

export enum GeneralDefinitionDataRequestDTOType {
    sid = 'sid',
    code = 'code',
    tel = 'tel'
}

export enum FairSettingKeyEnum {
    fiscalYear = "fiscal_year",
    vmsProjectYear = "vms_project_year",
    vmsProjectCode = "vms_project_no",
    emailAddress = "email_address",
    fairShortName = "fair_short_name",
    fairDisplayName = "fair_display_name",
    emailHeader = "email_header",
    emailFooter = "email_footer",
    fairRegistrationToggle = "fair_registration",
    fairRegistrationStartDatetime = "fair_registration_start_datetime",
    fairRegistrationEndDatetime = "fair_registration_end_datetime",
    profileFormForOrganicBuyer = "profile_form_for_organic_buyer",
    profileFormForOrganicBuyerAdmin = "profile_form_for_organic_buyer_admin",
    profileFormForCIPBuyer = "profile_form_for_cip_buyer",
    profileFormForCIPBuyerAdmin = "profile_form_for_cip_buyer_admin",
    profileFormForMissionBuyer = "profile_form_for_mission_buyer",
    profileFormForMissionBuyerAdmin = "profile_form_for_mission_buyer_admin",
}
