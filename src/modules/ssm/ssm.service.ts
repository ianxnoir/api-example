import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
var AWS = require('aws-sdk');
var ssm = new AWS.SSM({ region: 'ap-east-1' });
@Injectable()
export class SsmService {
    private saltKey : string
    
    constructor(
        private logger: Logger,
        private configService: ConfigService
    ) {
        this.logger.setContext(SsmService.name)
        this.saltKey = this.configService.get<any>('ssm.saltKey');
    }

    public async getKey(keyName : string) : Promise<string> {
        // TBC: XRAY?
        let input = {
            Name : keyName,
            WithDecryption : true
        }
        const token = await ssm.getParameter(input).promise()
        const salt = token?.Parameter?.Value
        if (salt) {
            return salt
        } else {
            throw new VepError(VepErrorMsg.Fail_To_Get_Key)
        }
    }
    
    public async getSalt() : Promise<string> {
        return this.saltKey;
    }
}
