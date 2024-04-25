import { Body, Controller, Delete, Get, Param, Post, Query, UseInterceptors} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AdminJwtInterceptor } from '../../core/interceptors/adminJwt.interceptor';
import { Logger } from '../../core/utils';

import { Auth } from '../../decorators/auth.decorator';
import { FindRatingRequestDto } from '../../dto/findRatingRequest.dto';
import { JoinSeminarRequestDto } from '../../dto/joinSeminarRequest.dto';
import { SbeEndpointRequestDto } from '../../dto/sbeEndpointRequest.dto';
import { SeminarRegistrationCommonDto, SeminarRegistrationForSeminarsDto, SeminarsRegistrationDto, VEPSeminarRegistrationDto } from '../../dto/seminarRegistration.dto';
import { UpdateSeminarRequestDto } from '../../dto/seminarRequest.dto';
import { UpsertRatingRequestDto } from '../../dto/upsertRatingSeminarRequest.dto';
import { Rating as RatingEntity } from '../../entities/rating.entity';
import { C2MService } from '../api/c2m/content.service';
import { RegisterEvent } from '../api/sbe/sbe.type';
import { FairService } from '../fair/fair.service';
import { StarSpeakerService } from '../starSpeaker/starSpeaker.service';
import { StarSpeakersAndSeminars } from '../starSpeaker/starSpeaker.type';

import { SeminarService } from './seminar.service';
import { EventDetail, RegisteredSeminar, RegisteredSeminarByUser, RegisteredSeminarByUserAndTimeRange, Seminar, SeminarDetail } from './seminar.type';

@Controller(['seminars', 'admin/v1/seminars'])
export class SeminarController {
  constructor(private logger: Logger, private seminarService: SeminarService, private starSpeakerService: StarSpeakerService, private fairService: FairService, private C2MService: C2MService,) {}

  @Get('healthCheck')
  public async healthCheck(): Promise<any> {
    return this.seminarService.healthCheck();
  }

  @Get()
  public async findAllSeminars(@Query() sbeParams: SbeEndpointRequestDto): Promise<Record<string, any>> {
    return {
      status: 200,
      data: await this.seminarService.findAll(sbeParams),
    };
  }

  @Post('/insertSBEDataToTable')
  public async insertSBEDataToTable(@Body() sbeParams: SbeEndpointRequestDto): Promise<Record<string, any>> {
    return  this.seminarService.insertSBEDataToTable(sbeParams);
  }

  @Post()
  public async updateSeminarEventDetail(@Auth('SSOUID') ssouid: string, @Body() updateSeminarDto: UpdateSeminarRequestDto): Promise<Record<string, any>> {
    return {
      status: 200,
      data: await this.seminarService.update(ssouid, updateSeminarDto),
    };
  }

  @Post('/countRegisteredSeminarsByUserAndTimeRange')
  public async countRegisteredSeminarsByUserAndTimeRange(@Body() body: RegisteredSeminarByUserAndTimeRange): Promise<any> {
    return this.seminarService.countRegisteredSeminarsByUserAndTimeRange(body.userId, body.secondUserId, body.responderUserId, body.fairCode, body.startTime, body.endTime, body.flagFromVideoMeeting);
  }

  @Get('ratings')
  public async findRatings(@Query() findRatingsDto: FindRatingRequestDto): Promise<Record<string, RatingEntity[]>> {
    const { sbeSeminarId } = findRatingsDto;
    return {
      data: await this.seminarService.findRatings(sbeSeminarId),
    };
  }

  @Get('rating')
  public async findSelfRating(@Auth('SSOUID') ssouid: string, @Query() findOneRatingDto: FindRatingRequestDto): Promise<Record<string, RatingEntity>> {
    const { sbeSeminarId } = findOneRatingDto;
    return {
      data: await this.seminarService.findOneRating(sbeSeminarId, ssouid),
    };
  }

  @Post('rating')
  public async upsertRating(@Auth('SSOUID') ssouid: string, @Body() upsertRatingDto: UpsertRatingRequestDto): Promise<Record<string, RatingEntity>> {
    return {
      data: await this.seminarService.upsertRating(ssouid, upsertRatingDto),
    };
  }

