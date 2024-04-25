import { Test, TestingModule } from '@nestjs/testing';
import { AxiosRequestConfig } from 'axios';
import qs from 'qs';
import { v4 as uuid } from 'uuid';
import { VepErrorMsg } from '../../../config/exception-constant';
import { UtilsModule } from '../../../core/utils/utils';
import { CouncilwiseDataType, GeneralDefinitionDataRequestDTOType, SsoDataType } from './content.enum';
import { ContentService } from './content.service';
import { CouncilwiseDataResponseDto } from './dto/councilwiseDataResp.dto';
import { FormTemplateDto } from './dto/formTemplate.dto';
import { StructureTagDataResponseDto } from './dto/StructureTagData.dto';

let app: TestingModule;
let contentService: ContentService;

jest.mock('axios', () => {
    return {
        create: jest.fn().mockImplementation(()=>{
            return jest.fn(() => Promise.resolve({ data: {} }));
        })
    }
});

beforeAll(async () => {
    app = await Test.createTestingModule({
        imports: [
            UtilsModule
        ],
        providers: [
            ContentService
        ]
    }).compile();

    contentService = app.get(ContentService)
});

beforeEach(() => {
    jest.clearAllMocks();
});

describe("retrieveFairSetting", () => {
    test('Verify contentQuery is called', async () => {
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce({})
        await contentService.retrieveFairSetting("hkjewellery")
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });

    test('Verify contentQuery is rejected', async () => {
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce({})
        await contentService.retrieveFairSetting("hkjewellery").catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveFairSetting.message);
        })
    });
})

describe("retrieveFairSettingHandlder", () => {
    test('Verify contentQuery is called', async () => {
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce({})
        await contentService.retrieveFairSettingHandlder("hkjewellery")
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce({})
        await contentService.retrieveFairSettingHandlder("hkjewellery").catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveFairSetting.message);
        })
    });
})

describe("retrieveDummyFormTemplate", () => {
    test('Verify contentQuery is called', async () => {
        const resp = { data: {} }
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(JSON.stringify(resp))
        await contentService.retrieveDummyFormTemplate()
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = { data: {} }
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(JSON.stringify(resp))
        await contentService.retrieveDummyFormTemplate().catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveFormData.message);
        })
    });
})

describe("retrieveFormTemplate", () => {
    test('Verify contentQuery is called', async () => {
        const resp = { data: {} }
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(JSON.stringify(resp))
        await contentService.retrieveFormTemplate('', '', '')
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = { data: {} }
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(JSON.stringify(resp))
        await contentService.retrieveFormTemplate('', '', '').catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveFormData.message);
        })
    });
})

describe("retrieveFormTemplateByShortSlug", () => {
    test('Verify contentQuery is called', async () => {
        const resp = { data: {} }
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(JSON.stringify(resp))
        await contentService.retrieveFormTemplateByShortSlug('', '', '')
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = { data: {} }
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(JSON.stringify(resp))
        await contentService.retrieveFormTemplateByShortSlug('', '', '').catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveFormData.message);
        })
    });
})

describe("returnMultiLangTemplate", () => {
    test('Verify retrieveFormTemplateByShortSlug is called 3 times', async () => {
        const formTemplate = new FormTemplateDto()
        jest.spyOn(contentService, 'retrieveFormTemplateByShortSlug').mockResolvedValueOnce(formTemplate)
        jest.spyOn(contentService, 'retrieveFormTemplateByShortSlug').mockResolvedValueOnce(formTemplate)
        jest.spyOn(contentService, 'retrieveFormTemplateByShortSlug').mockResolvedValueOnce(formTemplate)
        await contentService.returnMultiLangTemplate('', '', '')
        expect(contentService.retrieveFormTemplateByShortSlug).toHaveBeenCalledTimes(3);
    });
})

describe("returnMultiLangTemplate", () => {
    test('Verify is called 3 times', async () => {
        const formTemplate = new FormTemplateDto()
        jest.spyOn(contentService, 'retrieveFormTemplateByShortSlug').mockResolvedValueOnce(formTemplate)
        jest.spyOn(contentService, 'retrieveFormTemplateByShortSlug').mockResolvedValueOnce(formTemplate)
        jest.spyOn(contentService, 'retrieveFormTemplateByShortSlug').mockResolvedValueOnce(formTemplate)
        await contentService.returnMultiLangTemplate('', '', '')
        expect(contentService.retrieveFormTemplateByShortSlug).toHaveBeenCalledTimes(3);
    });
})

describe("retrieveCouncilwiseDataBy", () => {
    test('Verify contentQuery is called', async () => {
        const resp = new CouncilwiseDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(resp)
        await contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
            GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.salutation, 'Mr')
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = new CouncilwiseDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(resp)
        await contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
            GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.salutation, 'Mr').catch(ex => {
                expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveCouncilwiseData.message);
            })
    });
})

describe("retrieveCouncilwiseProvinceBy", () => {
    test('Verify contentQuery is called', async () => {
        const resp = new CouncilwiseDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(resp)
        await contentService.retrieveCouncilwiseProvinceBy(
            GeneralDefinitionDataRequestDTOType.code, "CHN", 'AH')
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = new CouncilwiseDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(resp)
        await contentService.retrieveCouncilwiseProvinceBy(
            GeneralDefinitionDataRequestDTOType.code, "CHN", '').catch(ex => {
                expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveCouncilwiseData.message);
            })
    });
})

