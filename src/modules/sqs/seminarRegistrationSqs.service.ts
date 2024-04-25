import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VepErrorMsg } from '../../config/exception-constant';
import { v4 as uuidv4 } from 'uuid';
import { VepError } from '../../core/exception/exception';
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({ region: 'ap-east-1' });

@Injectable()
export class SeminarRegistrationSqsService {
    private QUEUE_URL
    
    constructor(
        private logger: Logger,
        private configService: ConfigService
    ) {
        this.logger.setContext(SeminarRegistrationSqsService.name)
        this.QUEUE_URL = this.configService.get<any>('seminarRegistrationSqs.endpoint');
    }

    public async sendMessage(event: any, registrationNo: string): Promise<boolean> {
        
        var params = {
            MessageBody: JSON.stringify(event),
            MessageGroupId: registrationNo,
            MessageDeduplicationId: uuidv4(),
            QueueUrl: this.QUEUE_URL,
        };

        try {
            let sqsResult = await sqs.sendMessage(params).promise()
            this.logger.debug(`Send Message Result: ${JSON.stringify(sqsResult)}`)
            return true
        } catch (error) {
            this.logger.error(`Failed to send message to message queue, err: ${JSON.stringify(error)}`)
            throw new VepError(VepErrorMsg.Fail_To_Send_Message, `Failed to send message to message queue`)
        }
    }
}
