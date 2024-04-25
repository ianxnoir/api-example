import { VepErrorMsg } from "../../config/exception-constant";
import { SSOUserHeadersDto } from "../../core/decorator/ssoUser.decorator";
import { VepError } from "../../core/exception/exception";
import { FORM_TYPE } from "../formValidation/enum/formType.enum";
import { RegistrationDetailsResponseDto, RegistrationRequestDto } from "./dto/RegistrationRequest.dto";

export class EligibilityUtil {
    // Convert CMS Participant Type
    public static convertParticipantType(formType: string) {
        let returnedParticipantType = '';
        switch (formType) {
            case FORM_TYPE.MISSION:
                returnedParticipantType = 'VIP_MISSION';
                break;
            case FORM_TYPE.CIP:
                returnedParticipantType = 'VIP_CIP';
                break;
            case FORM_TYPE.ORGANIC_BUYER:
            case FORM_TYPE.SEMINAR_LONG:
            case FORM_TYPE.SEMINAR_SHORT:
            case FORM_TYPE.AOR:
            default:
                returnedParticipantType = 'ORGANIC';
        }
        return returnedParticipantType;
    }

    // Get necessary data from Wordpress Site Setting by fairCode
    public static prepareFairSettingDetails(fairSettingData: any): RegistrationDetailsResponseDto {
        try {
            return {
                fiscal_year: fairSettingData?.fiscal_year,
                eoa_fair_id: fairSettingData?.eoa_fair_id,
                fair_registration: fairSettingData?.fair_registration,
                fair_registration_start_datetime: fairSettingData?.fair_registration_start_datetime,
                fair_registration_end_datetime: fairSettingData?.fair_registration_end_datetime,
                always_on_form_display: fairSettingData?.always_on_form_display,
                aor_form_registration_start_datetime: fairSettingData?.aor_form_registration_start_datetime,
                aor_form_registration_end_datetime: fairSettingData?.aor_form_registration_end_datetime,
                cip_form_registration: fairSettingData?.cip_form_registration,
                cip_form_registration_start_datetime: fairSettingData?.cip_form_registration_start_datetime,
                cip_form_registration_end_datetime: fairSettingData?.cip_form_registration_end_datetime,
                mission_form_registration: fairSettingData?.mission_form_registration,
                mission_form_registration_start_datetime: fairSettingData?.mission_form_registration_start_datetime,
                mission_form_registration_end_datetime: fairSettingData?.mission_form_registration_end_datetime,
                seminar_registration: fairSettingData?.seminar_registration,
                seminar_registration_start_datetime: fairSettingData?.seminar_registration_start_datetime,
                seminar_registration_end_datetime: fairSettingData?.seminar_registration_end_datetime,
            };
        } catch (error) {
            throw new VepError(VepErrorMsg.Prepare_Fair_Setting_Details_Error, error.message);
        }
    }

    public static getEmailId(isLogined: boolean, ssoUser: SSOUserHeadersDto | null, query: RegistrationRequestDto): string { 
        try{
            return isLogined && ssoUser ? ssoUser?.emailId : query.emailId
        } catch (error){
            throw new VepError(VepErrorMsg.Fail_To_Get_EmailId, error.message); 
        }
    }
}