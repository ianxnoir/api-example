import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { IsArray, IsOptional, ValidateNested } from "class-validator"

export class UpdateC2MProfileReqDto {
    @ApiPropertyOptional({
        description: "array of object for product interest",
        example: [
            {
                stId: "14aeda3c67ad11ec90d60242ac120003",
                iaId: "98b56c08df0711ea906c0a10104e3bf6",
                teCode: "P4601A4XA01"
            }
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @IsOptional()
    productInterest?: C2MProductInterestUpdateDto[]

    @ApiPropertyOptional({
        description: "productStrategy",
        example: ["OEM"],
    })
    @IsArray()
    @IsOptional()
    productStrategy?: string[]

    @ApiPropertyOptional({
        description: "targetPreferredMarkets in councilwise code",
        example: ["THA"],
    })
    @IsArray()
    @IsOptional()
    targetPreferredMarkets?: string[]

}

export class C2MProductInterestUpdateDto {
    @ApiProperty({
        description: "stId",
        example: "14aeda3c67ad11ec90d60242ac120003",
    })
    stId: string

    @ApiProperty({
        description: "iaId",
        example: "98b56c08df0711ea906c0a10104e3bf6",
    })
    iaId: string

    @ApiProperty({
        description: "teCode",
        example: "P4601A4XA01",
    })
    teCode: string
}