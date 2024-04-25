import { ApiProperty } from "@nestjs/swagger"
import { IsNotEmpty, Matches } from "class-validator"

export class GetNextSerialNumberReqDto {
    @ApiProperty({
        description: "fairCode",
        example: "hkjewellery",
        required: true
    })
    @IsNotEmpty()
    fairCode: string

    @ApiProperty({
        description: "projectYear",
        example: "2021",
        required: true
    })
    @IsNotEmpty()
    projectYear: string

    @ApiProperty({
        description: "sourceType",
        example: "08",
        required: true
    })
    @IsNotEmpty()
    @Matches(/^08$|^17$|^18$/)
    sourceType: string

    @ApiProperty({
        description: "visitorType",
        example: "01",
        required: true
    })
    @IsNotEmpty()
    visitorType: string
}



