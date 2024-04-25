import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional } from "class-validator";
import { constant } from "../../../config/constant";
export class BuyerImportCreateTaskRequestDto {

    @ApiProperty({
        description: "Original File Name",
        example: "insert_vep_template.xlsx"
    })
    originalFileName: string;

    @ApiProperty({
        description: "Fair Code",
        example: "hkjewellery"
    })
    fairCode: string;

    @ApiProperty({
        description: "Fiscal Year (2122 means 2021-2022)",
        example: "2122"
    })
    fiscalYear: string;

    @ApiProperty({
        description: "Project Year",
        example: "2021"
    })
    projectYear: string;

    @ApiProperty({
        description: "Action Type",
        example: "VEP_UPDATE_BUYER",
        enum: constant.actionType
    })
    actionType: string;

    @ApiProperty({
        description: "Source Type",
        example: "08"
    })
    sourceType: string;

    @ApiProperty({
        description: "Visitor Type",
        example: "01"
    })
    visitorType: string;

    @IsOptional()
    @ApiPropertyOptional({
        description: "Serial Number Start",
        example: "100"
    })
    serialNumberStart: number;
}