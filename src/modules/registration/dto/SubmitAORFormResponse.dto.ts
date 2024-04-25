import { ApiProperty } from "@nestjs/swagger"
import { IsEnum } from "class-validator"
import { FormStepValidStatusDto, FormValidationErrorDto } from "../../formValidation/dto/formValidation.dto"
import { SUBMIT_TYPE, VALIDATION_STATUS } from "./SubmitForm.enum"
import { MultiLangNameDto } from '../../profile/dto/getCombineFairListResp.dto';
import { SubmitFormUserActivityDto } from "./submitFormUserActivity.dto";

export class SubmitAORFormResponseDto {
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
        description: "registrationResultArray",
        example: "222209220801007",
        required: false
    })
    registrationResultArray?: SubmitAORFormResponseResultArrayDto[]

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

export class SubmitAORFormResponseResultArrayDto{
    @ApiProperty({
        description: "register fair code",
        example: "hkdgp",
        required: true
    })
    fairCode: string

    @ApiProperty({
        description: "register fair code long name",
        example: "Hong Kong Jewellery",
        required: true
    })
    fairDisplayName: MultiLangNameDto

    @ApiProperty({
        description: "Is registration success",
        example: "true",
        required: true
    })
    isReg: boolean

    @ApiProperty({
        description: "Register registration no",
        example: "000005221700007",
        required: true
    })
    registrationNo: string

    @ApiProperty({
        description: "fail to register reason",
        example: "LOGGED_IN_LOWER_PARTICIPANT_TYPE",
        required: false
    })
    error?: string
}