import { Injectable } from "@nestjs/common";
import { VepErrorMsg } from "../../config/exception-constant";
import moment from 'moment';
import { SSOUserHeadersDto } from "../../core/decorator/ssoUser.decorator";
import { VepError } from "../../core/exception/exception";
import { Logger } from '../../core/utils';
import { BuyerService } from "../api/buyer/buyer.service";
import { ExhibitorService } from "../api/exhibitor/exhibitor.service";
import { FairDbService } from "../fairDb/fairDb.service";
import { FORM_TYPE } from "../formValidation/enum/formType.enum";
import { EligibilityResponseDto, RegistrationDetailsResponseDto, RegistrationRequestDto, RegistrationStatusCode } from "./dto/RegistrationRequest.dto";
import { RegistrationUtil } from "./registration.util";
import { ELIGIBILITY_RESPONSE_CODE, PARTICIPANT_TYPE_PRIORITY } from "./dto/SubmitForm.enum";
import { XTraceDto } from "../../core/decorator/xTraceId.decorator";
import { FairRegistration } from "../../dao/FairRegistration";
import { EligibilityUtil } from "./eligibility.util";

@Injectable()
export class EligibilityService {
    api_call: string = 'api_call';
    exception_raised: string = 'exception_raised';

    constructor(
        private logger: Logger,
        private exhibitorService: ExhibitorService,
        private buyerService: BuyerService,
        private fairDbService: FairDbService,
    ) {
        this.logger.setContext(EligibilityService.name);
    }

    public async logEligibilityResponse(eligibilityResponse: { [key: string]: any }, isLogined: boolean, ssoUser: SSOUserHeadersDto | null, query: RegistrationRequestDto, xTrace?: XTraceDto){
        if (xTrace) this.logger.INFO(xTrace.xRequestId, this.api_call, `[FairServerice] eligibility = ${eligibilityResponse.eligibility}, code = ${eligibilityResponse.code}`, this.prepareEligibilityResponse.name, {"emailId": EligibilityUtil.getEmailId(isLogined, ssoUser, query )})
    }

    // Return the Eligibility Response and explain why the user is not eligible to register the fair
    public async prepareEligibilityResponse(fairSettingDetails: RegistrationDetailsResponseDto, ssoUser: SSOUserHeadersDto | null, query: RegistrationRequestDto, formType: string, xTrace?: XTraceDto): Promise<EligibilityResponseDto> {
        try {
            const isLogined = RegistrationUtil.checkIsLoggedIn(ssoUser);

            let eligibilityResponse: EligibilityResponseDto = new EligibilityResponseDto()

            if (xTrace)
                this.logger.INFO(xTrace.xRequestId, this.api_call, `[FairServerice] FairCode is ${query.fairCode}. IsLogined is ${isLogined}, and ssoUid is ${ssoUser?.ssoUid}.`, this.prepareEligibilityResponse.name);

            if (this.checkIsEnabledToggle(fairSettingDetails, formType, xTrace)) {

                if (this.checkIsWithinRegistrationPeriod(fairSettingDetails, formType)) {

                    const response = await this.exhibitorService.checkExhibitorExistence(fairSettingDetails.eoa_fair_id, (isLogined && ssoUser ? ssoUser?.emailId : query.emailId))

                    if (response) {        
                        eligibilityResponse.eligibility = false;
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.ALREADY_REGISTERED_EXHIBITOR;
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    }

                    const registrationRecord = await this.fairDbService.checkRegistrationExistence(query.fairCode, fairSettingDetails.fiscal_year, query.emailId, isLogined, ssoUser?.ssoUid ?? "");

                    if (registrationRecord && registrationRecord?.length > 0 && registrationRecord[0]?.fairRegistrationStatus?.fairRegistrationStatusCode == RegistrationStatusCode.REJECTED) {
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.REGISTRATION_REJECTED_ACCOUNT_TEMPORARILY_RESTRICTED;
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    }
                    const registrationResult = await this.prepareRegistrationResult(registrationRecord, query, isLogined, eligibilityResponse, formType, ssoUser, xTrace);
                    return registrationResult;
                } else {
                    eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.OUTSIDE_REGISTRATION_PERIOD;
                    this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                    return eligibilityResponse;
                }
            } else {
                eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.DISABLED_REGISTRATION;
                this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                return eligibilityResponse;
            }
        } catch (error) {
            throw new VepError(VepErrorMsg.Prepare_Registration_Eligibility_Response_Error, error.message)
        }
    }

