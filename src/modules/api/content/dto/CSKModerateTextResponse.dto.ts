import { ApiProperty } from "@nestjs/swagger"

export class CSKModerateTextResponseDto {
    @ApiProperty({
        description: "Is Keyword Scan Failed, i.e. true = not allowed to search",
        example: true,
        type: 'boolean'
    })
    failedKeywordScan: boolean
}