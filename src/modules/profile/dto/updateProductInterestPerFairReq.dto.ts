import { IsArray, IsEnum, IsOptional, IsString } from "class-validator"

export class UpdateProductInterestPerFairReqDto {
    @IsString()
    fairCode: string

    @IsEnum(['en', 'tc', 'sc'])
    lang: 'en' | 'tc' | 'sc'

    @IsArray()
    productInterest: string[]

    productInterestOther: string

    @IsArray()
    @IsOptional()
    productInterestIP?: string[]

    @IsOptional()
    productInterestIPOther?: string

    @IsArray()
    @IsOptional()
    productInterestLicensing?: string[]

    @IsOptional()
    productInterestLicensingOther?: string
}