import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNotEmpty, ValidateNested } from "class-validator";

export enum Click2MatchStatusIdEnum {
    ACTIVE = 1,
    INACTIVE = 2,
    HIDDEN = 3,
    RESTRICTED = 4,
}

export class C2MParticipantStatusDto {
    @ApiProperty({
        description: "C2m Participant Status Id",
        example: 1,
        required: true
    })
    @IsNotEmpty()
    @IsEnum(Click2MatchStatusIdEnum)
    status: number
}

export class C2MParticipantStatusListItemDto {
    @ApiProperty({
        description: "C2m Participant Status Id",
        example: 1,
        required: true
    })
    @IsNotEmpty()
    @IsEnum(Click2MatchStatusIdEnum)
    status: number

    @ApiProperty({
        description: "Registration Record Id",
        example: 1,
        required: false
    })
    @IsNotEmpty()
    registrationRecordId: number

}

export class C2MParticipantStatusListDto {

    
    @ApiProperty({
        description: "Array of registrationRecordId and status pair ",
        example: "\"actions\": [{\"registrationRecordId\": 1,\"status\": 1}]",
        required: true
    })
    @IsNotEmpty()
    @IsArray()
    @Type(() => C2MParticipantStatusListItemDto)
    @ValidateNested({each: true})
    actions: C2MParticipantStatusListItemDto[];
}