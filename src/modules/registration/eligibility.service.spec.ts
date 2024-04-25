import { CacheModule, HttpModule } from '@nestjs/common';
import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import * as typeorm from 'typeorm';
import { UtilsModule } from "../../core/utils/utils";
import { FairParticipant } from "../../dao/FairParticipant";
import { FairPeriod } from "../../dao/FairPeriod";
import { FairRegistration } from "../../dao/FairRegistration";
import { FairRegistrationStatus } from "../../dao/FairRegistrationStatus";
import { FairRegistrationPregeneration } from "../../dao/FairRegistrationPregeneration";
import { C2MService } from "../api/c2m/content.service";
import { ContentService } from "../api/content/content.service";
import { BuyerService } from "../api/buyer/buyer.service";
import { ExhibitorService } from "../api/exhibitor/exhibitor.service";
import { FairService } from "../fair/fair.service";
import { FairDbService } from "../fairDb/fairDb.service";
import { FORM_TYPE } from "../formValidation/enum/formType.enum";
import { EligibilityResponseDto, RegistrationDetailsResponseDto, RegistrationRequestDto } from "./dto/RegistrationRequest.dto";
import { EligibilityService } from "./eligibility.service";
import { XTraceDto } from "../../core/decorator/xTraceId.decorator";
import { SSOUserHeadersDto } from "../../core/decorator/ssoUser.decorator";
import { Registration } from "../../entities/registration.entity";
import { ContentCacheService } from '../api/content/content-cache.service';
import { ElasticacheClusterModule } from '../../core/elasticachecluster/elasticachecluster.providers';
import { ESModule } from '../esHelper/es.module';

let app: TestingModule;
let exhibitorService: ExhibitorService
let buyerService: BuyerService

let fairDbService: FairDbService
let eligibilityService: EligibilityService

class MockRepositoryFake {
    public createQueryBuilder(): any { }
    public async find(): Promise<any[]> { return []; }
    public async findOne(): Promise<any> { return null; }
    public async findByIds(): Promise<any[]> { return []; }
    public async update(): Promise<typeorm.UpdateResult> { return new typeorm.UpdateResult();; }
    public manager = {
        transaction(): any { }
    };
}

beforeAll(async () => {
    app = await Test.createTestingModule({
        imports: [
            UtilsModule,
            HttpModule,
            CacheModule.register(),
            ElasticacheClusterModule,
            ESModule
        ],
        providers: [
            ExhibitorService,
            ContentService,
            ContentCacheService,
            C2MService,
            FairService,
            BuyerService,
            FairDbService,
            {
                provide: getRepositoryToken(FairRegistration),
                useClass: MockRepositoryFake
            }, 
            {
                provide: getRepositoryToken(FairRegistrationStatus),
                useClass: MockRepositoryFake
            }, 
            {
                provide: getRepositoryToken(FairParticipant),
                useClass: MockRepositoryFake
            },
            {
                provide: getRepositoryToken(FairPeriod),
                useClass: MockRepositoryFake
            },
            {
                provide: getRepositoryToken(FairRegistrationPregeneration),
                useClass: MockRepositoryFake
            },
            {
                provide: getRepositoryToken(Registration),
                useClass: MockRepositoryFake
            },
            EligibilityService,
        ],
    }).compile();

    eligibilityService = app.get(EligibilityService);
    exhibitorService = app.get(ExhibitorService);
    buyerService = app.get(BuyerService);
    fairDbService = app.get(FairDbService);

    jest.useFakeTimers("modern").setSystemTime(new Date('2022-04-20').getTime()); // mock time to 2022-04-20
});

afterEach(() => {
    jest.clearAllMocks();
});

afterAll(async () => {
    await app?.close();
});

