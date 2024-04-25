import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import qs from 'qs';
import { v4 as uuid } from 'uuid';
import { VepErrorMsg } from '../../../config/exception-constant';
import { VepError } from '../../../core/exception/exception';
import { Logger } from '../../../core/utils';
import { LANG } from '../../registration/dto/SubmitForm.enum';
import { SettingHandler } from './setting.handler';
import { CouncilwiseDataType, GeneralDefinitionDataRequestDTOType, SsoDataType } from './content.enum';
import { CouncilwiseDataResponseDto } from './dto/councilwiseDataResp.dto';
import { CSKModerateTextResponseDto } from './dto/CSKModerateTextResponse.dto';
import { FormTemplateDto, MuiltiLangFormTemplate } from './dto/formTemplate.dto';
import { StructureTagDataDto, StructureTagDataResponseDto } from './dto/StructureTagData.dto';
import { VepDoNotSearchResponseDto } from './dto/VepDoNotSearchResponse.dto';
import { VepSensitiveKeywordResponseDto } from './dto/VepSensitiveKeywordResponse.dto';
import { FairDetail } from '../../fair/dto/Fair.dto';

import http from 'http';
import https from 'https';
import { FairDetailsFromDB } from '../../fair/dto/GetFairSettingFromDB.dto';

@Injectable()
export class ContentService {
    private baseURL: string;

    private CONTENT_WORDPRESS_FAIRSETTING: string = "/wordpress/setting" 
    private CONTENT_WORDPRESS_OPENFAIRCOMBINATION: string = "/wordpress/openfairs-with-fair-combinations" 
    // Iterate fair setting data from DATABASE in previous years instead of getting only one year data
    private CONTENT_DEFINITION_FAIR_SETTINGS_FROM_DATABASE: string = "/admin/v1/content/definition/fair-settings/"

    private CONTENT_GET_STRUCTURE_TAG_BY_KEYWORD: string = "/admin/structure-tag" 
    private CONTENT_DEFINITION_STRUCTURE_TAG: string = "/definition/di/structureTagV2"
    private CONTENT_COUNCIL_DEFINITION_PREFIX: string = "/definition/council/"
    private CONTENT_SSO_DEFINITION_PREFIX: string = "/definition/sso/"
    private CONTENT_WORDPRESS_FORMTEMPLATE: string = "/wordpress/formTemplate"
    private CONTENT_WORDPRESS_FORMTEMPLATE_V2: string = "/wordpress/formTemplateV2"
    private CONTENT_WORDPRESS_DUMMY_FORMTEMPLATE: string = "/wordpress/dummyFormTemplate"

    private CONTENT_SENSITIVE : string = "/suggester/vep-senskwsensitivekeywords";
    private CONTENT_DONOTSEARCH : string = "/suggester/vep-senskwdonotsearch";
    private CONTENT_MODERATE_TEXT : string = "/suggester/csk-moderate-text";

    private chinaCountryCodeList : Array<string> = ["CHN"];

    private api;
    
    constructor(private configService: ConfigService, private logger: Logger) {
        this.logger.setContext(ContentService.name)
        this.baseURL = this.configService.get<string>('api.CONTENT_SERVICE_URI') || '';

        const agentConfig = {
            keepAlive: true
        }

        const httpAgent = new http.Agent(agentConfig)
        const httpsAgent = new https.Agent(agentConfig)
        
        this.api = axios.create({
          baseURL: this.baseURL,
          httpAgent,
          httpsAgent,
        })
        
    }

