
export enum BusinessRuleFormValidationCode {
    VALIDATION_PASSED = "",

    DATA_LENGTH_INVALID = "B100000",
    DATA_NOT_MATCH_REGEXP = "B100001",

    FIELD_REQUIRED = "B200000",
    FIELD_REQUIRED_BY_FORMTYPE = "B200001",
    COUNCILWIDE_DATA_VALIDATION_FAILED = "B200002",
    SSO_DATA_VALIDATION_FAILED = "B200003",
    RELATED_FIELD_MISSING = "B200004",
    INVALID_DATA_FORMAT = "B200005",

    DEFINITION_NOT_IMPLEMENTED = "B900001",
}

export const ThrowExceptionBusinessRuleFormValidationCode = [
    BusinessRuleFormValidationCode.FIELD_REQUIRED,
    BusinessRuleFormValidationCode.FIELD_REQUIRED_BY_FORMTYPE,
    BusinessRuleFormValidationCode.COUNCILWIDE_DATA_VALIDATION_FAILED,
    BusinessRuleFormValidationCode.SSO_DATA_VALIDATION_FAILED,
    BusinessRuleFormValidationCode.RELATED_FIELD_MISSING,
    BusinessRuleFormValidationCode.INVALID_DATA_FORMAT,

    BusinessRuleFormValidationCode.DEFINITION_NOT_IMPLEMENTED,
]