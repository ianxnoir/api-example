import { IsEnum } from "class-validator"

export class ProfileForEditReqByFairCodeDto {
    fairCode: string
    @IsEnum(['en', 'tc', 'sc'])
    lang: 'en' | 'tc' | 'sc'
}