import { IsOptional, IsString } from "class-validator"

export class VerifyRegFormLinkReqDto {
    @IsString()
    fairCode: string

    @IsString()
    slug: string

    @IsString()
    lang: string

    @IsString()
    visitorType: string

    @IsOptional()
    country?: string

    @IsOptional()
    refOffice?: string

    @IsOptional()
    refCode?: string

    @IsString()
    regLinkId: string
}