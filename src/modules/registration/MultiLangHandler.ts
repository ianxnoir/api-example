import {
  FormTemplateDto,
  MultiLangFormTemplateObj,
  MultiLangAggProductInterest, ProductInterestFieldOption, GroupedProductInterestFieldOption,
  MuiltiLangFormTemplate,
  MultiLangProductInterest,
  FormTemplateStepDto,
  FormTemplateFieldItemDto,
  SingleLangFormTemplateObj, FormLanguage, AdditionalValue
} from '../api/content/dto/formTemplate.dto';
import {
  DedicateDataFieldEnum,
  DedicateDataFieldListForValueHandling, ProductInterestFieldId
} from '../formValidation/enum/dedicateDataField.enum';
import { FormTemplateFieldDicionaryDto } from '../formValidation/dto/formTemplateFieldDicionary.dto';

/**
 * @class
 * @classdesc This class help to extract label and value from predefined wordpress json template, the output value maybe transformed by functions in this class
 * based on types/ acknowledged fieldId in json template.
 *
 */
export class MultiLangTemplateHandler {

  constructor(multiLangTemplate: MuiltiLangFormTemplate,anchor :FormLanguage = 'en') {
    this.formDictionaryEn = this.convertFormTemplateToTemplateDictionary(multiLangTemplate.formEn);
    this.formDictionarySc = new FormTemplateFieldDicionaryDto();
    this.formDictionaryTc = new FormTemplateFieldDicionaryDto();

    if (multiLangTemplate.formSc) {
      this.formDictionarySc = this.convertFormTemplateToTemplateDictionary(multiLangTemplate.formSc);
    }

    if (multiLangTemplate.formTc) {
      this.formDictionaryTc = this.convertFormTemplateToTemplateDictionary(multiLangTemplate.formTc);
    }

    this.anchor = anchor;
  }

  //Assumption always have form En
  formDictionaryEn: FormTemplateFieldDicionaryDto;
  formDictionarySc: FormTemplateFieldDicionaryDto;
  formDictionaryTc: FormTemplateFieldDicionaryDto;
  anchor: FormLanguage;


  public getFieldDetail(fieldId: string, fieldValue: string, addtionalValue?: AdditionalValue): MultiLangFormTemplateObj {
    let fieldType: string = '';
    fieldValue = fieldValue?.toString()??''
    switch (this.anchor){
      case 'en':
        fieldType = this.formDictionaryEn[fieldId]?.field_type || fieldType;
        break;
      case 'tc':
        fieldType = this.formDictionaryTc[fieldId]?.field_type || fieldType;
        break;
      case 'sc':
        fieldType = this.formDictionarySc[fieldId]?.field_type || fieldType;
        break;
    }

    let result: MultiLangFormTemplateObj;
    if (DedicateDataFieldListForValueHandling.includes(fieldId)) {
      result = this.getFieldDetailByDedicateName(fieldId, fieldValue, addtionalValue);
    } else if (['generic-hktdc-checkbox', 'generic-radio', 'generic-dropdown', 'generic-acceptance','hktdc-consent', 'generic-telephone', 'select','currency'].includes(fieldType)) {
      // 2. dropdown, checkbox, radio
      result = this.getFieldDetailByType(fieldType,fieldId, fieldValue);
    } else {
      result = this.getFieldDetailByFieldId(fieldId, fieldValue);
    }
    result.fieldType = fieldType
    this.transformMultiLangFormTemplateObjWithAnchor(result);
    return result;
  }


  public getFieldDetailByLang(fieldId: string, fieldValue: string,lang: FormLanguage, additionalValue?: AdditionalValue): SingleLangFormTemplateObj{
    let multiLangResult: MultiLangFormTemplateObj = this.getFieldDetail(fieldId, fieldValue, additionalValue);
    let result = new SingleLangFormTemplateObj(multiLangResult.formFieldId, multiLangResult.formFieldValue, multiLangResult.fieldType)
    switch(lang) {
      case 'en':
        result.label = multiLangResult.labelEn
        result.value = multiLangResult.valueEn
        break;
      case 'sc':
        result.label = multiLangResult.labelSc
        result.value = multiLangResult.valueSc
        break;
      case 'tc':
        result.label = multiLangResult.labelTc
        result.value = multiLangResult.valueTc
        break;
    }
    return result;
  }

