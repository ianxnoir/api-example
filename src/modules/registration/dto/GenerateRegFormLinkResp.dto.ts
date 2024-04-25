import { ApiProperty } from "@nestjs/swagger"
import { IsEnum } from "class-validator"
import { RegFormLinkValidationErrMsg } from "../../formValidation/enum/regFormLinkUtil.enum"

export class GenerateRegFormLinkRespDto {
    @ApiProperty({
        description: "reg form link generate status",
        example: false,
        required: true
    })
    isSubmitSuccess: boolean = false
    regFormLinkValidationError: RegFormLinkValidationErrorDto[] = []
    regFormLinkTask: RegFormLinkTask = new RegFormLinkTask
}

export class RegFormLinkTask {
    id: string
    regFormLinkTaskEntries: RegFormLinkTaskEntry[]

    constructor() {
        this.regFormLinkTaskEntries = []
    }
}

export class RegFormLinkTaskEntry {
    id: string
    reLinkId: string
}

export class RegFormLinkValidationErrorDto {
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
    @IsEnum(RegFormLinkValidationErrMsg)
    regFormLinkValidationErrorMessage: string
}