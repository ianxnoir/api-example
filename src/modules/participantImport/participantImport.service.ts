import { Injectable } from '@nestjs/common';
import { Logger } from '../../core/utils';
import { VepError } from '../../core/exception/exception';
import { VepErrorMsg } from '../../config/exception-constant';
import { S3Service } from '../../core/utils/s3.service';
import {
  constant,
  participantTypeMap,
} from '../../config/constant';
import { ConfigService } from '@nestjs/config';
import { CustomQuestion, ORSParticipantImportRequestDto } from './dto/participantImportRequest.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';
import axios, { AxiosResponse } from 'axios';
import { FairRegistrationStatus } from '../../dao/FairRegistrationStatus';
import { C2mParticipantStatus } from '../../dao/C2mParticipantStatus';
import { FairParticipant } from '../../dao/FairParticipant';
import { FairRegistrationCustomQuestion } from '../../dao/FairRegistrationCustomQuestion';
import { FairRegistrationTicketPass } from '../../dao/FairRegistrationTicketPass';
import * as AWSXRay from 'aws-xray-sdk';
import { FairRegistration } from '../../dao/FairRegistration';
import { FairParticipantType } from '../../dao/FairParticipantType';
import { FairRegistrationType } from '../../dao/FairRegistrationType';
import { FairParticipantTypeRoleMapping } from '../../dao/FairParticipantTypeRoleMapping';
import { FairTicketPass } from '../../dao/FairTicketPass';
import { SeminarRegistrationSqsService } from '../sqs/seminarRegistrationSqs.service';
import { v4 } from 'uuid';
import { CustomQuestionV2, ORSParticipantImportV2RequestDto } from './dto/participantImportV2Request.dto';
import { ActivitySqsService } from '../sqs/activitySqs.service';

@Injectable()
export class ParticipantImportService {
  bucket: string = '';
  path: string = '';
  queuePath: string = '';
  failureReportPath: string = '';
  vepTemplatePath: string = '';
  contentType: string = '';
  visitorTypeToParticipantTypeMapping: participantTypeMap = {};
  constructor(
    private logger: Logger,
    @InjectRepository(FairRegistration)
    private fairRegistrationRepository: Repository<FairRegistration>,
    @InjectRepository(FairParticipant)
    private fairParticipantRepository: Repository<FairParticipant>,
    @InjectRepository(FairRegistrationStatus)
    private fairRegistrationStatusRepository: Repository<FairRegistrationStatus>,
    @InjectRepository(C2mParticipantStatus)
    private c2mParticipantStatusRepository: Repository<C2mParticipantStatus>,
    @InjectRepository(FairParticipantType)
    private fairParticipantTypeRepository: Repository<FairParticipantType>,
    @InjectRepository(FairParticipantTypeRoleMapping)
    private fairParticipantTypeRoleMappingRepository: Repository<FairParticipantTypeRoleMapping>,
    @InjectRepository(FairRegistrationType)
    private fairRegistrationTypeRepository: Repository<FairRegistrationType>,
    @InjectRepository(FairTicketPass)
    private fairTicketPassRepository: Repository<FairTicketPass>,
    @InjectRepository(FairRegistrationTicketPass)
    private fairRegistrationTicketPassRepository: Repository<FairRegistrationTicketPass>,
    @InjectRepository(FairRegistrationCustomQuestion)
    private fairRegistrationCustomQuestionRepository: Repository<FairRegistrationCustomQuestion>,
    protected s3Service: S3Service,
    private configService: ConfigService,
    private sqsService: SeminarRegistrationSqsService,
    private activitySqsService: ActivitySqsService
  ) {
    this.logger.setContext(ParticipantImportService.name);
  }

  importORSParticipant = async (query: ORSParticipantImportRequestDto): Promise<Optional<any>> => {
    try {
      this.logger.INFO(v4(), "http_request_received", `Input Query: ${JSON.stringify(query)}`);
      this.checkMissingInput(query);
      query.email = query.email.toLowerCase()
      await this.checkInvalidInput(query);

      const { data } = await this.getFairCodeFiscalYear(query.projectNum, query.projectYear);
      if (data?.websiteType !== "conference") {
        throw new VepError(VepErrorMsg.Participant_Import_Website_Type_Error, 'Website Type is not conference');
      }

      this.checkRegistrationNumber(query.registrationNo)
      this.checkSelectedFairWithRegNo(query.registrationNo, query.projectNum, query.projectYear)

      // if (!(await this.validateSSOProfile(query.ssoUid, query.email))) {
      //   throw new VepError(VepErrorMsg.Participant_Import_Invalid_SSO_Email_Error, 'Email provided does not match the email got from SSO Uid');
      // }

      if (!(await this.validateSSOProfileFromFairDB(query.ssoUid, query.email))) {
        throw new VepError(VepErrorMsg.Participant_Import_Invalid_SSO_Email_Error, 'Email provided does not match the email got from SSO Uid');
      }

      // if(await this.checkIsRegNoExist(query.registrationNo) > 0){
      //   throw new VepError(VepErrorMsg.Participant_Import_Invalid_Registration_Number_Error, 'Duplicate Registration No');
      // }

      const participant = await this.checkDuplicateParticipant(query.ssoUid, data?.fairCode, data?.fiscalYear)

      if (participant) {
        const isRegNoIdentical = await this.checkRegNoWithExistingParticipant(
          query.registrationNo,
          participant.serialNumber,
          participant.projectYear,
          participant.sourceTypeCode,
          participant.visitorTypeCode,
          participant.projectNumber
        )

        if (isRegNoIdentical) {
          return await this.updateParticipantWithSameRegNo(participant, query, data?.fairCode, data?.fiscalYear);
        } else {
          return await this.updateParticipantWithDifferentRegNo(participant, query, data?.fairCode, data?.fiscalYear);
        }

      } else {
        const existingFairRegistration = await this.getFairRegistrationByRegNo(query.registrationNo);

        if (existingFairRegistration) {
          return await this.updateParticipantWithSameRegNo(existingFairRegistration, query, data?.fairCode, data?.fiscalYear);
        } else {
          return await this.createParticipant(query, data?.fairCode, data?.fiscalYear);
        }
      }

    } catch (error) {
      this.logger.error(`Failed in update importORSParticipant, err message: ${error.message}`)
      commonExceptionHandling(error);
    }
  };

