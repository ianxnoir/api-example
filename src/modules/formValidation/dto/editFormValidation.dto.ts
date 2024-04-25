import { ApiProperty } from "@nestjs/swagger"

export class EditFormValidationErrorDto {
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