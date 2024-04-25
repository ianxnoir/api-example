import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { v4 as uuid } from 'uuid';
import { VepErrorMsg } from '../../../config/exception-constant';
import { VepError } from '../../../core/exception/exception';
import { Logger } from '../../../core/utils';
import { SystemTemplate } from './dto/systemTemplate.dto';

@Injectable()
export class NotificationService {
    private baseURL: string;
    private NOTIFICATION_SYSTEM_TEMPLATE: string = "/admin/v1/notification/system-template/"

    constructor(private configService: ConfigService, private logger: Logger) {
        this.logger.setContext(NotificationService.name)
        this.baseURL = this.configService.get<string>('api.NOTIFICATION_SERVICE_URI') || '';
    }

    async retrieveNotificationTemplate(notificationId: string): Promise<SystemTemplate> {
        const headers = {
            'X-Request-ID': uuid(),
            'Content-Type': 'application/json',
        }

        const config: AxiosRequestConfig = {
            url: `${this.NOTIFICATION_SYSTEM_TEMPLATE}${notificationId}`,
            method: 'GET',
            headers,
            baseURL: this.baseURL,
        }

        try {
            const resp = await this.notificationQuery<SystemTemplate>(config)
            if (resp.status == "s000") {
                return resp
            } else {
                this.logger.ERROR('', '', `Failed to retrieve system template, notificationId: ${notificationId}, message: ${JSON.stringify(resp)}`, this.retrieveNotificationTemplate.name)
                throw new VepError(VepErrorMsg.Notification_FailToRetrieveSystemTemplate, ``)
            }
        } catch (ex) {
            throw new VepError(VepErrorMsg.Notification_FailToRetrieveSystemTemplate, `Failed to retrieve system template, notificationId: ${notificationId}`)
        }
    }

    async notificationQuery<T>(config: AxiosRequestConfig): Promise<T> {
        return new Promise(async (resolve, reject) => {
            axios(config).then((response: AxiosResponse) => {
                this.logger.log(`Received data from Notification Service, url: ${response.config.url}, Request ID ${response.config.headers['X-Request-ID']}`)
                resolve(response.data);
            }).catch((error: AxiosError) => {
                this.logger.error(`Error in call Notification Service, url: ${config.url}, Request ID ${config.headers['X-Request-ID']}, error message: ${JSON.stringify(error.message)}`)
                reject(new VepError(VepErrorMsg.NotificationService_Error, error.message))
            })
        })
    }
}
