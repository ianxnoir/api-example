import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, ValidateNested } from "class-validator";

export enum ConferenceClick2MatchStatusIdEnum {
    ACTIVE = 1,
    INACTIVE = 2,
    HIDDEN = 3,
    RESTRICTED = 4,
}

export class ConferenceConferenceC2MParticipantStatusDto {
    @ApiProperty({
        description: "C2m Participant Status Id",
        example: 1,
        required: true
    })
    @IsNotEmpty()
    @IsEnum(ConferenceClick2MatchStatusIdEnum)
    status: number
}

export class ConferenceC2MParticipantStatusListItemDto {
    @ApiProperty({
        description: "C2m Participant Status Id",
        example: 1,
        required: true
    })
    @IsNotEmpty()
    @IsEnum(ConferenceClick2MatchStatusIdEnum)
    status: number

    @ApiProperty({
        description: "Registration Record Id",
        example: 1,
        required: false
    })
    @IsNotEmpty()
    registrationRecordId: number

}

export class ConferenceC2MParticipantStatusListDto {

    
    @ApiProperty({
        description: "Array of registrationRecordId and status pair ",
        example: "\"actions\": [{\"registrationRecordId\": 1,\"status\": 1}]",
        required: true
    })
    @IsNotEmpty()
    @IsArray()
    @Type(() => ConferenceC2MParticipantStatusListItemDto)
    @ValidateNested({each: true})
    actions: ConferenceC2MParticipantStatusListItemDto[];
}