    public checkIsEnabledToggle(fairSettingDetails: RegistrationDetailsResponseDto, formType: string, xTrace?: XTraceDto): boolean {
        if (xTrace)
            this.logger.INFO(xTrace.xRequestId, this.api_call, `[FairServerice] formType = ${formType}`, this.checkIsEnabledToggle.name)

        let enabledToggled: boolean = false

        switch (formType) {
            case FORM_TYPE.CIP: 
                enabledToggled = ( fairSettingDetails.cip_form_registration === 1 )
                break
            case FORM_TYPE.MISSION: 
                enabledToggled = ( fairSettingDetails.mission_form_registration === 1 )
                break
            case FORM_TYPE.AOR: 
                enabledToggled = ( fairSettingDetails.always_on_form_display === 1 )
                break
            case FORM_TYPE.AOR: 
                enabledToggled = ( fairSettingDetails.always_on_form_display === 1 )
                break
            case FORM_TYPE.SEMINAR_LONG:
            case FORM_TYPE.SEMINAR_SHORT:
                enabledToggled = ( fairSettingDetails.seminar_registration === 1 )
                break
            case FORM_TYPE.ORGANIC_BUYER:
            default:
                enabledToggled = ( fairSettingDetails.fair_registration === 1 )
                break
        }

        return enabledToggled === true
    }

    public checkIsWithinRegistrationPeriod(fairSettingDetails: RegistrationDetailsResponseDto, formType: string, xTrace?: XTraceDto) {
        if (xTrace)
            this.logger.INFO(xTrace.xRequestId, this.api_call, `[FairServerice] formType = ${formType}`, this.checkIsWithinRegistrationPeriod.name)

        let isValid = false

        const datetime_format = 'YYYY-MM-DD HH:mm';
        const currentTime = moment(new Date()).format(datetime_format);
        let start_datetime: string | undefined = undefined
        let end_datetime: string | undefined = undefined

        switch (formType) {
            case FORM_TYPE.MISSION:
                start_datetime = fairSettingDetails?.mission_form_registration_start_datetime
                end_datetime = fairSettingDetails?.mission_form_registration_end_datetime
                break
            case FORM_TYPE.CIP:
                start_datetime = fairSettingDetails?.cip_form_registration_start_datetime
                end_datetime = fairSettingDetails?.cip_form_registration_end_datetime
                break
            case FORM_TYPE.AOR:
                start_datetime = fairSettingDetails?.aor_form_registration_start_datetime
                end_datetime = fairSettingDetails?.aor_form_registration_end_datetime
                break
            case FORM_TYPE.SEMINAR_LONG:
            case FORM_TYPE.SEMINAR_SHORT:
                start_datetime = fairSettingDetails?.seminar_registration_start_datetime
                end_datetime = fairSettingDetails?.seminar_registration_end_datetime
                break  
            case FORM_TYPE.ORGANIC_BUYER:
            default: 
                start_datetime = fairSettingDetails?.fair_registration_start_datetime
                end_datetime = fairSettingDetails?.fair_registration_end_datetime
                break
        }

        try {
            if (start_datetime && end_datetime) {
                isValid = moment(start_datetime).format(datetime_format) <= currentTime && moment(end_datetime).format(datetime_format) >= currentTime;
            }
            if (start_datetime && !end_datetime) {
                isValid = moment(start_datetime).format(datetime_format) <= currentTime;
            }
            if (!start_datetime && end_datetime) {
                isValid = moment(end_datetime).format(datetime_format) >= currentTime;
            }
            if (!start_datetime && !end_datetime) {
                isValid = true
            }
        } catch (err) {
            if (xTrace)
                this.logger.ERROR(xTrace.xTraceId, this.exception_raised, `[FairServerice] checkIsWithinRegistrationPeriod failed, reason: ${err.message}, Request ID: ${xTrace?.xRequestId}`, this.checkIsWithinRegistrationPeriod.name)
        }
        return isValid
    }

