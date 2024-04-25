import { Body, Controller, Headers, Put, UseInterceptors, Param, Post, Header, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OptionalSSOUserDecorator } from '../../core/decorator/optionalSsoUser.decorator';
import { SSOUserDecorator, SSOUserHeadersDto } from '../../core/decorator/ssoUser.decorator';
import { ValidationErrorResponseDto } from '../../core/filters/dto/ValidationErrorResponse.dto';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { Logger } from '../../core/utils';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { AdminUserDecorator } from '../../core/decorator/adminUser.decorator';
import { FairSettingSuccessfulResponseDto, RegistrationRequestDto, UpdateRegistrationStatusRequestDto, UpdateRegistrationStatusResponseDto, BulkUpdateRegistrationStatusRequestDto, RegistrationRequestV2Dto } from './dto/RegistrationRequest.dto';
import { SubmitFormRequestDto } from './dto/SubmitFormRequestDto.dto';
import { SubmitFormResponseDto } from './dto/SubmitFormResponse.dto';
import { C2MParticipantStatusDto, C2MParticipantStatusListDto } from './dto/updateCToMParticipantStatus.dto';
import { FairRegistrationRemarkReqDto } from './dto/updateFairRegistration.dto';
import { AdminJwtInterceptor } from '../../core/interceptors/adminJwt.interceptor';
import { RegistrationService } from './registration.service';
import { InvalidateRegistrationReqDto } from './dto/invalidateRegistrationReq.dto';
import { XTraceIdDecorator, XTraceDto } from '../../core/decorator/xTraceId.decorator';
import { VerifyRegFormLinkReqDto } from './dto/verifyRegFormLinkReq.dto';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { GetUploadFilePresignedUrlReqDto } from './dto/getUploadFilePresignedUrlReq.dto';
import { GenerateRegFormLinkReqDto } from './dto/GenerateRegFormLinkReq.dto';
import { QueryRegFormLinkReqDto } from './dto/QueryRegFormLinkReq.dto';
import { SubmitAORFormRequestDto } from './dto/SubmitAORFormRequestDto.dto';
import { SubmitAORFormResponseDto } from './dto/SubmitAORFormResponse.dto';
import { SubmitCombinedFairFormRequestDto } from './dto/SubmitCombinedFairFormRequestDto.dto';
import { SubmitCombinedFairFormResponseDto } from './dto/SubmitCombinedFairFormResponse.dto';
import { SubmitShortRegReqDto } from './dto/submitShortRegReq.dto';
import { SubmitShortRegRespDto } from './dto/submitShortRegResp.dto';

@ApiTags('Registration')
@Controller(['registration', 'admin/v1/fair/registration', 'admin/v1/fair/batch/registration'])
//@ApiHeader({
//    name: 'x-sso-uid',
//    description: 'sso uid from jwt payload (data source: sso)',
//})

export class RegistrationController {
  constructor(private logger: Logger, private registrationService: RegistrationService) {
      this.logger.setContext(RegistrationController.name)
  }

  @Put('/:registrationRecordId/c2m-participant-status')
  @UseInterceptors(ResponseInterceptor)
  @UseInterceptors(AdminJwtInterceptor)
  @ApiOperation({ summary: 'Update the c2m participant status by Id' })
  public async updateCToMParticipantStatus(@Param('registrationRecordId') registrationRecordId: number, @AdminUserDecorator() adminUser: AdminUserDto, @Body() c2MParticipantStatusDto: C2MParticipantStatusDto) {
    return await this.registrationService.updateCToMParticipantStatus(adminUser, registrationRecordId, c2MParticipantStatusDto)
  }

  @Put('/c2m-participant-status')
  @UseInterceptors(ResponseInterceptor)
  @UseInterceptors(AdminJwtInterceptor)
  @ApiOperation({ summary: 'Update the c2m participant status by List' })
  public async updateCToMParticipantStatusList(@AdminUserDecorator() adminUser: AdminUserDto, @Body() c2MParticipantStatusListDto: C2MParticipantStatusListDto) {
    return await this.registrationService.updateCToMParticipantStatusList(adminUser, c2MParticipantStatusListDto)
  }
  
  @Post('eligibility')
  @ApiBody({ type: RegistrationRequestDto })
  @UseInterceptors(ResponseInterceptor)
  @Header('content-type', 'application/json')
  @ApiOperation({ summary: 'Check if the user is eligible to register the fair' })
  @ApiHeader({
    name: 'x-sso-uid',
    description: 'sso uid from jwt payload (data source: sso)',
  })
  @ApiHeader({
    name: 'x-access-token',
    description: 'access token',
  })
  @ApiHeader({
    name: 'x-email-id',
    description: 'email Id',
  })
  @ApiHeader({
    name: 'x-sso-firstname',
    description: 'first name',
  })
  @ApiHeader({
    name: 'x-sso-lastname',
    description: 'x-sso-lastname',
  })
  @ApiHeader({
    name: 'x-request-id',
    description: 'Request ID for tracking is provided by API consumer',
  })
  @ApiHeader({
    name: 'x-trace-id',
    description: 'Trace ID for tracking is provided by API consumer',
  })
  @ApiResponse({
    status: 200,
    description: "Successful Response: Returned Fair Setting Details to check if the Fair Registration is enabled or disabled",
    type: FairSettingSuccessfulResponseDto,
    schema: { example: FairSettingSuccessfulResponseDto},
  })

