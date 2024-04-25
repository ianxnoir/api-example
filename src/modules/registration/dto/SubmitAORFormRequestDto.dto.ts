import { ApiProperty } from "@nestjs/swagger"
import { IsEnum, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';
import { LANG, SUBMIT_FORM_COUNTRY, SUBMIT_TYPE } from './SubmitForm.enum';

export class SubmitAORFormRequestDto {
    @ApiProperty({
        description: "fair code",
        example: "hkjewellery",
        type: "string",
        required: true
    })
    @IsString()
    fairCode: string

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
        description: "visitorType from reg link",
        example: "00",
        required: true
    })
    @IsNotEmpty()
    visitorType: string

    @ApiProperty({
        description: "slug from reg link",
        example: "/hkjewellery/cache/forms/17026",
        required: true
    })
    @IsNotEmpty()
    slug: string

    @ApiProperty({
        description: "country from reg link, optional field, support 'non_china' or 'china'",
        example: "non_china",
        required: false
    })
    @IsOptional()
    @IsEnum(SUBMIT_FORM_COUNTRY)
    country: string

    @ApiProperty({
        description: "regional office code from reg link, optional, for ref only",
        example: "HK",
        required: false
    })
    @Length(0, 30)
    @IsOptional()
    refOffice: string

    @ApiProperty({
        description: "ref code from reg link, optional",
        example: "HK",
        required: false
    })
    @Length(0, 300)
    @IsOptional()
    refCode: string

    @ApiProperty({
        description: "regLinkId from reg link",
        example: "e4867efdc4fb8a04a1f3fff1fa07e998",
        required: true
    })
    @IsNotEmpty()
    regLinkId: string
}