import { HttpModule } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { getEntityManagerToken, getRepositoryToken } from "@nestjs/typeorm";
import { Subsegment } from "aws-xray-sdk";
import { Logger } from "../../core/utils";
import * as typeorm from 'typeorm'
import { Repository } from "typeorm";
import { UtilsModule } from "../../core/utils/utils";
import { FairRegistration } from "../../dao/FairRegistration";
import { ProfileDbService } from "./profileDb.service";
import { VepErrorMsg } from "../../config/exception-constant";
import { FairRegistrationProductInterest } from "../../dao/FairRegistrationProductInterest";
import { FairRegistrationDynamicBm } from "../../dao/FairRegistrationDynamicBm";
import { FairRegistrationDynamicOthers } from "../../dao/FairRegistrationDynamicOthers";
import { FairRegistrationProductStrategy } from "../../dao/FairRegistrationProductStrategy";
import { FairRegistrationPreferredSuppCountryRegion } from "../../dao/FairRegistrationPreferredSuppCountryRegion";
import { FairParticipant } from "../../dao/FairParticipant";
import { ProfileEditDto } from "./dto/fairDb.service.dto";

const mockSubsegment = {
    close: () => { },
} as Subsegment;

jest.mock("aws-xray-sdk", () => {
    return {
        captureAsyncFunc: jest.fn((name: string, fn: any) => {
            return fn(mockSubsegment)
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
let profileDbService: ProfileDbService;
let fairRegistrationRepository: Repository<FairRegistration>

const mockManagerFactory = jest.fn(() => ({
    delete: jest.fn().mockReturnValue(undefined),
    transaction: jest.fn().mockReturnValue(undefined),
    save: jest.fn().mockReturnValue(undefined),
}))

beforeAll(async () => {
    app = await Test.createTestingModule({
        imports: [
            UtilsModule,
            HttpModule,
        ],
        providers: [
            Logger,
            ProfileDbService,
            {
                provide: getRepositoryToken(FairRegistration),
                useClass: FairRegistrationRepositoryFake
            },
            {
                provide: getEntityManagerToken(),
                useFactory: mockManagerFactory,
            }
        ],
    }).compile();
    profileDbService = app.get(ProfileDbService);

    fairRegistrationRepository = app.get(getRepositoryToken(FairRegistration));
});

afterEach(() => {
    jest.clearAllMocks();
});

describe("queryRegisteredFairCodeList", () => {
    test('returns valid results', async () => {
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        const dbResult = [{ fairCode: "hkjewellery" }]
        jest.spyOn(createQueryBuilder, 'getRawMany').mockResolvedValueOnce(dbResult);
        const result = await profileDbService.queryRegisteredFairCodeList("")
        expect(result).toStrictEqual(["hkjewellery"])
    });

    test('throw exception', async () => {
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(createQueryBuilder, 'getRawMany').mockRejectedValueOnce({ message: "error message from mocked value" });
        try {
            await profileDbService.queryRegisteredFairCodeList("")
        }
        catch (ex) {
            expect(ex.message).toBe(VepErrorMsg.Database_Error.message)
        }
    });
})

describe("queryFairRegProfileForEditByQueryBuilder", () => {
    test('returns valid results', async () => {
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);

        const dummyFairReg = new FairRegistration()
        dummyFairReg.id = "1001"
        const dummyPI = new FairRegistrationProductInterest()
        dummyPI.fairRegistrationId = dummyFairReg.id
        dummyPI.teCode = "PX00001"
        dummyFairReg.fairRegistrationProductInterests = [dummyPI]
        const dummyBM = new FairRegistrationDynamicBm()
        dummyBM.fairRegistrationId = dummyFairReg.id
        dummyBM.value = "Yes"
        dummyFairReg.fairRegistrationDynamicBms = [dummyBM]
        const dummyOthers = new FairRegistrationDynamicOthers()
        dummyOthers.fairRegistrationId = dummyFairReg.id
        dummyOthers.value = "No"
        dummyFairReg.fairRegistrationDynamicOthers = [dummyOthers]
        const dbResult = [dummyFairReg]

        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);

        const result = await profileDbService.queryFairRegProfileForEditByQueryBuilder("", [{ fairCode: "", fiscalYear: "" }])

        expect(result[0].id).toBe("1001")
        expect(result[0].fairRegistrationProductInterests[0].fairRegistrationId).toBe("1001")
        expect(result[0].fairRegistrationProductInterests[0].teCode).toBe("PX00001")
        expect(result[0].fairRegistrationDynamicBms[0].fairRegistrationId).toBe("1001")
        expect(result[0].fairRegistrationDynamicBms[0].value).toBe("Yes")
        expect(result[0].fairRegistrationDynamicOthers[0].fairRegistrationId).toBe("1001")
        expect(result[0].fairRegistrationDynamicOthers[0].value).toBe("No")
    });

    test('returns valid results', async () => {
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);

        const dbResult: FairRegistration[] = []

        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);

        const result = await profileDbService.queryFairRegProfileForEditByQueryBuilder("", [{ fairCode: "", fiscalYear: "" }])

        expect(result.length).toBe(0)
    });

    test('returns valid results', async () => {
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);

        const dbResult: FairRegistration[] = []

        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);
        jest.spyOn(createQueryBuilder, 'getMany').mockRejectedValueOnce(new Error("Error"));

        await profileDbService.queryFairRegProfileForEditByQueryBuilder("", [{ fairCode: "", fiscalYear: "" }]).catch(ex => {
            expect(ex.message).toBe("Error")
        })
    });
})

