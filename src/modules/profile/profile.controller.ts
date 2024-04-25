import { Body, Controller, Get, Header, HttpCode, Param, Post, Query, UseInterceptors, Put } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { AdminUserDecorator } from '../../core/decorator/adminUser.decorator';
import { SSOUserDecorator, SSOUserHeadersDto } from '../../core/decorator/ssoUser.decorator';
import { AdminJwtInterceptor } from '../../core/interceptors/adminJwt.interceptor';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { Auth } from '../../decorators/auth.decorator';
import { FairDbService } from '../fairDb/fairDb.service';
import { GetUploadFilePresignedUrlRespDto } from '../form/dto/getUploadFilePresignedUrlResp.dto';
import { AdminEditProfileResp } from './dto/adminEditProfileResp.dto';
import { CombinedFairFormDataRespDto } from './dto/combinedFairFormDataResp.dto';
import { FairParticipantInflencingReqDto } from './dto/fairParticipantInflencingReq.dto';
import { GetBuyerDetailsForExhbrReqDto } from './dto/getBuyerDetailsForExhbrReq.dto';
import { GetBuyerDetailsForExhbrRespDto } from './dto/getBuyerDetailsForExhbrResp.dto';
import { GetC2MProductInterestRespDto, GetC2MQuestionInputRespDto } from './dto/getC2mQuestionInputResp.dto';
import { GetCombinedFairListRespDto } from './dto/getCombineFairListResp.dto';
import { AdminGetPresignedUrlPerUserReqDto, GetPresignedUrlPerUserReqDto } from './dto/getPresignedUrlPerUserReq.dto';
import { ParticipantRegistrationBySsouidsDto } from './dto/ParticipantRegistrationBySsouids.dto';
import { ParticipantTypeByFairListDto } from './dto/ParticipantTypeByFair.dto';
import { ParticipantTypeByFairDetailSearchDto } from './dto/participantTypeByFairDetailSearch.dto';
import { ParticipantTypeSearchDto } from './dto/ParticipantTypeSearch.dto';
import { ProfileForEditReqByFairCodeDto } from './dto/profileForEditReqByFairCode.dto';
import { ProfileForBackendEditRespDto, ProfileForEditRespDto } from './dto/profileForEditResp.dto';
import { SearchC2mExcludedParticipantDto } from './dto/searchC2mExcludedParticipant.dto';
import { UpdateC2MProfileReqDto } from './dto/updateC2MProfileReq.dto';
import { UpdateFairParticipantRegistrationRecordDto } from './dto/UpdateFairParticipantRegistrationRecord.dto';
import { UpdateProductInterestPerFairReqDto } from './dto/updateProductInterestPerFairReq.dto';
import { UpdateProfileBackendReqDto } from './dto/updateProfileBackendReq.dto';
import { UpdateProfileFrontendReqDto } from './dto/updateProfileFrontendReq.dto';
import { UpdateProfileFrontendRespDto } from './dto/updateProfileFrontendResp.dto';
import { UpdateResultDto } from './dto/updateResult.dto';
import { ProfileService } from './profile.service';

@ApiHeader({
    name: 'x-request-id',
    description: 'The Request ID for tracking is provided by API consumer',
})
@ApiTags('Profile')
@Controller('profile')
export class ProfileController {
    constructor(
        private profileService: ProfileService,
        private fairDbService: FairDbService
    ) { }

    @Post('searchParticipantType')
    @Header('content-type', 'application/json')
    @ApiOperation({ summary: 'Function to Return Participant Type By Fair' })
    @ApiResponse({
        status: 200,
        description: "Return Exhibitor Participant Type",
        type: ParticipantTypeByFairListDto,
        schema: { example: ParticipantTypeByFairListDto },
    })
    // @ApiResponse({   
    //     status: 400,
    //     description: "Validation Error",
    //     type: ValidationErrorResponseDto,
    //     schema: { example: ValidationErrorResponseDto },
    // })
    public async searchParticipantType(@Body() query: ParticipantTypeSearchDto) {
        return this.profileService.searchParticipantType(query);
    }