  importORSParticipantR1AB2 = async (query: ORSParticipantImportV2RequestDto): Promise<Optional<any>> => {
    try {
      this.logger.INFO(v4(), "http_request_received", `Input Query: ${JSON.stringify(query)}`);
      this.checkMissingInput(query);
      query.email = query.email.toLowerCase()
      await this.checkInvalidInput(query);
      this.checkCustomQuestionDuplicate(query);
      const { data } = await this.getFairCodeFiscalYear(query.projectNum, query.projectYear);
      this.checkRegistrationNumber(query.registrationNo)
      this.checkSelectedFairWithRegNo(query.registrationNo, query.projectNum, query.projectYear)
      if (!await this.checkTicketPassCodeExist(query.ticketPassCode, data?.fairCode, data?.fiscalYear, query.projectYear)) {
        throw new VepError(VepErrorMsg.Ticket_Pass_Code_NotFound_Error, 'Ticket Pass Data not found');
      }

      if (!(await this.validateSSOProfileFromFairDB(query.ssoUid, query.email))) {
        throw new VepError(VepErrorMsg.Participant_Import_Invalid_SSO_Email_Error, 'Email provided does not match the email got from SSO Uid');
      }
      const participant = await this.checkDuplicateParticipant(query.ssoUid, data?.fairCode, data?.fiscalYear)
      const existingFairRegistration = await this.getFairRegistrationByRegNo(query.registrationNo);

      if (participant && existingFairRegistration && existingFairRegistration.fairParticipantId !== participant.fairParticipantId) {
        throw new VepError(VepErrorMsg.Participant_Duplicate_Error, 'Participant can only have one registration');
      }

      let result

      const before = await this.getFairRegistrationWithDetailsByRegNo(query.registrationNo);
      if (participant) { //record exist in fairRegistration
        const isRegNoIdentical = await this.checkRegNoWithExistingParticipant(
          query.registrationNo,
          participant.serialNumber,
          participant.projectYear,
          participant.sourceTypeCode,
          participant.visitorTypeCode,
          participant.projectNumber
        )
        if (isRegNoIdentical) { //same registration number
          result = await this.updateParticipantWithSameRegNoR1AB2(participant, query, data?.fairCode, data?.fiscalYear);
        } else { //different registration number
          result = await this.updateParticipantWithDifferentRegNoR1AB2(participant, query, data?.fairCode, data?.fiscalYear);
        }
      } else { //record not exist in fairRegistration
        if (existingFairRegistration) {
          result = await this.updateParticipantWithSameRegNoR1AB2(existingFairRegistration, query, data?.fairCode, data?.fiscalYear);
        } else {
          result = await this.createParticipantR1AB2(query, data?.fairCode, data?.fiscalYear);
        }
      }

      const after = await this.getFairRegistrationWithDetailsByRegNo(query.registrationNo);
      const userActivities = this.checkUserActivities(before, after)
      if (userActivities.length > 0) {
        await this.sendActivityRequest(userActivities).catch(e => {
          this.logger.INFO(v4(), "http_request_received", `Send Activity Queue Error: ${e}`)
        })
      }
      return result
    } catch (error) {
      commonExceptionHandling(error);
    }
  };

  checkUserActivities = (before: any, after: any) => {
    if (!before || !after) return []

    try {
      const logs = []
      const registrationNo = `${before.serialNumber}${before.projectYear?.substring(2)}${before.sourceTypeCode}${before.visitorTypeCode}${before.projectNumber}`

      if (before.ticketPassCode !== after.ticketPassCode) {
        logs.push({
          registrationNo,
          actionType: 'Update Participant Ticket Pass',
          description: `Change ticket pass from ${before.ticketPassCode} to ${after.ticketPassCode}`,
          beforeUpdate: before,
          afterUpdate: after
        })
      }

      if (before.generalBuyerRemark !== after.generalBuyerRemark) {
        logs.push({
          registrationNo,
          actionType: 'Update Participant Remark',
          description: `Update General Participant Remark from ${before.generalBuyerRemark} to ${after.generalBuyerRemark}`,
          beforeUpdate: before,
          afterUpdate: after
        })
      }

      if (before.c2mParticipantStatusId !== after.c2mParticipantStatusId) {
        logs.push({
          registrationNo,
          actionType: 'Update Participant C2M Status',
          description: `Update Participant C2M Status from ${before.c2mParticipantStatus.c2mParticipantStatusCode} to ${after.c2mParticipantStatus.c2mParticipantStatusCode}`,
          beforeUpdate: before,
          afterUpdate: after
        })
      }

      if (before.fairRegistrationStatus && after.fairRegistrationStatus && (before.fairRegistrationStatusId !== after.fairRegistrationStatusId)) {
        logs.push({
          registrationNo,
          actionType: 'Update Participant Registration Status',
          description: `Update Participant Registration Status from ${before.fairRegistrationStatus.fairRegistrationStatusCode} to ${after.fairRegistrationStatus.fairRegistrationStatusCode}`,
          beforeUpdate: before,
          afterUpdate: after
        })
      }

      if (before.displayName !== after.displayName
        || before.title !== after.title
        || before.correspondenceEmail !== after.correspondenceEmail
        || before.firstName !== after.firstName
        || before.lastName !== after.lastName
        || before.position !== after.position
        || before.companyName !== after.companyName
        || before.promotionCode !== after.promotionCode
        || before.customQuestions.length !== after.customQuestions.length) {
        logs.push({
          registrationNo,
          actionType: 'Update Participant General Information',
          description: `Update Participant Information`,
          beforeUpdate: before,
          afterUpdate: after
        })
      }

      return logs
    } catch (e) {
      this.logger.INFO(v4(), "http_request_received", `checkUserActivities Error: ${e}`)
      return []
    }
  }

