import { constant } from "../../../config/constant";
import { RegistrationDataSqsJsonFieldEnum } from "./RegistrationDataSqsJson.enum";

export const RegistrationDataSqsJsonDefaultValue = {
    [RegistrationDataSqsJsonFieldEnum.sourceTypeCode] : constant.submitFormDefaultValue.SourceTypeCode,
    [RegistrationDataSqsJsonFieldEnum.tier] : constant.submitFormDefaultValue.Tier,
    [RegistrationDataSqsJsonFieldEnum.actionType] : constant.actionType.VEP_REG_BUYER,
    [RegistrationDataSqsJsonFieldEnum.overseasBranchOffice] : 'HK',
  }