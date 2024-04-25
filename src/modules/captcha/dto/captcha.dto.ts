import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, ValidateNested } from 'class-validator';
import { Type } from "class-transformer"
import { CaptchaVerifyRequestDto } from './captchaVerifyRequest.dto';

export class CaptchaDto {
    @ApiProperty({
        description: "The captcha provider (e.g. tencent/ recaptcha)",
        example: "recaptcha"
    })
    @IsEnum(["recaptcha", "tencent"])
    providerId!: string;

    @ValidateNested()
    @Type(() => CaptchaVerifyRequestDto)
    @ApiProperty({
        description: "The incoming request to verify the captcha",
        type:CaptchaVerifyRequestDto,
        example: {
            "ip":  "122.152.158.136",
            "ticket": "",
            "randstr": ""
          },
    })
    verifyRequest: CaptchaVerifyRequestDto
}

export class CaptchaSuccessfulResponseDto {
    @ApiProperty({
        example: 'true'
    })
    success: string
}
