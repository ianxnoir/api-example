import { ApiProperty } from "@nestjs/swagger"

export class VepDoNotSearchResponseDto {
    @ApiProperty({
        description: "Is a vep-donotsearch keyword, i.e. true = not allowed to search",
        example: true,
        type: 'boolean'
    })
    senskwdonotsearch: boolean
}