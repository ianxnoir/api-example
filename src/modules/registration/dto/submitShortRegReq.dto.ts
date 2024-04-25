import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class SubmitShortRegReqDto {
    @ApiProperty({
        description: "fair code",
        example: "hkjewellery",
        type: "string",
        required: true
    })
    @IsNotEmpty()
    @IsString()
    fairCode: string

    @ApiProperty({
        description: "ssouid",
        example: "05c4920867764ed3880b921cf812a65d",
        type: "string",
        required: true
    })
    @IsNotEmpty()
    @IsString()
    ssoUid: string

    @ApiProperty({
        description: "eu consent",
        example: "true",
        type: "boolean",
        required: true
    })
    @IsNotEmpty()
    @IsBoolean()
    euConsentStatus: boolean

    @ApiProperty({
        description: "badge consent",
        example: "true",
        type: "boolean",
        required: true
    })
    @IsNotEmpty()
    @IsBoolean()
    badgeConsent: boolean

    @ApiProperty({
        description: "c2m consent",
        example: "true",
        type: "boolean",
        required: true
    })
    @IsNotEmpty()
    @IsBoolean()
    c2mConsent: boolean

    @ApiProperty({
        description: "registration detail consent",
        example: "true",
        type: "boolean",
        required: true
    })
    @IsNotEmpty()
    @IsBoolean()
    registrationDetailConsent: boolean
}