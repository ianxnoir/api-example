import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UtilsModule } from "../../core/utils/utils";
import { FairRegistrationImportTask } from '../../dao/FairRegistrationImportTask';
import { FairRegistration } from '../../dao/FairRegistration';
import { BuyerImportService } from './buyerImport.service';
import { BuyerImportRegistrationRequestDto, GetFairRegistrationTaskReqDto } from './dto/buyerImportRequest.dto';
import { DatabaseService } from '../../core/database/database.service';
import { Repository } from 'typeorm';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';

let app: TestingModule;
let buyerImportService: BuyerImportService
let buyerImportRepository : Repository<FairRegistrationImportTask>


beforeAll(async () => {
  jest.clearAllMocks()
  app = await Test.createTestingModule({
    imports: [
      UtilsModule,
    ],
    providers: [
      BuyerImportService,
      ConfigService,
      DatabaseService,
      {
        provide: getRepositoryToken(FairRegistrationImportTask),
        useClass: FairRegistrationRepositoryFake,
      },
      {
        provide: getRepositoryToken(FairRegistration),
        useClass: FairRegistrationRepositoryFake,
      },
    ]
  }).compile()
  buyerImportService = app.get(BuyerImportService)
  buyerImportRepository = app.get(getRepositoryToken(FairRegistrationImportTask));
})

afterEach(() => {
  jest.clearAllMocks();
});


