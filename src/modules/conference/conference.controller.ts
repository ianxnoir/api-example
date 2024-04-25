import { Body, Controller, Get, Header, Param, Post, Put, Query, UseInterceptors } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GetCountryListResDto, GetCustomQuestionsReqDto, GetCustomQuestionsResDto } from './dto/getCustomQuestions.dto';
import { SbeEndpointRequestDto } from '../../dto/sbeEndpointRequest.dto';
import { SearchConfParticipantsReqDto, SearchConfParticipantsResDto } from './dto/searchConferenceParticipants.dto';
import { ContentService } from '../api/content/content.service';
import { ConferenceService } from './conference.service';
import { GetConfParticipantReqDto, GetConfParticipantResDto } from './dto/getConferenceParticipant.dto';
import { ConfSeminarDetails, ConfSeminarDetailsV2, FilterSeminarReq } from './conference.type';
import { ParticipantTypeByFairListDto } from './dto/ParticipantTypeByFairList.dto';
import { ParticipantTypeSearchDto } from './dto/ParticipantTypeSearch.dto';
import { Auth } from '../../decorators/auth.decorator';
import { GetSeminarRegistrationsReqDto, GetSeminarRegistrationsResDto } from './dto/getSeminarRegistrations.dto';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { AdminUserDecorator } from '../../core/decorator/adminUser.decorator';
import { AdminJwtInterceptor } from '../../core/interceptors/adminJwt.interceptor';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { ConferenceC2MParticipantStatusListDto } from './dto/updateConferenceCToMParticipantStatus.dto';
import { ParticipantTicketPassNoteReqDto } from './dto/updateParticipantTicketPassNote.dto';
import { EventDetail } from '../seminar/seminar.type';
import { GetSeminarV2Response, GetSeminarsV2Dto } from './dto/getSeminarsOptimised.dto';
import { GetOneSeminarEventDetailResponse } from './dto/getOneSeminarEventDetail.dto';
import { UpdateSeminarRegistrationReqDto, UpdateSeminarRegistrationResDto } from './dto/updateSeminarRegistration.dto';
import { JoinSeminarRequestDto } from './dto/joinSeminarRequest.dto';
import { CheckSeminarIsEndedResDto } from './dto/checkSeminarIsEnded';
import { FairService } from '../fair/fair.service';
import { GetFairTicketPassResDto } from './dto/getFairTicketPass.dto';


@Controller(['/conference', '/admin/v1/fair/conference'])
export class ConferenceController {
  constructor(
    private conferenceService: ConferenceService,
    // private conferenceFallbackService: ConferenceFallbackService,
    private contentService: ContentService,
    private fairService: FairService,
  ) { }

  @Get('fair/:code')
  public async checkFairType(@Param('code') fairCode: string) {
    try {
      const fair = await this.fairService.getWordpressSettings(fairCode);
      if (fair?.data?.data?.website_type) return fair.data.data.website_type
    }
    catch (e) {
      // not found
    }
    return 'tradeshow'
  }

  //NOTE: merge later - originally from starSpeaker.controller
  @Get('speakers')
  public async getAllSpeakers(@Query() sbeParams: SbeEndpointRequestDto & { queryMode?: string }): Promise<Record<string, any>> {
    return {
      data: (await this.conferenceService.getAll(sbeParams))?.starSpeakersData || [],
    };
  }

  //NOTE: should not use this one anymore
  @Post('programme')
  public async filterSeminar(@Body() body: FilterSeminarReq): Promise<{ data: ConfSeminarDetails[] }> {
    /*     const { sbeParams, criteria } = body */

    return {
      data: [] /* await this.conferenceService.findAll(sbeParams, criteria) */
    };
  }

  @ApiOperation({ summary: "Get the seminar list for conference programme page" })
  @ApiResponse({
    status: 200,
    description: "return the seminar list result",
    type: GetSeminarV2Response,
    schema: { example: GetSeminarV2Response }
  })
  @Post('programme/v2')
  public async filterSeminarV2(@Body() body: GetSeminarsV2Dto): Promise<{ data: ConfSeminarDetailsV2[] }> {
    const { sbeParams, criteria, optionalInfo } = body

    return {
      data: await this.conferenceService.findAllV2(sbeParams, criteria, optionalInfo)
    };
  }

  @ApiOperation({ summary: "Get the seminar list for conference programme page" })
  @ApiResponse({
    status: 200,
    description: "return the seminar list result",
    type: GetSeminarV2Response,
    schema: { example: GetSeminarV2Response }
  })
  @Post('programme/v3')
  public async filterSeminarV3(@Body() body: GetSeminarsV2Dto): Promise<{ data: ConfSeminarDetailsV2[] }> {
    const { sbeParams, criteria, optionalInfo = {} } = body

    return {
      data: await this.conferenceService.findAllV3(sbeParams, criteria, optionalInfo)
    };
  }