    async retrieveOpenFairCombination(): Promise<{ openFairs: FairDetail[], combinedFairByFairDict: Record<string, string[]> }> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_WORDPRESS_OPENFAIRCOMBINATION}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
        }

        try {
            return await this.contentQuery<{ openFairs: FairDetail[], combinedFairByFairDict: Record<string, string[]> }>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveFairSetting, `Failed to retrieve open fair combination`)
        }
    }

    async retrieveFairSetting(
        fair: string
    ): Promise<any>{
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            fair,
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_WORDPRESS_FAIRSETTING}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            return await this.contentQuery<any>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveFairSetting, `Failed to retrieve fair setting, fair: ${fair}`)
        }
    }

    async retrieveFairSettingHandlder(
        fair: string
    ): Promise<SettingHandler>{
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            fair,
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_WORDPRESS_FAIRSETTING}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            return new SettingHandler(fair, await this.contentQuery<any>(config))
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveFairSetting, `Failed to retrieve fair setting, fair: ${fair}`)
        }
    }

    async retrieveDummyFormTemplate(): Promise<FormTemplateDto>{
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_WORDPRESS_DUMMY_FORMTEMPLATE}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
        }

        try {
            const formTemplateJson = await this.contentQuery<string>(config)
            return (JSON.parse(formTemplateJson)).data as FormTemplateDto

        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveFormData, `Failed to retrieve dummy FormTemplate`)
        }
    }

    async retrieveFormTemplate(
        fair: string,
        slug: string,
        lang: string,
    ): Promise<FormTemplateDto>{
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            fair,
            slug,
            lang,
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_WORDPRESS_FORMTEMPLATE}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            const formTemplateJson = await this.contentQuery<string>(config)
            return (JSON.parse(formTemplateJson)).data as FormTemplateDto
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveFormData, `Failed to retrieve FormTemplate, param: ${JSON.stringify(params)}`)
        }
    }

    async retrieveFormTemplateByShortSlug(
        fair: string,
        slug: string,
        lang: string,
    ): Promise<FormTemplateDto>{
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            fair,
            slug,
            lang,
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_WORDPRESS_FORMTEMPLATE_V2}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            const formTemplateJson = await this.contentQuery<string>(config)
            return (JSON.parse(formTemplateJson)).data as FormTemplateDto
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveFormData, `Failed to retrieve FormTemplate, param: ${JSON.stringify(params)}`)
        }
    }

    async returnMultiLangTemplate(fairCode: string, lang: string, slug: string, currFormTemplate: FormTemplateDto | undefined = undefined): Promise<MuiltiLangFormTemplate> {
        let muiltiLangFormTemplate = new MuiltiLangFormTemplate()

        if (currFormTemplate != undefined) {
            switch (lang) {
                case 'en':
                    muiltiLangFormTemplate.formEn = currFormTemplate
                    break
                case 'tc':
                    muiltiLangFormTemplate.formTc = currFormTemplate
                    break
                case 'sc':
                    muiltiLangFormTemplate.formSc = currFormTemplate
                    break
                default:
                    break
            }
        }

        await Promise.all(
            [
                muiltiLangFormTemplate.formEn ? Promise.resolve(muiltiLangFormTemplate.formEn) : this.retrieveFormTemplateByShortSlug(fairCode, slug, LANG.en),
                muiltiLangFormTemplate.formTc
                    ? Promise.resolve(muiltiLangFormTemplate.formTc)
                    : new Promise<FormTemplateDto | null>(async (resolve, reject) => {
                        try {
                            resolve(await this.retrieveFormTemplateByShortSlug(fairCode, slug, LANG.tc))
                    } catch {
                            resolve(null)
                        }
                    }),
                muiltiLangFormTemplate.formSc
                    ? Promise.resolve(muiltiLangFormTemplate.formSc)
                    : new Promise<FormTemplateDto | null>(async (resolve, reject) => {
                        try {
                            resolve(await this.retrieveFormTemplateByShortSlug(fairCode, slug, LANG.sc))
                        } catch {
                            resolve(null)
                        }
                    }),
            ]
        ).then(promiseResults => {
            muiltiLangFormTemplate.formEn = promiseResults[0]
            muiltiLangFormTemplate.formTc = promiseResults[1]
            muiltiLangFormTemplate.formSc = promiseResults[2]
        })

        return muiltiLangFormTemplate
    }

    async retrieveCouncilwiseDataBy<T>(
        requestType: GeneralDefinitionDataRequestDTOType,
        dataType: CouncilwiseDataType,
        id: string,
        additionalData: { [key: string]: string} = {}
    ): Promise<T> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            type: requestType,
            id,
            ...additionalData
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_COUNCIL_DEFINITION_PREFIX}${dataType}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        //console.log(config);

        try {
            return await this.contentQuery<T>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveCouncilwiseData, `Failed to retrieve councilwise data, requestType: ${requestType}, dataType: ${dataType}, id: ${id}`)
        }
    }

    async retrieveCouncilwiseProvinceBy(
        requestType: GeneralDefinitionDataRequestDTOType,
        countryId: string,
        provinceId: string,
    ): Promise<CouncilwiseDataResponseDto> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            type: requestType,
            countryId,
            id: provinceId
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_COUNCIL_DEFINITION_PREFIX}${CouncilwiseDataType.province}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        console.log(config);

        try {
            return await this.contentQuery<CouncilwiseDataResponseDto>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveCouncilwiseData, `Failed to retrieve councilwise province data, requestType: ${requestType}, type: ${CouncilwiseDataType.province}, countryId: ${countryId}, provinceId: ${provinceId}`)
        }
    }

    async retrieveCouncilwiseCityBy(
        requestType: GeneralDefinitionDataRequestDTOType,
        countryId: string,
        provinceId: string,
        cityId: string
    ): Promise<CouncilwiseDataResponseDto> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            type: requestType,
            countryId,
            provinceId,
            id: cityId
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_COUNCIL_DEFINITION_PREFIX}${CouncilwiseDataType.city}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        //console.log(config);

        try {
            return await this.contentQuery<CouncilwiseDataResponseDto>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveCouncilwiseData, `Failed to retrieve councilwise city data, requestType: ${requestType}, type: ${CouncilwiseDataType.city}, countryId: ${countryId}, provinceId: ${provinceId}, cityId: ${cityId}`)
        }
    }

    async retrieveStructureTagDataByTeCode(
        id: string,
    ): Promise<StructureTagDataResponseDto> {
        if (id === "") {
            return {}
        }

        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            type: 'teCode',
            id,
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_DEFINITION_STRUCTURE_TAG}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            return await this.contentQuery<StructureTagDataResponseDto>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveStructureTagData, `Failed to retrieve structure tag data, teCode: ${id}`)
        }
    }

    async retrieveStructureTagDataByFairCode(
        fairCodeList: string[],
    ): Promise<StructureTagDataResponseDto> {
        if (fairCodeList.length == 0) {
            return {}
        }

        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            type: 'fairCode',
            id: fairCodeList.join(','),
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_DEFINITION_STRUCTURE_TAG}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            return await this.contentQuery<StructureTagDataResponseDto>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveStructureTagData, `Failed to retrieve structure tag data, fairCode: ${fairCodeList}`)
        }
    }

    async retrieveStructureTagDataById(
        id: string,
    ): Promise<StructureTagDataResponseDto> {
        if (id === "") {
            return {}
        }

        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            type: 'stId',
            id,
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_DEFINITION_STRUCTURE_TAG}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        //console.log(config);

        try {
            return await this.contentQuery<StructureTagDataResponseDto>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveStructureTagData, `Failed to retrieve structure tag data, code: ${id}`)
        }
    }

    async retrieveSsoDataBy<T>(
        requestType: GeneralDefinitionDataRequestDTOType,
        dataType: SsoDataType,
        id: string,
        additionalData: { [key: string]: string} = {}
    ): Promise<T> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            type: requestType,
            id,
            ...additionalData,
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_SSO_DEFINITION_PREFIX}${dataType}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        //console.log(config);

        try {
            return await this.contentQuery<T>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveCouncilwiseData, `Failed to retrieve councilwise data, requestType: ${requestType}, dataType: ${dataType}, id: ${id}`)
        }
    }

    async retrieveRawJson(
        dbName: string,
    ): Promise<any> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            dbName
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_COUNCIL_DEFINITION_PREFIX}${CouncilwiseDataType['raw-jsonV2']}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            return await this.contentQuery<any>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveRawJson, `Failed to retrieve raw json, dbName: ${dbName}`)
        }
    }

    async contentQuery<T>(config: AxiosRequestConfig): Promise<T> {
        return new Promise(async (resolve, reject) => {
            this.api(config).then((response: AxiosResponse) => {
                this.logger.log(`Received data from Content Service, url: ${response.config.url}, Request ID ${response.config.headers['X-Request-ID']}`)
                resolve(response.data.data);
            }).catch((error: AxiosError) => {
                this.logger.error(`Error in call Content Service, url: ${config.url}, Request ID ${config.headers['X-Request-ID']}, error message: ${JSON.stringify(error.message)}`)
                reject(new VepError(VepErrorMsg.ContentService_Error, error.message))
            })
        })
    }


    cskModerateText = async (content: string): Promise<CSKModerateTextResponseDto> => {
        return new Promise(async (resolve, reject) => {
            const config: AxiosRequestConfig = {
                url: `${this.CONTENT_MODERATE_TEXT}?q=${encodeURI(content)}`,
                method: 'get',
                baseURL: this.baseURL,
                headers: {
                    'X-Request-ID': uuid(),
                },
            }

            axios(config).then((response: AxiosResponse) => {
                this.logger.debug(JSON.stringify(response.data))
                this.logger.log(`Keyword: ${content}, Result from Vep-Content.CSKModerateText: ${response.data.failedKeywordScan}, url: ${config.url}, Request ID ${response.config.headers['X-Request-ID']}`)
                resolve(response.data);
            }).catch((error: AxiosError) => {
                if (error.response) {
                    this.logger.error(`Error in call Vep-Content.CSKModerateText, url: ${config.url}, Request ID ${error.config.headers['X-Request-ID']}, error response: ${JSON.stringify(error.response.data)}`);
                    reject(new VepError(VepErrorMsg.Suggester_ContentCSK_Error, error.message))
                } else {
                    this.logger.error(`Error in call Vep-Content.CSKModerateText, url: ${config.url}, Request ID ${config.headers['X-Request-ID']}, error message: ${JSON.stringify(error.message)}`)
                    reject(new VepError(VepErrorMsg.Suggester_ContentCSK_Error, error.message))
                }
            })
        })
    }

    vepSenskwdonotsearch = async (content: string): Promise<VepDoNotSearchResponseDto> => {
        return new Promise(async (resolve, reject) => {
            const config: AxiosRequestConfig = {
                url: `${this.CONTENT_DONOTSEARCH}?q=${encodeURI(content)}`,
                method: 'get',
                baseURL: this.baseURL,
                headers: {
                    'X-Request-ID': uuid(),
                },
            }

            axios(config).then((response: AxiosResponse) => {
                this.logger.debug(JSON.stringify(response?.data))
                this.logger.log(`Keyword: ${content}, Result from Vep-Content.DoNotSearch: ${response?.data?.data}, url: ${config.url}, Request ID ${response?.config?.headers['X-Request-ID']}`)
                resolve(response?.data?.data);
            }).catch((error: AxiosError) => {
                if (error.response) {
                    this.logger.error(`Error in call Vep-Content.DoNotSearch, url: ${config.url}, Request ID ${error.config.headers['X-Request-ID']}, error response: ${JSON.stringify(error.response.data)}`);
                    reject(new VepError(VepErrorMsg.Suggester_DoNotSearch_Error, error.message))
                } else {
                    this.logger.error(`Error in call Vep-Content.DoNotSearch, url: ${config.url}, Request ID ${config.headers['X-Request-ID']}, error message: ${JSON.stringify(error.message)}`)
                    reject(new VepError(VepErrorMsg.Suggester_DoNotSearch_Error, error.message))
                }
            })
        })
    }

    vepSenskw = async (content: string): Promise<VepSensitiveKeywordResponseDto> => {
        return new Promise(async (resolve, reject) => {
            const config: AxiosRequestConfig = {
                url: `${this.CONTENT_SENSITIVE}?q=${encodeURI(content)}`,
                method: 'get',
                baseURL: this.baseURL,
                headers: {
                    'X-Request-ID': uuid(),
                },
            }

            axios(config).then((response: AxiosResponse) => {
                this.logger.debug(JSON.stringify(response?.data))
                this.logger.log(`Keyword: ${content}, Result from Vep-Content.SensitiveKeywords: ${response?.data?.data}, url: ${config.url}, Request ID ${response?.config?.headers['X-Request-ID']}`)
                resolve(response?.data?.data);
            }).catch((error: AxiosError) => {
                if (error.response) {
                    this.logger.error(`Error in call Vep-Content.SensitiveKeywords, url: ${config.url}, Request ID ${error.config.headers['X-Request-ID']}, error response: ${JSON.stringify(error.response.data)}`);
                    reject(new VepError(VepErrorMsg.Suggester_DoNotSearch_Error, error.message))
                } else {
                    this.logger.error(`Error in call Vep-Content.SensitiveKeywords, url: ${config.url}, Request ID ${config.headers['X-Request-ID']}, error message: ${JSON.stringify(error.message)}`)
                    reject(new VepError(VepErrorMsg.Suggester_DoNotSearch_Error, error.message))
                }
            })
        })
    }
     

    async isSensitiveKeywordsForFindBuyer(keyword : string, browserCountry: string){
        if (keyword) {
            let isSensitiveKeyword = await this.vepSenskwdonotsearch(keyword)
            //check sensitive keyword
            if (isSensitiveKeyword?.senskwdonotsearch) {
                this.logger.debug(`Matched donotsearch value, keyword: ${keyword}`)
                return isSensitiveKeyword.senskwdonotsearch
            }
                
            //if China check csk
            if (this.chinaCountryCodeList.includes(browserCountry)) {
                let isChinaSensitiveKeyword = await this.cskModerateText(keyword)
                if (isChinaSensitiveKeyword?.failedKeywordScan) {
                this.logger.debug(`Matched csk value, keyword: ${keyword}`)
                return isChinaSensitiveKeyword.failedKeywordScan
                }
            }
        }
        return false;
    }

    async isSensitiveKeywordsForFindParticipants(keyword : string){
        if (keyword) {
            // check sensitive keyword
            let resSenskw = await this.vepSenskw(keyword)
            if (resSenskw?.senskwsensitivekeywords) {
                this.logger.debug(`Matched sensitive value, keyword: ${keyword}`)
                if (resSenskw.senskwsensitivekeywords) return true;
            }
            // check donotsearch keyword
            let resSenskwdonotsearch = await this.vepSenskwdonotsearch(keyword)
            if (resSenskwdonotsearch?.senskwdonotsearch) {
                this.logger.debug(`Matched donotsearch value, keyword: ${keyword}`)
            if (resSenskwdonotsearch.senskwdonotsearch) return true;
            }
        
    // if China check csk
    /* if (this.chinaCountryCodeList.includes(browserCountry)) {
        let isChinaSensitiveKeyword = await this.cskModerateText(keyword)
        if (isChinaSensitiveKeyword?.failedKeywordScan) {
        this.logger.debug(`Matched csk value, keyword: ${keyword}`)
        return isChinaSensitiveKeyword.failedKeywordScan
        }
    } */
    
        }
        return false;
    }
    
    async getStructureTagByKeyword(keyword : string, fairCodes : string, fiscalYears : string, detail : string = "") : Promise<StructureTagDataDto[]> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            keyword,
            fairCodes,
            fiscalYears,
            detail
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_GET_STRUCTURE_TAG_BY_KEYWORD}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }
        console.log(`${config.url} : ${JSON.stringify(config)}`)
        try {
            return await this.contentQuery<StructureTagDataDto[]>(config)
        } catch (ex) {
            console.log(ex.message)
            return []
        }
    }

    // Iterate fair setting data from DATABASE in previous years instead of getting only one year data
    retrieveOpenFairsFromDB = async (fairCode: string): Promise<FairDetailsFromDB[]> => {
        this.logger.log("retrieveOpenFairsFromDB - Not found in Cache, Get from source");

        let result;

        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            fairCode
        }

        const config: AxiosRequestConfig = {
            url: `${this.CONTENT_DEFINITION_FAIR_SETTINGS_FROM_DATABASE}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            result = await this.contentQuery<FairDetailsFromDB[]>(config);
        } catch (ex) {
            throw new VepError(VepErrorMsg.ContentService_FailToRetrieveFairSettingFromDatabase, ex.message)
        }

    return result
}
}
