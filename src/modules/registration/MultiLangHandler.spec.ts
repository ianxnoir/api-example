import {
  FormTemplateDto,
  FormTemplateFieldItemDto,
  FormTemplateStepDto,
  MuiltiLangFormTemplate
} from '../api/content/dto/formTemplate.dto';
import { MultiLangTemplateHandler } from './MultiLangHandler';

beforeAll(async () => {
  jest.clearAllMocks()
})


describe('MultiLangHandler getFieldDetail should always return string in fieldValue',() => {
  let multiLangTemplate = new MuiltiLangFormTemplate();
  multiLangTemplate.formEn = new FormTemplateDto();
  multiLangTemplate.formEn.form_data = {
    form_type: 'dummy',
    form_obj: [new FormTemplateStepDto()]
  }
  multiLangTemplate.formEn.form_data.form_obj[0].field_items = []
  let fieldItems = multiLangTemplate.formEn.form_data.form_obj[0].field_items

  //Construct form data field

  //field name text
  let simpleTextField = new FormTemplateFieldItemDto();
  simpleTextField.id = "text"
  simpleTextField.field_type = "text"
  simpleTextField.label = "english label"
  fieldItems.push(simpleTextField)

  let multiLangHandler = new MultiLangTemplateHandler(multiLangTemplate)
  it('should get string result successful when input boolean',()=> {
    let fieldDetail = multiLangHandler.getFieldDetail('text', true as unknown as string)
    expect(fieldDetail).toEqual({
      fieldType: "text",
      formFieldId: "text",
      formFieldValue: "true",
      labelEn: "english label",
      labelSc: "english label",
      labelTc: "english label",
      valueEn: "true",
      valueSc: "true",
      valueTc: "true"
    })
  })

  it('should get string result successful when input number',()=> {
    let fieldDetail = multiLangHandler.getFieldDetail('text', 123 as unknown as string)
    expect(fieldDetail).toEqual({
      fieldType: "text",
      formFieldId: "text",
      formFieldValue: "123",
      labelEn: "english label",
      labelSc: "english label",
      labelTc: "english label",
      valueEn: "123",
      valueSc: "123",
      valueTc: "123"
    })
  })

  it('should get string result successful when input null',()=> {
    let fieldDetail = multiLangHandler.getFieldDetail('text', null as unknown as string)
    expect(fieldDetail).toEqual({
      fieldType: "text",
      formFieldId: "text",
      formFieldValue: "",
      labelEn: "english label",
      labelSc: "english label",
      labelTc: "english label",
      valueEn: "",
      valueSc: "",
      valueTc: ""
    })
  })
})


