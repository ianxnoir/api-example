import { HttpModule } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getEntityManagerToken, getRepositoryToken } from "@nestjs/typeorm";
import { Subsegment } from "aws-xray-sdk";
import { Logger } from "../../core/utils";
import * as typeorm from 'typeorm';
import { Repository } from "typeorm";
import { UtilsModule } from "../../core/utils/utils";
import { FairRegistration } from "../../dao/FairRegistration";
import { FairDbService } from "./fairDb.service";
import { FairRegistrationStatus } from "../../dao/FairRegistrationStatus";
import { FairParticipant } from "../../dao/FairParticipant";

import { ContentService } from '../api/content/content.service';
import { FairService } from '../fair/fair.service';
import { C2MService } from '../api/c2m/content.service';
import { UpdateC2MProfileReqDto } from "../profile/dto/updateC2MProfileReq.dto";
import { UpdateFairParticipantRegistrationRecordDto } from "../profile/dto/UpdateFairParticipantRegistrationRecord.dto";
import { C2MParticipantStatusListItemDto } from "../registration/dto/updateCToMParticipantStatus.dto";
import { FairRegistrationRemarkReqDto } from "../registration/dto/updateFairRegistration.dto";
import { FairParticipantInflencingReqDto } from "../profile/dto/fairParticipantInflencingReq.dto";
import { SearchC2mExcludedParticipantByFairListObj } from "../profile/dto/searchC2mExcludedParticipant.dto";
import { FairRegistrationNob } from "../../dao/FairRegistrationNob";
import { FairRegistrationPregeneration } from "../../dao/FairRegistrationPregeneration";

const mockSubsegment = {
    close: () => { },
} as Subsegment;

jest.mock('../api/content/content.service', () => {
    return { ContentService: jest.fn()};
});

jest.mock('../api/c2m/content.service', () => {
    return { C2MService: jest.fn() };
});

jest.mock('../fair/fair.service', () => {
    return { FairService: jest.fn() };
});

jest.mock("aws-xray-sdk", () => {
    return {
        captureAsyncFunc: jest.fn((name: string, fn: any) => {
            return fn(mockSubsegment);
        }),
    };
});

jest.mock("typeorm", () => {
    return {
        ...jest.requireActual('typeorm'),
        getManager: jest.fn(),
    };
});

let app: TestingModule;
let fairDbService: FairDbService;
let fairRegistrationRepository: Repository<FairRegistration>;
let fairRegistrationStatusRepository: Repository<FairRegistrationStatus>;
let fairParticipantRepository: Repository<FairParticipant>;
// let fairRegistrationPregenerationRepository: Repository<FairRegistrationPregeneration>;

const mockManagerFactory = jest.fn(() => ({
    delete: jest.fn().mockReturnValue(undefined),
    transaction: jest.fn().mockReturnValue(undefined),
    save: jest.fn().mockReturnValue(undefined),
}));


const mockManager: any = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
};

const mockTransaction: any = {
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
};

export class MockRepositoryFake {
    public createQueryBuilder(): any { }
    public async find(): Promise<any[]> { return []; }
    public async findOne(): Promise<any> { return null; }
    public async findByIds(): Promise<any[]> { return []; }
    public async update(): Promise<typeorm.UpdateResult> { return new typeorm.UpdateResult();; }
    public manager = {
        transaction(): any { }
    };
}

let createQueryBuilder: any = {
    select: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    leftJoin: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    leftJoinAndSelect: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    where: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    orWhere: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    andWhere: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    update: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    set: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    groupBy: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    take: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    skip: jest.fn().mockImplementation(() => {
        return createQueryBuilder;
    }),
    getCount: jest.fn(),
    getRawMany: jest.fn(),
    getMany: jest.fn(),
    findOne: jest.fn(),
    execute: jest.fn(),
};