  /**
   *
   * @param fieldId
   * @param productInterestValue
   * @param productInterestOtherValue
   * @description Construct two object based on input template
   */
  public getProductInterestDetail(fieldId: string,productInterestValue: string, productInterestOtherValue: string): MultiLangProductInterest {
    let result = new MultiLangProductInterest()
    result.productInterest = this.getFieldDetailByProductInterest(fieldId,productInterestValue)
    result.productInterestOther = this.getProductInterestOtherDetail(fieldId,productInterestOtherValue)
    this.transformMultiLangProductInterestWithAnchor(result)
    return result
  }

  /**
   * @param fairReg
   * @param fieldId
   * @param productInterestOtherValue
   * @description Construct two product interest object based on input template, need to aggragate product interest with iav3
   */
    public getProductInterestAggDetails(teCodeList: string[], productInterestOtherValue: string, fieldId: string): MultiLangAggProductInterest {
    let result = new MultiLangAggProductInterest()
    const label = this.getFieldLabelByProductInterest(fieldId)
    result.formFieldId = fieldId
    result.fieldType = label.fieldType
    result.labelEn = label.labelEn
    result.labelTc = label.labelTc
    result.labelSc = label.labelSc
    result.productInterestList = this.getGroupedProductInterestList(teCodeList, fieldId)

    result.productInterestOther = this.getProductInterestOtherDetail(fieldId, productInterestOtherValue)
    return result
  }

  public fieldExistInAnyTemplate(fieldId: string): boolean {
    if (this.formDictionaryEn[fieldId]) {
      return true;
    }
    if (this.formDictionarySc[fieldId]) {
      return true
    }
    if (this.formDictionaryTc[fieldId]) {
      return true
    }
    return false;
  }

  public getFormDataDictByAnchor(){
    switch(this.anchor){
      case 'tc':
        return this.formDictionaryTc
      case 'sc':
        return this.formDictionarySc
      case 'en': 
      default:
        return this.formDictionaryEn
    }
  }

  //Assumption: All fieldId in form template field is unique
  private convertFormTemplateToTemplateDictionary(formTemplate: FormTemplateDto): FormTemplateFieldDicionaryDto {
    let formTemplateDict: FormTemplateFieldDicionaryDto = {}

    formTemplate.form_data.form_obj.forEach((formTemplateStep: FormTemplateStepDto) => {
      formTemplateDict = {
        ...formTemplateDict,
        ...this.convertFieldListToTemplateDictionary(formTemplateStep.field_items)
      }
    })

    return formTemplateDict
  }

  private convertFieldListToTemplateDictionary(formFieldList: FormTemplateFieldItemDto[]): FormTemplateFieldDicionaryDto {
    var result: any = {};

    function templateRecurse(currArray: FormTemplateFieldItemDto[], prop: string, inheritProperties: Partial<FormTemplateFieldItemDto>) {
      let propertiesNamePassToChild: Array<keyof FormTemplateFieldItemDto> = ['currency_label', 'show_in_profile'];
      currArray.forEach(currItem => {
        if (currItem.field_items && currItem.field_items.length > 0) {
          let propertiesPassToChild = new FormTemplateFieldItemDto();
          for (let propertyName of propertiesNamePassToChild) {
            if (inheritProperties[propertyName]) {
              propertiesPassToChild[propertyName] = inheritProperties[propertyName];
            } else if (currItem[propertyName] !== undefined) {
              propertiesPassToChild[propertyName] = currItem[propertyName];
            }
          }
          templateRecurse(currItem.field_items, currItem.id!, propertiesPassToChild);
        } else {
          for (let property of Object.keys(inheritProperties) as Array<keyof typeof inheritProperties>){
              if (currItem[property] === undefined){
                currItem[property] = inheritProperties[property]
              }
          }
          result[prop ? `${prop}.${currItem.id!}` : currItem.id!] = currItem;
        }
      });
    }

    templateRecurse(formFieldList, '', {});
    return result;
  }

  private getFieldDetailByFieldId(fieldId: string, fieldValue: string): MultiLangFormTemplateObj {
    return {
      formFieldId: fieldId,
      formFieldValue: fieldValue,
      fieldType: this.formDictionaryEn[fieldId]?.field_type ?? '',
      labelEn: this.formDictionaryEn[fieldId]?.label ?? '',
      labelSc: this.formDictionarySc[fieldId]?.label ?? '',
      labelTc: this.formDictionaryTc[fieldId]?.label ?? '',
      valueEn: fieldValue,
      valueSc: fieldValue,
      valueTc: fieldValue
    };
  }