describe("queryFairRegProfileForEdit", () => {
    test('returns valid results for type = backend', async () => {

        const dummyFairReg = new FairRegistration()
        dummyFairReg.id = "1001"
        const dummyPI = new FairRegistrationProductInterest()
        dummyPI.fairRegistrationId = dummyFairReg.id
        dummyPI.teCode = "PX00001"
        dummyFairReg.fairRegistrationProductInterests = [dummyPI]
        const dummyBM = new FairRegistrationDynamicBm()
        dummyBM.fairRegistrationId = dummyFairReg.id
        dummyBM.value = "Yes"
        dummyFairReg.fairRegistrationDynamicBms = [dummyBM]
        const dummyOthers = new FairRegistrationDynamicOthers()
        dummyOthers.fairRegistrationId = dummyFairReg.id
        dummyOthers.value = "No"
        dummyFairReg.fairRegistrationDynamicOthers = [dummyOthers]
        const dbResult = [dummyFairReg]

        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);

        const result = await profileDbService.queryFairRegProfileForEdit("backend", 1001)

        expect(result!.id).toBe("1001")
        expect(result!.fairRegistrationProductInterests[0].fairRegistrationId).toBe("1001")
        expect(result!.fairRegistrationProductInterests[0].teCode).toBe("PX00001")
        expect(result!.fairRegistrationDynamicBms[0].fairRegistrationId).toBe("1001")
        expect(result!.fairRegistrationDynamicBms[0].value).toBe("Yes")
        expect(result!.fairRegistrationDynamicOthers[0].fairRegistrationId).toBe("1001")
        expect(result!.fairRegistrationDynamicOthers[0].value).toBe("No")
    });

    test('returns valid results for type = frontend', async () => {
        const dummyFairReg = new FairRegistration()
        dummyFairReg.id = "1001"
        const dummyPI = new FairRegistrationProductInterest()
        dummyPI.fairRegistrationId = dummyFairReg.id
        dummyPI.teCode = "PX00001"
        dummyFairReg.fairRegistrationProductInterests = [dummyPI]
        const dummyBM = new FairRegistrationDynamicBm()
        dummyBM.fairRegistrationId = dummyFairReg.id
        dummyBM.value = "Yes"
        dummyFairReg.fairRegistrationDynamicBms = [dummyBM]
        const dummyOthers = new FairRegistrationDynamicOthers()
        dummyOthers.fairRegistrationId = dummyFairReg.id
        dummyOthers.value = "No"
        dummyFairReg.fairRegistrationDynamicOthers = [dummyOthers]
        const dbResult = [dummyFairReg]

        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);

        const result = await profileDbService.queryFairRegProfileForEdit("frontend", 0, "", "", "")

        expect(result!.id).toBe("1001")
        expect(result!.fairRegistrationProductInterests[0].fairRegistrationId).toBe("1001")
        expect(result!.fairRegistrationProductInterests[0].teCode).toBe("PX00001")
        expect(result!.fairRegistrationDynamicBms[0].fairRegistrationId).toBe("1001")
        expect(result!.fairRegistrationDynamicBms[0].value).toBe("Yes")
        expect(result!.fairRegistrationDynamicOthers[0].fairRegistrationId).toBe("1001")
        expect(result!.fairRegistrationDynamicOthers[0].value).toBe("No")
    });

    test('return null', async () => {
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce([]);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce([]);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce([]);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce([]);

        const result = await profileDbService.queryFairRegProfileForEdit("frontend", 0, "", "", "")
        expect(result).toBe(null)
    });

    test('throw exception', async () => {
        const dbResult = [new FairRegistration()]
        jest.spyOn(fairRegistrationRepository, 'find').mockRejectedValue({ message: "Error" });
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);

        await profileDbService.queryFairRegProfileForEdit("frontend", 0, "", "", "").catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.Database_Error.message)
        })
    });
})

