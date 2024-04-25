export class BuyerDetailEntryDto {
    fieldId: string
    label: string
    fieldType: string
    values: BuyerDetailEntryMappedValueDto[]
}

export class ShowInProfileDto extends BuyerDetailEntryDto{
    onlyVisibleToYou: boolean
}

export class  BuyerDetailEntryMappedValueDto {
    fieldValue: string
    mappedValue: string

    constructor(fieldValue: string | boolean, mappedValue: string) {
        this.fieldValue = fieldValue?.toString() ?? ""
        this.mappedValue = mappedValue
    }
}
