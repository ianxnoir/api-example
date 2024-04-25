import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, ValidateIf } from 'class-validator';
import { BaseResDtoInt } from '../conference.type';

type KeywordType = 'all'|'displayName'|'position'|'companyName';

export interface SearchConfParticipantsReqInt {
    fairCode: string;
    fiscalYear: string;
    projectYear: string;
    keywordType: KeywordType;
    keyword: string;
    from: number;
    size: number;
    filterCountry: string;
    filterQ1: string[];
    filterQ2: string[];
    filterQ3: string[];
    filterQ4: string[];
    filterQ5: string[];
    filterQ6: string[];
    filterQ7: string[];
    filterQ8: string[];
    filterQ9: string[];
    filterQ10: string[];
}

export class SearchConfParticipantsReqDto implements SearchConfParticipantsReqInt {
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
    @ValidateIf((dto:SearchConfParticipantsReqInt) => !dto.hasOwnProperty("projectYear") || dto.hasOwnProperty("fiscalYear"))
    @IsNotEmpty()
    @IsString()
    public fiscalYear: string;

    @ApiProperty({
        type: String,
        description: 'projectYear year of the fair',
        example: '2022'
    })
    @ValidateIf((dto:SearchConfParticipantsReqInt) => !dto.hasOwnProperty("fiscalYear") || dto.hasOwnProperty("projectYear"))
    @IsNotEmpty()
    @IsString()
    public projectYear: string;

    @ApiProperty({
        type: String,
        description: 'type of the given keyword',
        example: 'all'
    })
    @IsNotEmpty()
    @IsString()
    public keywordType: KeywordType;

    @ApiPropertyOptional({
        type: String,
        description: 'keyword for searching',
        example: 'test'
    })
    @IsString()
    @IsOptional()
    public keyword: string;

    @ApiPropertyOptional({
        type: Number,
        description: 'pagination offset',
        example: 0
    })
    @IsNumber()
    @IsOptional()
    public from: number;
  
    @ApiPropertyOptional({
        type: Number,
        description: 'pagination limit',
        example: 30
    })
    @IsNumber()
    @IsOptional()
    public size: number;
    
    @ApiPropertyOptional({
        type: String,
        description: 'country code for filtering',
        example: 'HKG'
    })
    @IsString()
    @IsOptional()
    public filterCountry: string;

    @ApiPropertyOptional({
        type: [String],
        description: 'filter values for question 1',
        example: ['A101']
    })
    @IsString({each: true})
    @IsOptional()
    public filterQ1: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'filter values for question 2',
        example: []
    })
    @IsString({each: true})
    @IsOptional()
    public filterQ2: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'filter values for question 3',
        example: []
    })
    @IsString({each: true})
    @IsOptional()
    public filterQ3: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'filter values for question 4',
        example: []
    })
    @IsString({each: true})
    @IsOptional()
    public filterQ4: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'filter values for question 5',
        example: []
    })
    @IsString({each: true})
    @IsOptional()
    public filterQ5: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'filter values for question 6',
        example: []
    })
    @IsString({each: true})
    @IsOptional()
    public filterQ6: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'filter values for question 7',
        example: []
    })
    @IsString({each: true})
    @IsOptional()
    public filterQ7: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'filter values for question 8',
        example: []
    })
    @IsString({each: true})
    @IsOptional()
    public filterQ8: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'filter values for question 9',
        example: []
    })
    @IsString({each: true})
    @IsOptional()
    public filterQ9: string[];

    @ApiPropertyOptional({
        type: [String],
        description: 'filter values for question 10',
        example: []
    })
    @IsString({each: true})
    @IsOptional()
    public filterQ10: string[];
}

export class ConfParticipant {
    @ApiProperty({
        type: String,
        description: 'ref id of participant',
        example: '331668'
    })
    id: string|null;

    @ApiProperty({
        type: String,
        description: 'display name of participant',
        example: 'Alex Ho'
    })
    displayName: string|null;

