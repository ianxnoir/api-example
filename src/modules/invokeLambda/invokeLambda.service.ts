import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
import { RegistrationDataSqsJsonDto } from '../registration/dto/RegistrationDataSqsJson.dto';
var AWS = require('aws-sdk');
var lambda = new AWS.Lambda({ region: 'ap-east-1' });
@Injectable()
export class InvokeLambdaService {

  private FunctionName
  private InvocationType
  private LogType

  constructor(
    private logger: Logger,
    private configService: ConfigService
  ) {
    this.logger.setContext(InvokeLambdaService.name)
    this.FunctionName = this.configService.get<any>('submitFormLambda.FunctionName');
    this.InvocationType = this.configService.get<any>('submitFormLambda.InvocationType');
    this.LogType = this.configService.get<any>('submitFormLambda.LogType');
  }


  public async invokeRegistrationLambda(event: RegistrationDataSqsJsonDto): Promise<RegistrationLambdaResponseDto> {
    const functionName = this.invokeRegistrationLambda.name

    const params = {
      FunctionName: this.FunctionName,
      InvocationType: this.InvocationType,
      LogType: this.LogType,
      Payload: JSON.stringify(event)
    };

    try {
      this.logger.debug(`Try calling lambda`, functionName)
      const res = await lambda.invoke(params).promise();
      this.logger.debug(`Call lambda result: ${JSON.stringify(res)}`, functionName)
      return JSON.parse(res?.Payload) as RegistrationLambdaResponseDto;
    } catch (error) {
      this.logger.debug(`Failed to call lambda, reason: ${error.message}`, functionName)
      throw new VepError(VepErrorMsg.Fail_To_Call_Lambda, `Failed to send message to lambda`)
    }

  }
}
