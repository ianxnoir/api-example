import { Moment } from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { AdditionalValue } from '../api/content/dto/formTemplate.dto';
import { SystemTemplateContentEmail } from '../api/notification/dto/systemTemplate.dto';
import { FormDataDictionaryDto } from '../formValidation/dto/formDataDicionary.dto';
import { DedicateDataFieldEnum, DedicateDataFieldListForProductInterest } from '../formValidation/enum/dedicateDataField.enum';
import { FormCommonUtil } from '../formValidation/formCommon.util';
import { LANG } from '../registration/dto/SubmitForm.enum';
import { MultiLangTemplateHandler } from '../registration/MultiLangHandler';
import { EnquiryFormContentItem } from './dto/enquiryFormEmail.dto';
import { EnquiryFormEmailMetadataDto } from './dto/enquiryFormEmailMetadata.dto';

export class FormUtil {
    public static createFormSubmissionKey(): string {
        return `form_submission_${uuidv4()}`;
    }

    public static getEmailTemplateKeyByLang = (lang: LANG, emailTemplate: SystemTemplateContentEmail, metadata: EnquiryFormEmailMetadataDto) => {
        let emailSubject = ""
        let emailContent = ""
        switch (lang) {
            case LANG.tc:
                emailSubject = emailTemplate.emailSubjectTc ?? ""
                emailContent = metadata.emailHeader.en + (emailTemplate.emailContentTc ?? "") + metadata.emailFooter.en
                break;
            case LANG.sc:
                emailSubject = emailTemplate.emailSubjectSc ?? ""
                emailContent = metadata.emailHeader.sc + (emailTemplate.emailContentSc ?? "") + metadata.emailFooter.sc
                break;
            case LANG.en:
            default:
                emailSubject = emailTemplate.emailSubjectEn ?? ""
                emailContent = metadata.emailHeader.tc + (emailTemplate.emailContentEn ?? "") + metadata.emailFooter.tc
                break;
        }

        return { emailSubject, emailContent }
    }


    public static constructEnquiryFormContentTable(formDataDict: FormDataDictionaryDto, multiLangTemplateHandler: MultiLangTemplateHandler, lang: LANG): EnquiryFormContentItem[] {
        let itemList: EnquiryFormContentItem[] = []
        const formTemplateDict = multiLangTemplateHandler.getFormDataDictByAnchor()

        let additionalValue: AdditionalValue = {
            countryCodeFieldData: formDataDict[DedicateDataFieldEnum.br_address_country].data as string ?? "",
            stateProvinceCodeFieldData: formDataDict[DedicateDataFieldEnum.br_address_state].data as string ?? "",
        }

        Object.keys(formDataDict).forEach(
            fieldId => {
                const fieldData = formDataDict[fieldId].data
                if (formTemplateDict[fieldId]) {
                    if (Array.isArray(fieldData)) {
                        fieldData.forEach(fieldValue => {
                            const { label, value } = multiLangTemplateHandler.getFieldDetailByLang(fieldId, fieldValue, lang, additionalValue)
                            itemList.push({
                                label,
                                value
                            })
                        })
                    } else {
                        const { label, value } = multiLangTemplateHandler.getFieldDetailByLang(fieldId, fieldData as string, lang, additionalValue)
                        itemList.push({
                            label,
                            value
                        })
                    }
                } else {
                    if (DedicateDataFieldListForProductInterest.includes(fieldId)) {
                        const productInterestFormFieldTemplateId = FormCommonUtil.convertFormDataJsonProductInterestFieldIdToFormTemplateFieldId(fieldId)

                        const productInterestOtherFormFieldTemplateId = FormCommonUtil.convertProductInterestFormDataJsonFieldIdToOtherId(fieldId)
                        const productInterestOtherValue = (formDataDict[productInterestOtherFormFieldTemplateId]?.data as string) ?? ""

                        const teCodeList = fieldData as string[]
                        const aggProductInterest = multiLangTemplateHandler.getProductInterestAggDetails(teCodeList, productInterestOtherValue, productInterestFormFieldTemplateId)

                        let productInterestLabel = ""
                        let productInterestOtherLabel = ""

                        switch (lang){
                            case "tc":
                                productInterestLabel = aggProductInterest.labelTc
                                productInterestOtherLabel = aggProductInterest.productInterestOther.labelTc
                                break
                            case "sc":
                                productInterestLabel = aggProductInterest.labelSc
                                productInterestOtherLabel = aggProductInterest.productInterestOther.labelSc
                                break
                            default:
                            case "en":
                                productInterestLabel = aggProductInterest.labelEn
                                productInterestOtherLabel = aggProductInterest.productInterestOther.labelEn
                                break
                        }
                        itemList.push({
                            label: productInterestLabel,
                            value: teCodeList.join(", ")
                        })
                        itemList.push({
                            label: productInterestOtherLabel,
                            value: productInterestOtherValue
                        })
                    }
                }
            }
        )

        return itemList.sort((a, b) => a.label.localeCompare(b.label))
    }

    public static constructEnquiryFormContentBlockHTML(tableContentArray: EnquiryFormContentItem[]): string {
        let HTML = ''

        tableContentArray.forEach(
            tableContentItem => {
                HTML = HTML + `<p>${tableContentItem.label}: ${tableContentItem.value}</p>`
            }
        )

        return HTML
    }

    public static convertDateTimeToDateTimeString(date: Moment, lang: LANG): string {
        if (lang == LANG.en) {
            return date.utcOffset("+0800").format('DD MMMM YYYY HH:mm')
        } else {
            return date.utcOffset("+0800").locale('zh_hk').format("LLL")
        }
    }
}