  @ApiOperation({ summary: 'Function to get custom questions by fair' })
  @ApiResponse({
    status: 200,
    description: 'custom questions returned',
    type: GetCustomQuestionsResDto,
    schema: { example: GetCustomQuestionsResDto },
  })
  @Post('customQuestions')
  public async getCustomQuestions(@Body() body: GetCustomQuestionsReqDto): Promise<GetCustomQuestionsResDto> {
    const { sql, params, questions } = await this.conferenceService.getCustomQuestions(body)
    return {
      sql,
      params,
      data: { questions }
    }
  }

  @ApiOperation({ summary: 'Function to search conference participants with criteria' })
  @ApiResponse({
    status: 200,
    description: 'participants returned',
    type: SearchConfParticipantsResDto
  })
  @Post('participants')
  public async searchParticipants(@Body() body: SearchConfParticipantsReqDto): Promise<SearchConfParticipantsResDto> {
    const { keyword, from, size, ...params } = body;
    let isSensitiveKeywords = await this.contentService.isSensitiveKeywordsForFindParticipants(keyword);
    if (isSensitiveKeywords) {
      return {
        sql: '',
        params: '',
        data: {
          from,
          size,
          total_size: 0,
          participants: [],
          sensitiveKeyword: true
        }
      };
    }
    const { sql, params: params_, ...result } = await this.conferenceService.getParticipants({ from, size, keyword, ...params })
    return {
      sql,
      params: params_,
      data: result,
    }
  }

  @ApiOperation({ summary: 'Function to cet conference participant by ID' })
  @ApiResponse({
    status: 200,
    description: 'the requested participant\'s detail',
    type: GetConfParticipantResDto
  })
  @Post('participant')
  public async getParticipant(@Auth('SSOUID') ssoUid: string, @Body() body: GetConfParticipantReqDto): Promise<GetConfParticipantResDto> {
    const { sql, params, participant } = await this.conferenceService.getParticipant({ ...body, ssoUid })
    return {
      sql,
      params,
      data: { participant }
    }
  }

  @ApiOperation({ summary: 'Function to cet country list' })
  @ApiResponse({
    status: 200,
    description: 'country list returned',
    type: GetCountryListResDto,
  })
  @Get('countryList/:lang')
  public async getCountryList(@Param('lang') lang: 'en'|'tc'|'sc'): Promise<GetCountryListResDto> {
    const { code } = await this.contentService.retrieveRawJson('COUNTRY')
    const data = Object.keys(code).map(k => code[k])
      .sort((l, r) => {
        let lv: string = l[lang];
        let rv: string = r[lang];
        if (lv === 'Mainland China') lv = 'China'
        if (rv === 'Mainland China') rv = 'China'
        return lv.localeCompare(rv);
      })
    return {
      data: {
        countries: data.map(({ code, [lang]: value }) => ({ code, value }))
      }
    }
  }

  @Post('profile/searchParticipantType')
  @Header('content-type', 'application/json')
  @ApiOperation({ summary: 'Function to Return Participant Type By Fair' })
  @ApiResponse({
    status: 200,
    description: "Return Exhibitor Participant Type",
    type: ParticipantTypeByFairListDto,
    schema: { example: ParticipantTypeByFairListDto },
  })
  public async searchParticipantType(@Body() query: ParticipantTypeSearchDto) {
    return this.conferenceService.searchParticipantType(query);
  }

  @ApiOperation({ summary: 'Function to get user\'s seminar registrations' })
  @ApiResponse({
    status: 200,
    description: 'seminar registrations returned',
    type: GetSeminarRegistrationsResDto,
    schema: { example: GetSeminarRegistrationsResDto },
  })
  @Post('getSeminarRegistrations')
  public async getSeminarRegistrations(@Auth('SSOUID') ssoUid: string, @Body() { fairCode, year }: GetSeminarRegistrationsReqDto) {
    const result = await this.conferenceService.getSeminarRegistrations(ssoUid, fairCode, year);

    const playbackRegistrations = result.data.filter(sr => sr.seminarRegistrationType === 'Playback');

    if (playbackRegistrations.length) {
      const ticketPassService = await this.conferenceService.getTicketPassService(ssoUid)

      if (ticketPassService) {
        for (const playbackRegistration of playbackRegistrations) {
          playbackRegistration.effectiveStartTime = ticketPassService.effectiveStartTime
          playbackRegistration.effectiveEndTime = ticketPassService.effectiveEndTime
        }
      }
    }

    return result
  }