describe("queryFairRegProfileForBackendEditCheckingByRecordId", () => {
    test('returns valid results', async () => {
        const dummyFairReg = new FairRegistration()
        dummyFairReg.id = "1001"
        const dbResult = [dummyFairReg]
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);

        const result = await profileDbService.queryFairRegProfileForBackendEditCheckingByRecordId(1001)
        expect(result!.id).toBe("1001")
    });

    test('returns null', async () => {
        const dbResult: FairRegistration[] = []
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        const result = await profileDbService.queryFairRegProfileForBackendEditCheckingByRecordId(999)
        expect(result).toBe(null)
    });

    test('throw exception', async () => {
        jest.spyOn(fairRegistrationRepository, 'find').mockRejectedValueOnce({ message: "Error" });
        await profileDbService.queryFairRegProfileForBackendEditCheckingByRecordId(999).catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.Database_Error.message)
        })
    });
})

describe("updateFormSubmissionKey", () => {
    test('successful update', async () => {
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (fairReg: any): Promise<any> => {return fairReg});
        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);

        let fairReg = {}
        const formSubmissionKey = "84e9cce2-cef2-4abf-896c-ef238afa993c"
        const result = await profileDbService.updateFormSubmissionKey(fairReg as FairRegistration, formSubmissionKey)
        expect(mockTransaction.save).toBeCalledTimes(1);
        expect(result.formSubmissionKey).toBe(formSubmissionKey)
    });

    test('throw exception', async () => {
        jest.spyOn(mockTransaction, 'save').mockRejectedValueOnce({ message: "error message from mocked value" });
        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);

        let fairReg = {}
        const formSubmissionKey = "84e9cce2-cef2-4abf-896c-ef238afa993c"

        try {
            await profileDbService.updateFormSubmissionKey(fairReg as FairRegistration, formSubmissionKey)
        }
        catch (ex) {
            expect(ex.message).toBe(VepErrorMsg.Database_Error.message)
        }
    });

    // assume this.FairRegistrationRepository.manager.transaction()
    // test('successful update', async () => {
    //     jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (fairReg: any): Promise<any> => {return fairReg});
    //     jest.spyOn(fairRegistrationRepository.manager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
    //     let fairReg = new FairRegistration()
    //     const formSubmissionKey = "84e9cce2-cef2-4abf-896c-ef238afa993c"
    //     const result = await profileDbService.updateFormSubmissionKey(fairReg, formSubmissionKey)
    //     expect(mockTransaction.save).toBeCalledTimes(1);
    //     expect(result.formSubmissionKey).toBe(formSubmissionKey)
    // });
})

