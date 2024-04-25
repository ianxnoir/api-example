import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FairRegistrationImportTask } from '../../dao/FairRegistrationImportTask';
import { FairRegistration } from '../../dao/FairRegistration';
import { ParticipantImportService } from './participantImport.service';
import { C2mParticipantStatus } from '../../dao/C2mParticipantStatus';
import { FairParticipant } from '../../dao/FairParticipant';
import { FairParticipantType } from '../../dao/FairParticipantType';
import { FairParticipantTypeRoleMapping } from '../../dao/FairParticipantTypeRoleMapping';
import { FairRegistrationStatus } from '../../dao/FairRegistrationStatus';
import { FairRegistrationType } from '../../dao/FairRegistrationType';
import { FairTicketPass } from '../../dao/FairTicketPass';
import { CustomQuestion, ORSParticipantImportRequestDto } from './dto/participantImportRequest.dto';
import { CustomQuestionV2, ORSParticipantImportV2RequestDto } from './dto/participantImportV2Request.dto';
import { SeminarRegistrationSqsService } from '../sqs/seminarRegistrationSqs.service';
import { UtilsModule } from '../../core/utils/utils';
import { FairRegistrationCustomQuestion } from '../../dao/FairRegistrationCustomQuestion';
import { FairRegistrationTicketPass } from '../../dao/FairRegistrationTicketPass';
import { ActivitySqsService } from '../sqs/activitySqs.service';

let app: TestingModule;
let participantImportService: ParticipantImportService

beforeAll(async () => {
  jest.clearAllMocks()
  app = await Test.createTestingModule({
    imports: [UtilsModule],
    providers: [
      ParticipantImportService, SeminarRegistrationSqsService, ActivitySqsService,
      {
        provide: getRepositoryToken(FairTicketPass),
        useClass: FairRegistrationRepositoryFake,
      },
      {
        provide: getRepositoryToken(FairParticipant),
        useClass: FairRegistrationRepositoryFake,
      },
      {
        provide: getRepositoryToken(FairRegistrationStatus),
        useClass: FairRegistrationRepositoryFake,
      },
      {
        provide: getRepositoryToken(C2mParticipantStatus),
        useClass: FairRegistrationRepositoryFake,
      },
      {
        provide: getRepositoryToken(FairParticipantType),
        useClass: FairRegistrationRepositoryFake,
      },
      {
        provide: getRepositoryToken(FairParticipantTypeRoleMapping),
        useClass: FairRegistrationRepositoryFake,
      },
      {
        provide: getRepositoryToken(FairRegistrationType),
        useClass: FairRegistrationRepositoryFake,
      },
      {
        provide: getRepositoryToken(FairRegistration),
        useClass: FairRegistrationRepositoryFake,
      },
      {
        provide: getRepositoryToken(FairRegistrationTicketPass),
        useClass: FairRegistrationRepositoryFake,
      },
      {
        provide: getRepositoryToken(FairRegistrationCustomQuestion),
        useClass: FairRegistrationRepositoryFake,
      },
    ]
  }).compile()
  participantImportService = app.get(ParticipantImportService)
})

afterEach(() => {
  jest.clearAllMocks();
});

