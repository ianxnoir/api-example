import { ApiProperty } from "@nestjs/swagger"
import { IsEnum } from "class-validator"
import { FormStepValidStatusDto, FormValidationErrorDto } from "../../formValidation/dto/formValidation.dto"
import { SUBMIT_TYPE, VALIDATION_STATUS } from "./SubmitForm.enum"
import { SubmitFormUserActivityDto } from "./submitFormUserActivity.dto"

export class SubmitFormResponseDto {
    @ApiProperty({
        description: "validation status per step",
        example: [
            {
                "formStepId": "form_step_1",
                "isStepValid": false
            }
        ],
        type: [FormStepValidStatusDto],
        required: true
    })
    formStepValidStatus: FormStepValidStatusDto[]

    @ApiProperty({
        description: "form submit type",
        example: SUBMIT_TYPE.VALIDATE_STEP,
        type: "string",
        required: true
    })
    @IsEnum(SUBMIT_TYPE)
    submitType: SUBMIT_TYPE

    @ApiProperty({
        description: "validation status",
        example: VALIDATION_STATUS.STEP_PASSED,
        type: "string",
        required: true
    })
    @IsEnum(VALIDATION_STATUS)
    validationStatus: VALIDATION_STATUS 

    @ApiProperty({
        description: "form submit status",
        example: false,
        required: true
    })
    isSubmitSuccess: boolean

    @ApiProperty({
        description: "registrationNo",
        example: "222209220801007",
        required: false
    })
    registrationNo?: string

    @ApiProperty({
        description: "field error list",
        example: [{
            "formId": "123456",
            "formStepId": "form_step_1",
            "fieldId": "br_address_5_8.br_address_country",
            "formValidationErrorCode": "0001"
        }],
        type: [FormValidationErrorDto],
        required: true
    })
    formValidationError: FormValidationErrorDto[]

    @ApiProperty({
        description: "form submission key",
        example: "form_submission_uuidv4",
        required: true
    })
    formSubmissionKey: string

    @ApiProperty({
        description: "slug of the form",
        example: "/event/hkjewellery/en/form/organic-buyer-registration-form/",
        required: true
    })
    slug: string

    "user-activity": SubmitFormUserActivityDto
}