describe("retrieveCouncilwiseCityBy", () => {
    test('Verify contentQuery is called', async () => {
        const resp = new CouncilwiseDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(resp)
        await contentService.retrieveCouncilwiseCityBy(
            GeneralDefinitionDataRequestDTOType.code, "CHN", "AH", 'ANQ')
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = new CouncilwiseDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(resp)
        await contentService.retrieveCouncilwiseCityBy(
            GeneralDefinitionDataRequestDTOType.code, "CHN", "", "").catch(ex => {
                expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveCouncilwiseData.message);
            })
    });
})

describe("retrieveStructureTagDataByTeCode", () => {
    test('Verify contentQuery is called', async () => {
        const resp = new StructureTagDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(resp)
        await contentService.retrieveStructureTagDataByTeCode("PX00001A")
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = new StructureTagDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(resp)
        await contentService.retrieveStructureTagDataByTeCode("PX99991A").catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveStructureTagData.message);
        })
    });
    test('Verify contentQuery is not called when empty teCode', async () => {
        await contentService.retrieveStructureTagDataByTeCode("")
        expect(contentService.contentQuery).toHaveBeenCalledTimes(0);
    });
})

describe("retrieveStructureTagDataByFairCode", () => {
    test('Verify contentQuery is called', async () => {
        const resp = new StructureTagDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(resp)
        await contentService.retrieveStructureTagDataByFairCode(["hkjewellery"])
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = new StructureTagDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(resp)
        await contentService.retrieveStructureTagDataByFairCode(["abc"]).catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveStructureTagData.message);
        })
    });
    test('Verify contentQuery is not called when empty fair code string', async () => {
        await contentService.retrieveStructureTagDataByFairCode([])
        expect(contentService.contentQuery).toHaveBeenCalledTimes(0);
    });
})

describe("retrieveStructureTagDataById", () => {
    test('Verify contentQuery is called', async () => {
        const resp = new StructureTagDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(resp)
        await contentService.retrieveStructureTagDataById('code')
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = new StructureTagDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(resp)
        try {
            await contentService.retrieveStructureTagDataById('code')
        }
        catch (e) {
            expect(e.message).toBe(VepErrorMsg.ContentService_FailToRetrieveStructureTagData.message);
        }
    });
    test('Verify contentQuery is not called when empty stId', async () => {
        await contentService.retrieveStructureTagDataById("")
        expect(contentService.contentQuery).toHaveBeenCalledTimes(0);
    });
})

describe("retrieveSsoDataBy", () => {
    test('Verify contentQuery is called', async () => {
        const resp = new CouncilwiseDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(resp)
        await contentService.retrieveSsoDataBy<CouncilwiseDataResponseDto>(
            GeneralDefinitionDataRequestDTOType.sid, SsoDataType.countryV2, 'CHN')
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = new CouncilwiseDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(resp)
        await contentService.retrieveSsoDataBy<CouncilwiseDataResponseDto>(
            GeneralDefinitionDataRequestDTOType.sid, SsoDataType.countryV2, 'CH').catch(ex => {
                expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveCouncilwiseData.message);
            })
    });
})

describe("retrieveRawJson", () => {
    test('Verify contentQuery is called', async () => {
        const resp = new CouncilwiseDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockResolvedValueOnce(resp)
        await contentService.retrieveRawJson("COUNTRY")
        expect(contentService.contentQuery).toHaveBeenCalledTimes(1);
    });
    test('Verify contentQuery is rejected', async () => {
        const resp = new CouncilwiseDataResponseDto()
        jest.spyOn(contentService, 'contentQuery').mockRejectedValueOnce(resp)
        await contentService.retrieveRawJson("").catch(ex => {
            expect(ex.message).toBe(VepErrorMsg.ContentService_FailToRetrieveRawJson.message);
        })
    });
})

describe("contentQuery", () => {
    test('call return success', async () => {
        // const resp = {
        //     data: {}
        // }

        // const mockAxiosRes = {
        //     status: 200,
        //     data: {
        //         timestamp: 1635740605092,
        //         data: resp
        //     },
        //     config: {
        //         headers: {
        //             'X-Request-ID': uuid(),
        //         },
        //     },
        // };
        //(axios as any).mockResolvedValueOnce(mockAxiosRes);

        const config: AxiosRequestConfig = {
            url: '',
            method: 'GET',
            headers: {
                'X-Request-ID': uuid(),
            },
            baseURL: '',
            params: {},
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            await contentService.contentQuery(config)
            //expect(result).toBe(resp)
        } catch (ex) {

        }

    });

    test('call return fail', async () => {
        // const resp = {
        //     data: {}
        // }

        // const mockAxiosRes = {
        //     status: 400,
        //     message: "",
        //     data: {
        //         timestamp: 1635740605092,
        //         data: resp
        //     },
        //     config: {
        //         headers: {
        //             'X-Request-ID': uuid(),
        //         },
        //     },
        // };
        // (axios as any).mockRejectedValueOnce(mockAxiosRes);

        const config: AxiosRequestConfig = {
            url: '',
            method: 'GET',
            headers: {
                'X-Request-ID': uuid(),
            },
            baseURL: '',
            params: {},
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            await contentService.contentQuery(config)
        } catch (e) {
            expect(e.message).toBe(VepErrorMsg.ContentService_Error.message);
        }
    });
})

afterEach(async () => {
    jest.clearAllMocks()
});

afterAll(async () => {
    await app?.close();
});