  @ApiResponse({
    status: 400,
    description: "Validation Error",
    type: ValidationErrorResponseDto,
    schema: { example: ValidationErrorResponseDto },
})

  public async checkEligibility(
    @OptionalSSOUserDecorator() ssoUser: SSOUserHeadersDto | null , 
    @Body() registrationRequestDto : RegistrationRequestDto,
    @XTraceIdDecorator() xTrace : XTraceDto
  ) {
    return await this.registrationService.checkEligibility(ssoUser, registrationRequestDto, xTrace)
  }

    @Post('eligibilityV2')
    @ApiBody({ type: RegistrationRequestV2Dto })
    @UseInterceptors(ResponseInterceptor)
    @Header('content-type', 'application/json')
    @ApiOperation({ summary: 'Check if the user is eligible to register the fair' })
    @ApiHeader({
      name: 'x-sso-uid',
      description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
      name: 'x-access-token',
      description: 'access token',
    })
    @ApiHeader({
      name: 'x-email-id',
      description: 'email Id',
    })
    @ApiHeader({
      name: 'x-sso-firstname',
      description: 'first name',
    })
    @ApiHeader({
      name: 'x-sso-lastname',
      description: 'x-sso-lastname',
    })
    @ApiHeader({
      name: 'x-request-id',
      description: 'Request ID for tracking is provided by API consumer',
    })
    @ApiHeader({
      name: 'x-trace-id',
      description: 'Trace ID for tracking is provided by API consumer',
    })
    @ApiResponse({
      status: 200,
      description: "Successful Response: Returned Fair Setting Details to check if the Fair Registration is enabled or disabled",
      type: FairSettingSuccessfulResponseDto,
      schema: { example: FairSettingSuccessfulResponseDto },
    })
    @ApiResponse({
      status: 400,
      description: "Validation Error",
      type: ValidationErrorResponseDto,
      schema: { example: ValidationErrorResponseDto },
    })
    public async checkEligibilityV2(
      @OptionalSSOUserDecorator() ssoUser: SSOUserHeadersDto | null,
      @Body() registrationRequestDto: RegistrationRequestV2Dto,
      @XTraceIdDecorator() xTrace: XTraceDto
    ) {
      return await this.registrationService.checkEligibilityV2(ssoUser, registrationRequestDto, xTrace)
    }

    @Put('submitForm')
    @UseInterceptors(ResponseInterceptor)
    @ApiOperation({ summary: 'Endpoint for form validation and form submit' })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiResponse({
        status: 200,
        description: "Response : return validation result/ submit result",
        type: SubmitFormResponseDto,
        schema: { example: SubmitFormResponseDto },
    })
    public async submitForm(
      @OptionalSSOUserDecorator() ssoUser: SSOUserHeadersDto | null, 
      @Headers('x-forwarded-for') xForwardedForStr: string, 
      @XTraceIdDecorator() xTrace: XTraceDto,
      @Body() request: SubmitFormRequestDto) {
        return await this.registrationService.submitForm(ssoUser, request, xForwardedForStr, xTrace)
    }