  private getFieldDetailByDedicateName(fieldId: string, fieldValue: string,addtionalValue?: { countryCodeFieldData?: string, stateProvinceCodeFieldData?: string }): MultiLangFormTemplateObj {
    switch (fieldId) {
      case DedicateDataFieldEnum.br_address_state:
        return this.getBrAddressState(fieldId,fieldValue,addtionalValue?.countryCodeFieldData??"")
        break;
      case DedicateDataFieldEnum.br_address_city:
        return this.getBrAddressCity(fieldId,fieldValue,addtionalValue?.countryCodeFieldData??"",addtionalValue?.stateProvinceCodeFieldData??"")
        break;
      case ProductInterestFieldId.br_bm_product_interest:
      case ProductInterestFieldId.br_bm_product_interest_ip:
      case ProductInterestFieldId.br_bm_product_interest_licensing:
        return this.getFieldDetailByProductInterest(fieldId, fieldValue);
        break;
      case DedicateDataFieldEnum.br_address_country:
      case DedicateDataFieldEnum.br_country_code_company:
      case DedicateDataFieldEnum.br_country_code_mobile:
      case DedicateDataFieldEnum.br_title:
      case DedicateDataFieldEnum.br_business_nature:
      case DedicateDataFieldEnum.br_room_type:
      case DedicateDataFieldEnum.br_bm_prefer_supplier_country:
      case DedicateDataFieldEnum.br_hotel_list:
        return this.getFieldDetailByOptionValueOrId(fieldId,fieldValue);
        break;
      default:
        return this.getFieldDetailByFieldId(fieldId, fieldValue);
    }
  }


  private getBrAddressState(fieldId: string, fieldValue: string, countryCodeFieldData: string): MultiLangFormTemplateObj {
    let result: MultiLangFormTemplateObj = new MultiLangFormTemplateObj(fieldId, fieldValue);
    const stateProvinceCodeFieldData = fieldValue as string;
    const retrievedEnOption = this.formDictionaryEn[fieldId]?.options?.[0]?.[countryCodeFieldData]?.find((x: any) => x.value == stateProvinceCodeFieldData);
    const retrievedScOption = this.formDictionarySc[fieldId]?.options?.[0]?.[countryCodeFieldData]?.find((x: any) => x.value == stateProvinceCodeFieldData);
    const retrievedTcOption = this.formDictionaryTc[fieldId]?.options?.[0]?.[countryCodeFieldData]?.find((x: any) => x.value == stateProvinceCodeFieldData);
    result.labelEn = this.formDictionaryEn[fieldId]?.label ?? '';
    result.labelSc = this.formDictionarySc[fieldId]?.label ?? '';
    result.labelTc = this.formDictionaryTc[fieldId]?.label ?? '';

    if (retrievedEnOption) {
      result.valueEn = retrievedEnOption.label;
    }

    if (retrievedScOption) {
      result.valueSc = retrievedScOption.label;
    }

    if (retrievedTcOption) {
      result.valueTc = retrievedTcOption.label;
    }

    return result;
  }

  private getBrAddressCity(fieldId: string, fieldValue: string, countryCodeFieldData: string, stateProvinceCodeFieldData: string): MultiLangFormTemplateObj {
    let result: MultiLangFormTemplateObj = new MultiLangFormTemplateObj(fieldId, fieldValue);
    const cityCodeFieldData = fieldValue;
    const retrievedScOption = this.formDictionarySc[fieldId]?.options?.[0]?.[countryCodeFieldData]?.[0]?.[stateProvinceCodeFieldData]?.find((x: any) => x.value == cityCodeFieldData);
    const retrievedEnOption = this.formDictionaryEn[fieldId]?.options?.[0]?.[countryCodeFieldData]?.[0]?.[stateProvinceCodeFieldData]?.find((x: any) => x.value == cityCodeFieldData);
    const retrievedTcOption = this.formDictionaryTc[fieldId]?.options?.[0]?.[countryCodeFieldData]?.[0]?.[stateProvinceCodeFieldData]?.find((x: any) => x.value == cityCodeFieldData);
    result.labelEn = this.formDictionaryEn[fieldId]?.label ?? '';
    result.labelSc = this.formDictionarySc[fieldId]?.label ?? '';
    result.labelTc = this.formDictionaryTc[fieldId]?.label ?? '';

    if (retrievedEnOption) {
      result.valueEn = retrievedEnOption.label;
    }

    if (retrievedScOption) {
      result.valueSc = retrievedScOption.label;
    }

    if (retrievedTcOption) {
      result.valueTc = retrievedTcOption.label;
    }

    return result;
  }