    // Steps to Prepare Eligibility Result
    public async prepareRegistrationResult(registrationRecord: FairRegistration[], query: RegistrationRequestDto, isLogined: boolean, eligibilityResponse: { [key: string]: any }, formType: string, ssoUser: SSOUserHeadersDto | null, xTrace?: XTraceDto): Promise<any> {
        try {
            if (registrationRecord && registrationRecord.length > 0) {
                const fairRegistrationStatusCode = registrationRecord[0].fairRegistrationStatus?.fairRegistrationStatusCode
                // Registration Record exists + isLogined = true
                if (isLogined) {
                    // if registration record is pending or confirmed
                    if (fairRegistrationStatusCode == RegistrationStatusCode.PENDING || fairRegistrationStatusCode == RegistrationStatusCode.CONFIRMED) {
                        const registrationResult = this.checkRegistrationResultForSsoUser(registrationRecord, eligibilityResponse, formType, isLogined, ssoUser, query, xTrace );
                        return registrationResult;
                    } else if (fairRegistrationStatusCode == RegistrationStatusCode.INCOMPLETE || fairRegistrationStatusCode == RegistrationStatusCode.FAILED || fairRegistrationStatusCode == RegistrationStatusCode.CANCELLED) {
                        eligibilityResponse.eligibility = true;
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.ELIGIBLE;
                        eligibilityResponse.registrationFormUrl = '';
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    } else {
                        // In case
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.REGISTRATION_REJECTED_ACCOUNT_TEMPORARILY_RESTRICTED;
                        eligibilityResponse.registrationFormUrl = '';
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    }
                    // Registration Record exists + isLogined = false
                } else {
                    const isEmailExists = await this.buyerService.checkEmailExistenceInSso(query.emailId);
                    if (fairRegistrationStatusCode == RegistrationStatusCode.PENDING || fairRegistrationStatusCode == RegistrationStatusCode.CONFIRMED) {
                        const isHigherPriority = await this.isHigherPriorityForNotLoginedUsers(registrationRecord, formType)
                        if (isHigherPriority) {
                            if (isEmailExists) {
                                eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE;
                                return eligibilityResponse;
                            } else {
                                eligibilityResponse.eligibility = true;
                                eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.ELIGIBLE;
                                eligibilityResponse.registrationFormUrl = '';
                                return eligibilityResponse;
                            }
                        } else {
                            if (isEmailExists) {
                                eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.NOT_LOGGED_IN_ALREADY_REGISTERED_HAS_SSO_ACCOUNT;
                                this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                                return eligibilityResponse;
                            } else {
                                eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.NOT_LOGGED_IN_ALREADY_REGISTERED_NO_SSO_ACCOUNT;
                                this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                                return eligibilityResponse;
                            }
                        }
                    } else if (fairRegistrationStatusCode == RegistrationStatusCode.INCOMPLETE || fairRegistrationStatusCode == RegistrationStatusCode.FAILED || fairRegistrationStatusCode == RegistrationStatusCode.CANCELLED) {
                        if (isEmailExists) {
                            eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE;
                            this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                            return eligibilityResponse;
                          } else {
                            eligibilityResponse.eligibility = true;
                            eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.ELIGIBLE;
                            eligibilityResponse.registrationFormUrl = '';
                            this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                            return eligibilityResponse;
                          }  
                    } else {
                        // In case
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.REGISTRATION_REJECTED_ACCOUNT_TEMPORARILY_RESTRICTED;
                        eligibilityResponse.registrationFormUrl = '';
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    }
                }
                // Registration Record does not exist + isLogined = true
            } else {
                if (isLogined) {
                    eligibilityResponse.eligibility = true;
                    eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.ELIGIBLE;
                    eligibilityResponse.registrationFormUrl = '';
                    this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                    return eligibilityResponse;
                    // Registration Record does not exist + isLogined = false
                } else {
                    const isEmailExists = await this.buyerService.checkEmailExistenceInSso(query.emailId);
                    if (isEmailExists) {
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE;
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    } else {
                        eligibilityResponse.eligibility = true;
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.ELIGIBLE;
                        eligibilityResponse.registrationFormUrl = '';
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    }
                }
            }
        } catch (error) {
            throw new VepError(VepErrorMsg.Prepare_Registration_Result_Error, error.message);
        }
    }

