import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsNotEmpty, IsOptional, IsString, Min } from "class-validator"
import { LANG, SUBMIT_TYPE } from "../../registration/dto/SubmitForm.enum"

export class SubmitCustomFormReqDto {
    @ApiProperty({
        description: "fair code",
        example: "hkjewellery",
        type: "string",
        required: true
    })
    @IsString()
    fairCode: string

    @ApiProperty({
        description: "lang",
        example: "en",
        required: true
    })
    @IsEnum(LANG)
    lang: "en" | "tc" | "sc"

    @ApiProperty({
        description: "form submit type",
        example: SUBMIT_TYPE.VALIDATE_STEP,
        type: "string",
        required: true
    })
    @IsEnum(SUBMIT_TYPE)
    submitType: SUBMIT_TYPE

    @ApiProperty({
        description: "stringify form json",
        example: "{}",
        required: true
    })
    formDataJson: string

    @ApiProperty({
        description: "captcha, format {providerId},{ticket},{randstr}",
        example: "recaptcha,{ticket}",
        required: true
    })
    @IsOptional()
    captcha: string

    @ApiProperty({
        description: "no. of form step, start with 1",
        example: 1,
        required: true
    })
    @Min(1)
    step: number

    @ApiProperty({
        description: "slug from reg link",
        example: "/hkjewellery/cache/forms/17026",
        required: true
    })
    @IsNotEmpty()
    slug: string

    @ApiProperty({
        description: "formSubmissionKey",
        example: "form_submission_fc81baf4-b378-4a4a-b77c-8e6649275a7b",
        required: true
    })
    @IsNotEmpty()
    formSubmissionKey: string
}