  private getFieldDetailByType(fieldType: string,fieldId: string, fieldValue: string): MultiLangFormTemplateObj {
    switch (fieldType) {
      case 'generic-hktdc-checkbox':
      case 'generic-dropdown':
      case 'generic-radio':
      case 'select':
        return this.getFieldDetailByOptionValueOrId(fieldId, fieldValue);
      case 'generic-acceptance':
      case 'hktdc-consent':
        return this.getFieldDetailByAcceptanceText(fieldId,fieldValue);
      case 'currency':
        return this.getFieldDetailByCurrency(fieldId,fieldValue);
      default:
        return this.getFieldDetailByFieldId(fieldId, fieldValue);
    }
  }

  private getFieldDetailByCurrency(fieldId: string, fieldValue: string): MultiLangFormTemplateObj {
    let result: MultiLangFormTemplateObj = new MultiLangFormTemplateObj(fieldId, fieldValue);
    let currencyLabelEn = this.formDictionaryEn[fieldId]?.currency_label ?? '';
    let currencyLabelSc = this.formDictionarySc[fieldId]?.currency_label ?? '';
    let currencyLabelTc = this.formDictionaryTc[fieldId]?.currency_label ?? '';
    result.labelEn = this.formDictionaryEn[fieldId]?.label ?? '';
    result.labelSc = this.formDictionarySc[fieldId]?.label ?? '';
    result.labelTc = this.formDictionaryTc[fieldId]?.label ?? '';
    result.formFieldValue = fieldValue;
    if (currencyLabelEn !== '') {
      result.valueEn = `${currencyLabelEn}:${fieldValue}`;
    } else {
      result.valueEn = fieldValue;
    }

    if (currencyLabelSc !== '') {
      result.valueSc = `${currencyLabelSc}:${fieldValue}`;
    } else {
      result.valueSc = fieldValue;
    }

    if (currencyLabelTc !== '') {
      result.valueTc = `${currencyLabelTc}:${fieldValue}`;
    } else {
      result.valueTc = fieldValue;
    }
    return result;
  }

  private getFieldDetailByAcceptanceText(fieldId: string,fieldValue: string) : MultiLangFormTemplateObj{
      let result : MultiLangFormTemplateObj = new MultiLangFormTemplateObj(fieldId,fieldValue);
      result.labelEn = this.formDictionaryEn[fieldId]?.label ?? ''
      result.labelSc = this.formDictionarySc[fieldId]?.label ?? ''
      result.labelTc = this.formDictionaryTc[fieldId]?.label ?? ''
      switch (fieldValue) {
        case 'true':
          result.formFieldValue = 'Y'
          result.valueEn = this.formDictionaryEn[fieldId]?.acceptance_text ?? ''
          result.valueSc = this.formDictionarySc[fieldId]?.acceptance_text ?? ''
          result.valueTc = this.formDictionaryTc[fieldId]?.acceptance_text ?? ''
          break;
        case 'false':
          result.formFieldValue = 'N'
          result.valueEn = ''
          result.valueSc = ''
          result.valueTc = ''
          break;
        default:
          result.formFieldValue = 'U'
          result.valueEn = ''
          result.valueSc = ''
          result.valueTc = ''
          break;
      }
      return result
  }

  private getFieldDetailByOptionValueOrId(fieldId: string, fieldValue: string): MultiLangFormTemplateObj {
    let enValue = this.getValueFromOptionsArray(this.formDictionaryEn[fieldId]?.options, fieldValue);
    let scValue = this.getValueFromOptionsArray(this.formDictionarySc[fieldId]?.options, fieldValue);
    let tcValue = this.getValueFromOptionsArray(this.formDictionaryTc[fieldId]?.options, fieldValue);
    return {
      formFieldId: fieldId,
      formFieldValue: fieldValue,
      fieldType: this.formDictionaryEn[fieldId]?.field_type ?? '',
      labelEn: this.formDictionaryEn[fieldId]?.label ?? '',
      labelSc: this.formDictionarySc[fieldId]?.label ?? '',
      labelTc: this.formDictionaryTc[fieldId]?.label ?? '',
      valueEn: enValue,
      valueSc: scValue,
      valueTc: tcValue
    };
  }

