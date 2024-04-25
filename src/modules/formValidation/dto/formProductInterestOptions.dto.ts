export class FormProductInterestOptionsDto {
    br_bm_product_interest: any
    br_bm_product_interest_ip: any
    br_bm_product_interest_licensing: any
    productInterestFieldIdList: string[] = []

    constructor(){
        this.br_bm_product_interest = undefined
        this.br_bm_product_interest_ip = undefined
        this.br_bm_product_interest_licensing = undefined
        this.productInterestFieldIdList = []
    }

    returnJsonObject(){
        return new FormProductInterestOptionsJsonDto(
            JSON.stringify(this.br_bm_product_interest) ?? "",
            JSON.stringify(this.br_bm_product_interest_ip) ?? "",
            JSON.stringify(this.br_bm_product_interest_licensing) ?? ""
        )
    }
}

export class FormProductInterestOptionsJsonDto {
    br_bm_product_interest: string
    br_bm_product_interest_ip: string
    br_bm_product_interest_licensing: string

    constructor(interestJson: string, interestIPJson: string, interestLicensingJson: string)  {
        this.br_bm_product_interest = interestJson
        this.br_bm_product_interest_ip = interestIPJson
        this.br_bm_product_interest_licensing = interestLicensingJson
    }
}
