import { Injectable, Query } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import { VepErrorMsg } from "../../config/exception-constant";
import { VepError } from "../../core/exception/exception";
import { Logger } from "../../core/utils";
import { CaptchaDto } from "./dto/captcha.dto";
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CaptchaService {
    baseURL: string;
    constructor(
        private logger: Logger,
        private configService: ConfigService,
    ) {
        this.logger.setContext(CaptchaService.name);
        this.baseURL = this.configService.get<any>('captcha.host');
    }
    
  public async validateCaptcha(
    @Query() data: CaptchaDto,
  ): Promise<Optional<any>> {
   
    if (!["recaptcha", "tencent"].includes(data.providerId)) {
      throw new VepError(VepErrorMsg.Captcha_Error, `Invalid providerId, providerId should be recaptcha or tencent`)
    }

    const headers = {
        'Content-Type': 'application/json',
        'x-request-id': uuidv4()
    }
    
    console.log(this.baseURL + data.providerId + "/verify")
    this.logger.log('Verify the user with ' + JSON.stringify(data) + ' and the x-request-id is: ' + headers["x-request-id"])
  
    return axios.post(this.baseURL + data.providerId + "/verify", data.verifyRequest, 
                        {
                            headers: headers
                        }                 
                      )
                      .then((response) => {
                        this.logger.log("Captcha Response is: "+ JSON.stringify(response.data) + ' and the x-request-id is: ' + headers["x-request-id"])
                        return response.data
                      })
                      .catch((error) => {
                        throw new VepError(VepErrorMsg.Captcha_Error, error.response?.data?.message ?? error.message)
                      })
  }
}
