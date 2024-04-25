import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuid } from 'uuid';
import { VepErrorMsg } from '../../../config/exception-constant';
import { VepError } from '../../../core/exception/exception';
import { Logger } from '../../../core/utils';
import { FairDetail } from '../../fair/dto/Fair.dto';
import { Cache } from 'cache-manager';

import http from 'http';
import https from 'https';
import { CouncilwiseDataType, GeneralDefinitionDataRequestDTOType } from './content.enum';
import qs from 'qs';

@Injectable()
export class ContentCacheService {
    private baseURL: string;

    private CONTENT_WORDPRESS_OPENFAIRCOMBINATION: string = "/wordpress/openfairs-with-fair-combinations"

    private CONTENT_COUNCIL_DEFINITION_PREFIX: string = "/definition/council/"

    readonly CACHE_KEY_OPEN_FAIRS = "CACHE_KEY_OPEN_FAIRS";
    readonly CACHE_KEY_SIBLING_FAIRS_PREFIX = "CACHE_KEY_OPEN_FAIRS_SIBLING_FAIRS";
    readonly CACHE_KEY_RETRIEVE_RAW_JSON = "CACHE_KEY_RETRIEVE_RAW_JSON";
    readonly CACHE_KEY_RETRIEVE_COUNCILWISE_DATA_BY = "CACHE_KEY_RETRIEVE_COUNCILWISE_DATA_BY";
    readonly CACHE_KEY_OPEN_FAIRS_FROM_DB = "CACHE_KEY_OPEN_FAIRS_FROM_DB";

    readonly CACHE_TTL: number = 1800 + Math.floor(Math.random() * 30 + 1);
    
    private api;

    constructor(private configService: ConfigService, private logger: Logger, @Inject(CACHE_MANAGER) private cacheManager: Cache) {
        this.logger.setContext(ContentCacheService.name)
        this.baseURL = this.configService.get<string>('api.CONTENT_SERVICE_URI') || '';

        const agentConfig = {
            keepAlive: true
        }

        // Resusing connections
        const httpAgent = new http.Agent(agentConfig)
        const httpsAgent = new https.Agent(agentConfig)
        
        this.api = axios.create({
          baseURL: this.baseURL,
          httpAgent,
          httpsAgent,
        })
    }

    async retrieveOpenFairCombination(): Promise<{ openFairs: FairDetail[], combinedFairByFairDict: Record<string, string[]>, openFairsDict: Record<string, any> }> {
        let result: any = await this.cacheManager.get(this.CACHE_KEY_OPEN_FAIRS);

        if (result == null) {
            this.logger.log("retrieveOpenFairCombination - Not found in Cache, Get from source");

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
                result = await this.contentQuery<{ openFairs: FairDetail[], combinedFairByFairDict: Record<string, string[]> }>(config)

                const { openFairs } = result;

                result.openFairsDict = Object.assign({}, ...openFairs.map((x: any)=>({[x.fair_code]: x})))

                await this.cacheManager.set(this.CACHE_KEY_OPEN_FAIRS, result, { ttl: this.CACHE_TTL });
            } catch (ex) {
                throw new VepError(VepErrorMsg.ContentService_FailToRetrieveFairSetting, `Failed to retrieve open fair combination`)
            }
        }

        return result;
    }

    async getSiblingFairList(fairCodes: string[]) {
        const { combinedFairByFairDict, openFairsDict } = await this.retrieveOpenFairCombination();

        let key = this.CACHE_KEY_SIBLING_FAIRS_PREFIX + fairCodes.join("_");

        let result: any = await this.cacheManager.get(key);

        if (result == null) {
            this.logger.log("getSiblingFairList - Not found in Cache, Get from source");

            let siblingFairList: Record<string, { fairCode: string, fairSettingFairCode: string, fiscalYear: string }> = {};

            fairCodes.forEach((fairCode) => {
                if (combinedFairByFairDict.hasOwnProperty(fairCode)) {
                    combinedFairByFairDict[fairCode].forEach((x: string)=>{
                        if (openFairsDict.hasOwnProperty(x)) {
                            const t = openFairsDict[x];
                            siblingFairList[x] ={
                                fairCode: t.fair_code,
                                fairSettingFairCode: t.fair_code,
                                fiscalYear: t.fiscal_year
                            }
                        }
                    })
                }
            });

            result = Object.values(siblingFairList);

            await this.cacheManager.set(key, result, { ttl: this.CACHE_TTL });

        }

        return result;
    }

    async getWordpressSettings(fairCode: string) {
        const { openFairsDict } = await this.retrieveOpenFairCombination();

        return openFairsDict[fairCode];
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

        let key = `${this.CACHE_KEY_RETRIEVE_RAW_JSON}_${dbName}`
        let result: any = await this.cacheManager.get(key);
        if (result == null) {
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
                result = await this.contentQuery<any>(config)
                await this.cacheManager.set(key, result, { ttl: this.CACHE_TTL });
            } catch (ex) {
                throw new VepError(VepErrorMsg.ContentService_FailToRetrieveRawJson, `Failed to retrieve raw json, dbName: ${dbName}`)
            }
        }
        return result
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

    getKeyFromMasterListJson<T>(jsonObject: any, key: string[], layer: number): T | null {
        let currentKey = key[key.length - layer]
        if (jsonObject[currentKey] === undefined || jsonObject[currentKey] === null) {
            this.logger.debug(`Get Key from master list json : ${currentKey} does not exist`)
            return null
        }
        if (layer == 1) {
            return jsonObject[currentKey]
        }
        return this.getKeyFromMasterListJson(jsonObject[currentKey], key, layer - 1)
    }


}