describe('Buyer Import Tasks', () => {
  it('Get All Buyer Import Tasks', async () => {
    let registration: FairRegistrationImportTask = new FairRegistrationImportTask()
    registration.taskId =  "1",
    registration.originalFileName = "023-02-01 Full Data Export_Visitor_Records_sample.xlsx",
    registration.uploadFileS3ObjectRefId = "2ce2e235-e316-4e1a-b9c7-b431d9f1a2bd",
    registration.failureReportS3ObjectRefId = "76038231-6df3-4cea-afce-38f04edea459",
    registration.fairCode = "hkjewellery",
    registration.fiscalYear = "2023",
    registration.projectYear = "2021",
    registration.actionType = "INSERT_PAST_BUYER",
    registration.sourceType = "8",
    registration.visitorType = "01",
    registration.participantTypeId = "1",
    registration.tier = "GENERAL",
    registration.serialNumberStart = 1,
    registration.numberOfRow = 200000,
    registration.status = "PENDING",
    registration.createdBy =  "SYSTEM",
    registration.lastUpdatedBy =  "SYSTEM"

    let query = new GetFairRegistrationTaskReqDto()
    query.pageNum = 1
    query.size = 10

    const registrationMockedResponse: FairRegistrationImportTask[] = [
      registration
    ];

    const currentUser: AdminUserDto = {
      name: "spiderman",
      emailAddress: "spiderman@nowayhome.com",
      permission: [],
      branchOffice: 'HK',
      branchOfficeUser: 0,
      fairAccessList: 'hkjewellery,hkwinefair,hklicensingshow,hkdgp'
    };
    jest.spyOn(buyerImportService, 'getBuyerImportTasks').mockImplementationOnce(async (currentUser, query): Promise<any> => { return  registrationMockedResponse});

    const result = await buyerImportService.getBuyerImportTasks(currentUser, query);
    expect(result).toEqual(registrationMockedResponse);
  });


  it('Should successfully post buyer import task', async () => {
    let registration = new BuyerImportRegistrationRequestDto()
    registration.taskId =  "1",
    registration.originalFileName = "023-02-01 Full Data Export_Visitor_Records_sample.xlsx",
    registration.uploadFileS3ObjectRefId = "2ce2e235-e316-4e1a-b9c7-b431d9f1a2bd",
    registration.failureReportS3ObjectRefId = "76038231-6df3-4cea-afce-38f04edea459",
    registration.fairCode = "hkjewellery",
    registration.fiscalYear = "2023",
    registration.projectYear = "2021",
    registration.actionType = "INSERT_PAST_BUYER",
    registration.sourceType = "8",
    registration.visitorType = "01",
    registration.participantTypeId = 1,
    registration.tier = "GENERAL",
    registration.serialNumberStart = 1,
    registration.numberOfRow = 200000,
    registration.status = "PENDING",
    registration.createdBy =  "spiderman@nowayhome.com",
    registration.lastUpdatedBy =  "SYSTEM"

    let registrationResponse = new FairRegistrationImportTask()
    registrationResponse.id = "1",
    registrationResponse.taskId =  "1",
    registrationResponse.originalFileName = "023-02-01 Full Data Export_Visitor_Records_sample.xlsx",
    registrationResponse.uploadFileS3ObjectRefId = "2ce2e235-e316-4e1a-b9c7-b431d9f1a2bd",
    registrationResponse.failureReportS3ObjectRefId  = "76038231-6df3-4cea-afce-38f04edea459",
    registrationResponse.fairCode = "hkjewellery",
    registrationResponse.fiscalYear = "2023",
    registrationResponse.projectYear = "2021",
    registrationResponse.actionType = "INSERT_PAST_BUYER",
    registrationResponse.sourceType = "8",
    registrationResponse.visitorType = "01",
    registrationResponse.participantTypeId = "1",
    registrationResponse.tier = "GENERAL",
    registrationResponse.serialNumberStart = 1,
    registrationResponse.numberOfRow = 200000,
    registrationResponse.status = "PENDING",
    registrationResponse.createdBy =  "spiderman@nowayhome.com",
    registrationResponse.lastUpdatedBy =  "SYSTEM"

    const registrationMockedResponse: FairRegistrationImportTask[] = [
      registrationResponse
    ];

    const currentUser: AdminUserDto = {
      name: "spiderman",
      emailAddress: "spiderman@nowayhome.com",
      permission: [],
      branchOffice: 'HK',
      branchOfficeUser: 0,
      fairAccessList: 'hkjewellery,hkwinefair,hklicensingshow,hkdgp'
    };

    jest.spyOn(buyerImportService, "createBuyerImportTask").mockImplementationOnce(async () => registrationMockedResponse)

    const result = await buyerImportService.createBuyerImportTask(currentUser, registration);

    expect(result).toEqual(registrationMockedResponse)
  })

  it('Should successfully update buyer import task', async () => {
    let registration: BuyerImportRegistrationRequestDto = new BuyerImportRegistrationRequestDto()
    registration.taskId =  "1",
    registration.originalFileName = "023-02-01 Full Data Export_Visitor_Records_sample.xlsx",
    registration.uploadFileS3ObjectRefId = "2ce2e235-e316-4e1a-b9c7-b431d9f1a2bd",
    registration.failureReportS3ObjectRefId = "76038231-6df3-4cea-afce-38f04edea459",
    registration.fairCode = "hkjewellery",
    registration.fiscalYear = "2023",
    registration.projectYear = "2021",
    registration.actionType = "INSERT_PAST_BUYER",
    registration.sourceType = "8",
    registration.visitorType = "01",
    registration.participantTypeId = 1,
    registration.tier = "GENERAL",
    registration.serialNumberStart = 1,
    registration.numberOfRow = 200000,
    registration.status = "PENDING",
    registration.createdBy =  "SYSTEM",
    registration.lastUpdatedBy =  "SYSTEM"

    let registrationResponse: FairRegistrationImportTask = new FairRegistrationImportTask()
    registrationResponse.id = "1",
    registrationResponse.taskId =  "1",
    registrationResponse.originalFileName = "023-02-01 Full Data Export_Visitor_Records_sample.xlsx",
    registrationResponse.uploadFileS3ObjectRefId = "2ce2e235-e316-4e1a-b9c7-b431d9f1a2bd",
    registrationResponse.failureReportS3ObjectRefId  = "76038231-6df3-4cea-afce-38f04edea459",
    registrationResponse.fairCode = "hkjewellery",
    registrationResponse.fiscalYear = "2023",
    registrationResponse.projectYear = "2021",
    registrationResponse.actionType = "INSERT_PAST_BUYER",
    registrationResponse.sourceType = "8",
    registrationResponse.visitorType = "01",
    registrationResponse.participantTypeId = "1",
    registrationResponse.tier = "GENERAL",
    registrationResponse.serialNumberStart = 1,
    registrationResponse.numberOfRow = 200000,
    registrationResponse.status = "PENDING",
    registrationResponse.createdBy =  "SYSTEM",
    registrationResponse.lastUpdatedBy =  "SYSTEM"

    const registrationMockedResponse: FairRegistrationImportTask[] = [
      registrationResponse
    ];

    const registrationSingleMockedResponse: FairRegistrationImportTask =
      registrationResponse;

    const headers = {'x-request-id': '8d3574ae-7f07-4a6c-8ca2-85f8713524cc'};
    const taskId = '1';

    const buyerImportRepositoryFindSpy = jest
    .spyOn(buyerImportRepository , 'find')
    .mockResolvedValue(registrationMockedResponse);

    jest.spyOn(buyerImportRepository, 'update').mockImplementation(async (taskId): Promise<any> => {return });

    const buyerImportRepositoryFindOneSpy = jest
    .spyOn(buyerImportRepository , 'findOne')
    .mockResolvedValue(registrationSingleMockedResponse);

    const result = await buyerImportService.updateRegistrationTaskStatus(headers, taskId, registration);
    expect(buyerImportRepositoryFindSpy).toHaveBeenCalled()
    expect(buyerImportRepositoryFindOneSpy).toHaveBeenCalled()
    expect(result).toEqual(registrationSingleMockedResponse)
  })
})


export class FairRegistrationRepositoryFake {
  public create(): void {}
  public async find(): Promise<any> {}
  public async findOne(): Promise<any> {return new FairRegistrationImportTask();}
  public async update(): Promise<any> {}
}

afterAll(async () => {
  await app?.close();
});
