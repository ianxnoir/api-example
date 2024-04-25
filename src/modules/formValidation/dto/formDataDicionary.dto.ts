export class FormDataDictionaryDto {
    [key: string]: FieldData;
}

export class FieldData {
    key: string
    data: unknown
}