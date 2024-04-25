import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuid } from 'uuid';
import { VepErrorMsg } from '../../../config/exception-constant';
import { VepError } from '../../../core/exception/exception';
import { Logger } from '../../../core/utils';
import qs from 'qs';

@Injectable()
export class ExhibitorService {
    private baseURL: string;
    private EXHIBITOR_GET_ENQUIRY_FORM_SERIAL_NO: string = "/form/enquiryFormSerialNo"
    private EXHIBITOR_CHECK_EXISTENCE: string = "/exhibitor/checkExistence"

    constructor(private configService: ConfigService, private logger: Logger) {
        this.logger.setContext(ExhibitorService.name)
        this.baseURL = this.configService.get<string>('api.EXHIBITOR_SERVICE_URI') || '';
    }

    async retrieveEnquiryFormSerialNo(): Promise<string> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const config: AxiosRequestConfig = {
            url: `${this.EXHIBITOR_GET_ENQUIRY_FORM_SERIAL_NO}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
        }

        try {
            const { serialNo } =  await this.exhibitorQuery<{ serialNo: string }>(config)
            this.logger.INFO('', '', `Received enquiry no ${serialNo}`, this.retrieveEnquiryFormSerialNo.name, { serialNo })
            return serialNo
        } catch (ex) {
            throw new VepError(VepErrorMsg.ExhibitorService_FailToRetrieveSerialNo, `Failed to retrieve serial no, ex ${ex}`)
        }
    }

    // Check Active Exhibitors by eoaFairId & ssouId (or emailId)
    async checkExhibitorExistence(
        eoaFairId: string,
        emailId: string
    ): Promise<boolean> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const params = {
            eoaFairId,
            emailId
        }

        const config: AxiosRequestConfig = {
            url: `${this.EXHIBITOR_CHECK_EXISTENCE}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
            params,
            paramsSerializer: (p) => {
                return qs.stringify(p)
            }
        }

        try {
            const { existence } = await this.exhibitorQuery<{ existence: boolean }>(config)
            this.logger.INFO('', '', `Received existence ${existence}, eoaFairId ${eoaFairId} emailId ${emailId}`, this.checkExhibitorExistence.name, { existence })
            return existence
        } catch (ex) {
            throw new VepError(VepErrorMsg.ExhibitorService_Error, `Failed to check exhibitor existence, ex ${ex}`)
        }
    }

    async exhibitorQuery<T>(config: AxiosRequestConfig): Promise<T> {
        return new Promise(async (resolve, reject) => {
            axios(config).then((response: AxiosResponse) => {
                this.logger.log(`Received data from Exhibitor Service, url: ${response.config.url}, Request ID ${response.config.headers['X-Request-ID']}`)
                resolve(response.data.data);
            }).catch((error: AxiosError) => {
                this.logger.error(`Error in call Exhibitor Service, url: ${config.url}, Request ID ${config.headers['X-Request-ID']}, error message: ${JSON.stringify(error.message)}`)
                reject(new VepError(VepErrorMsg.ExhibitorService_Error, error.message))
            })
        })
    }
}
