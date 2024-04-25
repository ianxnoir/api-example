import { ApiProperty } from "@nestjs/swagger"

export class SubmitShortRegRespDto {
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
        description: "fail to register reason",
        example: "LOGGED_IN_LOWER_PARTICIPANT_TYPE",
        required: false
    })
    error?: string
}