  @ApiOperation({ summary: 'Function to update seminar registration\'s watchNowStatus or playBackStatus' })
  @ApiResponse({
      status: 200,
      description: "Return success or fail",
      type: UpdateSeminarRegistrationResDto,
      schema: { example: UpdateSeminarRegistrationResDto },
  })
  @Post('updateSeminarRegistration')
  public async updateSeminarRegistration(@Auth('SSOUID') ssoUid: string, @Body() { fairCode, year, seminarRegistrationId, type }: UpdateSeminarRegistrationReqDto) {
    return await this.conferenceService.updateSeminarRegistration(ssoUid, type, fairCode, year, seminarRegistrationId);
  }

  @ApiOperation({ summary: 'Get fair ticket pass' })
  @ApiResponse({
      status: 200,
      description: "return fair ticket pass",
      type: GetFairTicketPassResDto,
      schema: { example: GetFairTicketPassResDto },
  })
  @Get('/fairTicketPass')
  public async getFairTicketPass(@Query('fairCode') fairCode: string, @Query('projectYear') projectYear: string) {
    return this.conferenceService.getFairTicketPass(fairCode, projectYear);
  }

  @Put('/updateParticipant/:id')
  @UseInterceptors(ResponseInterceptor)
  @UseInterceptors(AdminJwtInterceptor)
  @ApiOperation({ summary: 'update ticket pass and remark of participant by Id' })
  public async updateParticipantTicketandNoteById(@AdminUserDecorator() adminUser: AdminUserDto, @Param('id') id: number, @Body() data: ParticipantTicketPassNoteReqDto) {
    return await this.conferenceService.updateParticipantTicketandNoteById(adminUser, id, data)
  }

  @Put('/c2m-participant-statusV2')
  @UseInterceptors(ResponseInterceptor)
  @UseInterceptors(AdminJwtInterceptor)
  @ApiOperation({ summary: 'Update the c2m participant status by List (ParticipantList Batch2)' })
  public async updateCToMParticipantStatusListV2(@AdminUserDecorator() adminUser: AdminUserDto, @Body() c2MParticipantStatusListDto: ConferenceC2MParticipantStatusListDto) {
    return await this.conferenceService.updateCToMParticipantStatusListV2(adminUser, c2MParticipantStatusListDto)
  }

  @ApiOperation({ summary: "Get the seminar event detail by seminar id" })
  @ApiResponse({
    status: 200, type: GetOneSeminarEventDetailResponse,
    schema: { example: GetOneSeminarEventDetailResponse },
  })
  @Get(':sbeSeminarId/eventDetail')
  public async findConfOneSeminarEventDetail(@Param('sbeSeminarId') sbeSeminarId: string): Promise<Record<string, EventDetail>> {
    const seminar = await this.conferenceService.findOneSeminarEvent({ sbeSeminarId });
    return {
      data: seminar.convert(),
    };
  }

  @Get(':sbeSeminarId/ended')
  @ApiOperation({ summary: "Check whether the seminar is ended" })
  @ApiResponse({
    status: 200,
    type: CheckSeminarIsEndedResDto || null,
    schema: { example: CheckSeminarIsEndedResDto },
  })
  public async checkSeminarIsEnded(@Param('sbeSeminarId') sbeSeminarId: string) {
    return {
      data: await this.conferenceService.checkSeminarIsEnded(sbeSeminarId)
    };
  }

  @Get(':sbeSeminarId')
  @ApiOperation({ summary: "Get the specific seminar event" })
  @ApiResponse({
    status: 200,
    type: GetOneSeminarEventDetailResponse || null,
    schema: { example: GetOneSeminarEventDetailResponse },
  })
  public async findOneSeminar(@Param('sbeSeminarId') sbeSeminarId: string, @Query() sbeParams: SbeEndpointRequestDto): Promise<Record<string, any>> {
    return {
      data: await this.conferenceService.findOneSeminar(sbeSeminarId, sbeParams),
    };
  }

  @Get(':sbeSeminarId/v2')
  @ApiOperation({ summary: "Get the specific seminar event" })
  @ApiResponse({
    status: 200,
    type: GetOneSeminarEventDetailResponse || null,
    schema: { example: GetOneSeminarEventDetailResponse },
  })
  public async findOneSeminarV2(@Param('sbeSeminarId') sbeSeminarId: string, @Query() sbeParams: SbeEndpointRequestDto): Promise<Record<string, any>> {
    return {
      data: await this.conferenceService.findOneSeminarV2(sbeSeminarId, sbeParams),
    };
  }

  @Post('ws/joinConfSeminar')
  public async joinConfSeminar(@Body() body: JoinSeminarRequestDto): Promise<Record<string, any>> {
    const { connectionId, payload } = body;
    const { fairCode, sbeSeminarId } = payload;
    return this.conferenceService.joinConfSeminar(connectionId, fairCode, sbeSeminarId);
  }
  
}