beforeAll(async () => {
    app = await Test.createTestingModule({
        imports: [
            UtilsModule,
            HttpModule,
        ],
        providers: [
            Logger,
            FairService,
            ContentService,
            C2MService,
            {
                provide: getRepositoryToken(FairRegistration),
                useClass: MockRepositoryFake
            }, {
                provide: getRepositoryToken(FairRegistrationStatus),
                useClass: MockRepositoryFake
            }, {
                provide: getRepositoryToken(FairParticipant),
                useClass: MockRepositoryFake
            }, {
                provide: getRepositoryToken(FairRegistrationPregeneration),
                useClass: MockRepositoryFake
            }, {
                provide: getEntityManagerToken(),
                useFactory: mockManagerFactory,
            },
            FairDbService,

        ],
    }).compile();

    fairRegistrationRepository = app.get(getRepositoryToken(FairRegistration));
    fairRegistrationStatusRepository = app.get(getRepositoryToken(FairRegistrationStatus));
    fairParticipantRepository = app.get(getRepositoryToken(FairParticipant));
    // fairRegistrationPregenerationRepository = app.get(getRepositoryToken(FairRegistrationPregeneration));

    jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilder);
    jest.spyOn(fairRegistrationStatusRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilder);
    jest.spyOn(fairParticipantRepository, 'createQueryBuilder').mockReturnValue(createQueryBuilder);
    fairDbService = app.get(FairDbService);
});

afterEach(() => {
    jest.clearAllMocks();
});

afterAll(async () => {
    await app?.close();
});

describe("queryFairDb query part 1", () => {
    test('returns valid results from queryFairRegByFairCodeSsoUid', async () => {
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        const dbResult = [{ fairCode: "hkjewellery" }];
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);

        const result = await fairDbService.queryFairRegByFairCodeSsoUid("ssoUid", "emailId", [{ "fairCode": "hkjewellery", "fiscalYear": "2021" }]);
        expect(result).toStrictEqual([{ fairCode: "hkjewellery" }]);
    });

    test('returns valid results from queryFairRegByFairCodeEmail', async () => {
        const dbResult = [{ fairCode: "hkjewellery" }];
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);

        const result = await fairDbService.queryFairRegByFairCodeEmail("ssoUid", "emailId", "fiscalYear");
        expect(result).toStrictEqual([{ fairCode: "hkjewellery" }]);
    });

    test('returns valid results from queryFairRegByFairParticipantRegId', async () => {
        const dbResult = new FairRegistration();
        jest.spyOn(fairRegistrationRepository, 'findOne').mockResolvedValueOnce(dbResult);

        const result = await fairDbService.queryFairRegByFairParticipantRegId(123456);
        expect(result).toStrictEqual(dbResult);
    });

    test('returns valid results from queryFairRegByFairParticipantRegIds', async () => {
        const dbResult = [new FairRegistration()];
        jest.spyOn(fairRegistrationRepository, 'findByIds').mockResolvedValueOnce(dbResult);

        const result = await fairDbService.queryFairRegByFairParticipantRegIds([123456, 223456]);
        expect(result).toStrictEqual(dbResult);
    });

    test('returns valid results from updateC2MProfile', async () => {
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (fairReg: any): Promise<any> => { return fairReg; });
        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);

        const dbResult = new FairRegistration();
        const result = await fairDbService.updateC2MProfile(dbResult, new UpdateC2MProfileReqDto());
        expect(result).toEqual(dbResult);
        expect(mockTransaction.save).toBeCalledTimes(1);
    });

    test('returns valid results from updateFairParticipantRegistrationRecord', async () => {
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (fairReg: any): Promise<any> => { return fairReg; });
        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);

        const dbResult = new FairRegistration();
        const result = await fairDbService.updateFairParticipantRegistrationRecord(dbResult, new UpdateFairParticipantRegistrationRecordDto(), []);
        expect(result).toEqual(undefined);
        expect(mockTransaction.save).toBeCalledTimes(2);
    });

    test('returns valid results from updateFairParticipantRegistrationRecordStatusListByIds', async () => {
        jest.spyOn(mockTransaction, 'update').mockImplementationOnce(async (): Promise<any> => { return { affected: 2 }; });
        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);

        let dto = new C2MParticipantStatusListItemDto();
        dto.registrationRecordId = 12345678;
        dto.status = 1;

        const result = await fairDbService.updateFairParticipantRegistrationRecordStatusListByIds([dto]);
        expect(result).toEqual(2);
        expect(mockTransaction.update).toBeCalledTimes(1);
    });

    test('returns valid results from updateFairRegRemarkById', async () => {
        let dbResult = new typeorm.UpdateResult();
        dbResult.affected = 2;
        jest.spyOn(fairRegistrationRepository, 'update').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.updateFairRegRemarkById(123456,
            new FairRegistrationRemarkReqDto("cbmRemark", "vpRemark", "generalBuyerRemark"));
        expect(result).toEqual(dbResult);
    });
});