describe("prepareEligibilityResponse", () => {
    it('should get result from prepareRegistrationResult', async () => {
        jest.spyOn(eligibilityService, 'checkIsEnabledToggle').mockReturnValueOnce(true);
        jest.spyOn(eligibilityService, 'checkIsWithinRegistrationPeriod').mockReturnValueOnce(true);
        jest.spyOn(exhibitorService, 'checkExhibitorExistence').mockResolvedValueOnce(false);
        const dummyFairReg = new FairRegistration
        jest.spyOn(fairDbService, 'checkRegistrationExistence').mockResolvedValueOnce([dummyFairReg]);
        let eligibilityResponse: EligibilityResponseDto = {
            eligibility: true,
            code: "ELIGIBLE", 
            registrationFormUrl: "",
        }
        jest.spyOn(eligibilityService, 'prepareRegistrationResult').mockResolvedValueOnce(eligibilityResponse);
        const result = await eligibilityService.prepareEligibilityResponse(DummyHelper.getSetting(), null, DummyHelper.getQuery(), FORM_TYPE.ORGANIC_BUYER, undefined)
        expect(result).toStrictEqual(eligibilityResponse)
    })    
})

describe("test prepareRegistrationResult", () => {
    it('should return ELIGIBLE', async () => {
        //@ts-ignore
        const result = await eligibilityService.prepareRegistrationResult([{fairRegistrationStatus:{fairRegistrationStatusCode: "CANCELLED"}}], DummyHelper.getQuery(), true, new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, undefined,  DummyHelper.getXTraceDto())
        let eligibilityResponse: EligibilityResponseDto = {
            eligibility: true,
            code: "ELIGIBLE", 
            registrationFormUrl: "",
        }
        expect(result).toEqual(eligibilityResponse)
    })

    it('should return REGISTRATION_REJECTED_ACCOUNT_TEMPORARILY_RESTRICTED', async () => {
        //@ts-ignore
        const result = await eligibilityService.prepareRegistrationResult([{fairRegistrationStatus:{fairRegistrationStatusCode: "REJECTED"}}], DummyHelper.getQuery(), true, new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, undefined,  DummyHelper.getXTraceDto())
        let eligibilityResponse: EligibilityResponseDto = {
            eligibility: false,
            code: "REGISTRATION_REJECTED_ACCOUNT_TEMPORARILY_RESTRICTED", 
            registrationFormUrl: "",
        }
        expect(result).toEqual(eligibilityResponse)
    })

    it('should return NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE', async () => {
        jest.spyOn(buyerService, 'checkEmailExistenceInSso').mockResolvedValueOnce(true);
        jest.spyOn(eligibilityService, 'isHigherPriorityForNotLoginedUsers').mockResolvedValueOnce(true);
        //@ts-ignore
        const result = await eligibilityService.prepareRegistrationResult([{fairRegistrationStatus:{fairRegistrationStatusCode: "CONFIRMED"}}], DummyHelper.getQuery(), false, new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, undefined,  DummyHelper.getXTraceDto())
        let eligibilityResponse: EligibilityResponseDto = {
            eligibility: false,
            code: "NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE", 
            registrationFormUrl: "",
        }
        expect(result).toEqual(eligibilityResponse)
    })

    it('should return NOT_LOGGED_IN_ALREADY_REGISTERED_HAS_SSO_ACCOUNT', async() => {
        jest.spyOn(buyerService, 'checkEmailExistenceInSso').mockResolvedValueOnce(true);
        jest.spyOn(eligibilityService, 'isHigherPriorityForNotLoginedUsers').mockResolvedValueOnce(false);

        // @ts-ignore
        const result = await eligibilityService.prepareRegistrationResult([{fairRegistrationStatus:{fairRegistrationStatusCode: "CONFIRMED"}}], DummyHelper.getQuery(), false, new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, undefined,  DummyHelper.getXTraceDto())
        let eligibilityResponse: EligibilityResponseDto = {
            eligibility: false,
            code: "NOT_LOGGED_IN_ALREADY_REGISTERED_HAS_SSO_ACCOUNT", 
            registrationFormUrl: "",
        }
        expect(result).toEqual(eligibilityResponse)
    })

    it('should return NOT_LOGGED_IN_ALREADY_REGISTERED_NO_SSO_ACCOUNT', async () => {
        jest.spyOn(buyerService, 'checkEmailExistenceInSso').mockResolvedValueOnce(false);
        jest.spyOn(eligibilityService, 'isHigherPriorityForNotLoginedUsers').mockResolvedValueOnce(false);
        //@ts-ignore
        const result = await eligibilityService.prepareRegistrationResult([{fairRegistrationStatus:{fairRegistrationStatusCode: "CONFIRMED"}}], DummyHelper.getQuery(), false, new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, undefined,  DummyHelper.getXTraceDto())
        let eligibilityResponse: EligibilityResponseDto = {
            eligibility: false,
            code: "NOT_LOGGED_IN_ALREADY_REGISTERED_NO_SSO_ACCOUNT", 
            registrationFormUrl: "",
        }
        expect(result).toEqual(eligibilityResponse)
    })

    it('should return NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE', async () => {
        jest.spyOn(buyerService, 'checkEmailExistenceInSso').mockResolvedValueOnce(true);
        //@ts-ignore
        const result = await eligibilityService.prepareRegistrationResult([{fairRegistrationStatus:{fairRegistrationStatusCode: "CANCELLED"}}], DummyHelper.getQuery(), false, new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, undefined,  DummyHelper.getXTraceDto())
        let eligibilityResponse: EligibilityResponseDto = {
            eligibility: false,
            code: "NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE", 
            registrationFormUrl: "",
        }
        expect(result).toEqual(eligibilityResponse)
    })

    it('should return ELIGIBLE', async () => {
        jest.spyOn(buyerService, 'checkEmailExistenceInSso').mockResolvedValueOnce(false);
        //@ts-ignore
        const result = await eligibilityService.prepareRegistrationResult([{fairRegistrationStatus:{fairRegistrationStatusCode: "CANCELLED"}}], DummyHelper.getQuery(), false, new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, undefined,  DummyHelper.getXTraceDto())
        let eligibilityResponse: EligibilityResponseDto = {
            eligibility: true,
            code: "ELIGIBLE", 
            registrationFormUrl: "",
        }
        expect(result).toEqual(eligibilityResponse)
    })
})
describe("checkIsWithinRegistrationPeriod", () => {
    it('should return true, with in organic buyer registration period', () => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = eligibilityService.checkIsWithinRegistrationPeriod(dummyFairSetting, FORM_TYPE.ORGANIC_BUYER, undefined)
        expect(result).toBe(true)
    })

    it('should return false, with in organic buyer registration period', () => {
        let dummyFairSetting = DummyHelper.getSetting()
        dummyFairSetting.fair_registration_end_datetime = "2022-04-02 00:00"
        const result = eligibilityService.checkIsWithinRegistrationPeriod(dummyFairSetting, FORM_TYPE.ORGANIC_BUYER, undefined)
        expect(result).toBe(false)
    })
})

