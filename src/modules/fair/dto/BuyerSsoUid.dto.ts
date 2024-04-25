import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";

export class SsoUidByFairCodeQueryDto {
    @IsOptional()
    @IsNumber()
    @Type(() => Number)
    pageNum: number = 0

    @IsOptional()
    @IsNumber()
    @ApiProperty({
        description: "Size of Buyer SsoUid",
        example: "10",
    })
    @Type(() => Number)
    size: number = 10
    
    @IsNotEmpty()
    @ApiProperty({
        description: "fairCode",
        example: "hkjewellery",
    })
    fairCode: string;
}

export class SsoUidByFairCodeResponseDto {
    @ApiProperty({
        example: '1628489710134'
    })
    timestamp: string

    @ApiProperty({
        example: '200'
    })
    status: string

    @ApiPropertyOptional({
        description: "SsoUid List returned by Fair Code",
        example: [""]
    })
    ssoUidList: string[] | []

}