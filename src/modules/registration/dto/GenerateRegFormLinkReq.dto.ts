import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"
import { LANG } from "./SubmitForm.enum"

export class GenerateRegFormLinkReqDto {
    @IsString()
    @ApiProperty({
        description: "Single Value",
        example: "hkjewellery",
        required: true
    })
    fairCode: string

    @IsString()
    @ApiProperty({
        description: "extracted slug value, Single Value",
        example: "organic-buyer-registration-form",
        required: true
    })
    slug: string

    @IsString()
    @ApiProperty({
        description: "Single Value",
        example: "en",
        required: false
    })
    lang: string = LANG.en

    @IsString()
    @ApiProperty({
        description: "Multiple Value",
        example: "00;01",
        required: true
    })
    visitorType: string

    @IsOptional()
    @ApiProperty({
        description: "Single Value",
        example: "non_china",
        required: false
    })
    country?: string

    @IsOptional()
    @ApiProperty({
        description: "Multiple Value",
        example: "ay;bj",
        required: false
    })
    refOverseasOffice?: string

    @IsOptional()
    @ApiProperty({
        description: "Multiple Value",
        example: "abc;bce;dfg123",
        required: false
    })
    refCode?: string

    @IsString()
    @ApiProperty({
        description: "vms project year, Single Value",
        example: "2122",
        required: true
    })
    projectYear: string

    @IsString()
    @ApiProperty({
        description: "extracted form value, Single Value",
        example: "Organic",
        required: true
    })
    formType: string

    @IsString()
    @ApiProperty({
        description: "extracted form value, Single Value",
        example: "Organic Buyer Registration Form",
        required: true
    })
    formName: string
}