import { Injectable } from "@nestjs/common";
import { Logger } from "../../core/utils";
import { CouncilwiseDataType, GeneralDefinitionDataRequestDTOType, SsoDataType } from "../api/content/content.enum";
import { ContentService } from "../api/content/content.service";
import { BusinessRuleField } from "./businessRuleField";
import { FormDataDictionaryDto } from "./dto/formDataDicionary.dto";
import { FormSubmitMetaData } from "./dto/formSubmitMetaData.dto";
import { FormStepValidStatusDto, FormValidationDto, FormValidationErrorDto } from "./dto/formValidation.dto";
import { BusinessRuleFormValidationCode } from "./enum/businessRuleFormValidationCode.enum"
import { DedicateDataFieldEnum } from "./enum/dedicateDataField.enum";
import { FORM_TYPE } from "./enum/formType.enum";
import { ContentCacheService } from '../api/content/content-cache.service';

@Injectable()
export class BusinessRuleFormValidationService {
  constructor(
    private logger: Logger,
    private contentService: ContentService,
    private contentCacheService: ContentCacheService
  ) {
    this.logger.setContext(BusinessRuleFormValidationService.name);
  }

  private async validateField(formType: string, fieldId: string, formDataDict: FormDataDictionaryDto, formStepId: string = ""): Promise<FormValidationErrorDto | null> {
    let formValidationErrorCode = "";
    switch (fieldId) {
      case DedicateDataFieldEnum.br_title:
        // required for Organic, AOR, CIP, Mission
        // check length <= 5
        // check exist in councilwide list
        // hidden task: cache councilwide list to local cache
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION, FORM_TYPE.AOR])
            .checkTextLength(0, 5)
            .checkCouncilwiseData(this.contentCacheService, GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.salutation)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_first_name:
        // required for Organic, AOR, CIP, Mission
        // check length <= 30
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION, FORM_TYPE.AOR])
            .checkTextLength(0, 30)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_last_name:
        // required for Organic, AOR, CIP, Mission
        // check length <= 30
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION, FORM_TYPE.AOR])
            .checkTextLength(0, 30)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_email:
        // required for Organic, AOR, CIP, Mission
        // check length <= 150
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION, FORM_TYPE.AOR])
            .checkTextLength(0, 150)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_position:
        // required for Organic, AOR, CIP, Mission
        // check length <= 80
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION, FORM_TYPE.AOR])
            .checkTextLength(0, 80)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_country_code_mobile:
        // required for Organic, AOR, CIP, Mission
        // check length <= 10
        // check exist in councilwide list (ID12)
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkTextLength(0, 10)
            .checkCouncilwiseData(this.contentCacheService, GeneralDefinitionDataRequestDTOType.tel, CouncilwiseDataType['idd-country'])
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_mobile_number:
        // required for Organic, AOR, CIP, Mission
        // check length <= 30
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkTextLength(0, 30)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_company_name:
        // required for Organic, AOR, CIP, Mission
        // check length <= 100
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION, FORM_TYPE.AOR])
            .checkTextLength(0, 100)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_country_code_company:
        // required for Organic, CIP, Mission
        // check length <= 10
        // check council IDD list
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkTextLength(0, 10)
            .checkCouncilwiseData(this.contentCacheService, GeneralDefinitionDataRequestDTOType.tel, CouncilwiseDataType['idd-country'])
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_area_code_company:
        // required for Organic, CIP, Mission
        // check length <= 8
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkTextLength(0, 8)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_company_number:
        // required for Organic, CIP, Mission
        // check length <= 30
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkTextLength(0, 30)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_extension_company:
        // required for Organic, CIP, Mission
        // check length <= 15
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkTextLength(0, 15)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_company_website:
        // check length <= 150
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkTextLength(0, 150)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_company_background:
        // required for Organic, CIP, Mission
        // check length <= 1300
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkTextLength(0, 1300)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_outlets_no:
        // check length <= 30
        // number only
        // optional field
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkTextLength(0, 30)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_password:
        // check length <= 20, >= 8
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkTextLength(8, 20)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_confirm_password:
        // check length <= 20, >= 8
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkTextLength(8, 20)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_upload_photo:
        // optional
        break;
      case DedicateDataFieldEnum.br_company_logo:
        // optional
        break;
      case DedicateDataFieldEnum.br_hotel_list:

        break;
      case DedicateDataFieldEnum.br_room_type:

        break;
      // Seminar related field
      case DedicateDataFieldEnum.br_sbe_event_list:
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkSbeEventList()
            .getFormValidationErrorCode()
        break;
        
      case DedicateDataFieldEnum.br_address_line_1:
        // check length <= 60
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkTextLength(0, 60)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_address_line_2:
        // check length <= 60
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkTextLength(0, 60)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_address_line_3:
        // check length <= 60
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkTextLength(0, 60)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_address_line_4:
        // check length <= 60  
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkTextLength(0, 60)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_address_postal_code:
        // check length <= 15
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkTextLength(0, 15)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_address_country:
        // required for Organic, AOR, CIP, Mission
        // check length <= 3
        // check exist in council list
        // check exist in sso list
        // check exist in council region list 
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION, FORM_TYPE.AOR])
            .checkTextLength(0, 3)
            .checkCouncilwiseData(this.contentCacheService, GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.country)
            .checkSsoData(this.contentService, GeneralDefinitionDataRequestDTOType.code, SsoDataType.countryV2)
            .checkCouncilwiseData(this.contentCacheService, GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType["region-country"])
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_address_state:
        // check length <= 4
        // check exist in council list
        // check exist in sso list
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId],
            {
              [DedicateDataFieldEnum.br_address_country]: formDataDict[DedicateDataFieldEnum.br_address_country]
            })
            .checkTextLength(0, 4)
            .checkCouncilStateProvince(this.contentService)
            .checkSsoStateProvince(this.contentService)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_address_city:
        // check length <= 4
        // check exist in council list
        // check exist in sso list
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId],
            {
              [DedicateDataFieldEnum.br_address_country]: formDataDict[DedicateDataFieldEnum.br_address_country],
              [DedicateDataFieldEnum.br_address_state]: formDataDict[DedicateDataFieldEnum.br_address_state],
            })
            .checkTextLength(0, 4)
            .checkCouncilCity(this.contentService)
            .checkSsoCity(this.contentService)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_business_nature:
        // required for Organic, CIP, Mission
        // check exist in council list (ID33)
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkCouncilwiseData(this.contentCacheService, GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.nob, true)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_bm_product_interest:
        // teCode
        // required for Organic, CIP, Mission
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkProductInterest(this.contentService)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_bm_product_interest_licensing:
        // teCode
        // optional, check only when presented
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkProductInterest(this.contentService)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_bm_product_interest_ip:
        // teCode
         // optional, check only when presented
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkProductInterest(this.contentService)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_bm_target_supplier:
        // required for Organic, CIP, Mission
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkCouncilwiseData(this.contentCacheService, GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType["product-stragetyV2"], true)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_bm_prefer_timeslot:
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkPreferredTimeslotFormat()
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_bm_product_interest_other:
      case DedicateDataFieldEnum.br_bm_product_interest_ip_other:
      case DedicateDataFieldEnum.br_bm_product_interest_licensing_other:
        // TBC
        break;
      case DedicateDataFieldEnum.br_bm_prefer_supplier_country:
        // required for Organic, CIP, Mission
        formValidationErrorCode =
          await new BusinessRuleField(formType, formDataDict[fieldId])
            .checkRequiredInFormType([FORM_TYPE.ORGANIC_BUYER, FORM_TYPE.CIP, FORM_TYPE.MISSION])
            .checkCouncilwiseData(this.contentCacheService, GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType["target-marketV2"], true)
            .getFormValidationErrorCode()
        break;
      case DedicateDataFieldEnum.br_consent_registration_detail:
        // TBC
        break;
      case DedicateDataFieldEnum.br_concent_privacy_policy_statement:
        // TBC
        break;
      case DedicateDataFieldEnum.br_concent_eu_eea_clause:
        // TBC
        break;
      case DedicateDataFieldEnum.br_concent_click2match:
        // TBC
        break;
      default:
        formValidationErrorCode = BusinessRuleFormValidationCode.DEFINITION_NOT_IMPLEMENTED
    }
    if (!formValidationErrorCode) {
      return null
    } else {
      return {
        formStepId,
        fieldId,
        formValidationErrorType: "",
        formValidationErrorCode,
      }
    }
  }

  private async validateSubmittedData(formType: string, formDataDict: FormDataDictionaryDto, formSubmitMetaData: FormSubmitMetaData): Promise<FormValidationDto> {
    let stepValidationDto = new FormValidationDto;

    // validation rules
    for (let fieldId of Object.keys(formDataDict)) {
      if (Object.values(DedicateDataFieldEnum).includes(fieldId)) {
        const validationResult = await this.validateField(formType, fieldId, formDataDict, formSubmitMetaData.stepIdToSubmit)
        if (validationResult) {
          stepValidationDto.formValidationError.push(validationResult)
        }
      }
    }

    stepValidationDto.formStepValidStatus = [
      {
        formStepId: formSubmitMetaData.stepIdToSubmit,
        isStepValid: stepValidationDto.formValidationError.length == 0
      }
    ]
    return stepValidationDto
  }

  private async validateForm(formType: string, formDataDict: FormDataDictionaryDto): Promise<FormValidationDto> {
    let formValidationDto = new FormValidationDto;
    // for each business rule field, perform validation
    for (let fieldId of Object.values(DedicateDataFieldEnum)) {
      // if form field not found, add to validation error
      const validationResult = await this.validateField(formType, fieldId, formDataDict)
      if (validationResult) {
        formValidationDto.formValidationError.push(validationResult)
      }
    }

    return formValidationDto
  }

  public async validateFormByBusinessRule(formType: string, formDataDict: FormDataDictionaryDto, formSubmitMetaData: FormSubmitMetaData): Promise<FormValidationDto> {
    if (formSubmitMetaData.isValidateStepOnly) {
      // check fields in step which is business field 
      return await this.validateSubmittedData(formType, formDataDict, formSubmitMetaData)
    } else {
      // checking all fields in business field list
      const brValidationResult = await this.validateForm(formType, formDataDict)
      brValidationResult.formStepValidStatus = brValidationResult.formValidationError.reduce(
        (aggResult: FormStepValidStatusDto[], error: FormValidationErrorDto) => {
          if (!aggResult.find(x => x.formStepId == error.formStepId)) {
            aggResult.push(
              {
                formStepId: error.formStepId,
                isStepValid: false,
              }
            )
          }
          return aggResult
        }
        , [])

      return brValidationResult
    }
  }
}
