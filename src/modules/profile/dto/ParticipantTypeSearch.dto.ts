import { ApiProperty } from "@nestjs/swagger";

export class ParticipantTypeSearchDto {
    @ApiProperty({
        description: "emailId",
        example: "abc@temp.com",
    })
    emailId: string;

    @ApiProperty({
        description: "ssoUid",
        example: "4b9c94b9d0b4fea8a3f2327056e58359",
    })
    ssoUid: string;

    @ApiProperty({
        description: "list of fairCode",
        example: ["hkjewellery, hkwinefair"],
    })
    fairCodes: string[];
}