describe("getProfileWithMandatoryBM", () => {
    test('returns valid results', async () => {
        const dummyFairReg = new FairRegistration()
        dummyFairReg.id = "1001"

        const dummyPS = new FairRegistrationProductStrategy()
        dummyPS.fairRegistrationId = dummyFairReg.id
        dummyPS.fairRegistrationProductStrategyCode = "OEM"
        dummyFairReg.fairRegistrationProductStrategies = [dummyPS]

        const dummyPSCR = new FairRegistrationPreferredSuppCountryRegion()
        dummyPSCR.fairRegistrationId = dummyFairReg.id
        dummyPSCR.fairRegistrationPreferredSuppCountryRegionCode = "HK"
        dummyFairReg.fairRegistrationPreferredSuppCountryRegions = [dummyPSCR]

        const dummyPI = new FairRegistrationProductInterest()
        dummyPI.fairRegistrationId = dummyFairReg.id
        dummyPI.teCode = "PX00001"
        dummyFairReg.fairRegistrationProductInterests = [dummyPI]

        const dummyOthers = new FairRegistrationDynamicOthers()
        dummyOthers.fairRegistrationId = dummyFairReg.id
        dummyOthers.value = "No"
        dummyFairReg.fairRegistrationDynamicOthers = [dummyOthers]
        const dbResult = [dummyFairReg]

        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);

        const result = await profileDbService.getProfileWithMandatoryBM("", "", "")

        expect(result!.id).toBe("1001")
        expect(result!.fairRegistrationProductStrategies[0].fairRegistrationId).toBe("1001")
        expect(result!.fairRegistrationProductStrategies[0].fairRegistrationProductStrategyCode).toBe("OEM")

        expect(result!.fairRegistrationPreferredSuppCountryRegions[0].fairRegistrationId).toBe("1001")
        expect(result!.fairRegistrationPreferredSuppCountryRegions[0].fairRegistrationPreferredSuppCountryRegionCode).toBe("HK")

        expect(result!.fairRegistrationProductInterests[0].fairRegistrationId).toBe("1001")
        expect(result!.fairRegistrationProductInterests[0].teCode).toBe("PX00001")

        expect(result!.fairRegistrationDynamicOthers[0].fairRegistrationId).toBe("1001")
        expect(result!.fairRegistrationDynamicOthers[0].value).toBe("No")
    });

    test('return null', async () => {
        const dbResult: FairRegistration[] = []

        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);

        const result = await profileDbService.getProfileWithMandatoryBM("", "", "")

        expect(result).toBe(null)
    });

    test('throw exception', async () => {
        const dbResult: FairRegistration[] = []

        jest.spyOn(fairRegistrationRepository, 'find').mockRejectedValueOnce({ message: "Error" });
        jest.spyOn(fairRegistrationRepository, 'find').mockResolvedValueOnce(dbResult);
        jest.spyOn(fairRegistrationRepository, 'createQueryBuilder').mockReturnValueOnce(createQueryBuilder);
        jest.spyOn(createQueryBuilder, 'getMany').mockResolvedValueOnce(dbResult);

        await profileDbService.getProfileWithMandatoryBM("", "", "").catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.Database_Error.message)
        })
    });
})

