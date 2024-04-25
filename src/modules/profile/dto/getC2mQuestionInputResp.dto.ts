import { FormProductInterestOptionsJsonDto } from "../../formValidation/dto/formProductInterestOptions.dto"

export class ProductInterestDto {
    productInterest: string[]
    productInterestOther: string
    productInterestIP: string[]
    productInterestIPOther: string
    productInterestLicensing: string[]
    productInterestLicensingOther: string
}

export class GetC2MProductInterestRespDto {
    productInterests: ProductInterestDto
    productInterestFieldIdList: string[]
    productInterestOptions: FormProductInterestOptionsJsonDto
    errorMessage?: string
}

export class GetC2MQuestionInputRespDto {
    productInterests: ProductInterestDto
    isProductInterestInputted: boolean
    isProductDesignInputted: boolean
    productStrategies: string[]
    isTargetPreferredMarketsInputted: boolean
    targetPreferredMarkets: string[]
    productInterestFieldIdList: string[]
    errorMessage: string
}

