import { ApiProperty } from "@nestjs/swagger"

export class FormStepValidStatusDto {
    @ApiProperty({
        description: "formStepId",
        example: "form_step_1",
        required: true
    })
    formStepId: string

    @ApiProperty({
        description: "isStepValid",
        example: false,
        required: true
    })
    isStepValid: boolean
}

export class FormValidationErrorDto {
    @ApiProperty({
        description: "formStepId",
        example: "form_step_1",
        required: true
    })
    formStepId: string

    @ApiProperty({
        description: "fieldId",
        example: "br_address_5_8.br_address_country",
        required: true
    })
    fieldId: string

    @ApiProperty({
        description: "formValidationErrorCode",
        example: "required",
        required: true
    })
    formValidationErrorType: string
    
    @ApiProperty({
        description: "formValidationErrorCode",
        example: "0001",
        required: true
    })
    formValidationErrorCode: string
}

export class FormValidationDto {
    formStepValidStatus: FormStepValidStatusDto[]
    formValidationError: FormValidationErrorDto[]

    constructor() {
        this.formStepValidStatus = []
        this.formValidationError = []
    }
}