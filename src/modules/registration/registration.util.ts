import { FormDataDictionaryDto } from "../formValidation/dto/formDataDicionary.dto";
import { RegistrationDataSqsJsonDto, RegistrationDataNonIntegratedField, RegistrationDataAntiMappingDto } from "./dto/RegistrationDataSqsJson.dto";
import { RegistrationDataSqsJsonFieldEnum } from "./dto/RegistrationDataSqsJson.enum";
import { RegistrationDataSqsJsonDefaultValue } from "./dto/RegistrationDataSqsJsonDefault";
import { RegistationExplicitInsertBMField, RegistrationDataSqsJsonFilteredField } from "./dto/RegistrationDataSqsJsonFiltered";
import { DictionarySqsJsonMapping } from "./dto/RegistrationDataSqsJsonMapping";
import { DedicateDataFieldListForProductInterest,DedicateDataFieldEnum, HardcodedDynamicBMFieldId } from "../formValidation/enum/dedicateDataField.enum";
import { MultiLangTemplateHandler } from './MultiLangHandler';
import { FormCommonUtil } from "../formValidation/formCommon.util";
import { AdditionalValue } from '../api/content/dto/formTemplate.dto';
import { SSOUserHeadersDto } from "../../core/decorator/ssoUser.decorator";
import { FORM_TYPE } from "../formValidation/enum/formType.enum";
const AWS = require('aws-sdk');
const ssm = new AWS.SSM({ region: 'ap-east-1' });

export class RegistrationUtil {
    private static DictionarySqsJsonAntiMapping = RegistrationUtil.calculateAntiMapping();
    private static calculateAntiMapping() : RegistrationDataAntiMappingDto {
        let result = {};
        Object.keys(DictionarySqsJsonMapping).forEach((formFieldId: string) => {
            result = {
                ...result,
                [formFieldId]: DictionarySqsJsonMapping[formFieldId],
            }
        })
        return result;
    }
    public static initializeSqsJsonData(): RegistrationDataSqsJsonDto {
        let result: RegistrationDataSqsJsonDto = {};
        Object.keys(RegistrationDataSqsJsonFieldEnum).forEach((sqsFieldId: string) => {
            switch (sqsFieldId) {
                case RegistrationDataSqsJsonFieldEnum.nob:
                case RegistrationDataSqsJsonFieldEnum.productInterest:
                case RegistrationDataSqsJsonFieldEnum.productInterestObjList:
                case RegistrationDataSqsJsonFieldEnum.preferredSuppCountryRegion:
                case RegistrationDataSqsJsonFieldEnum.bm: 
                case RegistrationDataSqsJsonFieldEnum.others:
                case RegistrationDataSqsJsonFieldEnum.seminarRegistrations:
                case RegistrationDataSqsJsonFieldEnum.preferredTimeslot:
                case RegistrationDataSqsJsonFieldEnum.productStrategy:
                    result = {
                        ...result,
                        [sqsFieldId]: []
                    }
                    break
                default:
                    result = {
                        ...result,
                        [sqsFieldId]: ""
                    }
                    break
            }
        });
        return result;
    }

    public static mapDictionaryToSqsJson(
        sqsDataToBeMapped : RegistrationDataSqsJsonDto,
        dictionaryDataToMap : FormDataDictionaryDto,
        multiLangTemplateHandler: MultiLangTemplateHandler
    ) {
        sqsDataToBeMapped = RegistrationUtil.integratedFieldMapping(sqsDataToBeMapped, dictionaryDataToMap,multiLangTemplateHandler);
        sqsDataToBeMapped = RegistrationUtil.nonIntegratedFieldMapping(sqsDataToBeMapped, dictionaryDataToMap, multiLangTemplateHandler);
        return sqsDataToBeMapped;
    }