describe("queryFairDb query part 2", () => {
    test('returns valid results from queryFairParticipantRegistrations', async () => {
        let dbResult = [new FairRegistration()];
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.queryFairParticipantRegistrations("ssoUid");
        expect(result).toEqual(dbResult);
    });

    test('returns valid results from queryActiveFairRegistrationsBySsoUid', async () => {
        let dbResult = [new FairRegistration()];
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.queryActiveFairRegistrationsBySsoUid("ssoUid", new FairParticipantInflencingReqDto(), []);
        expect(result).toEqual(dbResult);
    });

    test('returns valid results from queryActiveFairParticipantRegistrations', async () => {
        let dbResult = [new FairRegistration()];
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.queryActiveFairParticipantRegistrations([]);
        expect(result).toEqual(dbResult);
    });

    test('returns valid results from queryFairRegStatusByRegStatusIds', async () => {
        let dbResult = [new FairRegistrationStatus()];
        jest.spyOn(fairRegistrationStatusRepository, 'findByIds').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.queryFairRegStatusByRegStatusIds([]);
        expect(result).toEqual(dbResult);
    });

    test('returns valid results from updateRegistrationStatusByRegId', async () => {
        jest.spyOn(mockTransaction, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);
        const result = await fairDbService.updateRegistrationStatusByRegId([{ registrationRecordId: "string", status: "string", c2m: "string" }]);
        expect(result).toEqual({ isSuccess: true, 'user-activity': [] });
    });

    test('returns valid results from queryC2mExcludedParticipants', async () => {
        let dbResult = [new FairRegistration()];
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.queryC2mExcludedParticipants(new SearchC2mExcludedParticipantByFairListObj());
        expect(result).toEqual(dbResult);
    });

});
describe("queryFairDb query part 3", () => {

    test('returns valid results from constructCombinedFairQuery', async () => {
        const result = fairDbService.constructCombinedFairQuery([], []);
        expect(result).toEqual("");

        let fairDatas = [{ "relatedFair": [{ "fair_code": "fair_code", "fiscal_year": "fiscal_year" }], "fairCode": "fairCode" }];
        const result2 = fairDbService.constructCombinedFairQuery(["fairCode"], fairDatas);
        expect(result2).toEqual(`1 = 0`);
    });

    test('returns valid results from contructSearchFairParticipantsProductCategoryList', async () => {
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        const dbResult = [{ stId: "stId" }];
        jest.spyOn(createQueryBuilder, 'getRawMany').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.contructSearchFairParticipantsProductCategoryList([]);
        expect(result).toEqual(["stId"]);
    });

    test('returns valid results from contructSearchFairParticipantsProductCategoryList', async () => {
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        const dbResult = [{ stId: "stId" }];
        jest.spyOn(createQueryBuilder, 'getRawMany').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.contructSearchFairParticipantsProductCategoryList([]);
        expect(result).toEqual(["stId"]);
    });

    test('returns valid results from getHiddenRecordList', async () => {
        const result = await fairDbService.getHiddenRecordList([], [], "mySsoUid");
        expect(result).toEqual([]);
    });

});

