import { ApiProperty } from "@nestjs/swagger"
import { EditFormValidationErrorDto } from '../../formValidation/dto/editFormValidation.dto';
import { SubmitFormUserActivityDto } from "./submitFormUserActivity.dto";

export class SubmitCombinedFairFormResponseDto {

    @ApiProperty({
        description: "form submit status",
        example: false,
        required: true
    })
    isSubmitSuccess: boolean

    @ApiProperty({
        description: "field error list",
        example: [{
            "formId": "123456",
            "fieldId": "br_address_5_8.br_address_country",
            "formValidationErrorCode": "0001"
        }],
        type: [EditFormValidationErrorDto],
        required: true
    })
    formValidationError: EditFormValidationErrorDto[]

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

    @ApiProperty({
        description: "registrationNo",
        example: "222209220801007",
        required: false
    })
    registrationNo?: string

    "user-activity": SubmitFormUserActivityDto
}