    @ApiPropertyOptional({
        type: String,
        description: 'position of participant',
        example: 'Analyst Programmer'
    })
    position: string|null;

    @ApiProperty({
        type: String,
        description: 'company name of participant',
        example: 'ESD Service Limited'
    })
    companyName: string|null;
}

export interface SearchConfParticipantsResInt extends BaseResDtoInt<{
    from: number;
    size: number;
    total_size: number;
    participants: ConfParticipant[];
    sensitiveKeyword: boolean
}> {}

export class SearchConfParticipantsResData {
    @ApiProperty({
        type: Number,
        description: 'pagination offset',
        example: 0
    })
    from: number;

    @ApiProperty({
        type: Number,
        description: 'number of participants returned',
        example: 30
    })
    size: number;

    @ApiProperty({
        type: Number,
        description: 'total number of participants',
        example: 60
    })
    total_size: number;
    
    @ApiProperty({
        type: [ConfParticipant],
        description: 'participants returned',
        example: []
    })
    participants: ConfParticipant[];
    
    @ApiProperty({
        type: Boolean,
        description: 'whether the keyword for searching contains sensitive keyword',
        example: false
    })
    sensitiveKeyword: boolean;
}

export class SearchConfParticipantsResDto implements SearchConfParticipantsResInt {
    @ApiProperty({
        type: String,
        description: 'the SQL query for searhcing participants',
        example: "SELECT DISTINCT `fairRegistration`.`id` AS `fairRegistration_id`, `fairRegistration`.`displayName` AS `fairRegistration_displayName`, `fairRegistration`.`position` AS `fairRegistration_position`, `fairRegistration`.`companyName` AS `fairRegistration_companyName` FROM `fairRegistration` `fairRegistration` LEFT JOIN `fairParticipantType` `fairParticipantType` ON `fairParticipantType`.`id`=`fairRegistration`.`fairParticipantTypeId`  LEFT JOIN `fairRegistrationStatus` `fairRegistrationStatus` ON `fairRegistrationStatus`.`id`=`fairRegistration`.`fairRegistrationStatusId`  LEFT JOIN `c2mParticipantStatus` `c2mParticipantStatus` ON `c2mParticipantStatus`.`id`=`fairRegistration`.`c2mParticipantStatusId` WHERE `fairParticipantType`.`fairParticipantTypeCode` = ? AND `fairRegistrationStatus`.`fairRegistrationStatusCode` = ? AND `c2mParticipantStatus`.`c2mParticipantStatusCode` = ? AND `fairRegistration`.`fairCode` = ? AND `fairRegistration`.`fiscalYear` = ? AND EXISTS (SELECT 'x' FROM fairRegistrationCustomQuestion WHERE fairRegistrationId = `fairRegistration`.`id` AND questionNum = 1 AND categoryCode IN (?)) AND EXISTS (SELECT 'x' FROM fairRegistrationCustomQuestion WHERE fairRegistrationId = `fairRegistration`.`id` AND questionNum = 2 AND categoryCode IN (?)) ORDER BY `fairRegistration`.`displayName` ASC LIMIT 30"
    })
    sql: string

    @ApiProperty({
        type: String,
        description: 'the parameters used in the SQL query',
        example: "{\"typeCode\":\"GENERAL_PARTICIPANT\",\"statusCode\":\"CONFIRMED\",\"c2mStatusCode\":\"ACTIVE\",\"fairCode\":\"bnr\",\"fiscalYear\":\"2223\",\"q1\":[\"B121\"],\"q2\":[\"E104\"]}"
    })
    params: string

    @ApiProperty({
        type: SearchConfParticipantsResData,
        description: 'the search result',
        example: {
            from: 0,
            size: 30,
            total_size: 1,
            participants: [
                {
                    id: "331668",
                    displayName: "Alex Ho",
                    position: "Analyst Programmer",
                    companyName: "ESD Service Limited"
                }
            ],
            "sensitiveKeyword": false
        }
    })
    data: SearchConfParticipantsResData;
}
