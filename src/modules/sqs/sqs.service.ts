import { Injectable } from '@nestjs/common';
import { Logger } from '../../core/utils';
import { ConfigService } from '@nestjs/config';
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
import { EnquiryFormEmailDto } from '../form/dto/enquiryFormEmail.dto';
import { v4 as uuidv4 } from 'uuid';
import { RegistrationDataSqsJsonDto } from '../registration/dto/RegistrationDataSqsJson.dto';
var AWS = require('aws-sdk');
var sqs = new AWS.SQS({ region: 'ap-east-1' });
@Injectable()
export class SqsService {
    private EMAIL_QUEUE_URL
    private REGISTRATION_QUEUE_URL
    private REGISTRATION_DEAD_QUEUE_URL

    constructor(
        private logger: Logger,
        private configService: ConfigService
    ) {
        this.logger.setContext(SqsService.name)
        this.EMAIL_QUEUE_URL = this.configService.get<any>('sqs.notificationQueueEndpoint');
        this.REGISTRATION_QUEUE_URL = this.configService.get<any>('sqs.buyerRegistrationQueueEndpoint');
        this.REGISTRATION_DEAD_QUEUE_URL = this.configService.get<any>('sqs.buyerRegistrationDeadQueueEndpoint');
    }

    public async sendEmailObjToSqs(email: EnquiryFormEmailDto): Promise<boolean> {
        const messageContent = {
            "from": email.from,
            "to": email.to,
            "replyTo": email.replyTo,
            "cc": "",
            "subject": email.emailSubject,
            "html": email.emailContent,
        }

        const params = {
            QueueUrl: this.EMAIL_QUEUE_URL,
            MessageBody: JSON.stringify(messageContent),
            MessageGroupId: uuidv4(),
            MessageDeduplicationId: uuidv4()
        }

        try {
            let sqsResult = await sqs.sendMessage(params).promise()
            this.logger.debug(`Send Message Result: ${JSON.stringify(sqsResult)}`)
            return true
        } catch (error) {
            this.logger.error(`Failed to send message to message queue, err: ${JSON.stringify(error)}`)
            throw new VepError(VepErrorMsg.Fail_To_Send_Message, `Failed to send message to message queue`)
        }
    }

    public async sendSQSJsonToRegistrationQueue(registrationData: RegistrationDataSqsJsonDto,traceId : string) {
        const messageGroupId = uuidv4();
        const messageDeduplicationId = uuidv4();
        const params = {
            QueueUrl: this.REGISTRATION_QUEUE_URL,
            MessageBody: JSON.stringify(registrationData),
            MessageGroupId: messageGroupId,
            MessageDeduplicationId: messageDeduplicationId
        }

        try {
            let sqsResult = await sqs.sendMessage(params).promise()
            this.logger.INFO(traceId,'',`Message Group Id: ${messageGroupId}, DeduplicationId ${messageDeduplicationId}`)
            this.logger.INFO(traceId,'',`Send Message Result: ${JSON.stringify(sqsResult)}`)
            return true
        } catch (error) {
            this.logger.FATAL(traceId,'',`Failed to send message to message queue, err: ${JSON.stringify(error)}`)
            return false
        }
    }

    public async sendSQSJsonToRegistrationDeadQueue(registrationData: RegistrationDataSqsJsonDto) {
        const params = {
            QueueUrl: this.REGISTRATION_DEAD_QUEUE_URL,
            MessageBody: JSON.stringify(registrationData),
            MessageGroupId: uuidv4(),
            MessageDeduplicationId: uuidv4()
        }

        try {
            let sqsResult = await sqs.sendMessage(params).promise()
            this.logger.INFO('','',`Send Message Result: ${JSON.stringify(sqsResult)}`)
            return true
        } catch (error) {
            this.logger.FATAL('','',`Failed to send message to message queue, err: ${JSON.stringify(error)}`)
            return false
        }
    }
}