  checkMissingInput = (query: ORSParticipantImportRequestDto | ORSParticipantImportV2RequestDto): void => {
    try {
      const {
        registrationStatus,
        registrationNo,
        projectNum,
        projectYear,
        ssoUid,
        displayName,
        title,
        email,
        firstName,
        lastName,
        countryCode,
        ticketPassCode,
        shownInPartiList
      } = query;

      if (isEmpty(registrationStatus)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Registration_Status_Error, 'Missing Registration Status');
      }
      if (isEmpty(registrationNo)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Registration_Number_Error, 'Missing Registration Number');
      }
      if (isEmpty(projectNum)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Project_Number_Error, 'Missing Project Number');
      }
      if (isEmpty(projectYear)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Project_Year_Error, 'Missing Project Year');
      }
      if (isEmpty(ssoUid)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_SSO_UID_Error, 'Missing SSO UID');
      }
      if (isEmpty(displayName)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Display_Name_Error, 'Missing Display Name');
      }
      if (isEmpty(title)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Title_Error, 'Missing Title');
      }
      if (isEmpty(email)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Email_Error, 'Missing Email');
      }
      if (isEmpty(firstName)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_First_Name_Error, 'Missing First Name');
      }
      if (isEmpty(lastName)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Last_Name_Error, 'Missing Last Name');
      }
      if (isEmpty(countryCode)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Country_Code_Error, 'Missing Country Code');
      }
      if (isEmpty(ticketPassCode)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Ticket_Pass_Code_Error, 'Missing Ticket Pass Code');
      }
      if (registrationStatus === "CONFIRMED" && isEmpty(shownInPartiList)) {
        throw new VepError(VepErrorMsg.Participant_Import_Missing_Shown_In_Parti_List_Error, 'Missing shownInPartiList while Registration Status is "CONFIRMED"');
      }
    } catch (error) {
      this.logger.error(`Failed in checkMissingInput, err message: ${error.message}`)
      commonExceptionHandling(error);
    }

  }

  checkInvalidInput = async (query: ORSParticipantImportRequestDto | ORSParticipantImportV2RequestDto): Promise<void> => {
    try {
      const {
        registrationStatus,
        shownInPartiList
      } = query;

      if (!(registrationStatus === "CANCELLED" || registrationStatus === "CONFIRMED" || registrationStatus === "INCOMPLETE")) {
        throw new VepError(VepErrorMsg.Participant_Import_Invalid_Registration_Status_Error, 'Registration Status Must be "CANCELLED", "CONFIRMED" or "INCOMPLETE"');
      }

      if (registrationStatus === "CONFIRMED" && !(shownInPartiList === "Y" || shownInPartiList === "N")) {
        throw new VepError(VepErrorMsg.Participant_Import_Invalid_Shown_In_Parti_List_Error, 'shownInPartiList Must be "Y" or "N"');
      }

    } catch (error) {
      this.logger.error(`Failed in checkInvalidInput, err message: ${error.message}`)
      commonExceptionHandling(error);
    }

  }

  checkCustomQuestionDuplicate = (query: ORSParticipantImportV2RequestDto) => {
    try {
      const { customQuestionList } = query
      if (customQuestionList && customQuestionList.length > 0) {
        for (let c of customQuestionList) {
          const duplicates = c.questionAns.map(ans => ans.categoryCode).filter((item, index, arr) => arr.indexOf(item) !== index)
          if (duplicates.length > 0) throw new VepError(VepErrorMsg.Custom_Question_Duplicate_Error, `Custom Question Duplicated ${duplicates.toString()}`)
        }
      }
    } catch (error) {
      this.logger.error(`Failed in checkCustomQuestionDuplicate, err message: ${error.message}`)
      commonExceptionHandling(error);
    }
  }

  updateParticipantWithSameRegNo = async (existingFairRegistration: FairRegistration, query: ORSParticipantImportRequestDto, fairCode: string, fiscalYear: string) => {
    try {
      if (!existingFairRegistration.fairRegistrationStatusId) {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, "Previous participant missing reg status");
      }
      const fromRegStatus = await this.findRegistrationStatusFromDB({ id: existingFairRegistration.fairRegistrationStatusId })
        .then(regStatus => {
          return regStatus?.fairRegistrationStatusCode
        })
      const toRegStatus = query.registrationStatus
      const INCOMPLETE = constant.FAIR_REGISTRATION_STATUS.INCOMPLETE
      const CANCELLED = constant.FAIR_REGISTRATION_STATUS.CANCELLED
      const CONFIRMED = constant.FAIR_REGISTRATION_STATUS.CONFIRMED

      if ((fromRegStatus === CONFIRMED || fromRegStatus === CANCELLED) && toRegStatus === INCOMPLETE) {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, `Can't update Participant with Same Reg No when fromRegStatus = ${fromRegStatus} and toRegStatus = ${toRegStatus}`);
      } else if (fromRegStatus === CANCELLED && toRegStatus === CANCELLED) {
        return { result: "success" }//await this.fairRegistrationRepository.findOne({ id: existingFairRegistration.id })
      } else {
        return await this.updateParticipantToFairDB(existingFairRegistration, query, fairCode, fiscalYear)
      }
    } catch (error) {
      this.logger.error(`Failed in update updateParticipantWithSameRegNo, err message: ${error.message}`)
      return commonExceptionHandling(error);
    }
  }

  updateParticipantWithDifferentRegNo = async (existingParticipant: FairRegistration, query: ORSParticipantImportRequestDto, fairCode: string, fiscalYear: string) => {
    try {
      if (!existingParticipant.fairRegistrationStatusId) {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, "Previous participant missing reg status");
      }
      const fromRegStatus = await this.findRegistrationStatusFromDB({ id: existingParticipant.fairRegistrationStatusId })
        .then(regStatus => {
          return regStatus?.fairRegistrationStatusCode
        })
      const toRegStatus = query.registrationStatus
      const INCOMPLETE = constant.FAIR_REGISTRATION_STATUS.INCOMPLETE
      const CANCELLED = constant.FAIR_REGISTRATION_STATUS.CANCELLED
      const CONFIRMED = constant.FAIR_REGISTRATION_STATUS.CONFIRMED

      if (fromRegStatus === CANCELLED && (toRegStatus === CONFIRMED || toRegStatus === INCOMPLETE)) {
        return await this.updateParticipantToFairDB(existingParticipant, query, fairCode, fiscalYear)
      } else {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, `Can't update Participant with Different Reg No when fromRegStatus = ${fromRegStatus} and toRegStatus = ${toRegStatus}`);
      }
    } catch (error) {
      this.logger.error(`Failed in update updateParticipantWithDifferentRegNo, err message: ${error.message}`)
      return commonExceptionHandling(error);
    }
  }

  updateParticipantWithSameRegNoR1AB2 = async (existingFairRegistration: FairRegistration, query: ORSParticipantImportV2RequestDto, fairCode: string, fiscalYear: string) => {
    try {
      if (!existingFairRegistration.fairRegistrationStatusId) {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, "Previous participant missing reg status");
      }
      const fromRegStatus = await this.findRegistrationStatusFromDB({ id: existingFairRegistration.fairRegistrationStatusId })
        .then(regStatus => {
          return regStatus?.fairRegistrationStatusCode
        })

      const oldSsoUid = existingFairRegistration.fairParticipant.ssoUid
      const toRegStatus = query.registrationStatus
      const INCOMPLETE = constant.FAIR_REGISTRATION_STATUS.INCOMPLETE
      const CANCELLED = constant.FAIR_REGISTRATION_STATUS.CANCELLED
      const CONFIRMED = constant.FAIR_REGISTRATION_STATUS.CONFIRMED

      if ((fromRegStatus === CONFIRMED || fromRegStatus === CANCELLED) && toRegStatus === INCOMPLETE) {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, `Can't update Participant with Same Reg No when fromRegStatus = ${fromRegStatus} and toRegStatus = ${toRegStatus}`);
      } else if (fromRegStatus === CANCELLED && toRegStatus === CANCELLED) {
        return { result: "success" }
      } else {
        return await this.updateParticipantToFairDBR1AB2(existingFairRegistration, query, fairCode, fiscalYear, true).then(async (result) => {

          const registrationId = existingFairRegistration.id
          const fairParticipantTypeId = existingFairRegistration.fairParticipantTypeId
          if ((fromRegStatus === INCOMPLETE || fromRegStatus === CANCELLED) && toRegStatus === CONFIRMED) {
            if (oldSsoUid === query.ssoUid)
              await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.CANCEL_REGISTER, query, oldSsoUid, registrationId, fairParticipantTypeId)
            else {
              await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.CANCEL_REGISTER, query, oldSsoUid, registrationId, fairParticipantTypeId)
              await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.UPDATE, query, oldSsoUid, registrationId, fairParticipantTypeId)
            }
          }
          else if ((fromRegStatus === CONFIRMED || fromRegStatus === INCOMPLETE) && toRegStatus === CANCELLED) {
            if (oldSsoUid === query.ssoUid)
              await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.CANCEL, query, oldSsoUid, registrationId, fairParticipantTypeId)
            else {
              await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.CANCEL, query, oldSsoUid, registrationId, fairParticipantTypeId)
              await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.UPDATE, query, oldSsoUid, registrationId, fairParticipantTypeId)
            }
          }
          else if (oldSsoUid !== query.ssoUid && ((fromRegStatus === CONFIRMED && toRegStatus === CONFIRMED) || (fromRegStatus === INCOMPLETE && toRegStatus === INCOMPLETE))) {
            await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.UPDATE, query, oldSsoUid, registrationId, fairParticipantTypeId)
          }

          return result

        })

      }
    } catch (error) {
      return commonExceptionHandling(error);
    }
  }

  updateParticipantWithDifferentRegNoR1AB2 = async (existingFairRegistration: FairRegistration, query: ORSParticipantImportV2RequestDto, fairCode: string, fiscalYear: string) => {
    try {
      if (!existingFairRegistration.fairRegistrationStatusId) {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, "Previous participant missing reg status");
      }
      const fromRegStatus = await this.findRegistrationStatusFromDB({ id: existingFairRegistration.fairRegistrationStatusId })
        .then(regStatus => {
          return regStatus?.fairRegistrationStatusCode
        })
      const oldSsoUid = existingFairRegistration.fairParticipant.ssoUid
      const toRegStatus = query.registrationStatus
      const INCOMPLETE = constant.FAIR_REGISTRATION_STATUS.INCOMPLETE
      const CANCELLED = constant.FAIR_REGISTRATION_STATUS.CANCELLED
      const CONFIRMED = constant.FAIR_REGISTRATION_STATUS.CONFIRMED

      if (fromRegStatus === CANCELLED && (toRegStatus === CONFIRMED || toRegStatus === INCOMPLETE)) {
        return await this.updateParticipantToFairDBR1AB2(existingFairRegistration, query, fairCode, fiscalYear, false).then(async (result) => {
          if (toRegStatus === CONFIRMED)
            await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.CANCEL_REGISTER, query, oldSsoUid, existingFairRegistration.id, existingFairRegistration.fairParticipantTypeId)
          return result
        })
      } else {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, `Can't update Participant with Different Reg No when fromRegStatus = ${fromRegStatus} and toRegStatus = ${toRegStatus}`);
      }
    } catch (error) {
      return commonExceptionHandling(error);
    }
  }

  updateParticipantR1AB2 = async (existingParticipant: FairRegistration, query: ORSParticipantImportV2RequestDto, fairCode: string, fiscalYear: string) => {
    try {
      if (!existingParticipant.fairRegistrationStatusId) {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, "Previous participant missing reg status");
      }
      const fromRegStatus = await this.findRegistrationStatusFromDB({ id: existingParticipant.fairRegistrationStatusId })
        .then(regStatus => {
          return regStatus?.fairRegistrationStatusCode
        })
      const toRegStatus = query.registrationStatus
      const INCOMPLETE = constant.FAIR_REGISTRATION_STATUS.INCOMPLETE
      const CANCELLED = constant.FAIR_REGISTRATION_STATUS.CANCELLED
      const CONFIRMED = constant.FAIR_REGISTRATION_STATUS.CONFIRMED
      if (
        fromRegStatus === INCOMPLETE && (toRegStatus === INCOMPLETE || toRegStatus === CANCELLED)
        ||
        fromRegStatus === CONFIRMED && (toRegStatus === CONFIRMED || toRegStatus === CANCELLED)
      ) {
        // update conference
        return await this.updateParticipantToFairDB(existingParticipant, query, fairCode, fiscalYear, true)
      } else if ((fromRegStatus === INCOMPLETE || fromRegStatus === CANCELLED) && toRegStatus === CONFIRMED) {
        // update semniar and conference
        return await this.updateParticipantToFairDB(existingParticipant, query, fairCode, fiscalYear, true)
      } else if ((fromRegStatus === CONFIRMED || fromRegStatus === CANCELLED) && toRegStatus === INCOMPLETE) {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, '(fromRegStatus = "CONFIRMED" or fromRegStatus = "CANCELLED") and toRegStatus = "INCOMPLETE" is invalid');
      } else if (fromRegStatus === CANCELLED && fromRegStatus === CANCELLED) {
        // do nothing
        return await this.fairRegistrationRepository.findOne({ id: existingParticipant.id })
      } else {
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, 'Reg No Exist and Invalid Reg Status');
      }
    } catch (error) {
      this.logger.error(`Failed in update updateParticipantR1AB2, err message: ${error.message}`)
      throw new VepError(VepErrorMsg.Participant_Import_Status_Error, error.message);
    }
  }

  createParticipant = async (query: ORSParticipantImportRequestDto, fairCode: string, fiscalYear: string) => {
    switch (query.registrationStatus) {
      case constant.FAIR_REGISTRATION_STATUS.INCOMPLETE:
        // update conference
        return await this.insertParticipantToFairDB(query, fairCode, fiscalYear).then(res => {
          if (res) {
            return {
              result: res.result
            }
          } else {
            return
          }
        })
      case constant.FAIR_REGISTRATION_STATUS.CONFIRMED:
        // update semniar and conference
        return await this.insertParticipantToFairDB(query, fairCode, fiscalYear).then(res => {
          if (res) {
            return {
              result: res.result
            }
          } else {
            return
          }
        })
      default:
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, 'Reg Status = "CANCELLED"');
    }
  }

  createParticipantR1AB2 = async (query: ORSParticipantImportV2RequestDto, fairCode: string, fiscalYear: string) => {
    switch (query.registrationStatus) {
      case constant.FAIR_REGISTRATION_STATUS.INCOMPLETE:
        return await this.insertParticipantToFairDB(query, fairCode, fiscalYear, true).then(res => {
          if (res) {
            return {
              result: res.result
            }
          } else {
            return
          }
        })
      case constant.FAIR_REGISTRATION_STATUS.CONFIRMED:
        const registration = await this.insertParticipantToFairDB(query, fairCode, fiscalYear, true)
        const participantType = await this.mapParticipantType()
        await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.REGISTER, query, "", registration?.id ?? "", participantType?.id ?? "")
        return { result: registration?.result }
      default:
        throw new VepError(VepErrorMsg.Participant_Import_Status_Error, 'Reg Status = "CANCELLED"');
    }
  }

  insertParticipantToFairDB = async (query: ORSParticipantImportRequestDto | ORSParticipantImportV2RequestDto, fairCode: string, fiscalYear: string, isBatch2: boolean = false) => {
    return getManager().transaction(async transactionalEntityManager => {
      return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-participantImportService-insertParticipantToFairDB', async (subsegment) => {
        try {
          let fairParticipantId
          let fairParticipantRecord = await this.fairParticipantSSOandEmailExist(query.ssoUid, query.email)
          if (fairParticipantRecord.length == 0) {
            const fairParticipant = await transactionalEntityManager.insert(FairParticipant, this.convertToFairParticipantReq(query.ssoUid, query.email))
            fairParticipantId = fairParticipant.identifiers[0].id
          } else {
            fairParticipantId = fairParticipantRecord[0].id
          }
          if (!fairParticipantId) {
            throw new VepError(VepErrorMsg.Participant_Import_Status_Error, 'Cannot find fairParticipantId');
          }
          const fairRegistration = await transactionalEntityManager.insert(FairRegistration, await this.convertToConferenceRegReq(query, fairParticipantId, fairCode, fiscalYear));
          if (isBatch2) {
            await transactionalEntityManager.insert(FairRegistrationCustomQuestion, this.convertToFairRegCustomQuestionReqR1AB2(fairRegistration.identifiers[0].id, query.customQuestionList as CustomQuestionV2[]))
          } else {
            await transactionalEntityManager.insert(FairRegistrationCustomQuestion, this.convertToFairRegCustomQuestionReq(fairRegistration.identifiers[0].id, query.customQuestionList as CustomQuestion[]))
          }
          await transactionalEntityManager.insert(FairRegistrationTicketPass, this.convertToFairRegTicketPassReq(fairRegistration.identifiers[0].id, query.ticketPassCode))
          const id: string = fairRegistration.identifiers[0].id
          return { result: "success", id }
        } catch (error) {
          this.logger.error(`Failed in update insertParticipantToFairDB, err message: ${error.message}`)
          return commonExceptionHandling(new VepError(VepErrorMsg.Database_Error, error.message));
        } finally {
          subsegment?.close()
        }
      })
    })
  }

  updateParticipantToFairDB = async (existingFairRegistration: FairRegistration, query: ORSParticipantImportRequestDto | ORSParticipantImportV2RequestDto, fairCode: string, fiscalYear: string, isBatch2: boolean = false) => {
    return getManager().transaction(async transactionalEntityManager => {
      return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-participantImportService-updateParticipantToFairDB', async (subsegment) => {
        try {
          const sameSsoUid = existingFairRegistration.fairParticipant.ssoUid === query.ssoUid
          let fairParticipantId = existingFairRegistration.fairParticipantId


          if (!sameSsoUid) {

            let fairParticipantRecord = await this.fairParticipantSSOandEmailExist(query.ssoUid, query.email)
            if (fairParticipantRecord.length == 0) {
              const fairParticipant = await transactionalEntityManager.insert(FairParticipant, this.convertToFairParticipantReq(query.ssoUid, query.email))
              fairParticipantId = fairParticipant.identifiers[0].id
            } else {
              fairParticipantId = fairParticipantRecord[0].id
            }

          }

          if (!fairParticipantId) {
            throw new VepError(VepErrorMsg.Participant_Import_Status_Error, 'Cannot find fairParticipantId');
          }

          await transactionalEntityManager.delete(FairRegistrationCustomQuestion, { fairRegistrationId: existingFairRegistration.id })

          if (isBatch2) {
            await transactionalEntityManager.insert(FairRegistrationCustomQuestion, this.convertToFairRegCustomQuestionReqR1AB2(existingFairRegistration.id, query.customQuestionList as CustomQuestionV2[]))
          } else {
            await transactionalEntityManager.insert(FairRegistrationCustomQuestion, this.convertToFairRegCustomQuestionReq(existingFairRegistration.id, query.customQuestionList as CustomQuestion[]))
          }

          await transactionalEntityManager.delete(FairRegistrationTicketPass, { fairRegistrationId: existingFairRegistration.id })
          await transactionalEntityManager.save(FairRegistrationTicketPass, this.convertToFairRegTicketPassReq(existingFairRegistration.id, query.ticketPassCode))
          await transactionalEntityManager.save(FairRegistration, {
            id: existingFairRegistration.id
            , ...await this.convertToConferenceRegReq(query, fairParticipantId, fairCode, fiscalYear)
          });
          return { result: "success" }
        } catch (error) {
          this.logger.error(`Failed in update updateParticipantToFairDB, err message: ${error.message}`)
          return commonExceptionHandling(new VepError(VepErrorMsg.Database_Error, error.message));
        } finally {
          subsegment?.close()
        }
      })
    })
  }

  updateParticipantToFairDBR1AB2 = async (existingFairRegistration: FairRegistration, query: ORSParticipantImportV2RequestDto, fairCode: string, fiscalYear: string, sameRegNo: boolean = false) => {
    return getManager().transaction(async transactionalEntityManager => {
      return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-participantImportService-updateParticipantToFairDB', async (subsegment) => {
        try {
          let fairParticipantId = existingFairRegistration.fairParticipantId
          if (sameRegNo) {
            let data = await this.fairParticipantSSOandEmailExist(query.ssoUid, query.email)
            if (data.length == 0) {
              const fairParticipant = await transactionalEntityManager.insert(FairParticipant, this.convertToFairParticipantReq(query.ssoUid, query.email))
              fairParticipantId = fairParticipant.identifiers[0].id
            } else {
              fairParticipantId = data[0].id
            }
          } else {
            await transactionalEntityManager.delete(FairRegistrationTicketPass, { fairRegistrationId: existingFairRegistration.id })
            await transactionalEntityManager.save(FairRegistrationTicketPass, this.convertToFairRegTicketPassReq(existingFairRegistration.id, query.ticketPassCode))
          }
          await transactionalEntityManager.delete(FairRegistrationCustomQuestion, { fairRegistrationId: existingFairRegistration.id })
          await transactionalEntityManager.save(FairRegistrationCustomQuestion, this.convertToFairRegCustomQuestionReqR1AB2(existingFairRegistration.id, query.customQuestionList))
          await transactionalEntityManager.save(FairRegistration, {
            id: existingFairRegistration.id
            , ...await this.convertToConferenceRegReq(query, fairParticipantId, fairCode, fiscalYear)
          });
          return { result: "success" }
        } catch (error) {
          this.logger.error(`Failed in update updateParticipantToFairDB, err message: ${error.message}`)
          return commonExceptionHandling(new VepError(VepErrorMsg.Database_Error, error.message));
        } finally {
          subsegment?.close()
        }
      })
    })
  }

  checkTicketPassCodeExist = async (code: string, fairCode: string, fiscalYear: string, projectYear: string) => {
    return await this.fairTicketPassRepository.findOne({ where: [{ ticketPassCode: code, fairCode: fairCode, fiscalYear: fiscalYear, projectYear }] })
  }

  convertToConferenceRegReq = async (query: ORSParticipantImportRequestDto | ORSParticipantImportV2RequestDto, fairParticipantId: string | null, fairCode: string, fiscalYear: string)
    : Promise<Partial<FairRegistration>> => {
    const { registrationNo } = query
    const serialNumber = registrationNo.slice(0, 6)
    const projectYear = `20${registrationNo.slice(6, 8)}`
    const sourceType = registrationNo.slice(8, 10)
    const visitorType = registrationNo.slice(10, 12)
    const projectNumber = registrationNo.slice(12, 15)
    const registrationStatus = await this.findRegistrationStatusFromDB({ fairRegistrationStatusCode: query.registrationStatus })
    const c2mStatus = await this.mapC2mStatus(query.registrationStatus, query.shownInPartiList)
    const participantType = await this.mapParticipantType()
    const registrationType = await this.mapRegistrationType()
    return {
      serialNumber,
      projectYear,
      projectNumber,
      sourceTypeCode: sourceType,
      visitorTypeCode: visitorType,
      correspondenceEmail: query.correspondenceEmail,
      fairCode,
      fiscalYear,
      fairParticipantId: fairParticipantId,
      fairRegistrationTypeId: registrationType?.id,
      fairRegistrationStatusId: registrationStatus?.id,
      fairParticipantTypeId: participantType?.id,
      c2mParticipantStatusId: c2mStatus?.id,
      title: query.title,
      firstName: query.firstName,
      lastName: query.lastName,
      displayName: query.displayName,
      position: query.position,
      companyName: query.companyName,
      addressCountryCode: query.countryCode,
      promotionCode: query.promotionCode,
      generalBuyerRemark: query.generalParticipantRemark,
      createdBy: "ORS API",
      lastUpdatedBy: "ORS API"
    }
  }

  convertToFairParticipantReq = (ssoUid: string, email: string): Partial<FairParticipant> => {
    return {
      ssoUid: ssoUid,
      emailId: email,
      createdBy: "ORS API",
      lastUpdatedBy: "ORS API"
    }
  }

  convertToFairRegCustomQuestionReq = (fairRegistrationId: string, customQuestionList: CustomQuestion[]): Partial<FairRegistrationCustomQuestion>[] => {
    return customQuestionList.reduce((finalResult: Partial<FairRegistrationCustomQuestion>[], customQuestion: CustomQuestion) => {
      const convertCustomQuestion = (fairRegistrationId: string, questionNum: string, categoryCode: string, optionText?: string) => {
        return {
          fairRegistrationId,
          questionNum,
          categoryCode,
          optionText,
          createdBy: "ORS API",
          lastUpdatedBy: "ORS API"
        }
      }
      if (typeof customQuestion.questionAns === 'string') {
        finalResult.push(convertCustomQuestion(fairRegistrationId, customQuestion.questionNum, customQuestion.questionAns))
      } else {
        finalResult.push(...customQuestion.questionAns.map(ans => {
          return convertCustomQuestion(fairRegistrationId, customQuestion.questionNum, ans)
        }))
      }
      return finalResult
    }, []);
  }

  convertToFairRegCustomQuestionReqR1AB2 = (fairRegistrationId: string, customQuestionList: CustomQuestionV2[]): Partial<FairRegistrationCustomQuestion>[] => {
    return customQuestionList.reduce((finalResult: Partial<FairRegistrationCustomQuestion>[], customQuestion: CustomQuestionV2) => {
      const convertCustomQuestion = (fairRegistrationId: string, questionNum: string, categoryCode: string, optionText?: string) => {
        return {
          fairRegistrationId,
          questionNum,
          categoryCode,
          optionText,
          createdBy: "ORS API",
          lastUpdatedBy: "ORS API"
        }
      }
      finalResult.push(...customQuestion.questionAns.map(ans => {
        return convertCustomQuestion(fairRegistrationId, customQuestion.questionNum, ans.categoryCode, ans.text)
      }))
      return finalResult
    }, []);
  }

  convertToFairRegTicketPassReq = (fairRegistrationId: string, ticketPassCode: string): Partial<FairRegistrationTicketPass> => {
    return {
      fairRegistrationId,
      ticketPassCode,
      createdBy: "ORS API",
      lastUpdatedBy: "ORS API"
    }
  }

  fairParticipantSSOandEmailExist = (ssoUid: string, emailId: string) => {
    return this.fairParticipantRepository.find(
      { where: [{ ssoUid }, { emailId }] }
    )
  }

  findRegistrationStatusFromDB = async (query: Partial<FairRegistrationStatus>) => {
    return await this.fairRegistrationStatusRepository.findOne({
      where: [query]
    })
  }

  mapC2mStatus = (registrationStatus: string, shownInPartiList: string) => {
    if (registrationStatus === constant.FAIR_REGISTRATION_STATUS.INCOMPLETE || registrationStatus === constant.FAIR_REGISTRATION_STATUS.CANCELLED) {
      return this.c2mParticipantStatusRepository.findOne({
        where: [
          {
            c2mParticipantStatusCode: "RESTRICTED"
          }
        ]
      })
    } else if (registrationStatus === constant.FAIR_REGISTRATION_STATUS.CONFIRMED && shownInPartiList === "Y") {
      return this.c2mParticipantStatusRepository.findOne({
        where: [
          {
            c2mParticipantStatusCode: "ACTIVE"
          }
        ]
      })
    } else if (registrationStatus === constant.FAIR_REGISTRATION_STATUS.CONFIRMED && shownInPartiList === "N") {
      return this.c2mParticipantStatusRepository.findOne({
        where: [
          {
            c2mParticipantStatusCode: "HIDDEN"
          }
        ]
      })
    } else {
      throw new VepError(VepErrorMsg.Participant_Import_Status_Error, 'Fail to map C2M status');
    }
  }

  mapParticipantType = () => {
    return this.fairParticipantTypeRepository.findOne({
      where: [
        {
          fairParticipantTypeCode: "GENERAL_PARTICIPANT"
        }
      ]
    })
  }

  mapRegistrationType = () => {
    return this.fairRegistrationTypeRepository.findOne({
      where: [
        {
          fairRegistrationTypeCode: "CONFERENCE_IMPORT_ORS"
        }
      ]
    })
  }

  checkRegistrationNumber = (value: any) => {
    if (value == undefined || value == "") {
      throw new VepError(VepErrorMsg.Participant_Import_Invalid_Registration_Number_Error, 'Registration No. must not be empty');
    }
    if (isNaN(value)) {
      throw new VepError(VepErrorMsg.Participant_Import_Invalid_Registration_Number_Error, 'Registration No. must be a number');
    }
    if (value?.length != 18) {
      throw new VepError(VepErrorMsg.Participant_Import_Invalid_Registration_Number_Error, 'Registration No. is invalid');
    }
  }

  checkSelectedFairWithRegNo = (value: string, selectedProjectNumber: string, selectedProjectYear: string) => {
    let regNoProjectYear = `20${value.slice(6, 8)}`
    let regNoProjectNumber = value.slice(12, 15)
    if (regNoProjectYear != selectedProjectYear) {
      throw new VepError(VepErrorMsg.Participant_Import_Invalid_Registration_Number_Error, 'Registration No. is not match with the selected project year');
    }
    if (regNoProjectNumber != selectedProjectNumber) {
      throw new VepError(VepErrorMsg.Participant_Import_Invalid_Registration_Number_Error, 'Registration No. is not match with the selected project number');
    }
  }

  checkRegNoWithExistingParticipant = async (
    regNoFromReq: string,
    prevSerialNumber: string | null,
    prevProjectYear: string | null,
    prevSourceType: string | null,
    prevVisitorType: string | null,
    prevProjectNumber: string | null
  ) => {
    const serialNumber = regNoFromReq.slice(0, 6)
    const projectYear = `20${regNoFromReq.slice(6, 8)}`
    const sourceType = regNoFromReq.slice(8, 10)
    const visitorType = regNoFromReq.slice(10, 12)
    const projectNumber = regNoFromReq.slice(12, 15)

    const isRegNoExist =
      serialNumber === prevSerialNumber
      && projectYear === prevProjectYear
      && sourceType === prevSourceType
      && visitorType === prevVisitorType
      && projectNumber === prevProjectNumber

    return isRegNoExist;
  }

  getFairRegistrationByRegNo = async (regNo: string) => {
    const serialNumber = regNo.slice(0, 6)
    const projectYear = `20${regNo.slice(6, 8)}`
    const sourceTypeCode = regNo.slice(8, 10)
    const visitorTypeCode = regNo.slice(10, 12)
    const projectNumber = regNo.slice(12, 15)

    return await this.fairRegistrationRepository
      .findOne({
        relations: ["fairParticipant", "fairRegistrationStatus", "c2mParticipantStatus"],
        where: [
          {
            serialNumber,
            projectYear,
            sourceTypeCode,
            visitorTypeCode,
            projectNumber
          },
        ]
      })
      .catch((error) => {
        this.logger.error(`Failed in getFairRegistrationByRegNo, err message: ${error.message}`)
        throw new VepError(VepErrorMsg.Database_Error, error.message);
      });

  }

  getFairRegistrationWithDetailsByRegNo = async (regNo: string) => {
    const fairRegistration = await this.getFairRegistrationByRegNo(regNo)

    if (fairRegistration) {
      const ticketPass = await this.fairRegistrationTicketPassRepository.findOne({
        where: [
          {
            fairRegistrationId: fairRegistration.id
          },
        ]
      })

      const customQuestions = await this.fairRegistrationCustomQuestionRepository.find({
        where: [
          {
            fairRegistrationId: fairRegistration.id
          },
        ]
      })
      return {
        ...fairRegistration,
        ticketPassCode: ticketPass?.ticketPassCode,
        customQuestions: customQuestions
      }
    }
    return fairRegistration
  }

  checkDuplicateParticipant = async (ssoUid: string, fairCode: string, fiscalYear: string) => {
    return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-participantImportService-checkDuplicateParticipant', async (subsegment) => {
      try {
        return await this.fairRegistrationRepository.findOne({
          relations: ["fairParticipant"],
          where: {
            fairCode,
            fiscalYear,
            fairParticipant: { ssoUid }
          }
        })
      } catch (error) {
        this.logger.error(`Failed in checkDuplicateParticipant, err message: ${error.message}`)
        throw new VepError(VepErrorMsg.Database_Error, error.message);
      } finally {
        subsegment?.close()
      }
    })
  }

  public async getSeminarUserRole(id: string | null) {
    if (!id) return { userRole: "" }
    return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-participantImportService-getSeminarUserRole', async (subsegment) => {
      try {
        const { fairParticipantTypeCode } = await this.fairParticipantTypeRepository.findOne({
          where: {
            id
          }
        }).then(result => {
          return {
            fairParticipantTypeCode: result?.fairParticipantTypeCode ?? ""
          }
        })

        return await this.fairParticipantTypeRoleMappingRepository.findOne({
          where: {
            fairParticipantTypeCode
          }
        }).then(result => {
          return {
            userRole: result?.userRole ?? ""
          }
        })
      } catch (error) {
        throw new VepError(VepErrorMsg.Database_Error, error.message);
      } finally {
        subsegment?.close()
      }
    })
  }


  validateSSOProfileFromFairDB = async (ssoUid: string, emailFromRequest: string): Promise<boolean> => {
    // Check if ssoUid match email from FairParticipant Table
    return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-participantImportService-validateSSOProfileFromFairDB', async (subsegment) => {
      try {
        const existingParticipants = await this.fairParticipantSSOandEmailExist(ssoUid, emailFromRequest)
        //no record found, i.e. no need to check ssoUid and email
        if (existingParticipants.length === 0) {
          return true
        }
        return existingParticipants.some((participant) => {
          if (participant.ssoUid === ssoUid) {
            // participant searched by ssoUid
            return participant.emailId?.toLowerCase() === emailFromRequest
          } else {
            // participant searched by emailId
            return participant.ssoUid === ssoUid
          }
        })
      } catch (error) {
        this.logger.error(`Failed in validateSSOProfileFromFairDB, err message: ${error.message}`)
        throw new VepError(VepErrorMsg.Database_Error, error.message);
      } finally {
        subsegment?.close()
      }
    })
  }

  getFairCodeFiscalYear(projectNumber: string, projectYear: string): Promise<AxiosResponse> {
    const baseUri = this.configService.get<string>('api.CONTENT_SERVICE_URI') || '';
    return axios.request({
      method: 'GET',
      url: `${baseUri}/admin/v1/content/definition/fairCodeFiscalYearByProjectNo?projectNumber=${projectNumber}&projectYear=${projectYear}`
    }).then(axiosResponse => {
      return axiosResponse.data
    }).catch((error) => {
      this.logger.error(`Failed in getFairCodeFiscalYear, err message: ${error.message}`)
      throw new VepError(VepErrorMsg.Fair_Setting_NotFound_Error, error.message);
    });
  }

  sendSeminarRegistrationRequest = async (actionType: string, payload: ORSParticipantImportV2RequestDto, oldSsoUid: string | null | undefined, registrationId: string, fairParticipantTypeId: string | null) => {
    const { data } = await this.getFairCodeFiscalYear(payload.projectNum, payload.projectYear);
    const { userRole } = await this.getSeminarUserRole(fairParticipantTypeId);
    const registrationNo = payload.registrationNo.substring(0, payload.registrationNo.length - 3)
    const requestBody = {
      actionType: actionType,
      fairCode: data.fairCode,
      fiscalYear: data.fiscalYear,
      userRole: userRole,
      userId: payload.ssoUid,
      newSsoUid: payload.ssoUid,
      oldSsoUid: oldSsoUid,
      registrationId: registrationId,
      regNum: registrationNo,
      source: "Conference Registration API",
      ticketPass: payload.ticketPassCode,
      seminarDetails: []
    }
    return this.sqsService.sendMessage(requestBody, registrationNo)
  }

  sendActivityRequest = async (userActivities: any[]) => {
    const body = {
      eventSource: "vep-fair",
      traceId: "",
      requestId: "",
      eventName: "conference-fair-registration-update",
      eventTime: Math.floor(new Date().getTime() / 1000),
      userId: "ORS API",
      emailId: "ORS API",
      resourceName: null,
      service: null,
      responseStatus: null,
      responseData: JSON.stringify({
        data: {
          "user-activity": userActivities
        }
      }),
      requestData: null,
      requestUrl: null
    }
    return this.activitySqsService.sendMessage(body)
  }
}

function commonExceptionHandling(error: any) {
  if (error.name === 'VepError') {
    throw new VepError(error.vepErrorMsg, error.errorDetail);
  }
  throw new VepError(VepErrorMsg.Participant_Import_Status_Error, JSON.stringify(error));
}

function isEmpty(property: any): boolean {
  if (property == "" || property == null || property === undefined) {
    return true;
  }

  return false;
}