describe("prepareRegistrationResult", () => {
    it('should return NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE', async() => {
        jest.spyOn(buyerService, 'checkEmailExistenceInSso').mockResolvedValueOnce(true);
        const result: EligibilityResponseDto = await eligibilityService.prepareRegistrationResult([], DummyHelper.getQuery(), false, new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, null, DummyHelper.getXTraceDto())
        expect(result.eligibility).toBe(false)
        expect(result.code).toBe("NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE")
    })

    it('should return ELIGIBLE for logined users without Registration Record', async() => {
        const result: EligibilityResponseDto = await eligibilityService.prepareRegistrationResult([],  DummyHelper.getQuery(), true , new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, DummyHelper.getSsoUser(), DummyHelper.getXTraceDto())
        expect(result.eligibility).toBe(true)
    })

    it('should return NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE', async() => {
        jest.spyOn(buyerService, 'checkEmailExistenceInSso').mockResolvedValueOnce(true);
        const result: EligibilityResponseDto = await eligibilityService.prepareRegistrationResult([],  DummyHelper.getQuery(), false , new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, DummyHelper.getSsoUser(), DummyHelper.getXTraceDto())
        expect(result.eligibility).toBe(false)
        expect(result.code).toBe('NOT_LOGGED_IN_EMAIL_ADDRESS_ALREADY_IN_USE')
    })  

    it('should return ELIGIBLE if non-logined users, does not have registration record, no SSO account', async() => {
        jest.spyOn(buyerService, 'checkEmailExistenceInSso').mockResolvedValueOnce(false);
        const result: EligibilityResponseDto = await eligibilityService.prepareRegistrationResult([],  DummyHelper.getQuery(), false , new EligibilityResponseDto(), FORM_TYPE.ORGANIC_BUYER, DummyHelper.getSsoUser(), DummyHelper.getXTraceDto())
        expect(result.eligibility).toBe(true)
    })  
})

