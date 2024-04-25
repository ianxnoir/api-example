import { ApiProperty } from "@nestjs/swagger"

export class VepSensitiveKeywordResponseDto {
    @ApiProperty({
        description: "Is a vep-sensitive keyword, i.e. true = not allowed to search",
        example: true,
        type: 'boolean'
    })
    senskwsensitivekeywords: boolean
}