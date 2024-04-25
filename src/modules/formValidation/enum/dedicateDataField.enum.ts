// reserved for flatten form data json for field id checking
// form data json field id will be faltten for validation purpose
// notice product interest related field id is not same as actual field id in form template
export const DedicateDataFieldEnum = {
    br_title: "br_full_name.br_title", // 
    br_first_name: "br_full_name.br_first_name", // 
    br_last_name: "br_full_name.br_last_name", // 
    br_email: "br_email", // 
    br_position: "br_position", // 

    br_country_code_mobile: "br_full_mobile_number.br_country_code_mobile",
    br_mobile_number: "br_full_mobile_number.br_mobile_number", // 

    br_company_name: "br_company_name", // 
    br_country_code_company: "br_full_company_number.br_country_code_company", //
    br_area_code_company: "br_full_company_number.br_area_code_company", // 
    br_company_number: "br_full_company_number.br_company_number", // 
    br_extension_company: "br_full_company_number.br_extension_company", // 
    br_company_website: "br_company_website", // 
    br_company_background: "br_company_background", // 
    br_outlets_no: "br_outlets_no", //

    br_password: "br_full_password.br_password", // 
    br_confirm_password: "br_full_password.br_confirm_password", // 
    br_upload_photo: "br_upload_photo", // 
    br_company_logo: "br_company_logo", // 
    br_hotel_list: "br_hotel_list", // 
    br_room_type: "br_room_type", // 
    br_sbe_event_list: "br_sbe_event_list", // 

    br_address_line_1: "br_address_1_4.br_address_line_1", // 
    br_address_line_2: "br_address_1_4.br_address_line_2", // 
    br_address_line_3: "br_address_1_4.br_address_line_3", // 
    br_address_line_4: "br_address_1_4.br_address_line_4", //
    br_address_postal_code: "br_address_5_8.br_address_postal_code", //
    br_address_country: "br_address_5_8.br_address_country", //
    br_address_state: "br_address_5_8.br_address_state", //
    br_address_city: "br_address_5_8.br_address_city", //

    br_business_nature: "br_business_nature",
    br_bm_prefer_timeslot: "br_bm_prefer_timeslot",

    br_bm_product_interest: "br_bm_product_interest.te_code", //
    br_bm_product_interest_licensing: "br_bm_product_interest_licensing.te_code", //
    br_bm_product_interest_ip: "br_bm_product_interest_ip.te_code", //

    br_bm_product_interest_other: "br_bm_product_interest.other", //
    br_bm_product_interest_ip_other: "br_bm_product_interest_ip.other", // 
    br_bm_product_interest_licensing_other: "br_bm_product_interest_licensing.other", // 

    br_bm_target_supplier: "br_bm_target_supplier", // Product Strategy
    br_bm_prefer_supplier_country: "br_bm_prefer_supplier_country", // Target/ Preferred Market(s)

    br_consent_registration_detail: "br_consent_9701", // Consent: Registration Details Consent
    br_concent_privacy_policy_statement: "br_consent_9908", // Consent: Privacy Policy Statement
    br_concent_eu_eea_clause: "br_consent_9905", // Consent: EU / EA Clause
    br_concent_click2match: "br_consent_9602", // Consent: Click2Match
}

export const DedicateDataFieldListForProductInterest = [
    DedicateDataFieldEnum.br_bm_product_interest,
    DedicateDataFieldEnum.br_bm_product_interest_ip,
    DedicateDataFieldEnum.br_bm_product_interest_licensing
]

export const DedicateDataFieldListForProductInterestOther = [
    DedicateDataFieldEnum.br_bm_product_interest_other,
    DedicateDataFieldEnum.br_bm_product_interest_ip_other,
    DedicateDataFieldEnum.br_bm_product_interest_licensing_other
]

export const SsoRelatedFieldIdList = [ // sso related field (field list refer to VT-1573)
    DedicateDataFieldEnum.br_email,

    DedicateDataFieldEnum.br_title,
    DedicateDataFieldEnum.br_first_name,
    DedicateDataFieldEnum.br_last_name,

    DedicateDataFieldEnum.br_position,
    DedicateDataFieldEnum.br_company_name,

    DedicateDataFieldEnum.br_address_line_1,
    DedicateDataFieldEnum.br_address_line_2,
    DedicateDataFieldEnum.br_address_line_3,
    DedicateDataFieldEnum.br_address_line_4,
    DedicateDataFieldEnum.br_address_postal_code,
    DedicateDataFieldEnum.br_address_country,
    DedicateDataFieldEnum.br_address_state,
    DedicateDataFieldEnum.br_address_city,

    DedicateDataFieldEnum.br_country_code_mobile,
    DedicateDataFieldEnum.br_mobile_number,
    
    DedicateDataFieldEnum.br_country_code_company,
    DedicateDataFieldEnum.br_area_code_company,
    DedicateDataFieldEnum.br_company_number,
    DedicateDataFieldEnum.br_extension_company,

    DedicateDataFieldEnum.br_company_website,
    DedicateDataFieldEnum.br_company_background,

    DedicateDataFieldEnum.br_business_nature,

    DedicateDataFieldEnum.br_password,
    DedicateDataFieldEnum.br_confirm_password
]

export const ReservedFieldId = {
    VEP_REG_FORM_CAPTCHA: "VEP_REG_FORM_CAPTCHA"
}

// Reserved for form template field id checking
// notice product interest related field id is not same as actual field id in form template
export const ProductInterestFieldId = {
    br_bm_product_interest: "br_bm_product_interest",
    br_bm_product_interest_licensing: "br_bm_product_interest_licensing",
    br_bm_product_interest_ip: "br_bm_product_interest_ip",
}

// Reserved for product interest other field id stored in db
// notice product interest related field id is not same as actual field id in form template
export const ProductInterestOtherFieldId = {
    br_bm_product_interest_other: "br_bm_product_interest_other",
    br_bm_product_interest_ip_other: "br_bm_product_interest_ip_other",
    br_bm_product_interest_licensing_other: "br_bm_product_interest_licensing_other",
}

export const HardcodedDynamicBMFieldId = [
    "br_outlets_no", // also integrated field
    "br_hotel_list", // also integrated field
    "br_room_type", // also integrated field
    "br_bm_sourcing_budget",
    "br_bm_interested_in",
    "br_bm_price_point",
    "br_bm_low_moq",
    "br_bm_fair_visit",
    "br_bm_prefer_timeslot", // also integrated field
    "br_bm_pre_screening",
    "bm_distribution_network",
    "bm_retail_price_range",
    "bm_brand_categories",
    "bm_style_products_brands",
    "bm_rganic_food_suppliers",
    "bm_food_certificate"
]

// list of DedicateDataFieldEnum for special handling in retrieve value
export const DedicateDataFieldListForValueHandling = [
    DedicateDataFieldEnum.br_address_country,
    DedicateDataFieldEnum.br_address_state,
    DedicateDataFieldEnum.br_address_city,
    DedicateDataFieldEnum.br_country_code_company,
    DedicateDataFieldEnum.br_country_code_mobile,
    DedicateDataFieldEnum.br_title,
    DedicateDataFieldEnum.br_hotel_list,
    DedicateDataFieldEnum.br_business_nature,
    DedicateDataFieldEnum.br_room_type,
    DedicateDataFieldEnum.br_bm_prefer_supplier_country,
    ProductInterestFieldId.br_bm_product_interest,
    ProductInterestFieldId.br_bm_product_interest_ip,
    ProductInterestFieldId.br_bm_product_interest_licensing,
]
