import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Logger } from '../../../core/utils';

@Injectable()
export class C2MService {
    private baseURL: string;
    
    constructor(private configService: ConfigService, private logger: Logger) {
        this.logger.setContext(C2MService.name)
        this.baseURL = this.configService.get<string>('api.C2M_SERVICE_URI') || '';
    }

    public getC2MHiddenRecord({mySsoUid, fairCode, fairYear, hiddenType}: Record<string, any>): Promise<any> {
        return axios.request({
            method: 'GET',
            url: `${this.baseURL}c2m/fairs/${fairCode}/hidden-records`,
            params: { 
                fairYear,
                hiddenType: parseInt(hiddenType, 10)
            },
            headers: {
                'x-access-token': '',
                'x-email-id': '',
                'x-sso-uid': mySsoUid,
                'x-sso-firstname': '',
                'x-sso-lastname': '',
            }
        })
    }

    public postSeminarRegistrationNoti({ userId, fairCode, fiscalYear, eventId, seminarId }: Record<string, any>): void {
        this.logger.log(JSON.stringify({ section: 'postSeminarRegistrationNoti', action: 'seminarRegistration', step: '5', detail:  `input detail: userId: ${userId}, fairCode: ${fairCode}, fiscalYear: ${fiscalYear}, eventId: ${eventId}, seminarId: ${seminarId}` }));
        axios.request({
            method: 'POST',
            url: `${this.baseURL}c2m/triggerSeminarRegistrationNotification`,
            data: {
                userId,
                fairCode,
                fiscalYear,
                eventId,
                seminarId
            },
        }).then(result => {
            this.logger.log(JSON.stringify({ section: 'postSeminarRegistrationNoti', action: 'seminarRegistration', step: '6', detail:  `response: ${JSON.stringify(result)}` }));
        }).catch(error => {
            this.logger.log(JSON.stringify({ section: 'postSeminarRegistrationNoti', action: 'seminarRegistration', step: 'error', detail:  `response: ${JSON.stringify(error)}` }));
        })
    }

    public callNotiSchulerEndpoints(endPoint: string): void {
        axios.request({
            method: 'GET',
            url: `${this.baseURL}scheduler/${endPoint}`
        }).then(result => {
            this.logger.log(JSON.stringify({ section: 'callNotiSchulerEndpoints', action: 'callNotiSchulerEndpoints', step: '1', detail:  `response: ${JSON.stringify(result)}` }));
        }).catch(error => {
            this.logger.log(JSON.stringify({ section: 'callNotiSchulerEndpoints', action: 'callNotiSchulerEndpoints', step: 'error', detail:  `response: ${JSON.stringify(error)}` }));
        })
    }
}
