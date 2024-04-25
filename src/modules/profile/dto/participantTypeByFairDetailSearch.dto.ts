import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsString, ValidateNested } from "class-validator";

export class ParticipantTypeByFairDetailSearchDto {
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

    @IsArray()
    @ValidateNested({ each: true })
    @ApiProperty({
        description: "list of fairDetail",
        example: [
            {
                "fairCode": "hkjewellery",
                "fairSettingFairCode": "hkjewellery",
                "fiscalYear": "2223",
            }
        ],
    })
    fairDetailList: BuyerSearchFairDetail[];
}

export class BuyerSearchFairDetail {
    @IsString()
    @ApiProperty({
        description: "fairCode",
        example: "hkjewellery",
    })
    fairCode: string

    @IsString()
    @ApiProperty({
        description: "fairCode from fairSetting",
        example: "hkjewellery",
    })
    fairSettingFairCode: string

    @IsString()
    @ApiProperty({
        description: "fiscalYear",
        example: "2223",
    })
    fiscalYear: string

}