import { FormTemplateDto, FormTemplateFieldItemDto, FormTemplateStepDto } from "../api/content/dto/formTemplate.dto";
import { CustomFormSubmitDataDto } from "./dto/customFormSubmitData.dto";
import { EditFormDataDto } from "./dto/editFormData.dto";
import { FormDataDictionaryDto } from "./dto/formDataDicionary.dto";
import { FormSubmitDataDto } from "./dto/formSubmitData.dto";
import { FormTemplateFieldDicionaryDto } from "./dto/formTemplateFieldDicionary.dto";

export class ValidationUtil {
    public static convertFormToDictionary(formDataObj: FormSubmitDataDto | CustomFormSubmitDataDto | EditFormDataDto): FormDataDictionaryDto {
        return ValidationUtil.convertToFormDataDictionary(formDataObj.data)
    }

    public static convertFormTemplateToTemplateDictionary(formTemplate: FormTemplateDto): FormTemplateFieldDicionaryDto {
        let formTemplateDict: FormTemplateFieldDicionaryDto = {}

        formTemplate.form_data.form_obj.forEach((formTemplateStep: FormTemplateStepDto) => {
            formTemplateDict = {
                ...formTemplateDict,
                ...ValidationUtil.convertFieldListToTemplateDictionary(formTemplateStep.field_items)
            }
        })

        return formTemplateDict
    }

    public static convertFieldListToTemplateDictionary(formFieldList: FormTemplateFieldItemDto[]): FormTemplateFieldDicionaryDto {
        var result: any = {};
        function templateRecurse(currArray: FormTemplateFieldItemDto[], prop: string) {
            currArray.forEach(currItem => {
                if (currItem.field_items && currItem.field_items.length > 0) {
                    templateRecurse(currItem.field_items, currItem.id!)
                } else {
                    result[prop ? `${prop}.${currItem.id!}` : currItem.id!] = currItem;
                }
            });
        }
        templateRecurse(formFieldList, "");
        return result
    }

    private static convertToFormDataDictionary(submittedFormDataObj: any) {
        const flattenData = ValidationUtil.flattenFormData(submittedFormDataObj)
        let formDataDicionary: FormDataDictionaryDto = {}
        Object.keys(flattenData).forEach((key) => {
            formDataDicionary = {
                ...formDataDicionary,
                [key]: {
                    key,
                    data: flattenData[key]
                }
            }
        })
        return formDataDicionary
    }

    private static flattenFormData(data: any) {
        var result: any = {};
        function recurse(cur: any, prop: any) {
            if (Object(cur) !== cur) {
                result[prop] = cur;
            } else if (Array.isArray(cur)) {
                result[prop] = cur
            } else {
                var isEmpty = true;
                for (var p in cur) {
                    isEmpty = false;
                    recurse(cur[p], prop ? prop + "." + p : p);
                }
                if (isEmpty && prop)
                    result[prop] = {};
            }
        }
        recurse(data, "");
        return result;
    }

    public static unflattenFormData(data: any) {
        if (Object(data) !== data || Array.isArray(data))
            return data;
        var regex = /\.?([^.\[\]]+)|\[(\d+)\]/g,
            resultholder: any = {};
        for (var p in data) {
            var cur = resultholder,
                prop = "",
                m;
            while (m = regex.exec(p)) {
                cur = cur[prop] || (cur[prop] = (m[2] ? [] : {}));
                prop = m[2] || m[1];
            }
            cur[prop] = data[p];
        }
        return resultholder[""] || resultholder;
    }
}
