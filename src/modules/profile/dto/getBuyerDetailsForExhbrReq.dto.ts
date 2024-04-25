import { IsEnum } from "class-validator"

export class GetBuyerDetailsForExhbrReqDto {
    @IsEnum(['en', 'tc', 'sc'])
    lang: 'en' | 'tc' | 'sc'
    buyerFairCode: string
    buyerFiscalYear: string
    buyerSsoUid: string
}