    // Return Eligibility Result for SsoUser
    public async checkRegistrationResultForSsoUser(registrationRecord: any, eligibilityResponse: { [key: string]: any }, formType: string, isLogined: boolean, ssoUser: SSOUserHeadersDto | null, query: RegistrationRequestDto, xTrace?: XTraceDto): Promise<any> {
        const participantTypeRanking = PARTICIPANT_TYPE_PRIORITY;

        try {
            let returnedParticipantType = EligibilityUtil.convertParticipantType(formType);
            let dbParticipantType = registrationRecord[0]?.fairParticipantType?.fairParticipantTypeCode

            if (participantTypeRanking[returnedParticipantType] > participantTypeRanking[dbParticipantType]) {
                eligibilityResponse.eligibility = true;
                eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.ELIGIBLE;
                eligibilityResponse.registrationFormUrl = '';
                this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                return eligibilityResponse;
            } else if (participantTypeRanking[returnedParticipantType] == participantTypeRanking[dbParticipantType]) {
                // if (registrationRecord[0].fairRegistrationStatus.fairRegistrationStatusCode == 'PENDING_APPROVALS') {
                switch (registrationRecord[0].fairParticipantType.fairParticipantTypeCode) {
                    case 'VIP_CIP':
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.LOGGED_IN_ALREADY_REGISTERED_CIP;
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    case 'VIP_MISSION':
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.LOGGED_IN_ALREADY_REGISTERED_MISSION
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    case 'ORGANIC':
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.LOGGED_IN_ALREADY_REGISTERED_ORGANIC;
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    case 'EXHIBITOR':
                        eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.ALREADY_REGISTERED_EXHIBITOR;
                        this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                        return eligibilityResponse;
                    default:
                        throw new VepError(VepErrorMsg.Invalid_Participant_Type_Code, `${registrationRecord[0].fairParticipantType.fairParticipantTypeCode} is unable to match the Fair Participant Type Id`);
                }
            } else {
                eligibilityResponse.code = ELIGIBILITY_RESPONSE_CODE.LOGGED_IN_LOWER_PARTICIPANT_TYPE;
                this.logEligibilityResponse(eligibilityResponse, isLogined, ssoUser, query, xTrace)
                return eligibilityResponse;
            }
        } catch (error) {
            throw new VepError(VepErrorMsg.Check_Registration_Result_For_Sso_User, error.message);
        }
    }

    public async isHigherPriorityForNotLoginedUsers(registrationRecord: any, formType: string): Promise<any> {
        const participantTypeRanking = PARTICIPANT_TYPE_PRIORITY;
        try {
            let returnedParticipantType = EligibilityUtil.convertParticipantType(formType);
            let dbParticipantType = registrationRecord[0]?.fairParticipantType?.fairParticipantTypeCode

            if (participantTypeRanking[returnedParticipantType] > participantTypeRanking[dbParticipantType]) {
                return true
            } else {
                return false
            }
        } catch (ex) {
            throw new VepError(VepErrorMsg.Fail_To_Get_isHigherPriority_For_Not_Logined_Users, ex.message);
        }
    }
}