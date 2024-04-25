import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({ region: 'ap-east-1' });
var GROUP_ID_SUFFIX_FOR_FIFO = 0
@Injectable()
export class CustomQuestionSqsService {
    private QUEUE_URL
    private REGISTRATION_MESSAGE_GROUP_ID
    
    constructor(
        private logger: Logger,
        private configService: ConfigService
    ) {
        this.logger.setContext(CustomQuestionSqsService.name)
        this.QUEUE_URL = this.configService.get<any>('customQuestionImport.SQS_ENDPOINT');
        this.REGISTRATION_MESSAGE_GROUP_ID = this.configService.get<any>('customQuestionImport.RegistrationMessageGroupId');
    }

    public async sendMessage(messageDuplcationId: string, event: any): Promise<boolean> {
        GROUP_ID_SUFFIX_FOR_FIFO = (GROUP_ID_SUFFIX_FOR_FIFO + 1 > 3) ? 0 : GROUP_ID_SUFFIX_FOR_FIFO + 1
        var params = {
            MessageBody: JSON.stringify(event),
            MessageGroupId: this.REGISTRATION_MESSAGE_GROUP_ID + '_' + GROUP_ID_SUFFIX_FOR_FIFO,
            MessageDeduplicationId: messageDuplcationId,
            QueueUrl: this.QUEUE_URL,
        };

        try {
            let sqsResult = await sqs.sendMessage(params).promise()
            this.logger.debug(`Send Message Result: ${JSON.stringify(sqsResult)}`)
            return true
        } catch (error) {
            this.logger.error(`Failed to send message to message queue, err: ${JSON.stringify(error)}`)
            throw new VepError(VepErrorMsg.Fail_To_Send_Message, `Failed to send message to message queue err: ${JSON.stringify(error)}`)
        }
    }
}