  @Get('live')
  public getLiveSeminars(@Query() query: any): Record<string, any> {
    const lives: Seminar[] = this.seminarService.getLive(query);

    return {
      timestamp: new Date(1504095567183).toISOString(),
      status: 200,
      data: lives,
      from: 0,
      size: lives.length,
      total_size: lives.length,
    };
  }

  @Get('starSpeakersAndSeminars')
  public async getStarSpeakersAndSeminars(@Query() sbeParams: SbeEndpointRequestDto): Promise<Record<string, StarSpeakersAndSeminars>> {
    const { starSpeakersData, seminarsData } = await this.starSpeakerService.getAll(sbeParams, true);

    return {
      data: {
        starSpeakersData,
        seminarsData,
      },
    };
  }

  @Get(':sbeSeminarId/eventDetail')
  public async findOne(@Param('sbeSeminarId') sbeSeminarId: string): Promise<Record<string, EventDetail>> {
    const seminar = await this.seminarService.findOne({ sbeSeminarId });
    return {
      data: seminar.convert(),
    };
  }

  @Post('join')
  public async wsJoinRoom(@Body() body: JoinSeminarRequestDto): Promise<Record<string, any>> {
    const { connectionId, payload } = body;
    const { ssoUid, sbeSeminarId } = payload;
    return {
      data: await this.seminarService.joinSeminar(connectionId, sbeSeminarId, ssoUid),
    };
  }

  @Post('getAllCache')
  public async getAllCache(): Promise<any> {
    return {
      data: await this.seminarService.getAllCache(),
    };
  }

  @Post('joinSeminarCache')
  public async joinSeminarCache(@Body() body: JoinSeminarRequestDto): Promise<Record<string, any>> {
    const { connectionId, payload } = body;
    const { ssoUid, sbeSeminarId, isPublic } = payload;
    if (isPublic) {
      return this.seminarService.joinSeminarCachePublic(connectionId, sbeSeminarId);
    }
    return this.seminarService.joinSeminarCache(connectionId, sbeSeminarId, ssoUid);
  }

  @Post('clearAllCacheByPattern')
  public async clearAllCacheByPattern(@Body() body: {keyPattern: string}): Promise<Record<string, any>> {
    return this.seminarService.clearAllCacheByPattern(body.keyPattern);
  }

  @Delete(':sbeSeminarId')
  public async wsEndRoom(@Param('sbeSeminarId') sbeSeminarId: string, @Body('isPublic') isPublic: boolean): Promise<Record<string, any>> {
    return {
      status: 200,
      data: await this.seminarService.endSeminar(sbeSeminarId, isPublic),
    };
  }

  @Post('checkMultiLogin')
  public async wsCheckMultiLogin(@Body() body: any): Promise<Record<string, any>> {
    const { payload } = body;
    const { ssoUid, sbeSeminarId, userUuid } = payload;
    return {
      status: 200,
      data: await this.seminarService.checkMultiLogin(sbeSeminarId, ssoUid, userUuid),
    };
  }