  private getValueFromOptionsArray(optionsObj: Array<any> | null, fieldValue: string): string {
    //Assumption, options/radio/select have two format {label: string, value: string} or {name:string,id:string} Always get by value/id and return label/name
    let result = { label: '', value: '', name:'', id:'' };
    if (optionsObj) {
      result = optionsObj.find((x: { value?: string, id?: string }) => x.value == fieldValue || x.id == fieldValue) ?? result;
    }

    return result.name || result.label;
  }

  private getFieldLabelByProductInterest(fieldId: string): MultiLangFormTemplateObj {
    return {
      formFieldId: fieldId,
      formFieldValue: '',
      fieldType: this.formDictionaryEn[fieldId]?.field_type ?? '',
      labelEn: this.formDictionaryEn[fieldId]?.label ?? '',
      labelSc: this.formDictionarySc[fieldId]?.label ?? '',
      labelTc: this.formDictionaryTc[fieldId]?.label ?? '',
      valueEn: '',
      valueSc: '',
      valueTc: '',
    };
  }

  private getFieldDetailByProductInterest(fieldId: string, fieldValue: string): MultiLangFormTemplateObj {
    return {
      formFieldId: fieldId,
      formFieldValue: fieldValue,
      fieldType: this.formDictionaryEn[fieldId]?.field_type ?? '',
      labelEn: this.formDictionaryEn[fieldId]?.label ?? '',
      labelSc: this.formDictionarySc[fieldId]?.label ?? '',
      labelTc: this.formDictionaryTc[fieldId]?.label ?? '',
      valueEn: this.formDictionaryEn[fieldId]?.options[fieldValue][0]['st_en'] ?? '',
      valueSc: this.formDictionarySc[fieldId]?.options[fieldValue][0]['st_sc'] ?? '',
      valueTc: this.formDictionaryTc[fieldId]?.options[fieldValue][0]['st_tc'] ?? '',
    };
  }

  private getGroupedProductInterestList(teCodeList: string[], fieldId: string): GroupedProductInterestFieldOption[] {
    return teCodeList.reduce(
      (agg: GroupedProductInterestFieldOption[], teCode: string) => {
        const fieldOption = this.formDictionaryEn[fieldId]?.options[teCode]
        if (fieldOption) {
          const convertedFilterOption = this.convertProductInterest(fieldOption[0] as ProductInterestFieldOption)
          const existIA = agg.find(x => x.ia_id == convertedFilterOption.ia_id)
          if (existIA) {
            existIA.st.push(convertedFilterOption.st[0])
          } else {
            agg.push(convertedFilterOption);
          }
        }
        return agg
      }, [])
  }

  private convertProductInterest(productInterestFieldOption: ProductInterestFieldOption): GroupedProductInterestFieldOption{
    return {
      ia_id: productInterestFieldOption.ia_id,
      ia_en: productInterestFieldOption.ia_en,
      ia_tc: productInterestFieldOption.ia_tc,
      ia_sc: productInterestFieldOption.ia_sc,
      st: [{
        st_id: productInterestFieldOption.st_id,
        st_en: productInterestFieldOption.st_en,
        st_tc: productInterestFieldOption.st_tc,
        st_sc: productInterestFieldOption.st_sc,
        te_code: productInterestFieldOption.te_code,
      }],
      nature: productInterestFieldOption.nature,
    }
  }

  private getProductInterestOtherDetail(fieldId: string, fieldValue: string): MultiLangFormTemplateObj {
    return {
      formFieldId: this.formDictionaryEn[fieldId].id_other ?? '',
      formFieldValue: fieldValue,
      fieldType: this.formDictionaryEn[fieldId]?.field_type ? `${this.formDictionaryEn[fieldId]?.field_type}-other` : '',
      labelEn: this.formDictionaryEn[fieldId]?.name_other ?? '',
      labelSc: this.formDictionarySc[fieldId]?.name_other ?? '',
      labelTc: this.formDictionaryTc[fieldId]?.name_other ?? '',
      valueEn: fieldValue,
      valueSc: fieldValue,
      valueTc: fieldValue
    };
  }