    @Post('searchParticipantTypeByFairDetails')
    @Header('content-type', 'application/json')
    @ApiOperation({ summary: 'Function to Return Participant Type By Fair' })
    @ApiResponse({
        status: 200,
        description: "Return Exhibitor Participant Type",
        type: ParticipantTypeByFairListDto,
        schema: { example: ParticipantTypeByFairListDto },
    })
    // @ApiResponse({   
    //     status: 400,
    //     description: "Validation Error",
    //     type: ValidationErrorResponseDto,
    //     schema: { example: ValidationErrorResponseDto },
    // })
    public async searchParticipantTypeByFairDetails(@Body() query: ParticipantTypeByFairDetailSearchDto) {
        return this.profileService.searchParticipantTypeByFairDetails(query);
    }

    @Put('c2mUpdate/:fairCode')
    @UseInterceptors(ResponseInterceptor)
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @ApiOperation({ summary: 'Function for c2m update buyer profile' })
    @ApiResponse({
        status: 200,
        description: "Return Update Result",
        type: UpdateResultDto,
        schema: { example: UpdateResultDto },
    })
    public async updateC2MProfile(@SSOUserDecorator() ssoUser: SSOUserHeadersDto, @Param('fairCode') fairCode: string, @Body() updateReq: UpdateC2MProfileReqDto) {
        return this.profileService.updateC2MProfile(ssoUser, fairCode, updateReq);
    }

    @Post('updateFairParticipantRegistrationRecord')
    @UseInterceptors(ResponseInterceptor)
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @ApiOperation({ summary: 'Function to Update Fair Registration' })
    @ApiResponse({
        status: 200,
        description: "Return Update Result",
        type: UpdateResultDto,
        schema: { example: UpdateResultDto },
    })
    public async updateFairParticipantRegistrationRecord(@SSOUserDecorator() ssoUser: SSOUserHeadersDto, @Body() query: UpdateFairParticipantRegistrationRecordDto) {
        return this.profileService.updateFairParticipantRegistrationRecord(ssoUser, query);
    }

    @Post('/shortFairRegistrations')
    @UseInterceptors(ResponseInterceptor)
    public getShortRegistration(@Body() query: ParticipantRegistrationBySsouidsDto) {
      return this.profileService.getShortRegistration(query)
    }

    @Post('/fairRegistrations')
    @UseInterceptors(ResponseInterceptor)
    public getParticipantRegistrationDetail(@Body() query: ParticipantRegistrationBySsouidsDto) {
      let result = this.profileService.getParticipantRegistrationDetails(query)
      
      return result;
    }

    @Get('combinedFairList')
    @UseInterceptors(ResponseInterceptor)
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @ApiOperation({ summary: 'Get list of combined fair name, for user\'s registered record' })
    @ApiResponse({
        status: 200,
        description: "Return Update Result",
        type: [GetCombinedFairListRespDto],
        schema: { example: [GetCombinedFairListRespDto] },
    })
    public async getCombineFairList(@SSOUserDecorator() ssoUser: SSOUserHeadersDto): Promise<GetCombinedFairListRespDto[]> {
        return this.profileService.getCombinedFairList(ssoUser);
    }

    @Get('combinedFairData')
    @UseInterceptors(ResponseInterceptor)
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @ApiOperation({ summary: 'Get list of combined fair name, for user\'s registered record' })
    @ApiResponse({
        status: 200,
        description: "Return Update Result",
        type: GetCombinedFairListRespDto,
        schema: { example: GetCombinedFairListRespDto },
    })
    public async retrieveCombinedFairData(@SSOUserDecorator() ssoUser: SSOUserHeadersDto, @Query() query: ProfileForEditReqByFairCodeDto): Promise<CombinedFairFormDataRespDto> {
        return this.profileService.retrieveCombinedFairData(ssoUser.ssoUid, query);
    }