    public static integratedFieldMapping(
        sqsData : RegistrationDataSqsJsonDto,
        dictionaryData : FormDataDictionaryDto,
        multiLangFormTemplateHandler: MultiLangTemplateHandler
    ): RegistrationDataSqsJsonDto {

        Object.keys(DictionarySqsJsonMapping).forEach((formFieldId) => {
            const sqsFieldId = DictionarySqsJsonMapping[formFieldId]
            if (sqsData.hasOwnProperty(sqsFieldId)) {
                switch (sqsFieldId){
                    case RegistrationDataSqsJsonFieldEnum.productInterest:
                        const productInterestDict = dictionaryData[formFieldId];
                        if (productInterestDict) {
                            // product interest te code array
                            const productInterestTeCodeList = productInterestDict.data as string[]
                            sqsData[sqsFieldId] = (sqsData[sqsFieldId] as string[] ?? []).concat(productInterestTeCodeList);

                            // map with product interest field option
                            const piFormTemplateFieldId = FormCommonUtil.convertFormDataJsonProductInterestFieldIdToFormTemplateFieldId(formFieldId)

                            const formTemplateDict = multiLangFormTemplateHandler.getFormDataDictByAnchor()
                            const filterOptions = formTemplateDict[piFormTemplateFieldId]?.options ?? null
                            if (filterOptions) {
                                productInterestTeCodeList.forEach(productInterestTeCode => {
                                    if (filterOptions[productInterestTeCode]) {
                                        (sqsData[RegistrationDataSqsJsonFieldEnum.productInterestObjList] as any[]).push({
                                            stId: filterOptions[productInterestTeCode][0]["st_id"] as string,
                                            iaId: filterOptions[productInterestTeCode][0]["ia_id"] as string,
                                            teCode: productInterestTeCode
                                        })
                                    }
                                });
                            }
                        }
                        break;
                    case RegistrationDataSqsJsonFieldEnum.euConsentStatus:
                    case RegistrationDataSqsJsonFieldEnum.badgeConsent:
                    case RegistrationDataSqsJsonFieldEnum.c2mConsent:
                    case RegistrationDataSqsJsonFieldEnum.registrationDetailConsent:
                        const isConsentMapped = dictionaryData[formFieldId as string];
                        if (isConsentMapped) {
                            sqsData[sqsFieldId] = multiLangFormTemplateHandler.getFieldDetail(formFieldId,(isConsentMapped.data as string)?.toString()??'').formFieldValue
                        }
                    break;
                    default:
                        const isDictionaryMapped = dictionaryData[formFieldId as string];
                        if (isDictionaryMapped) {
                            // process.stdout.write('Field '+ mappingField + ' exists: ');
                            // console.log(isDictionaryMapped.data);
                            sqsData[sqsFieldId] = isDictionaryMapped.data;
                        }
                        break;
                }
            }
        })
        return sqsData;
    }

    public static nonIntegratedFieldMapping(
        sqsData: RegistrationDataSqsJsonDto,
        dictionaryData: FormDataDictionaryDto,
        multiLangFormTemplateHandler: MultiLangTemplateHandler
    ): RegistrationDataSqsJsonDto {
        let bmFields: RegistrationDataNonIntegratedField[] = [];
        let otherFields: RegistrationDataNonIntegratedField[] = [];
        let additionalValue: AdditionalValue = {
            countryCodeFieldData: dictionaryData[DedicateDataFieldEnum.br_address_country]?.data as string ?? "",
            stateProvinceCodeFieldData: dictionaryData[DedicateDataFieldEnum.br_address_state]?.data as string ?? "",
        }

        Object.keys(dictionaryData).forEach((dictionaryField: string) => {
            let antiMappingField = RegistrationUtil.DictionarySqsJsonAntiMapping[dictionaryField];
            if (DedicateDataFieldListForProductInterest.includes(dictionaryField)) {
                const teCodeList: string[] = []

                const productInterestOtherFormFieldId = FormCommonUtil.convertProductInterestFormDataJsonFieldIdToOtherId(dictionaryField)

                const productInterestOtherValue = dictionaryData[productInterestOtherFormFieldId]?.data as string ?? ""
                const productInterestFormFieldTemplateId = FormCommonUtil.convertFormDataJsonProductInterestFieldIdToFormTemplateFieldId(dictionaryField)
                const { productInterestOther } = multiLangFormTemplateHandler.getProductInterestAggDetails(teCodeList, productInterestOtherValue, productInterestFormFieldTemplateId)

                const productInterestOtherField: RegistrationDataNonIntegratedField = {
                    fieldId: productInterestOther.formFieldId,
                    labelEn: productInterestOther.labelEn,
                    labelSc: productInterestOther.labelSc,
                    labelTc: productInterestOther.labelTc,
                    value: productInterestOther.formFieldValue,
                    valueEn: productInterestOther.valueEn,
                    valueSc: productInterestOther.valueSc,
                    valueTc: productInterestOther.valueTc,
                    valueDesc: productInterestOther.valueEn
                };

                otherFields.push(productInterestOtherField);
            }

            const isSaveToBMOthers: boolean = RegistationExplicitInsertBMField.includes(dictionaryField)
                || (sqsData[antiMappingField] === undefined && !RegistrationDataSqsJsonFilteredField.includes(dictionaryField))

            if (isSaveToBMOthers) {
                const isBmField = HardcodedDynamicBMFieldId.includes(dictionaryField) || dictionaryField.startsWith('bm_')
                
                let fieldDataArray: string[] = []
                if (Array.isArray(dictionaryData[dictionaryField].data)){
                    fieldDataArray = dictionaryData[dictionaryField].data as Array<string>
                } else {
                    fieldDataArray = [dictionaryData[dictionaryField].data as string]
                }

                fieldDataArray.forEach((fieldData)=> {
                    let fieldId = dictionaryField
                    let fieldDetail = multiLangFormTemplateHandler.getFieldDetail(fieldId,fieldData,additionalValue)
                    let valueDesc = fieldDetail.valueEn

                    const niField: RegistrationDataNonIntegratedField = {
                        fieldId,
                        labelEn: fieldDetail.labelEn,
                        labelSc: fieldDetail.labelSc,
                        labelTc: fieldDetail.labelTc,
                        value: fieldDetail.formFieldValue,
                        valueEn: fieldDetail.valueEn,
                        valueSc: fieldDetail.valueSc,
                        valueTc: fieldDetail.valueTc,
                        valueDesc,
                    };


                    if (isBmField) {
                        bmFields.push(niField);
                    } else if (multiLangFormTemplateHandler.fieldExistInAnyTemplate(fieldId)) {
                        otherFields.push(niField);
                    }

                })
            }
        })
        sqsData[RegistrationDataSqsJsonFieldEnum.bm] = bmFields;
        sqsData[RegistrationDataSqsJsonFieldEnum.others] = otherFields;
        return sqsData;
    }

