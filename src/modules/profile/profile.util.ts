import { FairRegistration } from "../../dao/FairRegistration"
import { FormTemplateDto } from "../api/content/dto/formTemplate.dto"
import { FormProductInterestOptionsDto } from "../formValidation/dto/formProductInterestOptions.dto"
import { ProductInterestOtherFieldId } from "../formValidation/enum/dedicateDataField.enum"
import { FormCommonUtil } from "../formValidation/formCommon.util"
import { GetC2MProductInterestRespDto } from "./dto/getC2mQuestionInputResp.dto"

export class ProfileUtil {
    public static convertFairRegToProductInterestObject(fairReg: FairRegistration, formTemplate: FormTemplateDto | null): GetC2MProductInterestRespDto{
        const formProductInterestOptionsDto: FormProductInterestOptionsDto = FormCommonUtil.retrieveFormProductInterestOptions(formTemplate)

        const productInterestTeCode = Object.keys(formProductInterestOptionsDto.br_bm_product_interest ?? {})
        const productInterestIPTeCode = Object.keys(formProductInterestOptionsDto.br_bm_product_interest_ip ?? {})
        const productInterestLicensingTeCode = Object.keys(formProductInterestOptionsDto.br_bm_product_interest_licensing ?? {})

        const productInterest: string[] = []
        const productInterestIP: string[] = []
        const productInterestLicensing: string[] = []

        fairReg.fairRegistrationProductInterests.forEach(fairRegProductInterestItem => {
            const { teCode } = fairRegProductInterestItem
            if(productInterestTeCode.includes(fairRegProductInterestItem.teCode)){
                productInterest.push(teCode)
            }
            if(productInterestIPTeCode.includes(fairRegProductInterestItem.teCode)){
                productInterestIP.push(teCode)
            }
            if(productInterestLicensingTeCode.includes(fairRegProductInterestItem.teCode)){
                productInterestLicensing.push(teCode)
            }
        });

        const productInterestOther = fairReg.fairRegistrationDynamicOthers.find(x => x.formFieldId == ProductInterestOtherFieldId.br_bm_product_interest_other)?.value ?? ""
        const productInterestIPOther = fairReg.fairRegistrationDynamicOthers.find(x => x.formFieldId == ProductInterestOtherFieldId.br_bm_product_interest_ip_other)?.value ?? ""
        const productInterestLicensingOther = fairReg.fairRegistrationDynamicOthers.find(x => x.formFieldId == ProductInterestOtherFieldId.br_bm_product_interest_licensing_other)?.value ?? ""

        return {
            productInterests: {
                productInterest,
                productInterestOther,
                productInterestIP,
                productInterestIPOther,
                productInterestLicensing,
                productInterestLicensingOther,
            },
            productInterestFieldIdList: formProductInterestOptionsDto.productInterestFieldIdList,
            productInterestOptions: formProductInterestOptionsDto.returnJsonObject(),
        }
    }
}