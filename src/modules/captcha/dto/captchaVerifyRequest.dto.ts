import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsString, Matches } from "class-validator"

export class CaptchaVerifyRequestDto {
    @ApiProperty({
        description: "The client IP address",
        example: "122.152.158.136",
    })
    @Matches(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)
    ip: string

    @ApiProperty({
        description: "The captcha ticket provided by captcha provider after its vaildation",
        example: "",
    })
    @IsString()
    ticket: string

    @ApiPropertyOptional({
        description: "The captcha random string is required by tencent only after its validation",
        example: "",
    })
    @IsString()
    randstr: string
}
