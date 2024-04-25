import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuid } from 'uuid';
import { VepErrorMsg } from '../../../config/exception-constant';
import { VepError } from '../../../core/exception/exception';
import { Logger } from '../../../core/utils';
import { ShortRegReqDto } from './dto/shortRegReq.dto';
import { ShortRegRespDto } from './dto/shortRegResp.dto';

@Injectable()
export class FairRegistrationService {
    private baseURL: string;
    private FAIR_REGISTRATION_SHORT_REGISTRATION: string = "/registration/submitShortRegistration"

    constructor(private configService: ConfigService, private logger: Logger) {
        this.logger.setContext(FairRegistrationService.name)
        this.baseURL = this.configService.get<string>('api.FAIR_REGISTRATION_SERVICE_URI') || '';
    }

    async submitShortRegistration(data: ShortRegReqDto): Promise<ShortRegRespDto> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const config: AxiosRequestConfig = {
            url: `${this.FAIR_REGISTRATION_SHORT_REGISTRATION}`,
            method: 'PUT',
            headers,
            baseURL: this.baseURL,
            data,
        }

        try {
            return await this.fairRegistrationQuery<ShortRegRespDto>(config)
        } catch (ex) {
            throw new VepError(VepErrorMsg.ExhibitorService_FailToSubmitShortRegistration, `Failed to submit short registration, ex ${ex}`)
        }
    }

    async fairRegistrationQuery<T>(config: AxiosRequestConfig): Promise<T> {
        return new Promise(async (resolve, reject) => {
            axios(config).then((response: AxiosResponse) => {
                this.logger.log(`Received data from Fair Registration Service, url: ${response.config.url}, Request ID ${response.config.headers['X-Request-ID']}`)
                resolve(response.data.data);
            }).catch((error: AxiosError) => {
                this.logger.error(`Error in call Fair Registration Service, url: ${config.url}, Request ID ${config.headers['X-Request-ID']}, error message: ${JSON.stringify(error.message)}`)
                reject(new VepError(VepErrorMsg.FairRegistrationService_Error, error.message))
            })
        })
    }
}