describe("updateProductInterestPerFair", () => {
    test('successful update', async () => {
        const fairParticipant = new FairParticipant()

        const dummyFairReg = new FairRegistration()
        dummyFairReg.id = "1001"
        dummyFairReg.fairParticipant = fairParticipant

        const dummyPI = new FairRegistrationProductInterest()
        dummyPI.fairRegistrationId = dummyFairReg.id
        dummyPI.teCode = "PX00001"
        dummyFairReg.fairRegistrationProductInterests = [dummyPI]

        const dummyOthers = new FairRegistrationDynamicOthers()
        dummyOthers.fairRegistrationId = dummyFairReg.id
        dummyOthers.value = "No"
        dummyFairReg.fairRegistrationDynamicOthers = [dummyOthers]

        const updatedPI = new FairRegistrationProductInterest()
        updatedPI.fairRegistrationId = dummyFairReg.id
        updatedPI.teCode = "PX00002"

        const updatedOthers = new FairRegistrationDynamicOthers()
        updatedOthers.fairRegistrationId = dummyFairReg.id
        updatedOthers.value = "Yes"

        jest.spyOn(mockTransaction, 'delete').mockImplementationOnce(async (): Promise<any> => {return });
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (fairRegPI: any): Promise<FairRegistrationProductInterest[]> => {return fairRegPI});

        jest.spyOn(mockTransaction, 'delete').mockImplementationOnce(async (): Promise<any> => {return });
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (fairRegDyOthers: any): Promise<FairRegistrationDynamicOthers[]> => {return fairRegDyOthers});

        fairParticipant.lastUpdatedTime = new Date()
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (fairParticipant: any): Promise<FairParticipant> => {return fairParticipant});

        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (fairReg: any): Promise<FairRegistration> => {return fairReg});

        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);

        const result = await profileDbService.updateProductInterestPerFair(dummyFairReg, [updatedPI], [updatedOthers])

        expect(result.fairParticipant.lastUpdatedTime).toBe(fairParticipant.lastUpdatedTime)
        expect(result.fairRegistrationProductInterests[0].teCode).toBe("PX00002")
        expect(result.fairRegistrationDynamicOthers[0].value).toBe("Yes")

        expect(mockTransaction.delete).toBeCalledTimes(2);
        expect(mockTransaction.save).toBeCalledTimes(3);
    });

    test('throw exception', async () => {
        const dummyFairReg = new FairRegistration()
        dummyFairReg.id = "1001"

        const updatedPI = new FairRegistrationProductInterest()
        updatedPI.fairRegistrationId = dummyFairReg.id
        updatedPI.teCode = "PX00002"

        const updatedOthers = new FairRegistrationDynamicOthers()
        updatedOthers.fairRegistrationId = dummyFairReg.id
        updatedOthers.value = "Yes"

        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (): Promise<any> => { throw new Error("Error") });
        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);

        await profileDbService.updateProductInterestPerFair(dummyFairReg, [updatedPI], [updatedOthers]).catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.Database_Error.message)
        })
    });
})