    public static calculateFields(sqsData : RegistrationDataSqsJsonDto) : RegistrationDataSqsJsonDto {
        sqsData = RegistrationUtil.calculateDisplayName(sqsData);
        return sqsData;
    }

    public static calculateDisplayName(sqsData : RegistrationDataSqsJsonDto) : RegistrationDataSqsJsonDto {
        const firstName = (sqsData[RegistrationDataSqsJsonFieldEnum.firstName] ?? '') as string;
        const lastName = (sqsData[RegistrationDataSqsJsonFieldEnum.lastName] ?? '') as string;
        sqsData[RegistrationDataSqsJsonFieldEnum.displayName] = (() => {
            let connect = (firstName && lastName ? ' ' : '' );
            if (RegistrationUtil.testCJK(firstName) || RegistrationUtil.testCJK(lastName)) {
                return lastName + firstName;
            } else {
                return firstName + connect + lastName;
            }
        })();
        return sqsData;
    }

    public static fillSqsJsonWithDefaultValue(sqsData: RegistrationDataSqsJsonDto) : RegistrationDataSqsJsonDto {
        Object.keys(RegistrationDataSqsJsonDefaultValue).forEach((field)=>{
            if (sqsData[field] === "") {
                // process.stdout.write('Field '+ field + ' use default value: ');
                // console.log(RegistrationDataSqsJsonDefaultValue[field]);
                sqsData[field] = RegistrationDataSqsJsonDefaultValue[field];
            }
        })
        return sqsData;
    }

    public static fillSqsJsonWithAdditionalValue(sqsData: RegistrationDataSqsJsonDto, additionalInfo: { [key: string]: string | null } ): RegistrationDataSqsJsonDto {
        Object.keys(additionalInfo).forEach((field) => {
            sqsData[field] = additionalInfo[field];
        })
        return sqsData;
    }

    public static convertDictionaryToSqsJson(dictionaryDataToMap: FormDataDictionaryDto, additionalInfo: { [key: string]: string | null }, multiLangTemplateHandler: MultiLangTemplateHandler): RegistrationDataSqsJsonDto {
        let sqsJsonResult = RegistrationUtil.initializeSqsJsonData();
        sqsJsonResult = RegistrationUtil.mapDictionaryToSqsJson(sqsJsonResult, dictionaryDataToMap, multiLangTemplateHandler);
        sqsJsonResult = RegistrationUtil.calculateFields(sqsJsonResult);
        sqsJsonResult = RegistrationUtil.fillSqsJsonWithDefaultValue(sqsJsonResult);
        RegistrationUtil.fillSqsJsonWithAdditionalValue(sqsJsonResult, additionalInfo);

        return sqsJsonResult;
    }

    public static testCJK = (text:any) => {
        if (typeof(text) === 'string')
            return /[\u4E00-\u9FCC\u3400-\u4DB5\uFA0E\uFA0F\uFA11\uFA13\uFA14\uFA1F\uFA21\uFA23\uFA24\uFA27-\uFA29]|[\ud840-\ud868][\udc00-\udfff]|\ud869[\udc00-\uded6\udf00-\udfff]|[\ud86a-\ud86c][\udc00-\udfff]|\ud86d[\udc00-\udf34\udf40-\udfff]|\ud86e[\udc00-\udc1d]$/.test(text);
        else 
            return false;
    } 

    public static convertToFullPathSlug(fairCode: string, lang: string, slug: string){
        return `/event/${fairCode}/${lang}/form/${slug}/`
    }

    public static checkIsLoggedIn(ssoUser: SSOUserHeadersDto | null){
        return ssoUser?.ssoUid != undefined
    }

    public static convertParticipantTypeToDigit(formType: string): string {
        let returnedParticipantTypeDegit = "0";
        switch (formType) {
            case FORM_TYPE.CIP:
                returnedParticipantTypeDegit = "2";
                break;
            case FORM_TYPE.MISSION:
                returnedParticipantTypeDegit = "3";
                break;
            case FORM_TYPE.ORGANIC_BUYER:
            case FORM_TYPE.AOR:
            case FORM_TYPE.SEMINAR_LONG:
            case FORM_TYPE.SEMINAR_SHORT:
            default:
                returnedParticipantTypeDegit = "1";
        }
        return returnedParticipantTypeDegit;
    }

    // ssm
    public static async getKey(keyName : string) : Promise<string> {
        let input = {
            Name : keyName,
            WithDecryption : true
        }
        let token = await ssm.getParameter(input).promise()
        console.log(token)
        return token.Parameter.Value
    }

}