    @Get('formData')
    @UseInterceptors(ResponseInterceptor)
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @ApiOperation({ summary: 'Get Profile, return as form data json according to fairCode, lang and fair participant type' })
    @ApiResponse({
        status: 200,
        description: "Return Form Data Json with slug",
        type: ProfileForEditRespDto,
        schema: { example: ProfileForEditRespDto },
    })
    public async retrieveProfileForFrontEnd(@SSOUserDecorator() ssoUser: SSOUserHeadersDto, @Query() query: ProfileForEditReqByFairCodeDto): Promise<ProfileForEditRespDto> {
        return this.profileService.retrieveProfileForFrontEnd(ssoUser.ssoUid, query);
    }

    @Put('formData')
    @UseInterceptors(ResponseInterceptor)
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @ApiOperation({ summary: 'Get Profile, return as form data json according to fairCode, lang and fair participant type' })
    @ApiResponse({
        status: 200,
        description: "Return Form Data Json with slug",
        type: ProfileForEditRespDto,
        schema: { example: ProfileForEditRespDto },
    })
    public async updateProfileByFormData(@SSOUserDecorator() ssoUser: SSOUserHeadersDto, @Body() updateReq: UpdateProfileFrontendReqDto): Promise<UpdateProfileFrontendRespDto> {
        return this.profileService.updateProfileByFormData(ssoUser.ssoUid, updateReq);
    }

    @Get('presignedUrl')
    @UseInterceptors(ResponseInterceptor)
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @ApiOperation({ summary: 'Get presigned url per user' })
    @ApiResponse({
        status: 200,
        description: "Return Form Data Json with slug",
        type: ProfileForEditRespDto,
        schema: { example: ProfileForEditRespDto },
    })
    public async getPresignedUrlPerUser(@SSOUserDecorator() ssoUser: SSOUserHeadersDto, @Query() query: GetPresignedUrlPerUserReqDto): Promise<GetUploadFilePresignedUrlRespDto> {
        return this.profileService.getPresignedUrlPerUser(ssoUser.ssoUid, query);
    }

    
    @Get('buyerDetailsForExhibitor')
    @UseInterceptors(ResponseInterceptor)
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @ApiOperation({ summary: 'Get buyer details for exhibitor' })
    @ApiResponse({
        status: 200,
        description: "Return Update Result",
        type: GetBuyerDetailsForExhbrRespDto,
        schema: { example: GetBuyerDetailsForExhbrRespDto },
    })
    public async getBuyerDetailsForExhibitor(@SSOUserDecorator() exhibitorSsoUser: SSOUserHeadersDto, @Query() request: GetBuyerDetailsForExhbrReqDto): Promise<GetBuyerDetailsForExhbrRespDto> {
        return this.profileService.getBuyerDetailsForExhibitor(exhibitorSsoUser, request);
    }

    @Get('c2mQuestionInput')
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @UseInterceptors(ResponseInterceptor)
    public async getC2MQuestionInput(@SSOUserDecorator() ssoUser: SSOUserHeadersDto, @Query() query: ProfileForEditReqByFairCodeDto): Promise<GetC2MQuestionInputRespDto> {
        return this.profileService.getC2MQuestionInput(ssoUser.ssoUid, query);
    }

    @Get('formProductInterestOptions')
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @UseInterceptors(ResponseInterceptor)
    public async getFormProductInterestOptions(@SSOUserDecorator() ssoUser: SSOUserHeadersDto, @Query() query: ProfileForEditReqByFairCodeDto): Promise<GetC2MProductInterestRespDto> {
        return this.profileService.getFormProductInterestOptions(ssoUser.ssoUid, query);
    }