describe("updateFairRegistrationByProfileEditDto", () => {
    test('successful update', async () => {
        const dummyFairReg = new FairRegistration()
        dummyFairReg.id = "1001"

        const dummyPS = new FairRegistrationProductStrategy()
        dummyPS.fairRegistrationId = dummyFairReg.id
        dummyPS.fairRegistrationProductStrategyCode = "OEM"

        const dummyPSCR = new FairRegistrationPreferredSuppCountryRegion()
        dummyPSCR.fairRegistrationId = dummyFairReg.id
        dummyPSCR.fairRegistrationPreferredSuppCountryRegionCode = "HK"

        const dummyPI = new FairRegistrationProductInterest()
        dummyPI.fairRegistrationId = dummyFairReg.id
        dummyPI.teCode = "PX00001"
        
        const dummyBM = new FairRegistrationDynamicBm()
        dummyBM.fairRegistrationId = dummyFairReg.id
        dummyBM.formFieldId = "bm_field_id"
        dummyBM.value = "Yes"

        const dummyOthers = new FairRegistrationDynamicOthers()
        dummyOthers.fairRegistrationId = dummyFairReg.id
        dummyOthers.formFieldId = "field_d002233"
        dummyOthers.value = "No"

        const profileEditDto: ProfileEditDto = {
            overseasBranchOfficer: "Happy",
            euConsentStatus: "Y",
            badgeConsent: "Y",
            c2mConsent: "Y",
            registrationDetailConsent: "Y",
            
            fairRegistrationProductStrategies: [dummyPS],
            fairRegistrationPreferredSuppCountryRegions: [dummyPSCR],
            fairRegistrationProductInterests: [dummyPI],

            dynamicBmFieldIdToUpdate: ["bm_field_id"], 
            fairRegistrationDynamicBms: [dummyBM], 
            dynamicOtherFieldIdToUpdate: ["field_d002233"], 
            fairRegistrationDynamicOthers: [dummyOthers],
            lastUpdatedBy: "Chris Wong",
        }

        jest.spyOn(mockTransaction, 'update').mockImplementationOnce(async (): Promise<any> => { return }); // partialEntity

        jest.spyOn(mockTransaction, 'delete').mockImplementationOnce(async (): Promise<any> => { return }); // fairRegistrationProductStrategies
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (): Promise<any> => { return });
        jest.spyOn(mockTransaction, 'delete').mockImplementationOnce(async (): Promise<any> => { return }); // fairRegistrationPreferredSuppCountryRegions
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (): Promise<any> => { return });
        jest.spyOn(mockTransaction, 'delete').mockImplementationOnce(async (): Promise<any> => { return }); // fairRegistrationProductInterests
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (): Promise<any> => { return });
        jest.spyOn(mockTransaction, 'delete').mockImplementationOnce(async (): Promise<any> => { return }); // fairRegistrationDynamicBms
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (): Promise<any> => { return });
        jest.spyOn(mockTransaction, 'delete').mockImplementationOnce(async (): Promise<any> => { return }); // fairRegistrationDynamicOthers
        jest.spyOn(mockTransaction, 'save').mockImplementationOnce(async (): Promise<any> => { return });

        jest.spyOn(mockTransaction, 'update').mockImplementationOnce(async (): Promise<any> => { return }); // fairParticipant.lastUpdatedTime

        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);

        const result = await profileDbService.updateFairRegistrationByProfileEditDto(dummyFairReg, profileEditDto)

        expect(result).toStrictEqual({ isSuccess: true })

        expect(mockTransaction.update).toBeCalledTimes(2);
        expect(mockTransaction.delete).toBeCalledTimes(5);
        expect(mockTransaction.save).toBeCalledTimes(5);
    });

    test('throw exception', async () => {
        const profileEditDto: ProfileEditDto = {
            dynamicBmFieldIdToUpdate: [], 
            fairRegistrationDynamicBms: [], 
            dynamicOtherFieldIdToUpdate: [], 
            fairRegistrationDynamicOthers: [],
            lastUpdatedBy: "Chris Wong",
        }
        jest.spyOn(mockTransaction, 'update').mockRejectedValueOnce(new Error("Error"));
        jest.spyOn(mockManager, 'transaction').mockImplementationOnce(async (fn: any) => fn(mockTransaction));
        jest.spyOn(typeorm, 'getManager').mockReturnValue(mockManager);
        await profileDbService.updateFairRegistrationByProfileEditDto(new FairRegistration(), profileEditDto).catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.Database_Error.message)
        })
    });
})

afterAll(async () => {
    await app?.close();
});

export class FairRegistrationRepositoryFake {
    public createQueryBuilder(): any { }
    public async find(): Promise<FairRegistration[]> { return []; }
    public manager = {
        transaction(): any { }
    }
}

const mockManager: any = {
    transaction: jest.fn(),
}

const mockTransaction: any = {
    save: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
}

const createQueryBuilder: any = {
    select: jest.fn().mockImplementation(() => {
        return createQueryBuilder
    }),
    leftJoin: jest.fn().mockImplementation(() => {
        return createQueryBuilder
    }),
    leftJoinAndSelect: jest.fn().mockImplementation(() => {
        return createQueryBuilder
    }),
    where: jest.fn().mockImplementation(() => {
        return createQueryBuilder
    }),
    orWhere: jest.fn().mockImplementation(() => {
        return createQueryBuilder
    }),
    andWhere: jest.fn().mockImplementation(() => {
        return createQueryBuilder
    }),
    getMany: jest.fn(),
    getRawMany: jest.fn()
}
