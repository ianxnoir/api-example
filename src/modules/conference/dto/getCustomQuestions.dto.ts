import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, ValidateIf } from 'class-validator';
import { BaseResDtoInt } from '../conference.type';

export interface GetCustomQuestionsReqInt {
    lang: string;
    fairCode: string;
    projectYear?: string;
    fiscalYear?: string;
}

export class GetCustomQuestionsReqDto implements GetCustomQuestionsReqInt {
    @ApiProperty({
        type: String,
        description: 'frontend locale code',
        example: 'en'
    })
    @IsNotEmpty()
    @IsString()
    public lang: string;

    @ApiProperty({
        type: String,
        description: 'fair code',
        example: 'bnr'
    })
    @IsNotEmpty()
    @IsString()
    public fairCode: string;

    @ApiProperty({
        type: String,
        description: 'fiscal year of the fair',
        example: '2223'
    })
    @ValidateIf((dto:GetCustomQuestionsReqDto) => !dto.hasOwnProperty("projectYear") || dto.hasOwnProperty("fiscalYear"))
    @IsNotEmpty()
    @IsString()
    public fiscalYear: string;

    @ApiProperty({
        type: String,
        description: 'project year of the fair',
        example: '2022'
    })
    @ValidateIf((dto:GetCustomQuestionsReqDto) => !dto.hasOwnProperty("fiscalYear") || dto.hasOwnProperty("projectYear"))
    @IsNotEmpty()
    @IsString()
    public projectYear: string;
}

export class CustomQuestion {
    @ApiProperty({
        type: Number,
        description: 'filter number',
        example: 1
    })
    filterNum: number|null;
    
    @ApiProperty({
        type: String,
        description: 'filter label (question) in requested locale',
        example: 'Sport'
    })
    filterLabel: string|null;
    
    @ApiProperty({
        type: String,
        description: 'filter label (question) in English',
        example: 'Sport'
    })
    filterLabelEn: string|null;

    @ApiProperty({
        type: Number,
        description: 'question number',
        example: 1
    })
    questionNum: number|null;

    @ApiProperty({
        type: String,
        description: 'answer code',
        example: 'F102'
    })
    categoryCode: string;

    @ApiPropertyOptional({
        type: String,
        description: 'the parent of the answer code',
        example: null
    })
    parentCategoryCode: string|null;

    @ApiProperty({
        type: String,
        description: 'answer label in requested locale',
        example: 'Running'
    })
    value: string|null;

    @ApiProperty({
        type: String,
        description: 'answer label in english',
        example: 'Running'
    })
    valueEn: string|null;

    @ApiProperty({
        type: Number,
        description: 'sequence number of the answer',
        example: 1
    })
    sequence: number|null;
}

export interface GetCustomQuestionsResInt extends BaseResDtoInt<{
    questions: CustomQuestion[]
}> {}

export class GetCustomQuestionsResData {
    @ApiProperty({
        type: [CustomQuestion],
        description: 'custom questions returned',
        example: [
            {
                questionNum: 1,
                categoryCode: "F102",
                parentCategoryCode: null,
                value: "Running",
                valueEn: "Running",
                filterNum: 1,
                filterLabel: "Sport",
                filterLabelEn: "Sport",
                sequence: 1
            }
        ]
    })
    questions: CustomQuestion[]
}

export class GetCustomQuestionsResDto implements GetCustomQuestionsResInt {
    @ApiProperty({
        type: String,
        description: 'the SQL query for getting custom questions for debugging',
        example: "SELECT `fairCustomQuestion`.`questionNum` AS questionNum, `fairCustomQuestion`.`categoryCode` AS categoryCode, `fairCustomQuestion`.`parentCategoryCode` AS parentCategoryCode, `fairCustomQuestion`.`valueEn` AS value, `fairCustomQuestion`.`valueEn` AS valueEn, `fairCustomQuestionFilter`.`filterNum` AS filterNum, `fairCustomQuestionFilter`.`filterNameEn` AS filterLabel, `fairCustomQuestionFilter`.`filterNameEn` AS filterLabelEn, `fairCustomQuestion`.`sequence` As sequence FROM `fairCustomQuestionFilter` `fairCustomQuestionFilter` LEFT JOIN `fairCustomQuestion` `fairCustomQuestion` ON `fairCustomQuestion`.`questionNum` = `fairCustomQuestionFilter`.`questionNum` AND `fairCustomQuestion`.`fairCode` = ? AND `fairCustomQuestion`.`fiscalYear` = ?  LEFT JOIN `fairCustomQuestion` `parent` ON `fairCustomQuestion`.`parentCategoryCode` = `parent`.`categoryCode` AND `parent`.`fairCode` = ? AND `parent`.`fiscalYear` = ? WHERE `fairCustomQuestionFilter`.`fairCode` = ? AND `fairCustomQuestionFilter`.`fiscalYear` = ? ORDER BY `fairCustomQuestionFilter`.`filterNum` ASC, IFNULL(`parent`.`questionNum`, `fairCustomQuestion`.`questionNum`) ASC, IFNULL(`parent`.`sequence`, `fairCustomQuestion`.`sequence`) ASC, IF(`fairCustomQuestion`.`parentCategoryCode` IS NULL, 0, 1) ASC"
    })
    sql: string

    @ApiProperty({
        type: String,
        description: 'related SQL parameters in JSON string',
        example: "{\"fairCode\":\"mp\",\"fiscalYear\":\"2223\"}"
    })
    params: string

    @ApiProperty({
        type: GetCustomQuestionsResData,
        description: 'the custom questions available',
        example: {
            questions: [
                {
                    questionNum: 1,
                    categoryCode: "F102",
                    parentCategoryCode: null,
                    value: "Running",
                    valueEn: "Running",
                    filterNum: 1,
                    filterLabel: "Sport",
                    filterLabelEn: "Sport",
                    sequence: 1
                }
            ]
        }
    })
    data: GetCustomQuestionsResData;
}

export class Country {
    @ApiProperty({
        type: String,
        description: 'country code',
        example: 'AFG'
    })
    code: string|null;

    @ApiProperty({
        type: String,
        description: 'country name',
        example: "Afghanistan"
    })
    value: string|null;
}

export interface GetCountryListResInt {
    data: { countries: Country[] };
}

export class GetCountryListResData {
    @ApiProperty({
        type: [Country],
        description: 'countries returned',
        example: [
            {
                code: "AFG",
                value: "Afghanistan"
            }
        ]
    })
    countries: Country[];
}

export class GetCountryListResDto implements GetCountryListResInt {
    @ApiProperty({
        type: GetCountryListResData,
        description: 'the country list available',
        example: {
            countries: [
                {
                    code: "AFG",
                    value: "Afghanistan"
                }
            ]
        }
    })
    data: GetCountryListResData
}