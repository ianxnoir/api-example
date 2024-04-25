export class TitleDataDto {
    rendered: string
}

export class FormTemplateFieldLengthDto {
    min: number
    max: string
}

export class OptionFieldDto {
    [key: string]: string
}

export class ComplexDefinitionDto {
    field_id: string;
    operator: string;
    value: string;
}

export class FormTemplateFieldItemDto {
    id: string
    name?: string
    field_type: string
    visible?: boolean
    field_items?: FormTemplateFieldItemDto[]
    type: string
    label?: string
    placeholder?: string
    remarks?: string
    required?: boolean
    defaultValue?: string
    regular_expression?: string;
    length?: FormTemplateFieldLengthDto
    show_in_profile?: boolean
    edit_in_profile?: boolean
    show_to_exhibitor?: boolean
    rows?: number
    column?: number
    minimum_value?: string
    maximum_value?: string
    minDate?: string
    maxDate?: string
    acceptance_text?: string

    id_other?: string
    name_other?: string
    
    options?: any
    // possible hierarchy 
    // 1. 
    /*
{ 
    "a" : "Apple", 
    "b" : "Banana", 
    "c" : "Orange", 
    "d" : "Pear", 
} 

[{ 
    "items": [ 
        "1":"Mr", 
        "2":"Mrs", 
        "3":"Miss", 
        "4":"Doctor" 
    ] 
}] 

[{
    "items":[ 
        "Latte", 
        "Cappuccino", 
        "Mocha", 
        "Americano", 
        "Expresso", 
        "Macchiato"
    ] 
}] 
    */

    multiple_selection?: boolean
    valid_when?: ComplexDefinitionDto[]
    valid_when_all?: ComplexDefinitionDto[]
    visible_when?: ComplexDefinitionDto[]
    visible_when_all?: ComplexDefinitionDto[]
    required_when?: ComplexDefinitionDto[]
    required_when_all?: ComplexDefinitionDto[]
    image_file_only?: boolean
    multiple_files?: boolean
    image_file_size?: number
    document_file_size?: number
    currency_label?: string;
}

export class FormTemplateStepDto {
    form_id: string
    form_title: string
    field_items: FormTemplateFieldItemDto[]
    captcha: boolean
}

export class FormTemplateDataDto {
    form_type: string
    form_obj: FormTemplateStepDto[]
}

export class FormTemplateDto {
    title: TitleDataDto
    form_data: FormTemplateDataDto

    constructor() {
        this.title = { rendered: "" }
        this.form_data = { form_type: "", form_obj: [] }
    }
}

export class MuiltiLangFormTemplate {
    formEn: FormTemplateDto
    formSc: FormTemplateDto | null
    formTc: FormTemplateDto | null
}

export class MultiLangFormTemplateObj {
    constructor(formFieldId:string,formFieldValue:string) {
        this.formFieldId = formFieldId
        this.formFieldValue = formFieldValue
        this.labelEn = ''
        this.labelTc = ''
        this.labelSc = ''
        this.valueEn = ''
        this.valueTc = ''
        this.valueSc = ''
    }
    formFieldId: string
    fieldType: string
    labelEn: string
    labelTc: string
    labelSc: string
    formFieldValue: string
    valueEn: string
    valueSc: string
    valueTc: string
}

export class MultiLangProductInterest{
    productInterest: MultiLangFormTemplateObj
    productInterestOther: MultiLangFormTemplateObj
}

export class MultiLangAggProductInterest{
    formFieldId: string
    fieldType: string
    labelEn: string
    labelTc: string
    labelSc: string
    productInterestList: GroupedProductInterestFieldOption[]
    productInterestOther: MultiLangFormTemplateObj
}

export class ProductInterestFieldOption {
    ia_id: string
    ia_en: string
    ia_tc: string
    ia_sc: string
    st_id: string
    st_en: string
    st_tc: string
    st_sc: string
    te_code: string
    nature: number
}
export class GroupedProductInterestFieldOption {
    ia_id: string
    ia_en: string
    ia_tc: string
    ia_sc: string
    st: [StructureTagFieldOption]
    nature: number
}

export class StructureTagFieldOption {
    st_id: string
    st_en: string
    st_tc: string
    st_sc: string
    te_code: string
}
export class SingleLangFormTemplateObj{
    constructor(formFieldId:string, formFieldValue:string, fieldType: string) {
        this.formFieldId = formFieldId
        this.formFieldValue = formFieldValue
        this.fieldType = fieldType
    }
    formFieldId: string
    formFieldValue: string
    fieldType: string;
    label: string
    value: string
}

export class AdditionalValue {
    countryCodeFieldData?: string
    stateProvinceCodeFieldData?: string
}

export type FormLanguage = 'en' | 'tc' | 'sc'
