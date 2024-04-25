import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LANG } from "./SubmitForm.enum"

export class SubmitCombinedFairFormRequestDto {
    @ApiProperty({
        description: "from fair code",
        example: "hkjewellery",
        type: "string",
        required: true
    })
    @IsString()
    fairCode: string

    @ApiProperty({
        description: "to fair code",
        example: "hkgdp",
        type: "string",
        required: true
    })
    @IsString()
    toRegisterFairCode: string


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
        description: "form submission key, to be validated except first step validation",
        example: "form_submission_uuidv4",
        required: false
    })

    @IsOptional()
    formSubmissionKey?: string

    @ApiProperty({
        description: "lang",
        example: "en",
        required: true
    })
    @IsEnum(LANG)
    lang: LANG


    @ApiProperty({
        description: "slug from reg link",
        example: "/hkjewellery/cache/forms/17026",
        required: true
    })
    @IsNotEmpty()
    slug: string

}