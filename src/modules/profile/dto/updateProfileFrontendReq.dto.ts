import { IsEnum } from "class-validator"

export class UpdateProfileFrontendReqDto {
    fairCode: string
    @IsEnum(['en', 'tc', 'sc'])
    lang: 'en' | 'tc' | 'sc'
    formDataJson: string
}