  @ApiOperation({ summary: 'Seminar Event Registration in VEP DB' })
  @ApiResponse({
    status: 200,
    description: 'Seminar Event Registration Success in VEP DB',
    schema: {
      example: {
        status: 200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Fail to register the event in VEP DB',
  })
  @ApiResponse({
    status: 500,
    description: 'System error',
  })
  @Post('/saveSeminarRegistrationRecord')
  public async saveSeminarRegistrationRecord(@Body('data') body: VEPSeminarRegistrationDto[]): Promise<Record<string, any>> {
    return this.seminarService.postSeminarRegistrationRecord(body);
  }

  @ApiOperation({ summary: 'Seminar Event Registration' })
  @ApiResponse({
    status: 200,
    description: 'Seminar Event Registration Success',
    schema: {
      example: {
        status: 200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Fail to register the event',
  })
  @ApiResponse({
    status: 500,
    description: 'System error',
  })
  @Post('/eventRegistration')
  public async eventRegistration(@Body() body: SeminarRegistrationCommonDto): Promise<any> {
    // 1. get buyer record from fair DB
    const buyerRecord = await this.seminarService.getFairRegistrationInfo(body.userData);
    this.logger.log(`Cannot find any buyer info, result:${buyerRecord ?? ''}`);

    const postRegisterEventsPromise: Promise<any>[] = [];
    
    if(!buyerRecord.length){
      this.logger.log(`Cannot find any buyer info, result:${buyerRecord ?? ''}`);
      body.userData.forEach(async (emptyProfile: any) => {
        const notRegisterFairBuyer = this.seminarService.postRegisterEvents({
          companyName: "",
          countryCode: "",
          email: "",
          eventId: body.eventId,
          firstName: "",
          lastName: "",
          language: 'en',
          registrationNo: emptyProfile.registrationNo, //
          title: '',
          systemCode: body.systemCode,
          salutation: "",
        } as RegisterEvent);
        postRegisterEventsPromise.push(notRegisterFairBuyer);
      });
   }else{

      buyerRecord.forEach(async (profile: any) => {
        const registrationNo = `${profile.serialNumber}${profile.projectYear.substring(2)}${profile.sourceTypeCode}${profile.visitorTypeCode}${profile.projectNumber}`;
        const promiseFunc = this.seminarService.getBuyerProfilePreferredLanguage(profile).then((language) => {
          return this.seminarService.postRegisterEvents({
            companyName: profile.companyName ?? '',
            countryCode: profile.addressCountryCode ?? '',
            email: profile.fairParticipant.emailId,
            eventId: body.eventId,
            firstName: profile.firstName ?? '',
            lastName: profile.lastName ?? '',
            language: language ?? '',
            registrationNo: registrationNo ?? '', //
            title: profile.position ?? '',
            systemCode: body.systemCode,
            salutation: profile.title ?? '',
          } as RegisterEvent);
        });
        postRegisterEventsPromise.push(promiseFunc);
      });

    }

    return Promise.allSettled(postRegisterEventsPromise)
      .then((result) => {
        const successRecords: any = [];
        const failRecords: any = [];
        result.forEach((res) => {
          // check sbe response status, ex: res.value.status === 200 ?
          if (res.status === 'fulfilled' && res.value.status === 200) {
            successRecords.push(res.value);
          } else if (res.status === 'fulfilled' && res.value.status !== 200) {
            failRecords.push(res.value);
          } else if (res.status === 'rejected') {
            failRecords.push(res.reason.response.data);
          } else {
            failRecords.push(res);
          }
        });

        if (failRecords?.length) {
          this.logger.log(`Received failed event registration record(s), result:${failRecords}`);
        }

        return {
          status: 200,
          successRecords,
          failRecords,
        };
      })
      .catch((err) => {
        this.logger.error(`Cannot post event registration to SBE, result:${JSON.stringify(err)}`);
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

  @ApiOperation({ summary: 'Seminar Registration' })
  @ApiResponse({
    status: 200,
    description: 'Seminar Registration Success',
    schema: {
      example: {
        status: 200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Fail to register the seminar',
  })
  @ApiResponse({
    status: 500,
    description: 'System error',
  })
  @Post('/seminarRegistration')
  public async seminarRegistration(@Body() body: SeminarRegistrationForSeminarsDto): Promise<any> {
    this.logger.log(JSON.stringify({ section: '1st line', action: 'seminarRegistration', step: '1', detail:  `input: ${JSON.stringify(body)}` }));
    const buyerRecord = await this.seminarService.getFairRegistrationInfo(body.userData);

    let seminarRegister: any[] = [];
    if(!body?.seminarReg?.length){ //SNS flow
        seminarRegister = await this.seminarService.getSeminarRegistrationAns(body.userData[0].userId, body.seminarId)
    }else{
        seminarRegister = body.seminarReg
    }
    const postRegisterSeminarPromise: Promise<any>[] = [];
    if (!buyerRecord?.length){
      this.logger.log(`Cannot find any buyer info, result:${buyerRecord ?? ''}`);
      body.userData.forEach(async (emptyProfile:any)=>{
        const notRegisterFairBuyer = this.seminarService.postRegisterSeminar({
          eventId: body.eventId,
          language: body.language ?? 'en',
          registrationNo: emptyProfile.registrationNo,
          seminarReg: seminarRegister,
          paymentSession: '',
          shouldSendConfirmationEmail: '0', //if "1", SBE system will send the confirmation email after seminar registration success
          systemCode: body.systemCode,
        } as SeminarsRegistrationDto);
        postRegisterSeminarPromise.push(notRegisterFairBuyer);
      })
    }else{
      buyerRecord.forEach(async (profile: any) => {
        const registrationNo = `${profile.serialNumber}${profile.projectYear.substring(2)}${profile.sourceTypeCode}${profile.visitorTypeCode}${profile.projectNumber}`;
        const registeredFairBuyer = this.seminarService.getBuyerProfilePreferredLanguage(profile).then((language) => {
          return this.seminarService.postRegisterSeminar({
            eventId: body.eventId,
            language: language ?? '',
            registrationNo: registrationNo ?? '',
            seminarReg: seminarRegister,
            paymentSession: '',
            shouldSendConfirmationEmail: '0', //if "1", SBE system will send the confirmation email after seminar registration success
            systemCode: body.systemCode,
          } as SeminarsRegistrationDto);
        });
        postRegisterSeminarPromise.push(registeredFairBuyer);
      });
    };

    return Promise.allSettled(postRegisterSeminarPromise)
      .then((result) => {
        this.logger.log(JSON.stringify({ section: 'postRegisterSeminarPromise', action: 'seminarRegistration', step: '2', detail:  `result: ${JSON.stringify(result)}` }));
        const successRecords: any = [];
        const failRecords: any = [];

        result.forEach((res) => {
          // check sbe response status, ex: res.value.status === 200 ?
          if (res.status === 'fulfilled' && res.value.status === 200) {
            successRecords.push(res.value);
          } else if (res.status === 'fulfilled' && res.value.status !== 200) {
            failRecords.push(res.value);
          } else if (res.status === 'rejected') {
            failRecords.push(res.reason.response.data);
          }else{
            failRecords.push(res)
          }
        });

        if (failRecords?.length) {
          this.logger.log(`Received failed seminar registration record(s), result:${failRecords}`);
        }

        return Promise.all([successRecords, failRecords])
      })
      .then(([successRecords, failRecords]) => {

        // notification
        this.logger.log(JSON.stringify({ section: 'notification', action: 'seminarRegistration', step: '3', detail:  `successRecords: ${JSON.stringify(successRecords)}` }));
        if (successRecords?.length) {
          const userId = body?.userData[0]?.userId;
          const fairCode = body?.userData[0]?.fairCode;
          const fiscalYear = body?.userData[0]?.fiscalYear;
          const eventId = body?.eventId;
          let seminarId: any[] = [];
          if (body?.seminarReg?.length) {
            // long form
            body?.seminarReg.forEach((seminarReg: any) => {
              seminarId.push(seminarReg.seminarId);
            });
            this.logger.log(JSON.stringify({ section: 'notification - long form', action: 'seminarRegistration', step: '4', detail:  `detail: userId: ${userId}, fairCode: ${fairCode}, fiscalYear: ${fiscalYear}, eventId: ${eventId}, seminarId: ${seminarId}` }));
            seminarId?.length && this.C2MService.postSeminarRegistrationNoti({ userId, fairCode, fiscalYear, eventId, seminarId });
          } else if (body?.seminarId?.length) {
            // short form
            seminarId = body.seminarId;
            this.logger.log(JSON.stringify({ section: 'notification - short form', action: 'seminarRegistration', step: '4', detail:  `detail: userId: ${userId}, fairCode: ${fairCode}, fiscalYear: ${fiscalYear}, eventId: ${eventId}, seminarId: ${seminarId}` }));
            seminarId?.length && this.C2MService.postSeminarRegistrationNoti({ userId, fairCode, fiscalYear, eventId, seminarId });
          } else {
            this.logger.log(`Cannot receive seminarId in the body, result: ${body}`);
          }

          // seminarId?.length && this.C2MService.postSeminarRegistrationNoti({ userId, fairCode, fiscalYear, eventId, seminarId });
          // this.logger.log(JSON.stringify({ section: 'notification', action: 'seminarRegistration', step: '3', detail:  `finsih notification` }));
        }

        return Promise.all([successRecords, failRecords])
      })
      .then(([successRecords, failRecords]) => {

        return {
          status: 200,
          successRecords,
          failRecords,
        };
      })
      .catch((err) => {
        this.logger.error(`Cannot post seminar registration to SBE, result:${JSON.stringify(err)}`);
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

  @ApiOperation({ summary: 'Return Registered Seminar List' })
  @ApiResponse({
    status: 200,
    description: 'Return Registered Seminar List',
    schema: {
      example: {
        status: 200,
        data: [],
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'System error',
  })
  @Post('/getRegisterSeminar')
  public async getRegisterSeminar(
    @Auth('SSOUID') ssouid: string,
    @Body() body:RegisteredSeminar
  ): Promise<any> {

    let targetFairData: Record<string, any>[] | null;

    let combinedFairData: Record<string, any>[] = await this.fairService.getMultipleFairDatas([body.fairCode]).then((result: any) => {
      if (!result[0]?.relatedFair.length) {
        return [];
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return (
        result[0]?.relatedFair.length &&
        result[0]?.relatedFair?.flatMap((fair: any) => ({
              fairCode: fair.fair_code,
              fiscalYear: fair.fiscal_year,
              fairShortName: fair.fair_short_name?.en,
              projectNo: fair.vms_project_no,
              projectYear: fair.vms_project_year
            }))
      );
    });

    if (!body.filteredFairCode) {
      targetFairData = combinedFairData;
    } else {
      targetFairData = combinedFairData.filter((fairData: Record<string, any>) => fairData.fairCode == body.filteredFairCode)
    }

    if (!targetFairData.length) {
      return {
        meta: {},
        data: {
          status: 400,
          message: `Couldn't find any fair data`,
        },
      };
    }

    return this.seminarService
      .getSeminarRegistrationWithPagination(targetFairData, combinedFairData, ssouid, body.userRole, body.isPass, body.email, body.language, body.itemPerPage, body.pageNum, body.fairCode, body.filteredFairCode)
      .then((seminarPaginationData) => {
        return {
          status: 200,
          data: seminarPaginationData,
        };
      })
      .catch((err) => {
        this.logger.error(`Cannot get registered seminars, result:${JSON.stringify(err)}`);
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

  @Post('/getRegisteredSeminars')
  public async getRegisteredSeminars(@Auth('EMAIL_ID') email: string, @Body() body: RegisteredSeminarByUser): Promise<any> {
    return this.seminarService.getRegisteredSeminars(email, body.vmsProjectCode, body.vmsProjectYear, body.language);
  }
  @Get('/findAllSeminarsForReminder')
  public async findAllSeminarsForReminder(@Query() sbeParams: SbeEndpointRequestDto): Promise<Record<string, any>> {
    return {
      status: 200,
      data: await this.seminarService.findAllSeminarsForReminder(sbeParams),
    };
  }
  
  @Post('/admin/getRegisteredSeminarsForAdmin')
  @UseInterceptors(AdminJwtInterceptor)
  public async getRegisteredSeminarsForAdmin(@Body() body: RegisteredSeminarByUser): Promise<any> {
    return this.seminarService.getRegisteredSeminars(body.email!, body.vmsProjectCode, body.vmsProjectYear, body.language);
  }


  @Post('seminarRegistration/reportRecord')
  public getSeminarReportRecord(@Body() body: Record<string, number>): Promise<any> {
    const { page, size } = body;
    return this.seminarService.getSeminarReport(page, size);
  }

  @Post('seminarRegistration/submitSeminarReport')
  public submitSeminarReport(@Body() body: Record<string, any>): Promise<any> {
    const { fairCode, fiscalYear, seminarName, eventId, sbeSeminarId, fileName } = body;
    return this.seminarService.submitSeminarReport(fairCode, fiscalYear, seminarName, eventId, sbeSeminarId, fileName);
  }

  /*
  C2M Kick off Reminder - Meeting
  */
  @Get('/KickOffMeetingReminder')
  public KickOffMeetingReminder(): void {
    return this.C2MService.callNotiSchulerEndpoints('KickOffMeetingReminder');
  }

  /*
  C2M Kick off Reminder - Exhibitor
  */
  @Get('/exhibitorLoginReminder')
  public exhibitorLoginReminder(): void {
    return this.C2MService.callNotiSchulerEndpoints('exhibitorLoginReminder');
  }

  /*
  C2M Kick off Reminder - Buyer
  */
  @Get('/buyerLoginReminder')
  public buyerLoginReminder(): void {
    return this.C2MService.callNotiSchulerEndpoints('buyerLoginReminder');
  }

  /*
  C2M Daily Reminder - Meeting
  */
  @Get('/dailyMeetingReminder')
  public dailyMeetingReminder(): void {
    return this.C2MService.callNotiSchulerEndpoints('dailyMeetingReminder');
  }

  /*
  C2M Upcoming Reminder - Meeting
  */
  @Get('/findUpcomingMeeingsOver15Min')
  public findUpcomingMeeingsOver15Min(): void {
    return this.C2MService.callNotiSchulerEndpoints('findUpcomingMeeingsOver15Min')
  }

  /*
  Attending Seminar Reminder - Seminar
  */
  @Get('/attendingSeminarReminder')
  public attendingSeminarReminder(): void {
    return this.C2MService.callNotiSchulerEndpoints('attendingSeminarReminder');
  }

  /*
  Seminar Summary Reminder - Seminar
  */
  @Get('/seminarSummaryReminder')
  public seminarSummaryReminder(): void {
    return this.C2MService.callNotiSchulerEndpoints('seminarSummaryReminder');
  }

  /*
  No response is received - BM List
  */
  @Get('/noResponseInBmList')
  public noResponseInBmList(): void {
    return this.C2MService.callNotiSchulerEndpoints('noResponseInBmListReminder');
  }

  /*
  Not Enough Interest - BM List
  */
  @Get('/notEnoughInterestInBmList')
  public notEnoughInterestInBmList(): void {
    return this.C2MService.callNotiSchulerEndpoints('notEnoughInterestInBmListReminder');
  }

  @Get(':sbeSeminarId')
  public async findSeminar(@Param('sbeSeminarId') sbeSeminarId: string, @Query() sbeParams: SbeEndpointRequestDto): Promise<Record<string, any>> {
    return {
      data: await this.seminarService.findSeminar(sbeSeminarId, sbeParams),
    };
  }

  @Post('/getRegisteredSeminarsByUser')
  public async getRegisteredSeminarsByUser(@Auth('SSOUID') ssouid: string, @Body() body: SeminarDetail): Promise<any> {

    return this.seminarService
      .getSeminarRegistrationByUser(ssouid, body.fairCode, body.fiscalYear)
      .then((seminarData) => {
        const formattedRes = seminarData.map((seminar: Record<string, any>) => ({
          seminarId: seminar.seminarId,
          registrationTime: seminar.creationTime
        }))
        return {
          status: 200,
          data: formattedRes
        }
      })
      .catch((err) => {
        this.logger.error(`Cannot get registered seminars, result:${JSON.stringify(err)}`);
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

 

  @Post('/addCache')
  public addCache(@Body() body: {key: string, value: string}) {
    return this.seminarService.addCache(body.key, body.value);
  }

  @Post('/deleteCache')
  public deleteCache(@Body() body: {key: string}) {
    return this.seminarService.deleteCache(body.key);
  }

  @Post('/getCache')
  public getCache(@Body() body: {key: string}) {
    return this.seminarService.getCache(body.key);
  }

  @Post('/getKeysByPattern')
  public getKeysByPattern(@Body() body: {keyPattern: string}) {
    return this.seminarService.getKeysByPattern(body.keyPattern);
  }
}