  private transformMultiLangFormTemplateObjWithAnchor(formTemplateObj: MultiLangFormTemplateObj) {
    let labelToReplace : Array<keyof MultiLangFormTemplateObj> = []
    let valueToReplace : Array<keyof MultiLangFormTemplateObj> = []
    let anchorLabel = ''
    let anchorValue = ''
    switch (this.anchor) {
      case 'en':
        labelToReplace = ['labelSc','labelTc']
        valueToReplace = ['valueSc','valueTc']
        anchorLabel = formTemplateObj.labelEn
        anchorValue = formTemplateObj.valueEn
        break;
      case 'tc':
        labelToReplace = ['labelSc','labelEn']
        valueToReplace = ['valueSc','valueEn']
        anchorLabel = formTemplateObj.labelTc
        anchorValue = formTemplateObj.valueTc
        break;
      case 'sc':
        labelToReplace = ['labelTc','labelEn']
        valueToReplace = ['valueTc','valueEn']
        anchorLabel = formTemplateObj.labelSc
        anchorValue = formTemplateObj.valueSc
        break;
    }

    this.replacePropertiesValue<MultiLangFormTemplateObj>(formTemplateObj,labelToReplace,anchorLabel)
    this.replacePropertiesValue<MultiLangFormTemplateObj>(formTemplateObj,valueToReplace,anchorValue)
  }

  private replacePropertiesValue<T> (objToReplace:T,objKeys:Array<keyof T>,value: T[keyof T]){
    objKeys.forEach((key) => {
      if(objToReplace[key] as unknown as string == '') {
        objToReplace[key] = value
      }
    })
  }

  private transformMultiLangProductInterestWithAnchor(multiLangProductInterest: MultiLangProductInterest) {
    let labelToReplace : Array<keyof MultiLangFormTemplateObj> = []
    let valueToReplace : Array<keyof MultiLangFormTemplateObj> = []
    let anchorProductInterestLabel = ''
    let anchorProductInterestValue = ''
    let anchorProductInterestOtherLabel = ''
    let anchorProductInterestOtherValue = ''
    switch (this.anchor) {
      case 'en':
        labelToReplace = ['labelSc','labelTc']
        valueToReplace = ['valueSc','valueTc']

        anchorProductInterestLabel = multiLangProductInterest.productInterest.labelEn
        anchorProductInterestValue = multiLangProductInterest.productInterest.valueEn
        anchorProductInterestOtherLabel = multiLangProductInterest.productInterestOther.labelEn
        anchorProductInterestOtherValue = multiLangProductInterest.productInterestOther.valueEn
        break;
      case 'tc':
        labelToReplace = ['labelSc','labelEn']
        valueToReplace = ['valueSc','valueEn']

        anchorProductInterestLabel = multiLangProductInterest.productInterest.labelTc
        anchorProductInterestValue = multiLangProductInterest.productInterest.valueTc
        anchorProductInterestOtherLabel = multiLangProductInterest.productInterestOther.labelTc
        anchorProductInterestOtherValue = multiLangProductInterest.productInterestOther.valueTc
        break;
      case 'sc':
        labelToReplace = ['labelTc','labelEn']
        valueToReplace = ['valueTc','valueEn']

        anchorProductInterestLabel = multiLangProductInterest.productInterest.labelSc
        anchorProductInterestValue = multiLangProductInterest.productInterest.valueSc
        anchorProductInterestOtherLabel = multiLangProductInterest.productInterestOther.labelSc
        anchorProductInterestOtherValue = multiLangProductInterest.productInterestOther.valueSc
        break;
    }

    this.replacePropertiesValue<MultiLangFormTemplateObj>(multiLangProductInterest.productInterest,labelToReplace,anchorProductInterestLabel)
    this.replacePropertiesValue<MultiLangFormTemplateObj>(multiLangProductInterest.productInterest,valueToReplace,anchorProductInterestValue)
    this.replacePropertiesValue<MultiLangFormTemplateObj>(multiLangProductInterest.productInterestOther,labelToReplace,anchorProductInterestOtherLabel)
    this.replacePropertiesValue<MultiLangFormTemplateObj>(multiLangProductInterest.productInterestOther,valueToReplace,anchorProductInterestOtherValue)
  }
}

export class LabelValuePair {
  label: string
  value: string
}

export class NameIdPair {
  name: string
  id: string
}