describe("checkIsEnabledToggle", () => {
    it('should return checkIsEnabledToggle for Organic Buyer', async() => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = await eligibilityService.checkIsEnabledToggle(dummyFairSetting, FORM_TYPE.ORGANIC_BUYER, DummyHelper.getXTraceDto()) 
        expect(result).toBe(true)
    })

    it('should return checkIsEnabledToggle for Mission Buyer', async() => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = await eligibilityService.checkIsEnabledToggle(dummyFairSetting, FORM_TYPE.MISSION, DummyHelper.getXTraceDto()) 
        expect(result).toBe(true)
    })

    it('should return checkIsEnabledToggle for CIP Buyer', async() => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = await eligibilityService.checkIsEnabledToggle(dummyFairSetting, FORM_TYPE.CIP, DummyHelper.getXTraceDto()) 
        expect(result).toBe(true)
    })

    it('should return checkIsEnabledToggle for Seminar Long Form', async() => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = await eligibilityService.checkIsEnabledToggle(dummyFairSetting, FORM_TYPE.SEMINAR_LONG, DummyHelper.getXTraceDto()) 
        expect(result).toBe(true)
    })

    it('should return checkIsEnabledToggle for AOR Form', async() => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = await eligibilityService.checkIsEnabledToggle(dummyFairSetting, FORM_TYPE.AOR, DummyHelper.getXTraceDto()) 
        expect(result).toBe(true)
    })
})

describe("checkIsWithinRegistrationPeriod", () => {
    it("should checkIsWithinRegistrationPeriod for Organic Buyer", async() => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = await eligibilityService.checkIsWithinRegistrationPeriod(dummyFairSetting, FORM_TYPE.ORGANIC_BUYER, DummyHelper.getXTraceDto())
        expect(result).toBe(true)
    })

    it("should checkIsWithinRegistrationPeriod for Mission Buyer", async() => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = await eligibilityService.checkIsWithinRegistrationPeriod(dummyFairSetting, FORM_TYPE.MISSION, DummyHelper.getXTraceDto())
        expect(result).toBe(true)
    })

    it("should checkIsWithinRegistrationPeriod for CIP Buyer", async() => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = await eligibilityService.checkIsWithinRegistrationPeriod(dummyFairSetting, FORM_TYPE.CIP, DummyHelper.getXTraceDto())
        expect(result).toBe(true)
    })

    it("should checkIsWithinRegistrationPeriod for Seminar Long Form", async() => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = await eligibilityService.checkIsWithinRegistrationPeriod(dummyFairSetting, FORM_TYPE.SEMINAR_LONG, DummyHelper.getXTraceDto())
        expect(result).toBe(true)
    })

    it("should checkIsWithinRegistrationPeriod for Seminar AOR Form", async() => {
        let dummyFairSetting = DummyHelper.getSetting()
        const result = await eligibilityService.checkIsWithinRegistrationPeriod(dummyFairSetting, FORM_TYPE.AOR, DummyHelper.getXTraceDto())
        expect(result).toBe(true)
    })
})

