import { ApiProperty } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator"
export class GetCustomQuestionsImportReqDto {
    @IsNumber()
    @Type(() => Number)
    pageNum: number = 1

    @IsNumber()
    @Type(() => Number)
    size: number = 10
}

export class GetCustomQuestionsFilterLabelReqDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: "Fair Code",
        example: "hkjewellery"
    })
    fairCode: string

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: "Year",
        example: "2021"
    })
    year: string
}

export class GetCustomQuestionsReqDto {
    @IsNumber()
    @Type(() => Number)
    pageNum: number = 1

    @IsNumber()
    @Type(() => Number)
    size: number = 10

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: "Fair Code",
        example: "hkjewellery"
    })
    fairCode: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: "Project Year",
        example: "2021"
    })
    projectYear: string;

    @IsOptional()
    @ApiProperty({
        description: "Sorting Field",
        example: "questionNum-"
    })
    sortBy: string;

    @IsOptional()
    @ApiProperty({
        description: "Order Direction, default ASC",
        example: "DESC"
    })
    order: string;
}

export class UpdateCustomQuestionsReqDto {
    @IsNotEmpty()
    @ApiProperty()
    filterNum: number;

    @IsNotEmpty()
    @ApiProperty()
    filterNameEn: string;

    @IsNotEmpty()
    @ApiProperty()
    filterNameTc: string;

    @IsNotEmpty()
    @ApiProperty()
    filterNameSc: string;

    @IsNotEmpty()
    @ApiProperty()
    questionNum: number;
}

export class UpdateCustomQuestionsFilterLabelReqDto {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: "Fair Code",
        example: "hkjewellery"
    })
    fairCode: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: "Project Year",
        example: "2021"
    })
    projectYear: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        description: "Fiscal Year",
        example: "2022"
    })
    fiscalYear: string;

    @IsNotEmpty()
    @ApiProperty({
        description: "Filters data",
        type: () => UpdateCustomQuestionsReqDto,
    })
    filtersData: UpdateCustomQuestionsReqDto[];
}

export interface CustomQuestionsFilterLabelInnerStructureInterface {
    fairCode: string;
    projectYear: string;
    fiscalYear: string;
    filterNum: number;
    filterNameEn: string;
    filterNameTc: string;
    filterNameSc: string;
    questionNum: number;
    createdBy: string;
}