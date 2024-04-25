import { ApiProperty } from "@nestjs/swagger";

export class PostCustomQuestionImportReqDto {
    @ApiProperty({
        description: "Original File Name",
        example: "insert_template.xlsx"
    })
    originalFileName: string;

    @ApiProperty({
        description: "Fair Code",
        example: "bnr"
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
   
}