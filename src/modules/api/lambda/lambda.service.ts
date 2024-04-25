import { HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LambdaService {
  private baseUri: string;

  constructor(
    private httpService: HttpService,
    private configService: ConfigService
  ) {
    this.baseUri = this.configService.get<string>('api.LAMBDA_URI') || '';
  }

  public async getSecretValue(secretId: String): Promise<any> {
    return this.httpService.post(`${this.baseUri}/aws/getSecretValue`, { secretId }).toPromise();
  }

  public async triggerBatchJob(): Promise<any> {
    return this.httpService.post(`${this.baseUri}/aws/seminarReport/runBatch`, {}).toPromise();
  }

}
