import { Injectable, HttpService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import qs from 'querystring';
import { Observable } from 'rxjs';

import { RegisterEvent, RegisterSeminar, SBEQuery, SBESeminarResponse, SBEStarSpeakerResponse, SBERegistrationResponse } from './sbe.type';

@Injectable()
export class SBEService {
  private baseUri: string;
  private apiKey: string;

  constructor(private httpService: HttpService, private configService: ConfigService) {
    this.baseUri = this.configService.get<string>('api.SBE_BASE_URI') || '';
    this.apiKey = this.configService.get<string>('api.SBE_API_KEY') || '';
  }

  public async getSeminars(query: SBEQuery): Promise<SBESeminarResponse> {
    const queryStr = qs.stringify(query);

    const uri = `${this.baseUri}/external-module/seminar/v1/external/events/seminars?${queryStr}`;

    const observable: Observable<AxiosResponse> = this.httpService.get(uri, {
      headers: this.requestHeaders(),
    });

    return (await observable.toPromise()).data;
  }

  public async postRegisterEvent(body: RegisterEvent): Promise<any> {
    const uri = `${this.baseUri}/external-module/seminar/v1/external/events/register`;

    const observable: Observable<AxiosResponse> = this.httpService.post(
      uri,
      {
        companyName: body.companyName,
        countryCode: body.countryCode,
        email: body.email,
        eventId: body.eventId,
        firstName: body.firstName,
        lastName: body.lastName,
        language: body.language,
        registrationNo: body.registrationNo,
        salutation: body.salutation,
        systemCode: body.systemCode,
        title: body.title,
      },
      {
        headers: this.requestHeaders(),
      }
    );

    return (await observable.toPromise()).data;
  }

  public async postRegisterSeminar(body: RegisterSeminar): Promise<SBERegistrationResponse> {
    const uri = `${this.baseUri}/external-module/seminar/v1/external/events/seminars/register`;

    const observable: Observable<AxiosResponse> = this.httpService.post(
      uri,
      {
        eventId: body.eventId,
        language: body.language,
        paymentSession: body.paymentSession,
        registrationNo: body.registrationNo,
        seminarReg: body.seminarReg,
        shouldSendConfirmationEmail: body.shouldSendConfirmationEmail,
        systemCode: body.systemCode,
      },
      {
        headers: this.requestHeaders(),
      }
    );

    return (await observable.toPromise()).data;
  }

  public async getStarSpeakers(query: SBEQuery): Promise<SBEStarSpeakerResponse> {
    const queryStr = qs.stringify(query);

    const uri = `${this.baseUri}/external-module/seminar/v1/external/events/speakers?${queryStr}`;

    const observable: Observable<AxiosResponse> = this.httpService.get(uri, {
      headers: this.requestHeaders(),
    });

    return (await observable.toPromise()).data;
  }

  private requestHeaders(): Record<string, any> {
    return {
      'x-api-key': this.apiKey,
    };
  }

  public async getRegisteredSeminars(query: SBEQuery): Promise<any> {
    const queryStr = qs.stringify(query);
    const uri = `${this.baseUri}/external-module/seminar/v1/external/events/mySeminars?${queryStr}`;

    const observable: Observable<AxiosResponse> = this.httpService.get(uri, 
    {
      headers: this.requestHeaders(),
    });

    return (await observable.toPromise()).data;
  }
}
