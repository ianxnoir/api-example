import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { VepError } from '../../core/exception/exception';
import { VepErrorMsg } from '../../config/exception-constant';

@Injectable()
export class ESService {
    host: string;
    authorization: string;
    constructor(private configService: ConfigService, private logger: Logger) {
        this.logger.setContext(ESService.name)
        this.host = this.configService.get<any>('es.host');
        this.authorization = this.configService.get<any>('es.authorization');
    }

    async constructESQuery(index: string, body: {}) {
        this.logger.debug("Elastic Search Query :")
        this.logger.debug(JSON.stringify(body))
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': this.authorization
        }
        return axios.post(this.host + index + "/_search", body, {
            headers: headers
        })
            .then((response) => {
                return response.data
            })
            .catch((error) => {
                this.logger.error("Error in call Elactic Search");
                throw new VepError(VepErrorMsg.Fair_Search_Participant_ES_Error, error.message)
            })
    }
}