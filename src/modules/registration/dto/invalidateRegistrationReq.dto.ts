import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";

export class InvalidateRegistrationReqDto {
    @ApiProperty({
        description: "fairCode",
        example: "hkjewellery",
        required: true
    })
    @IsString()
    fairCode: string

    @ApiProperty({
        description: "fiscalYear",
        example: "2122",
        required: true
    })
    @IsString()
    fiscalYear: string

    @ApiProperty({
        description: "contactEmail",
        example: "temp@gmail.com",
        required: true
    })
    @IsString()
    contactEmail: string
}