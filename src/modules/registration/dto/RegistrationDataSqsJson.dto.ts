export class RegistrationDataSqsJsonDto {
    [key: string]: unknown;
}

export class RegistrationDataNonIntegratedField {
    fieldId: string
    labelEn: string
    labelTc: string
    labelSc: string
    value: string
    valueEn: string
    valueTc: string
    valueSc: string
    valueDesc: string
}

export class RegistrationDataAntiMappingDto {
    [key: string]: string;
}