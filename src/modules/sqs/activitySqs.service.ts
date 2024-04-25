import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({ region: 'ap-east-1' });

@Injectable()
export class ActivitySqsService {
    private QUEUE_URL
    
    constructor(
        private logger: Logger,
        private configService: ConfigService
    ) {
        this.logger.setContext(ActivitySqsService.name)
        this.QUEUE_URL = this.configService.get<any>('activityQueue');
    }
    
    public async sendMessage(body:any): Promise<boolean> {
        var params = {
            MessageBody: JSON.stringify(body),
            QueueUrl: this.QUEUE_URL,
        };

        try {
            let sqsResult = await sqs.sendMessage(params).promise()
            this.logger.debug(`Send activity Message Result: ${JSON.stringify(sqsResult)}`)
            return true
        } catch (error) {
            this.logger.error(`Failed to send message to activity queue, err: ${JSON.stringify(error)}`)
            throw new VepError(VepErrorMsg.Fail_To_Send_Message, `Failed to send message to activity queue`)
        }
    }
}