describe("checkRegistrationResultForSsoUser", () => {
    it("should check Eligibility Response as True if the formType is higher than existing one", async() => {
        const result = await eligibilityService.checkRegistrationResultForSsoUser(DummyHelper.getParticipantType("ORGANIC"), DummyHelper.getDefaultEligibilityResponse, FORM_TYPE.MISSION, true, DummyHelper.getSsoUser(), DummyHelper.getQuery(), DummyHelper.getXTraceDto())
        expect(result.eligibility).toEqual(true)
    })

    it("should return Eligibility Response Code if the formType is the same as the existing one for Organic Buyers", async() => {
        const result = await eligibilityService.checkRegistrationResultForSsoUser(DummyHelper.getParticipantType("ORGANIC"), DummyHelper.getDefaultEligibilityResponse, FORM_TYPE.ORGANIC_BUYER, true, DummyHelper.getSsoUser(), DummyHelper.getQuery(), DummyHelper.getXTraceDto())
        expect(result.code).toEqual('LOGGED_IN_ALREADY_REGISTERED_ORGANIC')
    })

    it("should return Eligibility Response Code if the formType is the same as the existing one for Mission Buyers", async() => {
        const result = await eligibilityService.checkRegistrationResultForSsoUser(DummyHelper.getParticipantType("VIP_MISSION"), DummyHelper.getDefaultEligibilityResponse, FORM_TYPE.MISSION, true, DummyHelper.getSsoUser(), DummyHelper.getQuery(), DummyHelper.getXTraceDto())
        expect(result.code).toEqual('LOGGED_IN_ALREADY_REGISTERED_MISSION')
    })

    it("should return Eligibility Response Code if the formType is the same as the existing one for CIP Buyers", async() => {
        const result = await eligibilityService.checkRegistrationResultForSsoUser(DummyHelper.getParticipantType("VIP_CIP"), DummyHelper.getDefaultEligibilityResponse, FORM_TYPE.CIP, true, DummyHelper.getSsoUser(), DummyHelper.getQuery(), DummyHelper.getXTraceDto())
        expect(result.code).toEqual('LOGGED_IN_ALREADY_REGISTERED_CIP')
    })

    it("should return Eligibility Response Code if the formType is lower than the existing one", async() => {
        const result = await eligibilityService.checkRegistrationResultForSsoUser(DummyHelper.getParticipantType("VIP_CIP"), DummyHelper.getDefaultEligibilityResponse, FORM_TYPE.ORGANIC_BUYER, true, DummyHelper.getSsoUser(), DummyHelper.getQuery(), DummyHelper.getXTraceDto())
        expect(result.code).toEqual('LOGGED_IN_LOWER_PARTICIPANT_TYPE')
    })
})

describe('isHigherPriorityForNotLoginedUsers', () => {
    it('should return true when the formType is higher than the existing one for non-loggined users', async() => {
        const result = await eligibilityService.isHigherPriorityForNotLoginedUsers(DummyHelper.getParticipantType("ORGANIC"), FORM_TYPE.CIP)
        expect(result).toEqual(true)
    })

    it('should return false when the formType is lower than the existing one for non-loggined users', async() => {
        const result = await eligibilityService.isHigherPriorityForNotLoginedUsers(DummyHelper.getParticipantType("VIP_CIP"), FORM_TYPE.ORGANIC_BUYER)
        expect(result).toEqual(false)
    })
})
class DummyHelper {
    static getSetting = (): RegistrationDetailsResponseDto => {
        return {
            fiscal_year: "2223",
            eoa_fair_id: "1951",
            fair_registration: 1,
            fair_registration_start_datetime: "2022-04-01 00:00",
            fair_registration_end_datetime: "2022-06-30 00:00",
            always_on_form_display: 1,
            aor_form_registration_start_datetime: "2022-04-01 00:00",
            aor_form_registration_end_datetime: "2022-06-30 00:00",
            cip_form_registration: 1,
            cip_form_registration_start_datetime: "2022-04-01 00:00",
            cip_form_registration_end_datetime: "2022-06-30 00:00",
            mission_form_registration: 1,
            mission_form_registration_start_datetime: "2022-04-01 00:00",
            mission_form_registration_end_datetime: "2022-06-30 00:00",
            seminar_registration: 1,
            seminar_registration_start_datetime: "2022-04-01 00:00",
            seminar_registration_end_datetime: "2022-06-30 00:00",
        }
    }
    static getQuery = (): RegistrationRequestDto => {
        return {
            fairCode: "hkjewellery",
            emailId: "test@test.com",
            lang: "en",
            slug: "organic-buyer-registration-form",
            useDummy: "false",
        }
    }

    static getXTraceDto = (): XTraceDto => {
        return {
            xTraceId: '12345',
            xRequestId: '67890'
        }
    }

    static getDefaultEligibilityResponse = (): EligibilityResponseDto => {
        return {
            eligibility: true,
            code: "ELIGIBLE",
            registrationFormUrl: "",
        }
    }

    static getSsoUser = (): SSOUserHeadersDto => {
        return {
            accessToken: 'f71c0cfb608d49fa92ab5f430f80123e',
            ssoUid: '12345',
            emailId: 'test@gmail.com',
            firstName: 'test',
            lastName: 'test'
        }
    }

    static getParticipantType = (participantTypeCode: string) => {
        return [{fairParticipantType:{fairParticipantTypeCode: participantTypeCode}}]
    }
}