describe("queryFairDb query part 4", () => {
    test('returns valid results from searchFairParticipantsFilterOptionDbQuery', async () => {
        const dbResult = [{ selectionAliasName: "selectionAliasName" }];
        const searchQuery = {
            keyword: "string",
            lang: "string",
            from: 1,
            size: 100,
            fairCodes: [],
            filterCountry: [],
            filterNob: [],
            filterProductCategory: [],
            filterParticipatingFair: [],
            alphabet: "string",
            ssoUidList: [],
        };
        jest.spyOn(createQueryBuilder, 'getRawMany').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.searchFairParticipantsFilterOptionDbQuery(createQueryBuilder, "selection", "selectionAliasName", searchQuery, undefined);
        expect(result).toEqual(["selectionAliasName"]);
    });

    test('returns valid results from searchFairParticipantsDbQuery', async () => {
        let searchFairParticipantsInterface = {
            keyword: "string",
            lang: "string",
            from: 1,
            size: 100,
            fairCodes: [],
            filterCountry: [],
            filterNob: [],
            filterProductCategory: [],
            filterParticipatingFair: [],
            alphabet: "string",
            ssoUidList: [],
        };

        jest.spyOn(createQueryBuilder, 'getCount').mockResolvedValueOnce(1);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce([new FairRegistration()]);
        const dbResult = [{ selectionAliasName: "selectionAliasName" }];
        jest.spyOn(createQueryBuilder, 'getRawMany').mockResolvedValue(dbResult);
        const result = await fairDbService.searchFairParticipantsDbQuery(searchFairParticipantsInterface, [], [], [], undefined);
        expect(result).toEqual({
            "count": 1,
            "userList": [new FairRegistration()],
            "fairCodeList": [undefined],
            "countryCodeList": [undefined],
            "nobList": [undefined],
            "productInterestList": [undefined]
        });
    });

    test('returns valid results from retrieveVisitorTypeCodeList', async () => {
        const dbResult = [{ VisitorType: "VisitorType" }];
        jest.spyOn(createQueryBuilder, 'getRawMany').mockResolvedValueOnce(dbResult);
        jest.spyOn(mockManager, 'getRepository').mockImplementationOnce(() => {
            return {
                createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilder)
            }
        });
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);

        const result = await fairDbService.retrieveVisitorTypeCodeList();
        expect(result).toEqual(dbResult);
    });

    test('returns valid results from invalidateFairRegistration', async () => {
        jest.spyOn(mockTransaction, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValueOnce(mockManager);

        const result = await fairDbService.invalidateFairRegistration([{ registrationRecordId: "string", status: "string" }]);
        expect(result).toEqual(true);
    });

    test('returns valid results from getFairParticipantByEmailId', async () => {

        const dbResult = [{ fairCode: "hkjewellery" }];
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.getFairParticipantByEmailId("emailId");
        expect(result).toEqual(dbResult);
    });
    
    test('returns valid results from linkFairParticipantSsoUidByEmailId', async () => {
        jest.spyOn(fairParticipantRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);

        let dbResult = new typeorm.UpdateResult();
        dbResult.affected = 0;
        jest.spyOn(fairParticipantRepository, 'update').mockResolvedValueOnce(dbResult);
        const result = await fairDbService.linkFairParticipantSsoUidByEmailId("ssoUid", "emailId");
        expect(result).toEqual(0);
    });
});

describe("queryFairDb query part 5", () => {
    test('returns valid results from getSSOAutoHandlingField', async () => {
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        let record = new FairRegistration()
        record.id = "1"
        record.fairRegistrationNobs = [new FairRegistrationNob()]
        const dbResult = [record];

        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult).mockResolvedValueOnce(dbResult)
        const result = await fairDbService.getSSOAutoHandlingField("ssoUid", "fairCode", "fiscalYear");
        expect(result).toEqual(record);
    });
})