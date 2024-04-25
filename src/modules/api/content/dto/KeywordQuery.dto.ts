import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty } from "class-validator";

export class KeywordQueryDto {
    @IsNotEmpty()
    @ApiProperty({
        description: "Text to be check",
        example: "text",
        maxLength: 500
    })
    q: string
}

export class AutoCompleteRequestDto {
    @IsNotEmpty()
    @ApiProperty({
        description: "Language, only accept en/ tc/ sc",
        example: "en",
        maxLength: 2
    })
    lang: 'en'|'tc'|'sc'

    @IsNotEmpty()
    @ApiProperty({
        description: "Text to be auto complete, support UFT-8 characters",
        example: "text",
        maxLength: 500
    })
    q: string

    @IsNotEmpty()
    @ApiProperty({
        description: "CountryCode of the user, from HKTDC's Location API",
        example: "HKG",
        maxLength: 100
    })
    browserLocation: string
}