import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BaseResDtoInt } from '../conference.type';
import { ConfParticipant } from './searchConferenceParticipants.dto';

export interface GetConfParticipantReqInt {
    fairCode: string;
    fiscalYear?: string;
    projectYear?: string;
    id: string;
    ssoUid?: string;
    lang: string;
}

export class GetConfParticipantReqDto implements GetConfParticipantReqInt {
    @ApiPropertyOptional({
        type: String,
        description: 'fair code',
        example: 'bnr'
    })
    public fairCode: string;

    @ApiPropertyOptional({
        type: String,
        description: 'fiscal year of the fair',
        example: '2223'
    })
    public fiscalYear: string;

    @ApiPropertyOptional({
        type: String,
        description: 'project year of the fair',
        example: '2022'
    })
    public projectYear: string;

    @ApiPropertyOptional({
        type: String,
        description: 'ref id of the participant',
        example: '331668'
    })
    public id: string;

    @ApiPropertyOptional({
        type: String,
        description: 'frontend locale code',
        example: 'en'
    })
    public lang: string;
}

class FairParticipantType {
    @ApiProperty({
        type: String,
        description: 'participant type of the participant',
        example: 'General Participant'
    })
    fairParticipantTypeDesc: string|null;
}

class FairParticipant {
    @ApiProperty({
        type: String,
        description: 'SSO UID of the participant',
        example: 'da6c30132bcd4d27b0473a883543ec78'
    })
    ssoUid: string|null;
}

class GetConfParticipantQAns {
    @ApiProperty({
        type: Number,
        description: 'question number of the answer',
        example: 1
    })
    questionNum: number;
    
    @ApiProperty({
        type: String,
        description: 'the answer code',
        example: 'B121'
    })
    categoryCode: string;
    
    @ApiPropertyOptional({
        type: String,
        description: 'the option text to be shown for the answer',
        example: ''
    })
    optionText?: string;
}

class ConfParticipantDetail extends ConfParticipant {
    @ApiProperty({
        type: String,
        description: 'country name of the participant',
        example: 'Hong Kong'
    })
    addressCountryCode?: string|null;
    
    @ApiProperty({
        type: FairParticipant,
        description: 'fairParticipantType record of the participant',
        example: {}
    })
    fairParticipantType?: FairParticipantType;
    
    @ApiProperty({
        type: FairParticipant,
        description: 'fairParticipant record of the participant',
        example: {}
    })
    fairParticipant?: FairParticipant;
    
    @ApiProperty({
        type: [GetConfParticipantQAns],
        description: 'question answers of the participant',
        example: []
    })
    fairRegistrationCustomQuestion?: GetConfParticipantQAns[];
}

export interface GetConfParticipantResInt extends BaseResDtoInt<{
    participant?: ConfParticipantDetail;
}> {}

export class GetConfParticipantResData {
    @ApiPropertyOptional({
        type: ConfParticipantDetail,
        description: 'the participant detail returned',
        example: {}
    })
    participant?: ConfParticipantDetail
}

export class GetConfParticipantResDto implements GetConfParticipantResInt {
    @ApiProperty({
        type: String,
        description: 'the SQL query for getting participant detail',
        example: "SELECT DISTINCT `fairRegistration`.`id` AS `fairRegistration_id`, `fairRegistration`.`displayName` AS `fairRegistration_displayName`, `fairRegistration`.`position` AS `fairRegistration_position`, `fairRegistration`.`companyName` AS `fairRegistration_companyName`, `fairRegistration`.`addressCountryCode` AS `fairRegistration_addressCountryCode`, `fairParticipant`.`ssoUid` AS `fairParticipant_ssoUid`, `fairRegistrationCustomQuestion`.`questionNum` AS `fairRegistrationCustomQuestion_questionNum`, `fairRegistrationCustomQuestion`.`categoryCode` AS `fairRegistrationCustomQuestion_categoryCode`, `fairRegistrationCustomQuestion`.`optionText` AS `fairRegistrationCustomQuestion_optionText` FROM `fairRegistration` `fairRegistration` LEFT JOIN `fairParticipantType` `fairParticipantType` ON `fairParticipantType`.`id`=`fairRegistration`.`fairParticipantTypeId`  LEFT JOIN `fairRegistrationStatus` `fairRegistrationStatus` ON `fairRegistrationStatus`.`id`=`fairRegistration`.`fairRegistrationStatusId`  LEFT JOIN `c2mParticipantStatus` `c2mParticipantStatus` ON `c2mParticipantStatus`.`id`=`fairRegistration`.`c2mParticipantStatusId`  LEFT JOIN `fairParticipant` `fairParticipant` ON `fairParticipant`.`id`=`fairRegistration`.`fairParticipantId`  LEFT JOIN `fairRegistrationCustomQuestion` `fairRegistrationCustomQuestion` ON `fairRegistrationCustomQuestion`.`fairRegistrationId`=`fairRegistration`.`id` WHERE `fairParticipantType`.`fairParticipantTypeCode` = ? AND `fairRegistrationStatus`.`fairRegistrationStatusCode` = ? AND `c2mParticipantStatus`.`c2mParticipantStatusCode` = ? AND `fairRegistration`.`fairCode` = ? AND `fairRegistration`.`fiscalYear` = ? AND `fairRegistration`.`id` = ? ORDER BY `fairRegistration`.`displayName` ASC"
    })
    sql: string

    @ApiProperty({
        type: String,
        description: 'related SQL parameters in JSON string',
        example: "{\"typeCode\":\"GENERAL_PARTICIPANT\",\"statusCode\":\"CONFIRMED\",\"c2mStatusCode\":\"ACTIVE\",\"fairCode\":\"mp\",\"fiscalYear\":\"2223\",\"id\":\"331668\",\"lang\":\"en\"}"
    })
    params: string

    @ApiProperty({
        type: GetConfParticipantResData,
        description: 'the search result',
        example: {
            participant: {
                id: "331668",
                displayName: "Alex Ho",
                position: "Analyst Programmer",
                companyName: "ESD Service Limited",
                addressCountryCode: "Hong Kong",
                fairParticipant: {
                    ssoUid: "da6c30132bcd4d27b0473a883543ec78"
                },
                fairRegistrationCustomQuestions: [
                    {
                        questionNum: "1",
                        categoryCode: "B121",
                        optionText: ""
                    }
                ]
            }
        }
    })
    data: GetConfParticipantResData;
}