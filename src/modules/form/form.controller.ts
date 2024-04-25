
import { Controller, Get, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { XTraceDto, XTraceIdDecorator } from '../../core/decorator/xTraceId.decorator';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { GetFormSubmissionKeyReqDto } from './dto/getFormSubmissionKeyReq.dto';
import { GetUploadFilePresignedUrlReqDto } from './dto/getUploadFilePresignedUrlReq.dto';
import { FormService } from './form.service';

@Controller(['form'])
export class FormController {
    constructor(private formService: FormService) { }

    // Override default configuration for Rate limiting and duration.
    // we can only call registration/fairRegistrations for 100 times in every 3 second 
    @Get('uploadFilePresignedUrl')
    @UseInterceptors(ResponseInterceptor)
    @UseGuards(ThrottlerGuard)
    @Throttle(100, 3)
    public async getUploadFilePresignedUrl(@Query() query: GetUploadFilePresignedUrlReqDto) {
        return await this.formService.getUploadFilePresignedUrl(query)
    }

    @Get('submissionKey')
    @UseInterceptors(ResponseInterceptor)
    @UseGuards(ThrottlerGuard)
    @Throttle(100, 3)
    public async getFormSubmissionKey(@Query() query: GetFormSubmissionKeyReqDto, @XTraceIdDecorator() xTrace: XTraceDto) {
        return await this.formService.getFormSubmissionKey(query, xTrace)
    }
}
