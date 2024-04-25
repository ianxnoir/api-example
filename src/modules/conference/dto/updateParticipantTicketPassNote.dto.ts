import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, MaxLength } from "class-validator";

export class ParticipantTicketPassNoteReqDto {
    @ApiProperty({
        description: "General Participant Remark",
        example: "General Participant Remark",
        maxLength: 30000,
        required: false
    })
    @MaxLength(30000)
    @IsOptional()
    generalParticipantRemark?: string
    ticketPassCode?: string

    constructor(generalParticipantRemark: string | null | undefined) {
        // can be updated as "" but not null or undfined
        if (generalParticipantRemark != null) { this.generalParticipantRemark = generalParticipantRemark; }
    }

}