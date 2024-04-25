import { ApiProperty } from "@nestjs/swagger"

export class MultiLangNameDto {
    @ApiProperty({
        description: "name en",
        example: "Hong Kong International Jewellery Show",
    })
    en: string

    @ApiProperty({
        description: "name tc",
        example: "香港國際珠寶展",
    })
    tc: string

    @ApiProperty({
        description: "name sc",
        example: "香港国际珠宝展",
    })
    sc: string

    constructor() {
        this.en = ""
        this.tc = ""
        this.sc = ""
    }
}

export class FairNameDto {
    @ApiProperty({
        description: "fairCode",
        example: "hkjewellery",
    })
    fairCode: string

    @ApiProperty({
        description: "display name from fair setting",
        example: {
            "en": "Hong Kong International Jewellery Show",
            "tc": "香港國際珠寶展",
            "sc": "香港国际珠宝展"
        },
        type: MultiLangNameDto
    })
    fairDisplayName: MultiLangNameDto

    constructor(fairCode?: string, fairDisplayName?: MultiLangNameDto) {
        this.fairCode = fairCode ?? ""
        this.fairDisplayName = fairDisplayName ?? new MultiLangNameDto()
    }
}

export class GetCombinedFairListRespDto {
    @ApiProperty({
        description: "combination name",
        example: "jewellery-diamond",
    })
    combinationName: string

    @ApiProperty({
        description: "fair list with display name",
        type: [FairNameDto]
    })
    fairList: FairNameDto[]
}