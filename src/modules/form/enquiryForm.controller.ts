import { Body, Headers, Controller, Put, UseInterceptors } from '@nestjs/common';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { SubmitEnquiryFormReqDto } from './dto/submitEnquiryFormReq.dto';
import { EnquiryFormService } from './enquiryForm.service';

@Controller(['enquiryForm'])
export class EnquiryFormController {
    constructor(private enquiryFormService: EnquiryFormService) { }

    @Put("submit")
    @UseInterceptors(ResponseInterceptor)
    public async submitEnquiryForm(@Headers('x-forwarded-for') xForwardedForStr: string, @Body() request: SubmitEnquiryFormReqDto) {
        return this.enquiryFormService.submitEnquiryForm(request, xForwardedForStr)
    }
}
