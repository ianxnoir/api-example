import { Body, Headers, Controller, Put, UseInterceptors } from '@nestjs/common';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { CustomFormService } from './customForm.service';
import { SubmitCustomFormReqDto } from './dto/submitCustomFormReq.dto';

@Controller(['customForm'])
export class CustomFormController {
    constructor(private customFormService: CustomFormService) { }

    @Put("submit")
    @UseInterceptors(ResponseInterceptor)
    public async submitCustomForm(@Headers('x-forwarded-for') xForwardedForStr: string, @Body() request: SubmitCustomFormReqDto) {
        return this.customFormService.submitCustomForm(request, xForwardedForStr)
    }
}
