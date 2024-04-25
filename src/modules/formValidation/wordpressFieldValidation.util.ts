//import moment from "moment";
import { ComplexDefinitionDto } from "../api/content/dto/formTemplate.dto";
import { FormDataDictionaryDto } from "./dto/formDataDicionary.dto";

export class WordpressFieldValidationUtil {
    //#region ComplexDefinition related
    public static checkComplexDefinitionTrue(complexDefDto: ComplexDefinitionDto, formDataDict: FormDataDictionaryDto): boolean {
        let isComplexDefFulfilled = false
        let relatedFieldName = ""
        Object.keys(formDataDict).some((x) => {
            if (x.includes(complexDefDto.field_id)) {
                relatedFieldName = x
                return true
            }
            return false
        })

        if (relatedFieldName) {
            const relatedData = formDataDict[relatedFieldName].data
            if (complexDefDto.operator == "=") {
                if (relatedData == complexDefDto.value) {
                    isComplexDefFulfilled = true
                }
            }
            if (complexDefDto.operator == "!=") {
                if (relatedData != complexDefDto.value) {
                    isComplexDefFulfilled = true
                }
            }
        }
        return isComplexDefFulfilled
    }

    public static checkRequiredWhen(complexDefDtoList: ComplexDefinitionDto[], formDataDict: FormDataDictionaryDto) {
        return complexDefDtoList.reduce((result, currComplexDto) => {
            if (!result) {
                result = result || WordpressFieldValidationUtil.checkComplexDefinitionTrue(currComplexDto, formDataDict)
            }
            return result
        }, false)
    }
    //#endregion ComplexDefinition related

    //#region Generic Field Util
    public static checkSelectValue(options: any, fieldData: string): boolean {
        let isValid = false
        if (Array.isArray(options)) {
            isValid = options.some(optionItem => optionItem.value.toString() == fieldData)
        } 

        return isValid
    }

    public static checkCheckboxValue(options: any, fieldData: string): boolean {
        let isValid = false
        if (Array.isArray(options)) {
            isValid = options.some(optionItem => optionItem.id.toString() == fieldData)
        } 

        return isValid
    }

    public static checkRadioValue(options: any, fieldData: string): boolean {
        let isValid = false
        if (Array.isArray(options)) {
            isValid = options.some(optionItem => optionItem.id.toString() == fieldData)
        } 

        return isValid
    }

    public static recursiveCheckSelectValue(option: any, fieldData: string): boolean {
        let isValid = false
        if (Array.isArray(option)) {
            option.forEach((x) => {
                if (WordpressFieldValidationUtil.recursiveCheckSelectValue(x, fieldData)) {
                    isValid = true
                }
            })
        } else {
            for (var p in option) {
                if (Object(option[p]) !== option[p]) {
                    if (option[p] === fieldData) {
                        isValid = true
                    }
                } else {
                    if (WordpressFieldValidationUtil.recursiveCheckSelectValue(option[p], fieldData)) {
                        isValid = true
                    }
                }

            }
        }

        return isValid
    }
    //#endregion Generic field
    
}