  @Put('submitAORForm')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'Endpoint for aor form validation and submit' })
  @ApiHeader({
    name: 'x-sso-uid',
    description: 'sso uid from jwt payload (data source: sso)',
  })
  @ApiResponse({
    status: 200,
    description: "Response : return validation result/ submit result",
    type: SubmitAORFormResponseDto,
    schema: { example: SubmitAORFormResponseDto },
  })
  public async submitAORForm(
    @Headers('x-forwarded-for') xForwardedForStr: string, 
    @XTraceIdDecorator() xTrace: XTraceDto,
    @Body() request: SubmitAORFormRequestDto) {
    return await this.registrationService.submitAORForm(request, xForwardedForStr, xTrace)
  }

  @Put('submitCombinedFairForm')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'Endpoint for combinedFair form validation and submit' })
  @ApiHeader({
    name: 'x-sso-uid',
    description: 'sso uid from jwt payload (data source: sso)',
  })
  @ApiResponse({
    status: 200,
    description: "Response : return validation result/ submit result",
    type: SubmitCombinedFairFormResponseDto,
    schema: { example: SubmitCombinedFairFormResponseDto },
  })
  public async submitCombinedFairForm(
    @SSOUserDecorator() ssoUser: SSOUserHeadersDto,
    @Headers('x-forwarded-for') xForwardedForStr: string, 
    @XTraceIdDecorator() xTrace: XTraceDto,
    @Body() request: SubmitCombinedFairFormRequestDto) {
    return await this.registrationService.submitCombinedFairForm(ssoUser, request, xForwardedForStr, xTrace)
  }

  @Put('submitShortRegistration')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'Endpoint for short form registration' })
  @ApiResponse({
    status: 200,
    description: "Response : return validation result/ submit result",
    type: SubmitShortRegRespDto,
    schema: { example: SubmitShortRegRespDto },
  })
  public async submitShortRegistration(@Body() request: SubmitShortRegReqDto) {
    return await this.registrationService.submitShortRegistration(request)
  }

  @Put(':registrationRecordId/registration-status')
  @UseInterceptors(ResponseInterceptor)
  @UseInterceptors(AdminJwtInterceptor)
  @ApiOperation({ summary: 'Update fair participant (Buyer) registration status' })
  @ApiResponse({
    status: 200,
    description: "Successful response",
    type: UpdateRegistrationStatusResponseDto,
    schema: { example: UpdateRegistrationStatusResponseDto },
  })
  public async updateStatus(@AdminUserDecorator() adminUser: AdminUserDto, @Param('registrationRecordId') registrationRecordId: number, @Body() request: UpdateRegistrationStatusRequestDto) {
    return await this.registrationService.updateStatus(adminUser, registrationRecordId, request)
  }

  @Put('registration-status')
  @UseInterceptors(ResponseInterceptor)
  @UseInterceptors(AdminJwtInterceptor)
  @ApiOperation({ summary: 'Bulk update fair participant (Buyer) registration status' })
  @ApiResponse({
    status: 200,
    description: "Successful response",
    type: UpdateRegistrationStatusResponseDto,
    schema: { example: UpdateRegistrationStatusResponseDto },
  })
  public async bulkUpdateStatus(@AdminUserDecorator() adminUser: AdminUserDto, @Body() request: BulkUpdateRegistrationStatusRequestDto) {
    return await this.registrationService.bulkUpdateStatus(adminUser, request)
  }

  @Put(':registrationRecordId')
  @UseInterceptors(ResponseInterceptor)
  @UseInterceptors(AdminJwtInterceptor)
  @ApiOperation({ summary: 'update remark of fair registration by Id' })
  public async updateFairRegistrationById(@AdminUserDecorator() adminUser: AdminUserDto, @Param('registrationRecordId') registrationRecordId: number, @Body() fairRegistrationRemarkReqDto: FairRegistrationRemarkReqDto) {
    return await this.registrationService.updateFairRegistrationById(adminUser, registrationRecordId, fairRegistrationRemarkReqDto)
  }

  @Get('verifyRegFormLink')
  @UseInterceptors(ResponseInterceptor)
  public async verifyRegFormLink(@Query() query: VerifyRegFormLinkReqDto) {
    return this.registrationService.verifyRegFormLink(query)
  }

  @Post('generateRegFormLink')
  @ApiBody({ type: GenerateRegFormLinkReqDto })
  @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
  public async generateRegFormLink(@Body() generateRegFormLinkReqDto: GenerateRegFormLinkReqDto, @AdminUserDecorator() adminUser: AdminUserDto,) {
    return this.registrationService.generateRegFormLink(generateRegFormLinkReqDto, adminUser)
  }

  @Get('queryRegFormLink')
  @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
  @ApiOperation({ summary: 'Return the list of Reg Form Link Task' })
  @ApiResponse({
    status: 200,
    description: 'Successful Response: Return the list of Reg Form Link Task',
  })
  public async queryRegFormLink(@Query() query: QueryRegFormLinkReqDto) {
    return this.registrationService.queryRegFormLink(query)
  }

  @Get('countRegFormLink')
  @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
  @ApiOperation({ summary: 'Return the number of Reg Form Link Task' })
  public async countRegFormLink() {
    return this.registrationService.countRegFormLink()
  }

  @Post('invalidate-registration')
  @ApiBody({ type: InvalidateRegistrationReqDto })
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'invalidate fair registration, endpoint for eoa api' })
  public async invalidateRegistration(@Body() invalidateRegReqDto: InvalidateRegistrationReqDto) {
    return await this.registrationService.invalidateRegistration(invalidateRegReqDto)
  }

  // Override default configuration for Rate limiting and duration.
  // we can only call registration/fairRegistrations for 100 times in every 3 second 
  @Get('uploadFilePresignedUrl')
  @UseInterceptors(ResponseInterceptor)
  @UseGuards(ThrottlerGuard)
  @Throttle(100, 3)
  public async getUploadFilePresignedUrl(@OptionalSSOUserDecorator() ssoUser: SSOUserHeadersDto | null, @Query() query: GetUploadFilePresignedUrlReqDto) {
    return await this.registrationService.getUploadFilePresignedUrl(ssoUser, query)
  }

}

// registrationservice

// can reg - give them a form
// cannot reg - return a message (refer to jira step 51)