describe('MultiLangHandler test getFieldDetail by type',()=> {
  let multiLangTemplate = new MuiltiLangFormTemplate();
  multiLangTemplate.formEn = new FormTemplateDto();
  multiLangTemplate.formEn.form_data = {
    form_type :'dummy',
    form_obj : [new FormTemplateStepDto()]
  }
  multiLangTemplate.formEn.form_data.form_obj[0].field_items= []
  let fieldItems = multiLangTemplate.formEn.form_data.form_obj[0].field_items

  //Construct form data field

  //field type generic-hktdc-checkbox
  let genericTdcCheckBoxItem = new FormTemplateFieldItemDto();
  genericTdcCheckBoxItem.id = "tdc-checkbox-id"
  genericTdcCheckBoxItem.field_type = "generic-hktdc-checkbox"
  genericTdcCheckBoxItem.label = "Tdc checkbox label"
  genericTdcCheckBoxItem.options = [{label:'Meaningful Value',value:'meaningfulvalue1'}, {label:'Not So Meaningful Value', value:'nonmeaningfulvalue2'}]
  fieldItems.push(genericTdcCheckBoxItem)

  //field type generic-dropdown
  let genericDropDownItem = new FormTemplateFieldItemDto();
  genericDropDownItem.id = "generic-dropdown-id"
  genericDropDownItem.field_type = "generic-dropdown"
  genericDropDownItem.label = "Tdc generic dropdown label"
  genericDropDownItem.options = [{label:'Meaningful Drop Down Value',value:'meaningfuldropdownvalue1'}, {label:'Not So Meaningful Drop Down Value', value:'nonmeaningfuldropdownvalue2'}]
  fieldItems.push(genericDropDownItem)

  //field type generic-radio
  let genericRadioItem = new FormTemplateFieldItemDto();
  genericRadioItem.id = "generic-radio-id"
  genericRadioItem.field_type = "generic-radio"
  genericRadioItem.label = "Tdc generic radio label"
  genericRadioItem.options = [{label:'Meaningful Radio Value',value:'meaningfulradiovalue1'}, {label:'Not So Meaningful Radio Value', value:'nonmeaningfulradiovalue2'}]
  fieldItems.push(genericRadioItem)

  //field type select
  let selectItem = new FormTemplateFieldItemDto();
  selectItem.id = "select-id"
  selectItem.field_type = "select"
  selectItem.label = "Tdc generic select label"
  selectItem.options = [{name:'Meaningful Select Value',id:'meaningfulselectvalue1'}, {name:'Not So Meaningful Select Value', id:'nonmeaningfulselectvalue2'}]
  fieldItems.push(selectItem)

  //field type generic-acceptance
  let accpetanceItem = new FormTemplateFieldItemDto();
  accpetanceItem.id = "generic-acceptance-id"
  accpetanceItem.field_type = "generic-acceptance"
  accpetanceItem.label = "Tdc generic accept label"
  accpetanceItem.acceptance_text = "Accpeted"
  fieldItems.push(accpetanceItem)

  //field type hktdc-consent
  let consentItem = new FormTemplateFieldItemDto();
  consentItem.id = "hktdc-consent-id"
  consentItem.field_type = "hktdc-consent"
  consentItem.label = "Tdc consent label"
  consentItem.acceptance_text = "Consent"
  fieldItems.push(consentItem)

  //field type currency
  //Assumption currency is always under currency-generic
  let currencyParent = new FormTemplateFieldItemDto();
  currencyParent.currency_label = 'HKD'
  currencyParent.field_type = 'currency-generic'
  currencyParent.id = 'currencyParent'
  currencyParent.field_items = []

  let currencyChild = new FormTemplateFieldItemDto();
  currencyChild.label = 'Some Currency'
  currencyChild.field_type = 'currency'
  currencyChild.id = 'currencyChild'

  currencyParent.field_items.push(currencyChild)
  fieldItems.push(currencyParent)
  let multiLangHandler = new MultiLangTemplateHandler(multiLangTemplate)

  it('should get field detail successful - field type "tdc-checkbox-id"',()=>{
    let fieldDetail = multiLangHandler.getFieldDetail('tdc-checkbox-id','meaningfulvalue1')
    let expectedResult = {
      "fieldType": "generic-hktdc-checkbox",
      "formFieldId": "tdc-checkbox-id",
      "formFieldValue": "meaningfulvalue1",
      "labelEn": "Tdc checkbox label",
      "labelSc": "Tdc checkbox label",
      "labelTc": "Tdc checkbox label",
      "valueEn": "Meaningful Value",
      "valueSc": "Meaningful Value",
      "valueTc": "Meaningful Value"
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get field detail successful - field type "generic-dropdown"',()=>{
    let fieldDetail = multiLangHandler.getFieldDetail('generic-dropdown-id','meaningfuldropdownvalue1')
    let expectedResult = {
      "fieldType": "generic-dropdown",
      "formFieldId": "generic-dropdown-id",
      "formFieldValue": "meaningfuldropdownvalue1",
      "labelEn": "Tdc generic dropdown label",
      "labelSc": "Tdc generic dropdown label",
      "labelTc": "Tdc generic dropdown label",
      "valueEn": "Meaningful Drop Down Value",
      "valueSc": "Meaningful Drop Down Value",
      "valueTc": "Meaningful Drop Down Value"
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get field detail successful - field type "select" ',()=>{
    let fieldDetail = multiLangHandler.getFieldDetail('select-id','nonmeaningfulselectvalue2')
    let expectedResult = {
      "fieldType": "select",
      "formFieldId": "select-id",
      "formFieldValue": "nonmeaningfulselectvalue2",
      "labelEn": "Tdc generic select label",
      "labelSc": "Tdc generic select label",
      "labelTc": "Tdc generic select label",
      "valueEn": "Not So Meaningful Select Value",
      "valueSc": "Not So Meaningful Select Value",
      "valueTc": "Not So Meaningful Select Value"
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get accepted field value successful - field type "generic-acceptance" ',()=>{
    let fieldDetail = multiLangHandler.getFieldDetail('generic-acceptance-id','true')
    let expectedResult = {
      "fieldType": "generic-acceptance",
      "formFieldId": "generic-acceptance-id",
      "formFieldValue": "Y",
      "labelEn": "Tdc generic accept label",
      "labelSc": "Tdc generic accept label",
      "labelTc": "Tdc generic accept label",
      "valueEn": "Accpeted",
      "valueSc": "Accpeted",
      "valueTc": "Accpeted"
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get empty accepted field successful - field type "generic-acceptance" ',()=>{
    let fieldDetail = multiLangHandler.getFieldDetail('generic-acceptance-id','false')
    let expectedResult = {
      "fieldType": "generic-acceptance",
      "formFieldId": "generic-acceptance-id",
      "formFieldValue": "N",
      "labelEn": "Tdc generic accept label",
      "labelSc": "Tdc generic accept label",
      "labelTc": "Tdc generic accept label",
      "valueEn": "",
      "valueSc": "",
      "valueTc": ""
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get form field value U with empty field value - field type "generic-acceptance" ',()=>{
    let fieldDetail = multiLangHandler.getFieldDetail('generic-acceptance-id','')
    let expectedResult = {
      "fieldType": "generic-acceptance",
      "formFieldId": "generic-acceptance-id",
      "formFieldValue": "U",
      "labelEn": "Tdc generic accept label",
      "labelSc": "Tdc generic accept label",
      "labelTc": "Tdc generic accept label",
      "valueEn": "",
      "valueSc": "",
      "valueTc": ""
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get accepted field value successful with field type "hktdc-consent" ',()=>{
    let fieldDetail = multiLangHandler.getFieldDetail('hktdc-consent-id','true')
    let expectedResult = {
      "fieldType": "hktdc-consent",
      "formFieldId": "hktdc-consent-id",
      "formFieldValue": "Y",
      "labelEn": "Tdc consent label",
      "labelSc": "Tdc consent label",
      "labelTc": "Tdc consent label",
      "valueEn": "Consent",
      "valueSc": "Consent",
      "valueTc": "Consent"
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get empty accepted field successful with field type "hktdc-consent" ',()=>{
    let fieldDetail = multiLangHandler.getFieldDetail('hktdc-consent-id','false')
    let expectedResult = {
      "fieldType": "hktdc-consent",
      "formFieldId": "hktdc-consent-id",
      "formFieldValue": "N",
      "labelEn": "Tdc consent label",
      "labelSc": "Tdc consent label",
      "labelTc": "Tdc consent label",
      "valueEn": "",
      "valueSc": "",
      "valueTc": ""
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get value U with empty field value -  field type "hktdc-consent" ',()=>{
    let fieldDetail = multiLangHandler.getFieldDetail('hktdc-consent-id','')
    let expectedResult = {
      "fieldType": "hktdc-consent",
      "formFieldId": "hktdc-consent-id",
      "formFieldValue": "U",
      "labelEn": "Tdc consent label",
      "labelSc": "Tdc consent label",
      "labelTc": "Tdc consent label",
      "valueEn": "",
      "valueSc": "",
      "valueTc": ""
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get value with currency label - field type "currency" ',()=> {
    let fieldDetail = multiLangHandler.getFieldDetail('currencyParent.currencyChild','100')
    //Only supply currency label when related formTemplate provide currency label.
    let expectedResult = {
      "fieldType": "currency",
      "formFieldId": "currencyParent.currencyChild",
      "formFieldValue": "100",
      "labelEn": "Some Currency",
      "labelSc": "Some Currency",
      "labelTc": "Some Currency",
      "valueEn": "HKD:100",
      "valueSc": "100",
      "valueTc": "100"
    }
    expect(fieldDetail).toEqual(expectedResult)
  })
})

/**
 * All dedicated fields have special rule, eg: nested object
 */
describe('MultiLangHandler test getFieldDetail by dedicate fields',()=> {
  let multiLangTemplate = new MuiltiLangFormTemplate();
  multiLangTemplate.formEn = new FormTemplateDto();
  multiLangTemplate.formEn.form_data = {
    form_type: 'dummy',
    form_obj: [new FormTemplateStepDto()]
  }
  multiLangTemplate.formEn.form_data.form_obj[0].field_items = []
  let fieldItems = multiLangTemplate.formEn.form_data.form_obj[0].field_items

  //Construct form data field

  //field name br_address_5_8
  let brAddress58 = new FormTemplateFieldItemDto();
  brAddress58.id = "br_address_5_8"
  brAddress58.field_type = "hktdc-address5-8"
  brAddress58.field_items = []
  fieldItems.push(brAddress58)

  let brAddressPostalCode = new FormTemplateFieldItemDto();
  brAddressPostalCode.id = "br_address_postal_code"
  brAddressPostalCode.field_type = "text"
  brAddressPostalCode.label = "Postal Code"
  brAddress58.field_items.push(brAddressPostalCode)

  let brAddressCountry = new FormTemplateFieldItemDto();
  brAddressCountry.id = "br_address_country"
  brAddressCountry.field_type = "select"
  brAddressCountry.label = 'Country /Region'
  brAddressCountry.options = [{label:'Aruba',value:'ABW'}, {label:'Afghanistan', value:'AFG'}]
  brAddress58.field_items.push(brAddressCountry)

  let brAddressState = new FormTemplateFieldItemDto();
  brAddressState.id = "br_address_state"
  brAddressState.field_type = "select"
  brAddressState.label = 'State /Province'
  brAddressState.options = [{ABW:[{label:'New South Wales',value:'NSW'}]}]
  brAddress58.field_items.push(brAddressState)

  let brAddressCity = new FormTemplateFieldItemDto();
  brAddressCity.id = "br_address_city"
  brAddressCity.field_type = "select"
  brAddressCity.label = 'City'
  brAddressCity.options = [{ABW:[{NSW:[{label:'Agagama',value:'CIT'}]}]}]
  brAddress58.field_items.push(brAddressCity)

  let multiLangHandler = new MultiLangTemplateHandler(multiLangTemplate)
  it('should get field detail successful with field name "br_address_5_8.br_address_city" ',() => {
    let additionalInfo = { countryCodeFieldData: "ABW", stateProvinceCodeFieldData: "NSW" }
    let fieldDetail = multiLangHandler.getFieldDetail("br_address_5_8.br_address_city","CIT",additionalInfo)
    let expectedResult = {
      "fieldType": "select",
      "formFieldId": "br_address_5_8.br_address_city",
      "formFieldValue": "CIT",
      "labelEn": "City",
      "labelSc": "City",
      "labelTc": "City",
      "valueEn": "Agagama",
      "valueSc": "Agagama",
      "valueTc": "Agagama"
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get empty value field detail with field name "br_address_5_8.br_address_city" without giving enough information ',() => {
    let additionalInfo = { countryCodeFieldData: "", stateProvinceCodeFieldData: "" }
    let fieldDetail = multiLangHandler.getFieldDetail("br_address_5_8.br_address_city","CIT",additionalInfo)
    let expectedResult = {
      "fieldType": "select",
      "formFieldId": "br_address_5_8.br_address_city",
      "formFieldValue": "CIT",
      "labelEn": "City",
      "labelSc": "City",
      "labelTc": "City",
      "valueEn": "",
      "valueSc": "",
      "valueTc": ""
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get empty value field detail with field name "br_address_5_8.br_address_city" without additional info',() => {
    let additionalInfo = { countryCodeFieldData: "", stateProvinceCodeFieldData: "" }
    let fieldDetail = multiLangHandler.getFieldDetail("br_address_5_8.br_address_city","CIT",additionalInfo)
    let expectedResult = {
      "fieldType": "select",
      "formFieldId": "br_address_5_8.br_address_city",
      "formFieldValue": "CIT",
      "labelEn": "City",
      "labelSc": "City",
      "labelTc": "City",
      "valueEn": "",
      "valueSc": "",
      "valueTc": ""
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get field detail successful with field name "br_address_5_8.br_address_state" ',() => {
    let additionalInfo = { countryCodeFieldData: "ABW", stateProvinceCodeFieldData: "NSW" }
    let fieldDetail = multiLangHandler.getFieldDetail("br_address_5_8.br_address_state","NSW",additionalInfo)
    let expectedResult = {
      "fieldType": "select",
      "formFieldId": "br_address_5_8.br_address_state",
      "formFieldValue": "NSW",
      "labelEn": "State /Province",
      "labelSc": "State /Province",
      "labelTc": "State /Province",
      "valueEn": "New South Wales",
      "valueSc": "New South Wales",
      "valueTc": "New South Wales"
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get empty value field detail with field name "br_address_5_8.br_address_city" without giving enough information ',() => {
    let additionalInfo = { countryCodeFieldData: "", stateProvinceCodeFieldData: "" }
    let fieldDetail = multiLangHandler.getFieldDetail("br_address_5_8.br_address_state","NSW",additionalInfo)
    let expectedResult = {
      "fieldType": "select",
      "formFieldId": "br_address_5_8.br_address_state",
      "formFieldValue": "NSW",
      "labelEn": "State /Province",
      "labelSc": "State /Province",
      "labelTc": "State /Province",
      "valueEn": "",
      "valueSc": "",
      "valueTc": ""
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get empty value field detail with field name "br_address_5_8.br_address_city" without additional info',() => {
    let fieldDetail = multiLangHandler.getFieldDetail("br_address_5_8.br_address_state","NSW")
    let expectedResult = {
      "fieldType": "select",
      "formFieldId": "br_address_5_8.br_address_state",
      "formFieldValue": "NSW",
      "labelEn": "State /Province",
      "labelSc": "State /Province",
      "labelTc": "State /Province",
      "valueEn": "",
      "valueSc": "",
      "valueTc": ""
    }
    expect(fieldDetail).toEqual(expectedResult)
  })

  it('should get field detail successful with field name "br_address_5_8.br_address_country" ',() => {
    let fieldDetail = multiLangHandler.getFieldDetail("br_address_5_8.br_address_country","ABW")
    let expectedResult = {
      "fieldType": "select",
      "formFieldId": "br_address_5_8.br_address_country",
      "formFieldValue": "ABW",
      "labelEn": "Country /Region",
      "labelSc": "Country /Region",
      "labelTc": "Country /Region",
      "valueEn": "Aruba",
      "valueSc": "Aruba",
      "valueTc": "Aruba"
    }
    expect(fieldDetail).toEqual(expectedResult)
  })
})

describe('Get field anchor logic',()=> {
  //en
  let engMultiLangTemplate = new MuiltiLangFormTemplate();
  engMultiLangTemplate.formEn = new FormTemplateDto();
  engMultiLangTemplate.formEn.form_data = {
    form_type: 'dummy',
    form_obj: [new FormTemplateStepDto()]
  }
  engMultiLangTemplate.formEn.form_data.form_obj[0].field_items = []
  let enFieldItems = engMultiLangTemplate.formEn.form_data.form_obj[0].field_items
  let engFieldType = new FormTemplateFieldItemDto();
  engFieldType.id = "text"
  engFieldType.field_type = "text"
  engFieldType.label = "english label"
  enFieldItems.push(engFieldType)


  let enOnlyMultiLangHandler = new MultiLangTemplateHandler(engMultiLangTemplate,'en')
  let scOnlyMultiLangHandler = new MultiLangTemplateHandler(engMultiLangTemplate,'sc')
  let tcOnlyMultiLangHandler = new MultiLangTemplateHandler(engMultiLangTemplate,'tc')

  it('should replace empty label with en when select en as anchor',()=>{
    let fieldDetail = enOnlyMultiLangHandler.getFieldDetail('text','value')
    expect(fieldDetail).toEqual({
      "fieldType": "text",
      "formFieldId": "text",
      "formFieldValue": "value",
      "labelEn": "english label",
      "labelSc": "english label",
      "labelTc": "english label",
      "valueEn": "value",
      "valueSc": "value",
      "valueTc": "value"
    })
  })

  it('should replace empty label with tc template label when select tc as anchor',()=>{
    let fieldDetail = scOnlyMultiLangHandler.getFieldDetail('text','value')
    expect(fieldDetail).toEqual({
      "fieldType": "",
      "formFieldId": "text",
      "formFieldValue": "value",
      "labelEn": "english label",
      "labelSc": "",
      "labelTc": "",
      "valueEn": "value",
      "valueSc": "value",
      "valueTc": "value"
    })
  })

  it('should replace empty label with sc template label when select sc as anchor',()=>{
    let fieldDetail = tcOnlyMultiLangHandler.getFieldDetail('text','value')
    expect(fieldDetail).toEqual({
      "fieldType": "",
      "formFieldId": "text",
      "formFieldValue": "value",
      "labelEn": "english label",
      "labelSc": "",
      "labelTc": "",
      "valueEn": "value",
      "valueSc": "value",
      "valueTc": "value"
    })
  })
})

describe('MultiLangHandler test getFieldDetail by lang',()=> {
  let multiLangTemplate = new MuiltiLangFormTemplate();
  multiLangTemplate.formEn = new FormTemplateDto();
  multiLangTemplate.formEn.form_data = {
    form_type: 'dummy',
    form_obj: [new FormTemplateStepDto()]
  }
  multiLangTemplate.formEn.form_data.form_obj[0].field_items = []
  let fieldItems = multiLangTemplate.formEn.form_data.form_obj[0].field_items

  //Construct form data field

  //field name text
  let simpleTextField = new FormTemplateFieldItemDto();
  simpleTextField.id = "text"
  simpleTextField.field_type = "text"
  simpleTextField.label = "english label"
  fieldItems.push(simpleTextField)

  let tcMultiFormHandler = new MultiLangTemplateHandler(multiLangTemplate,'tc')
  it('should get english text successful',()=>{
    let fieldDetail = tcMultiFormHandler.getFieldDetailByLang('text','textValue','en')
    expect(fieldDetail).toEqual({
      formFieldId: 'text',
      formFieldValue: 'textValue',
      fieldType: "",
      label: 'english label',
      value: 'textValue'
    })
  })

  it('should get tc empty text successful',()=>{
    let fieldDetail = tcMultiFormHandler.getFieldDetailByLang('text','textValue','tc')
    expect(fieldDetail).toEqual({
      formFieldId: 'text',
      formFieldValue: 'textValue',
      fieldType: "",
      label: '',
      value: 'textValue'
    })
  })

  it('should get sc empty text successful',()=>{
    let fieldDetail = tcMultiFormHandler.getFieldDetailByLang('text','textValue','sc')
    expect(fieldDetail).toEqual({
      formFieldId: 'text',
      formFieldValue: 'textValue',
      fieldType: "",
      label: '',
      value: 'textValue'
    })
  })
})

describe('fieldExistInAnyTemplate function',() => {
  let multiLangTemplate = new MuiltiLangFormTemplate();
  multiLangTemplate.formEn = new FormTemplateDto();
  multiLangTemplate.formEn.form_data = {
    form_type: 'dummy',
    form_obj: [new FormTemplateStepDto()]
  }
  multiLangTemplate.formEn.form_data.form_obj[0].field_items = []
  let fieldItems = multiLangTemplate.formEn.form_data.form_obj[0].field_items

  //Construct form data field

  //field name text
  let simpleTextField = new FormTemplateFieldItemDto();
  simpleTextField.id = "text"
  simpleTextField.field_type = "text"
  simpleTextField.label = "english label"
  fieldItems.push(simpleTextField)

  let multiLangHandler = new MultiLangTemplateHandler(multiLangTemplate)
  it('should return true when form field found ',()=> {
    let result = multiLangHandler.fieldExistInAnyTemplate('text')
    expect(result).toEqual(true)
  })

  it('should return false when form field found ',()=> {
    let result = multiLangHandler.fieldExistInAnyTemplate('imaginary field')
    expect(result).toEqual(false)
  })
})
