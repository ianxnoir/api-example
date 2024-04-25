import { ApiProperty } from "@nestjs/swagger"
import { Transform } from "class-transformer"
import { IsArray, IsOptional, IsString, Matches } from "class-validator"

export class UpdateProfileBackendReqDto {

    formDataJson: string

    @Matches(RegExp(/^en|tc|sc$/mi), {
        message:
            'PreferredLanguage is not in correct format.',
    })
    @Transform(({ value }) => value.toLowerCase())
    @ApiProperty({
        description: "string of preferredLanguage, possible value including en, tc, sc, allow empty string",
        example: "tc",
        required: false
    })
    @IsOptional()
    preferredLanguage?: "en" | "tc" | "sc"

    @IsArray()
    @Matches(RegExp(/^EMAIL|APP_PUSH|WECHAT|SMS|WHATSAPP$/mi), {
        message:
            'PreferredChannels is not in correct format.',
        each: true
    })
    @IsOptional()
    @IsString({ each: true })
    preferredChannels?: ("EMAIL" | "APP_PUSH" | "WECHAT" | "SMS" | "WHATSAPP")[]

    overseasBranchOfficer?: string
}