describe('Participant Import', () => {
  it('ORS Participant Import V1', async () => {
    let query = new ORSParticipantImportRequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []
    const registrationMockedResponse: any = { success: true }

    jest.spyOn(participantImportService, 'importORSParticipant').mockImplementationOnce(async (query): Promise<any> => { return registrationMockedResponse });

    const result = await participantImportService.importORSParticipant(query);
    expect(result).toEqual(registrationMockedResponse);
  });

  it('ORS Participant Import V2', async () => {
    let query = new ORSParticipantImportV2RequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []
    const registrationMockedResponse: any = { success: true }

    jest.spyOn(participantImportService, 'importORSParticipantR1AB2').mockImplementationOnce(async (query): Promise<any> => { return registrationMockedResponse });

    const result = await participantImportService.importORSParticipantR1AB2(query);
    expect(result).toEqual(registrationMockedResponse);
  });

  it('Test function checkMissingInput', async () => {
    let query = new ORSParticipantImportRequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    jest.spyOn(participantImportService, 'checkMissingInput').mockImplementationOnce(async (query) => { return null });

    const result = await participantImportService.checkMissingInput(query);
    expect(result).toEqual(null);
  });

  it('Test function checkInvalidInput', async () => {
    let query = new ORSParticipantImportRequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    jest.spyOn(participantImportService, 'checkInvalidInput').mockImplementationOnce(async (query): Promise<void> => { });

    const result = await participantImportService.checkInvalidInput(query);
    expect(result).toEqual(undefined);
  });

  it('Test function updateParticipantWithSameRegNo', async () => {
    const fairRegistration = new FairRegistration()

    let query = new ORSParticipantImportRequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult = { result: "success" }

    jest.spyOn(participantImportService, 'updateParticipantWithSameRegNo').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.updateParticipantWithSameRegNo(fairRegistration, query, "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function updateParticipantWithDifferentRegNo', async () => {
    const fairRegistration = new FairRegistration()

    let query = new ORSParticipantImportRequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult = { result: "success" }

    jest.spyOn(participantImportService, 'updateParticipantWithDifferentRegNo').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.updateParticipantWithDifferentRegNo(fairRegistration, query, "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function updateParticipantWithSameRegNoR1AB2', async () => {
    const fairRegistration = new FairRegistration()

    let query = new ORSParticipantImportV2RequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult = { result: "success" }

    jest.spyOn(participantImportService, 'updateParticipantWithSameRegNoR1AB2').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.updateParticipantWithSameRegNoR1AB2(fairRegistration, query, "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function updateParticipantWithDifferentRegNoR1AB2', async () => {
    const fairRegistration = new FairRegistration()

    let query = new ORSParticipantImportV2RequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult = { result: "success" }

    jest.spyOn(participantImportService, 'updateParticipantWithDifferentRegNoR1AB2').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.updateParticipantWithDifferentRegNoR1AB2(fairRegistration, query, "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function updateParticipantR1AB2', async () => {
    const fairRegistration = new FairRegistration()

    let query = new ORSParticipantImportV2RequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult = { result: "success" }

    jest.spyOn(participantImportService, 'updateParticipantR1AB2').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.updateParticipantR1AB2(fairRegistration, query, "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function createParticipant', async () => {
    let query = new ORSParticipantImportRequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult = { result: "success" }

    jest.spyOn(participantImportService, 'createParticipant').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.createParticipant(query, "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function createParticipantR1AB2', async () => {
    let query = new ORSParticipantImportV2RequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult = { result: "success" }

    jest.spyOn(participantImportService, 'createParticipantR1AB2').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.createParticipantR1AB2(query, "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function insertParticipantToFairDB', async () => {
    let query = new ORSParticipantImportV2RequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult = { result: "success" }

    jest.spyOn(participantImportService, 'insertParticipantToFairDB').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.insertParticipantToFairDB(query, "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function updateParticipantToFairDB', async () => {
    const fairRegistration = new FairRegistration()

    let query = new ORSParticipantImportV2RequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult = { result: "success" }

    jest.spyOn(participantImportService, 'updateParticipantToFairDB').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.updateParticipantToFairDB(fairRegistration, query, "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function updateParticipantToFairDBR1AB2', async () => {
    const fairRegistration = new FairRegistration()

    let query = new ORSParticipantImportV2RequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult = { result: "success" }

    jest.spyOn(participantImportService, 'updateParticipantToFairDBR1AB2').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.updateParticipantToFairDBR1AB2(fairRegistration, query, "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function checkTicketPassCodeExist', async () => {
    const ticketPassCode = "T001"

    const expectedResult = new FairTicketPass()
    expectedResult.fairCode = "bnr"
    expectedResult.fiscalYear = "2223"
    expectedResult.ticketPassCode = "T001"

    jest.spyOn(participantImportService, 'checkTicketPassCodeExist').mockImplementationOnce(async (query): Promise<any> => { return expectedResult });

    const result = await participantImportService.checkTicketPassCodeExist(ticketPassCode, "bnr", "2223", "2023");
    expect(result).toEqual(expectedResult);
  });

  it('Test function convertToConferenceRegReq', async () => {
    let query = new ORSParticipantImportV2RequestDto()
    query.registrationNo = "999999220102201333"
    query.ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    query.registrationStatus = "CONFIRMED"
    query.registrationNo = "741557220101219000"
    query.shownInPartiList = "N"
    query.projectNum = "219"
    query.projectYear = "2022"
    query.displayName = "Blue Benedict"
    query.firstName = "Benedict"
    query.lastName = "Blue"
    query.title = "Mr"
    query.email = "testing3@gmail.com"
    query.countryCode = "HKG"
    query.ticketPassCode = "T001"
    query.promotionCode = ""
    query.position = "Technicant"
    query.companyName = "Testing Paper Ltd."
    query.generalParticipantRemark = ""
    query.correspondenceEmail = ""
    query.customQuestionList = []

    const expectedResult: Partial<FairRegistration> = {
      serialNumber: "999999",
      projectYear: "2022",
      projectNumber: "201",
      sourceTypeCode: "01",
      visitorTypeCode: "02",
      correspondenceEmail: "",
      fairCode: "bnr",
      fiscalYear: "2223",
      fairParticipantId: "1",
      fairRegistrationTypeId: "1",
      fairRegistrationStatusId: "5",
      fairParticipantTypeId: "1",
      c2mParticipantStatusId: "1",
      title: "Mr",
      firstName: "Benedict",
      lastName: "Blue",
      displayName: "Blue Benedict",
      position: "Technicant",
      companyName: "Testing Paper Ltd.",
      addressCountryCode: "HKG",
      promotionCode: "",
      generalBuyerRemark: "",
      createdBy: "ORS API",
      lastUpdatedBy: "ORS API"
    }

    jest.spyOn(participantImportService, 'convertToConferenceRegReq').mockImplementationOnce(async (query): Promise<Partial<FairRegistration>> => { return expectedResult });

    const result = await participantImportService.convertToConferenceRegReq(query, "1", "bnr", "2223");
    expect(result).toEqual(expectedResult);
  });

  it('Test function convertToFairParticipantReq', async () => {
    const ssoUid = "4001b9d205644d5fa528b73420c89a6e"
    const email = "testing3@gmail.com"

    const expectedResult: Partial<FairParticipant> = {
      ssoUid: "4001b9d205644d5fa528b73420c89a6e",
      emailId: "testing3@gmail.com",
      createdBy: "ORS API",
      lastUpdatedBy: "ORS API"
    }

    jest.spyOn(participantImportService, 'convertToFairParticipantReq').mockImplementationOnce((ssoUid, email): Partial<FairParticipant> => { return expectedResult });

    const result = participantImportService.convertToFairParticipantReq(ssoUid, email);
    expect(result).toEqual(expectedResult);
  });

  it('Test function convertToFairRegCustomQuestionReq', async () => {
    const fairRegistrationId = "1"
    const customQuestion: CustomQuestion[] = [
      {
        questionNum: "1",
        questionAns: "123",
      }
    ]

    const expectedResult: Partial<FairRegistrationCustomQuestion>[] = [{
      categoryCode: "123",
      questionNum: "1",
      createdBy: "ORS API",
      lastUpdatedBy: "ORS API"
    }]

    jest.spyOn(participantImportService, 'convertToFairRegCustomQuestionReq').mockImplementationOnce((fairRegistrationId, customQuestion): Partial<FairRegistrationCustomQuestion>[] => { return expectedResult });

    const result = participantImportService.convertToFairRegCustomQuestionReq(fairRegistrationId, customQuestion);
    expect(result).toEqual(expectedResult);
  });

  it('Test function convertToFairRegCustomQuestionReqR1AB2', async () => {
    const fairRegistrationId = "1"
    const customQuestion: CustomQuestionV2[] = [
      {
        questionNum: "1",
        questionAns: [{
          categoryCode: "123",
          text: "test"
        }],
      }
    ]

    const expectedResult: Partial<FairRegistrationCustomQuestion>[] = [{
      categoryCode: "123",
      optionText: "test",
      questionNum: "1",
      createdBy: "ORS API",
      lastUpdatedBy: "ORS API"
    }]

    jest.spyOn(participantImportService, 'convertToFairRegCustomQuestionReqR1AB2').mockImplementationOnce((fairRegistrationId, customQuestion): Partial<FairRegistrationCustomQuestion>[] => { return expectedResult });

    const result = participantImportService.convertToFairRegCustomQuestionReqR1AB2(fairRegistrationId, customQuestion);
    expect(result).toEqual(expectedResult);
  });

  it('Test function convertToFairRegTicketPassReq', async () => {
    const fairRegistrationId = "1"
    const ticketPassCode = "T001"

    const expectedResult: Partial<FairRegistrationTicketPass> = {
      fairRegistrationId: "1",
      ticketPassCode: "T001",
      createdBy: "ORS API",
      lastUpdatedBy: "ORS API"
    }

    jest.spyOn(participantImportService, 'convertToFairRegTicketPassReq').mockImplementationOnce((fairRegistrationId, ticketPassCode): Partial<FairRegistrationTicketPass> => { return expectedResult });

    const result = participantImportService.convertToFairRegTicketPassReq(fairRegistrationId, ticketPassCode);
    expect(result).toEqual(expectedResult);
  });

  it('Test function checkRegistrationNumber', async () => {
    const registrationNo = "999999220102201333"

    jest.spyOn(participantImportService, 'checkRegistrationNumber').mockImplementationOnce((value) => { });

    const result = participantImportService.checkRegistrationNumber(registrationNo);
    expect(result).toEqual(undefined);
  });

  it('Test function checkSelectedFairWithRegNo', async () => {
    const registrationNo = "999999220102201333"
    const projectYear = "2022"
    const projectNumber = "201"

    jest.spyOn(participantImportService, 'checkSelectedFairWithRegNo').mockImplementationOnce((value) => { });

    const result = participantImportService.checkSelectedFairWithRegNo(registrationNo, projectNumber, projectYear);
    expect(result).toEqual(undefined);
  });

  it('Test function checkRegNoWithExistingParticipant', async () => {
    const registrationNo = "999999220102201333"
    const prevSerialNumber = "999999"
    const prevProjectYear = "2022"
    const prevSourceType = "01"
    const prevVisitorType = "02"
    const prevProjectNumber = "201"

    jest.spyOn(participantImportService, 'checkRegNoWithExistingParticipant').mockImplementationOnce(async (value): Promise<boolean> => { return false });

    const result = await participantImportService.checkRegNoWithExistingParticipant(registrationNo, prevSerialNumber, prevProjectYear, prevSourceType, prevVisitorType, prevProjectNumber);
    expect(result).toEqual(false);
  });
})


export class FairRegistrationRepositoryFake {
  public create(): void { }
  public async find(): Promise<any> { }
  public async findOne(): Promise<any> { return new FairRegistrationImportTask(); }
  public async update(): Promise<any> { }
}

afterAll(async () => {
  await app?.close();
});
