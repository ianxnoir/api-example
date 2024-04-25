import { ApiProperty } from "@nestjs/swagger";

export class ParticipantRegistrationBySsouidsDto {
    @ApiProperty({
        description: "list of ssoUid",
        example: ["5f2ec1c6d2d24be681752bc7500380e1"],
    })
    ssoUids: string[];
}