    @Put('updateProductInterest')
    @Header('content-type', 'application/json')
    @ApiHeader({
        name: 'x-sso-lastname',
        description: 'last name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-firstname',
        description: 'first name from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-email-id',
        description: 'emailId from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-sso-uid',
        description: 'sso uid from jwt payload (data source: sso)',
    })
    @ApiHeader({
        name: 'x-access-token',
        description: 'access token from jwt payload (data source: sso)',
    })
    @UseInterceptors(ResponseInterceptor)
    public async updateProductInterestPerFair(@SSOUserDecorator() ssoUser: SSOUserHeadersDto, @Body() body: UpdateProductInterestPerFairReqDto): Promise<any> {
        return this.profileService.updateProductInterestPerFair(ssoUser.ssoUid, body);
    }

    @HttpCode(200)
    @Get('/internal/fair/participants/:ssoUid')
    public getFairParticipantInflencingDetail(@Param('ssoUid') ssoUid: string, @Query() query: FairParticipantInflencingReqDto) {
      let result = this.profileService.getFairParticipantInflencingDetail(ssoUid, query)
      
      return result;
    }

    @HttpCode(200)
    @Put('/internal/fair/participants/:ssoUid/emailId/:emailId/link')
    public linkFairParticipantSsoUidByEmailId(@Param('ssoUid') ssoUid: string, @Param('emailId') emailId: string) {
        let result = this.profileService.linkFairParticipantSsoUidByEmailId(ssoUid, emailId);
        
        return result;
    }

    @Get('c2m-excluded-participants')
    public searchC2mExcludedParticipants(@Query() query: SearchC2mExcludedParticipantDto) {
        return this.profileService.searchC2mExcludedParticipants(query);
    }

    @Get('getFairParticipantsProfileWithCombinedFair')
    public async getFairParticipantsProfileWithCombinedFair(@Auth('SSOUID') ssoUid: string, @Query() query: Record<string, any>, ) {
        const { fairCode, language, timezone } = query;
        return await this.fairDbService.getFairParticipantsProfileWithCombinedFair({ ssoUid, fairCode, language, timezone});
    }
}

@ApiHeader({
    name: 'x-request-id',
    description: 'The Request ID for tracking is provided by API consumer',
})
@ApiTags('AdminProfile')
@Controller('admin/v1/profile')
export class ProfileAdminController {
    constructor(
        private profileService: ProfileService
    ) {
    }

    @Get('formData/:registrationRecordId')
    @UseInterceptors(ResponseInterceptor)
    @UseInterceptors(AdminJwtInterceptor)
    public async retrieveProfileForBackendEdit(@AdminUserDecorator() adminUser: AdminUserDto, @Param('registrationRecordId') registrationRecordId: number): Promise<ProfileForBackendEditRespDto> {
        return this.profileService.retrieveProfileForBackendEdit(adminUser, registrationRecordId);
    }

    @Put('formData/:registrationRecordId')
    @UseInterceptors(ResponseInterceptor)
    @UseInterceptors(AdminJwtInterceptor)
    public async adminUpdateProfileByFormData(@AdminUserDecorator() adminUser: AdminUserDto, @Param('registrationRecordId') registrationRecordId: number, @Body() updateReq: UpdateProfileBackendReqDto): Promise<AdminEditProfileResp> {
        return this.profileService.adminUpdateProfileByFormData(adminUser, registrationRecordId, updateReq);
    }

    @Get('presignedUrl/:registrationRecordId')
    @UseInterceptors(ResponseInterceptor)
    @UseInterceptors(AdminJwtInterceptor)
    public async adminGetPresignedUrlPerUser(@AdminUserDecorator() adminUser: AdminUserDto, @Param('registrationRecordId') registrationRecordId: number, @Query() query: AdminGetPresignedUrlPerUserReqDto): Promise<GetUploadFilePresignedUrlRespDto> {
        return this.profileService.adminGetPresignedUrlPerUser(adminUser, registrationRecordId, query);
    }
}
