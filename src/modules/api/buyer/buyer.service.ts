import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { VepErrorMsg } from '../../../config/exception-constant';
import { VepError } from '../../../core/exception/exception';
import { Logger } from '../../../core/utils';
import { v4 as uuid } from 'uuid';
import { ProfileInternalDto } from './dto/profileInternal.dto';
import qs from 'qs';
import { SsoPrefillDto } from './dto/ssoPrefill.dto';
import { UpdateNotiPrefRespDto } from './dto/updateNotiPrefResp.dto';

@Injectable()
export class BuyerService {
    private baseURL: string;
    
    constructor(private configService: ConfigService, private logger: Logger) {
        this.logger.setContext(BuyerService.name)
        this.baseURL = this.configService.get<string>('api.BUYER_SERVICE_URI') || '';
    }

    async getProfileInternal(
        ssoUid: string | null,
        emailId: string | null,
    ): Promise<ProfileInternalDto | null> {
        const config: AxiosRequestConfig = {
            url: `${this.baseURL}profile-internal/`,
            method: 'POST',
            headers: {
                'X-Request-ID': uuid(),
                'Content-Type': 'application/json',
            },
            baseURL: this.baseURL,
            data: {
                ssoUid,
                emailId,
            },
        }

        try {
            return await this.buyerQuery<ProfileInternalDto>(config)
        } catch (ex) {
            this.logger.INFO('','',`Could not retrieve buyer profile internal, ssoUid: ${ssoUid}, emailId: ${emailId}`)
            return null
        }
    }

    async getSsoProfile(
        ssoUid: string,
    ): Promise<SsoPrefillDto> {
        const params = {
            ssoUid
        }

        const config: AxiosRequestConfig = {
            url: `${this.baseURL}profile-internal/ssoPrefill`,
            method: 'GET',
            headers: {
                'X-Request-ID': uuid(),
                'Content-Type': 'application/json',
            },
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            return await this.buyerQuery<SsoPrefillDto>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.BuyerService_FailToRetrieveSsoProfile, `Failed to retrieve sso profile, ssoUid: ${ssoUid}`)
        }
    }

    async getSsoProfileByEmail(
      ssoEmail: string,
    ): Promise<SsoPrefillDto> {
        const params = {
            ssoEmail
        }

        const config: AxiosRequestConfig = {
            url: `${this.baseURL}profile-internal/ssoPrefillWithEmail`,
            method: 'GET',
            headers: {
                'X-Request-ID': uuid(),
                'Content-Type': 'application/json',
            },
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            return await this.buyerQuery<SsoPrefillDto>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.BuyerService_FailToRetrieveSsoProfile, `Failed to retrieve sso profile, ssoUid: ${ssoEmail}`)
        }
    }

    async adminUpdateNotiPref(
        ssoUid: string,
        preferredLanguage?: "en" | "tc" | "sc",
        preferredChannels?: ("EMAIL" | "APP_PUSH" | "WECHAT" | "SMS" | "WHATSAPP")[]
    ): Promise<UpdateNotiPrefRespDto> {
        const data = {
            ssoUid,
            preferredLanguage,
            preferredChannels,
        }
        const config: AxiosRequestConfig = {
            url: `${this.baseURL}profile-internal/notificationPreference`,
            method: 'PUT',
            headers: {
                'X-Request-ID': uuid(),
                'Content-Type': 'application/json',
            },
            baseURL: this.baseURL,
            data
        }
        
        try {
            return await this.buyerQuery<UpdateNotiPrefRespDto>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.BuyerService_FailToUpdateNotiPref, `Failed to update notification preference, ssoUid: ${ssoUid}, preferredLanguage ${preferredLanguage}, preferredChannels ${preferredChannels}`)
        }
    }

    // Check Email Existence For SsoUser by emailId
    async checkEmailExistenceInSso(
        email: string,
    ): Promise<boolean> {
        const params = {
            email
        }

        const config: AxiosRequestConfig = {
            url: `${this.baseURL}register/checkEmailExistence`,
            method: 'GET',
            headers: {
                'X-Request-ID': uuid(),
                'Content-Type': 'application/json',
            },
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            const { isUsed } = await this.buyerQuery<{ isUsed: boolean }>(config)
            return isUsed
        } catch (ex) {
            throw new VepError(VepErrorMsg.Check_Email_Exists_In_Sso_Url_Error, `Failed to check email exists in sso, email: ${email}`)
        }
    }

    async buyerQuery<T>(config: AxiosRequestConfig): Promise<T> {
        return new Promise(async (resolve, reject) => {
            axios(config).then((response: AxiosResponse) => {
                this.logger.debug(JSON.stringify(response.data))
                this.logger.log(`Received data from Buyer Service, url: ${response.config.url}, Request ID ${response.config.headers['X-Request-ID']}`)
                resolve(response.data.data);
            }).catch((error: AxiosError) => {
                this.logger.error(`Error in call Buyer Service, url: ${config.url}, Request ID ${config.headers['X-Request-ID']}, error message: ${JSON.stringify(error?.message)}`)
                reject(new VepError(VepErrorMsg.BuyerService_Error, error?.message))
            })
        })
    }

    public getBuyerUserRawProfile({ ssoUid, emailId }: Record<string, any>): Promise<any> {
        return axios.request({
            method: 'POST',
            url: `${this.baseURL}profile/getUserRawProfile`,
            data: { 
                ssoUid,
                emailId,
            },
        })
    }
}
