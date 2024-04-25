import { Controller, Get, Param, UseInterceptors, Post, Body, Query, Headers, CacheTTL, CacheInterceptor, Delete } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import moment from 'moment';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { AdminUserDecorator } from '../../core/decorator/adminUser.decorator';
import { ValidationErrorResponseDto } from '../../core/filters/dto/ValidationErrorResponse.dto';
import { AdminJwtInterceptor } from '../../core/interceptors/adminJwt.interceptor';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { Auth } from '../../decorators/auth.decorator';
import { buyerRegistrationSyncSNSDto, updateStatusDto } from '../../dto/seminarRegistration.dto';
import { TimeslotDto } from '../../dto/timeslot.dto';
import { TimeslotHelper } from '../../helper/timeslotHelper';
import { ContentService } from '../api/content/content.service';
import { FairDbService } from '../fairDb/fairDb.service';
import { SsoUidByFairCodeQueryDto, SsoUidByFairCodeResponseDto } from './dto/BuyerSsoUid.dto';
import { C2MParticipantStatus, BuyerDetail } from './dto/C2MParticipantStatus.dto';
import { FairDetail, GetFairListingRequestDto, GetFairListingRespDto } from './dto/Fair.dto';
import { FormattedTimeSlotsDto } from './dto/FormattedCIPTimeSlots.dto';
import { SearchFairParticipants, SearchFairParticipantsResponse } from './dto/SearchFairParticipants.dto';
import { SearchFairParticipantsFilterOption } from './dto/searchFairParticipantsFilterOption.dto';
import { FairService } from './fair.service';
import { OpenFairsQueryDto } from './dto/OpenFairs.dto';
import { ESParticipantResponseInterceptor } from '../../core/interceptors/participants-resp-transform.interceptor';

@Controller(['fair', 'admin/v1/fair'])
export class FairController {
  constructor(private fairService: FairService, private fairDbService: FairDbService, private contentService: ContentService) {}

  @Get()
  public fairIndex(): Record<string, any> {
    return {
      data: 'Fair Service is Ready',
    };
  }

  @CacheTTL(900)
  @UseInterceptors(CacheInterceptor)
  @Get('/:fairCode/combinedFairDateRange')
  public async getCombinedFairDateRange(@Param('fairCode') fairCode: string) {
    const fairCodes: string[] = await new Promise<string[]>(async (resolve, reject) => {
      try {
        const { data } = await this.fairService.getWordpressCombinedFairSettings(fairCode);
        const combinedFairDataObj = JSON.parse(data.data);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        resolve(combinedFairDataObj.data['combined-fair'].map((x: { url: string }) => x.url));
      } catch (ex) {
        resolve([fairCode]);
      }
    });

    return { data: this.fairService.getFairsDateRange(fairCodes) };
  }

  @Get('/:fairCode/dates')
  public async getFairDates(@Param('fairCode') fairCode: string): Promise<Record<string, any>> {
    const { data } = await this.fairService.getWordpressSettings(fairCode);
    const hybridFairStartDatetime = moment.parseZone(`${data.data.hybrid_fair_start_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    const hybridFairEndDatetime = moment.parseZone(`${data.data.hybrid_fair_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    const winsEventStartDatetime = moment.parseZone(`${data.data.wins_event_start_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    const winsEventEndDatetime = moment.parseZone(`${data.data.wins_event_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    const c2mStartDatetime = moment.parseZone(`${data.data.c2m_start_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    const c2mEndDatetime = moment.parseZone(`${data.data.c2m_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();

    const fairDates = this.fairService.getFairDates(fairCode);

    return {
      data: {
        // deprecated
        c2mStartDatetime,
        c2mEndDatetime,
        hybridFairStartDatetime,
        hybridFairEndDatetime,
        winsEventStartDatetime,
        winsEventEndDatetime,
        // new
        ...fairDates,
      },
    };
  }

  @Get('/:fairCode/combinedDates')
  public async getCombinedFairDates(@Param('fairCode') fairCode: string): Promise<Record<string, any>> {
    const fairCodes: string[] = await new Promise<string[]>(async (resolve, reject) => {
      try {
        const { data } = await this.fairService.getWordpressCombinedFairSettings(fairCode);
        const combinedFairDataObj = JSON.parse(data.data);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        resolve(combinedFairDataObj.data['combined-fair'].map((x: { url: string }) => x.url));
      } catch (ex) {
        resolve([fairCode]);
      }
    });
    const fairSettingPromises = fairCodes.map(async (tempCode: string) => this.fairService.getWordpressSettings(tempCode));
    const fairRes = await Promise.all(fairSettingPromises);
    const fairSettings = fairRes.map((res: any) => res.data.data);
    // return { fairSettings };
    // const fairCodes = await this.fairService.getCombinedFairByFairDict([fairCode]);

    let hyMin: string | null = null;
    let hyMax: string | null = null;
    let winsMin: string | null = null;
    let winsMax: string | null = null;
    let c2mMin: string | null = null;
    let c2mMax: string | null = null;
    let c2mMax2: string | null = null;
    fairSettings?.forEach((item: any) => {
      if (!hyMin || hyMin > item.hybrid_fair_start_datetime) hyMin = item.hybrid_fair_start_datetime;
      if (!hyMax || hyMax < item.hybrid_fair_start_datetime) hyMax = item.hybrid_fair_end_datetime;
      if (!winsMin || winsMin > item.wins_event_start_datetime) winsMin = item.wins_event_start_datetime;
      if (!winsMax || winsMax < item.hybrid_fair_start_datetime) winsMax = item.wins_event_end_datetime;
      if (!c2mMin || c2mMin > item.c2m_start_datetime) c2mMin = item.c2m_start_datetime;
      if (!c2mMax || c2mMax < item.hybrid_fair_start_datetime) c2mMax = item.c2m_end_datetime;
      if (!c2mMax2 || c2mMax2 < item.c2m_end_datetime) c2mMax2 = item.c2m_end_datetime;
    });
    const hybridFairStartDatetime = moment.parseZone(`${hyMin} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    const hybridFairEndDatetime = moment.parseZone(`${hyMax} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    const winsEventStartDatetime = moment.parseZone(`${winsMin} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    const winsEventEndDatetime = moment.parseZone(`${winsMax} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    const c2mStartDatetime = moment.parseZone(`${c2mMin} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    const c2mEndDatetime = moment.parseZone(`${c2mMax} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();
    // add another logic to get the furthest c2m end date, above c2mEndDate might be another logic
    const c2mEndDatetime2 = moment.parseZone(`${c2mMax2} +08:00`, 'YYYY-MM-DD HH:mm ZZ').toISOString();

    const timeslotsToBeComputedArray: Promise<any>[] = [];
    fairSettings.forEach((item: any) => timeslotsToBeComputedArray.push(this.fairService.getFairDates(item.fair_code)));
    const timeslotsToBeComputed = await Promise.all(timeslotsToBeComputedArray);
    const combinedFairDates = this.fairService.computeCombinedFairTimeslots(timeslotsToBeComputed);

    return {
      status: 200,
      data: {
        hybridFairStartDatetime,
        hybridFairEndDatetime,
        winsEventStartDatetime,
        winsEventEndDatetime,
        c2mStartDatetime,
        c2mEndDatetime,
        c2mEndDatetime2,
        ...combinedFairDates,
      },
    };
  }

  @Get('/:fairCode/groupedCombinedDates/:type')
  public async getGroupedCombinedFairDates(@Param('fairCode') fairCode: string, @Param('type') type: string, @Headers('X-USER-TZ') tz: string = 'UTC'): Promise<Record<string, any>> {
    // timeslot here
    const fairCodes: string[] = await new Promise<string[]>(async (resolve, reject) => {
      try {
        const { data } = await this.fairService.getWordpressCombinedFairSettings(fairCode);
        const combinedFairDataObj = JSON.parse(data.data);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        resolve(combinedFairDataObj.data['combined-fair'].map((x: { url: string }) => x.url));
      } catch (ex) {
        resolve([fairCode]);
      }
    });
    const fairSettingPromises = fairCodes.map(async (tempCode: string) => this.fairService.getWordpressSettings(tempCode));
    const fairRes = await Promise.all(fairSettingPromises);
    const fairSettings = fairRes.map((res: any) => res.data.data);
    const { online, physical } = this.fairService.computeCombinedFairTimeslots(fairSettings.map(async (item: any) => this.fairService.getFairDates(item.fair_code)));
    if (type === 'physical') {
      return {
        data: {
          physical: TimeslotHelper.groupTimeslotsByDate(<TimeslotDto[]>physical, tz),
        },
      };
    }

    if (type === 'online') {
      return {
        data: {
          online: TimeslotHelper.groupTimeslotsByDate(<TimeslotDto[]>online, tz),
        },
      };
    }

    if (type === 'hybrid') {
      const hybrid = this.fairService.combineTimeslots(online, physical);

      return {
        data: {
          hybrid: TimeslotHelper.groupTimeslotsByDate(<TimeslotDto[]>hybrid, tz),
        },
      };
    }
    return { data: {} };
  }

  // Get the OpenFairs list every 15 min from content service to reduce internal service calls
  @Get('/open')
  @CacheTTL(900)
  @UseInterceptors(CacheInterceptor, ResponseInterceptor)
  public async getOpenFairs(@Query() query: OpenFairsQueryDto): Promise<FairDetail[]> {
    let returnAll = false;
    if (query && query.full) {
      returnAll = true;
    }
    return this.fairService.getOpenFairs(returnAll);
  }

  // Get the ActiveFairs list every 15 min from content service to reduce internal service calls
  @Get('/active')
  @CacheTTL(900)
  @UseInterceptors(CacheInterceptor, ResponseInterceptor)
  public async getActiveFairs(@Query() query: OpenFairsQueryDto): Promise<FairDetail[]> {
    let returnAll = false;
    if (query && query.full) {
      returnAll = true;
    }
    return this.fairService.getActiveFairs(returnAll);
  }

  @Get('/before')
  @CacheTTL(300)
  @UseInterceptors(CacheInterceptor, ResponseInterceptor)
  public async getBeforeFairs(): Promise<FairDetail[]> {
    return this.fairService.getBeforeFairs();
  }

  @Get('/list')
  @CacheTTL(900)
  @UseInterceptors(CacheInterceptor, ResponseInterceptor)
  public async getFairListing(@Query() query: GetFairListingRequestDto): Promise<GetFairListingRespDto> {
    return this.fairService.getFairListing(query);
  }

  // show the fair list only if user have the corresponding access right
  @Get('/accessiblelist')
  @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
  public async getUserFairListing(@AdminUserDecorator() currentUser: AdminUserDto, @Query() query: GetFairListingRequestDto): Promise<GetFairListingRespDto> {
    return this.fairService.getFairListingFromDB(query, currentUser);
  }

  @Get('ssouid')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'Function to Get Buyer SsoUid by Fair Code' })
  @ApiResponse({
    status: 200,
    description: "Return Buyer SsoUid by Fair Code",
    type: SsoUidByFairCodeQueryDto,
    schema: { example: SsoUidByFairCodeResponseDto },
  })
  @ApiResponse({
    status: 400,
    description: "Validation Error",
    type: ValidationErrorResponseDto,
    schema: { example: ValidationErrorResponseDto },
  })
  public async getSsoUidByFairCode(@Query() ssoUidByFairCodeQueryDto: SsoUidByFairCodeQueryDto) {
    return this.fairService.getSsoUidByFairCode(ssoUidByFairCodeQueryDto);
  }

  @Get('/fairParticipantsFilterOption/')
  public async searchFairParticipantsFilterOption(@Query() query: SearchFairParticipantsFilterOption) {
    let fairDatas: Record<string, any>[] = []
    const { fairCode } = query

    try {
      const { data } = await this.fairService.getWordpressSettings(fairCode);
      const fairSetting = data.data;
      fairDatas = [
        {
          relatedFair: [
            {
              fair_code: fairSetting.fair_code,
              fiscal_year: fairSetting.fiscal_year,
              fair_short_name: fairSetting.fair_short_name,
            },
          ],
        },
      ];
    } catch {
      fairDatas = [];
    }

    const participantsProductCategoryIdList = fairDatas.length > 0 ? await this.fairDbService.contructSearchFairParticipantsProductCategoryList(fairDatas) : []
    return this.fairService.searchFairParticipantsFilterOption(fairDatas, participantsProductCategoryIdList);
  }

  @Post('/searchFairParticipants')
  @UseInterceptors(ResponseInterceptor)
  public async searchFairParticipants(@Auth('SSOUID') ssoUid: string, @Body() body: SearchFairParticipants) {
    const { keyword, lang, from, size, fairCodes, filterParticipatingFair, filterCountry, filterNob, filterProductCategory, alphabet, ssoUidList, browserCountry, ccdid } = body;

    let isSensitiveKeywords = await this.contentService.isSensitiveKeywordsForFindBuyer(keyword, browserCountry);

    if (isSensitiveKeywords) {
      return {
        data: {
          aggregations: {
            participatingFair: [],
            countrySymbol: [],
            natureofBusinessSymbols: [],
            productCategoryList: [],
          },
          hits: [],
          from,
          size,
          total_size: 0,
          sensitiveKeyword: true,
        },
      };
    }

    const participantsResult = this.fairDbService.searchFairParticipants({
      mySsoUid: ssoUid,
      keyword,
      lang,
      from,
      size,
      fairCodes,
      filterParticipatingFair,
      filterCountry,
      filterNob,
      filterProductCategory,
      alphabet,
      ssoUidList,
      ccdid,
    });
    return Promise.all([participantsResult]).then((result) => ({
      data: {
        aggregations: {
          participatingFair: result[0].fairCodeList,
          countrySymbol: result[0].countryList,
          natureofBusinessSymbols: result[0].nobList,
          productCategoryList: result[0].productInterestList,
        },
        hits: result[0].userList,
        from,
        size,
        total_size: result[0].totalSize,
        sensitiveKeyword: false,
      },
    }));
  }

  @Post('/searchFairParticipantsV2')
  @UseInterceptors(ESParticipantResponseInterceptor)
  public async searchFairParticipantsV2(@Auth('SSOUID') ssoUid: string, @Body() body: SearchFairParticipants) {
    const { keyword, lang, from, size, fairCodes, filterParticipatingFair, filterCountry, filterNob, filterProductCategory, alphabet, ssoUidList, browserCountry, ccdid } = body;

    let isSensitiveKeywords = await this.contentService.isSensitiveKeywordsForFindBuyer(keyword, browserCountry);

    if (isSensitiveKeywords) {
      let response = new SearchFairParticipantsResponse()
      response.data.from = from
      response.data.size = size
      response.data.sensitiveKeyword = true
      return response
    }

    return await this.fairService.searchFairParticipantsV2({
      mySsoUid: ssoUid,
      keyword,
      lang,
      from,
      size,
      fairCodes,
      filterParticipatingFair,
      filterCountry,
      filterNob,
      filterProductCategory,
      alphabet,
      ssoUidList,
      ccdid,
    });
  }

  // new api to update the buyer c2mParticiapntStatus
  @Post('updateC2MParticipantStatusForBuyer')
  @UseInterceptors(ResponseInterceptor)
  public async updateC2MParticipantStatusForBuyer(@Auth('SSOUID') ssoUid: string, @Body() C2MParticipantStatus: C2MParticipantStatus) {
    const { c2mParticipantStatus, fairCode, fiscalYear } = C2MParticipantStatus;
    return this.fairDbService.updateC2MParticipantStatusForBuyer({ ssoUid, c2mParticipantStatus, fairCode, fiscalYear });
  }

  @Get('/getMultipleFairDatas')
  @CacheTTL(900)
  @UseInterceptors(CacheInterceptor, ResponseInterceptor)
  public async getMultipleFairDatasWithCache(@Query('fairCodes') fairCodes: string) {
    let fairCodesArr = fairCodes.split(",")
    return this.fairService.getMultipleFairDatas(fairCodesArr);
  }

  @Post('/getMultipleFairDatas')
  @UseInterceptors(ResponseInterceptor)
  public async getMultipleFairDatas(@Body('fairCodes') fairCodes: string[]) {
    return this.fairService.getMultipleFairDatas(fairCodes);
  }

  @Post('/getFairParticipantProfile')
  @UseInterceptors(ResponseInterceptor)
  public async getFairParticipantProfile(@Body() body: Record<string, any>) {
    const { ssoUid, fairCode, fiscalYear } = body;
    return this.fairDbService.getFairParticipantProfile(ssoUid, fairCode, fiscalYear);
  }

  @Post('/getFairParticipantStatus')
  @UseInterceptors(ResponseInterceptor)
  public async getFairParticipantStatus(@Body() body: BuyerDetail) {
    const { ssoUid, fairCode } = body;
    return this.fairDbService.getFairParticipantStatus(ssoUid, fairCode);
  }

  @Post('/getAndSetC2MLoginStatus')
  @UseInterceptors(ResponseInterceptor)
  public async getAndSetC2MLoginStatus(@Body() body: BuyerDetail) {
    const { ssoUid, fairCode, fiscalYear } = body;
    return this.fairDbService.getAndSetC2MLoginStatus(ssoUid, fairCode, fiscalYear);
  }

  @Get('getFairDatesConfig/:fairCode/:year/:type')
  @UseInterceptors(ResponseInterceptor)
  @UseInterceptors(AdminJwtInterceptor)
  public async getFairDatesConfig(@Param('fairCode') fairCode: string, @Param('year') year: string, @Param('type') type: string): Promise<any> {
    return this.fairService.getFairPeriod(fairCode, year, Number(type));
  }

  @Post('postFairDatesConfig/:fairCode/:year')
  @UseInterceptors(ResponseInterceptor)
  @UseInterceptors(AdminJwtInterceptor)
  public async postFairDatesConfig(@AdminUserDecorator() currentUser: AdminUserDto, @Param('fairCode') fairCode: string, @Param('year') year: string, @Body() body: any): Promise<any> {
    if (
      !this.fairService.checkPermission(
        [100], // 100 = General setting (C2M config - Notification)
        currentUser.permission,
        true
      )
    ) {
      return {
        status: 400,
        message: 'no permission',
      };
    }
    return this.fairService.postFairPeriod(currentUser.emailAddress, fairCode, year, body);
  }

  @Delete('deleteFairDatesConfig/:fairCode')
  @UseInterceptors(ResponseInterceptor)
  @UseInterceptors(AdminJwtInterceptor)
  public async deleteFairDatesConfig(@AdminUserDecorator() currentUser: AdminUserDto, @Param('fairCode') fairCode: string, @Body() body: any): Promise<any> {
    if (
      !this.fairService.checkPermission(
        [100], // 100 = General setting (C2M config - Notification)
        currentUser.permission,
        true
      )
    ) {
      return {
        status: 400,
        message: 'no permission',
      };
    }
    return this.fairService.deleteFairPeriod(currentUser.emailAddress, fairCode, body.recordIds);
  }

  @Get('getBuyerRegistrationStatus/:projectCode/:projectYear')
  public async getBuyerRegistrationStatus(@Auth('SSOUID') ssoUid: string, @Param('projectCode') code: string, @Param('projectYear') year: string): Promise<any> {
    return this.fairService.getBuyerRegistrationStatus(ssoUid, code, year);
  }

  @Post('/getFairParticipant')
  @UseInterceptors(ResponseInterceptor)
  public async getFairParticipant(@Body() body: { emailId: string }): Promise<any> {
    const { emailId } = body;
    const response = await this.fairDbService.getFairParticipantByEmailId(emailId);

    const buyerData: any[] = [];
    response.forEach((b) => {
      const buyer: Record<string, any> = {};

      buyer.fairCode = b.fairCode;
      buyer.fiscalYear = b.fiscalYear;
      buyer.ssoUid = b.fairParticipant.ssoUid;
      buyer.role = 'buyer';

      buyerData.push(buyer);
    });

    return buyerData;
  }

  @ApiOperation({ summary: 'Return CIP fair dates' })
  @ApiResponse({
    status: 200,
    description: 'Return CIP fair dates',
    schema: { example: FormattedTimeSlotsDto },
  })
  @ApiResponse({
    status: 500,
    description: 'System error',
  })
  @Get('/getCIPFairDates/:fairCode/:fiscalYear')
  public async getCIPFairDates(
    @Param('fairCode') fairCode: string, 
    @Param('fiscalYear') fiscalYear: string,
    // @Headers('X-USER-TZ') tz: string = 'UTC'
  ): Promise<any> {
    return this.fairService.getCIPTimeslotGroup(fairCode, fiscalYear)
  }

  @Get('/getCIPFairDatesInAdminPortal/:fairCode/:fiscalYear')
  public async getCIPFairDatesInAdminPortal(
    @Param('fairCode') fairCode: string, 
    @Param('fiscalYear') fiscalYear: string,
    // @Headers('X-USER-TZ') tz: string = 'UTC'
  ): Promise<any> {
    const cipFairDates = await this.getFairDatesConfig(fairCode, fiscalYear, '2');

    let formattedTimeSlots: {
      recordIds: number[];
      availableDate: string;
      availableTimeRange: {
        displayTime: string;
        startTime: string;
        endTime: string;
      }[];
    }[] = [];
    if (cipFairDates.data) {
      cipFairDates.data.map((dbData: any) => {
        const formattedTimeSlotsIndex = formattedTimeSlots.findIndex((data) => {
          const tempStartTime = moment(dbData.startTime).tz('Asia/Hong_Kong').format('yyyy-MM-DD');
          return tempStartTime === data.availableDate;
        });
        if (formattedTimeSlotsIndex !== -1) {
          formattedTimeSlots[formattedTimeSlotsIndex].recordIds.push(dbData.recordId);
          formattedTimeSlots[formattedTimeSlotsIndex].availableTimeRange.push({
            displayTime: `${moment(dbData.startTime).tz('Asia/Hong_Kong').format('HH:mm')} - ${moment(dbData.endTime).tz('Asia/Hong_Kong').format('HH:mm')}`,
            startTime: moment(dbData.startTime).tz('Asia/Hong_Kong').format(),
            endTime: moment(dbData.endTime).tz('Asia/Hong_Kong').format(),
          });
        } else {
          formattedTimeSlots.push({
            recordIds: [dbData.recordId],
            availableDate: moment(dbData.startTime).tz('Asia/Hong_Kong').format('yyyy-MM-DD'),
            availableTimeRange: [
              {
                displayTime: `${moment(dbData.startTime).tz('Asia/Hong_Kong').format('HH:mm')} - ${moment(dbData.endTime).tz('Asia/Hong_Kong').format('HH:mm')}`,
                startTime: moment(dbData.startTime).tz('Asia/Hong_Kong').format(),
                endTime: moment(dbData.endTime).tz('Asia/Hong_Kong').format(),
              },
            ],
          });
        }
      });

      formattedTimeSlots.map((data) => data.availableTimeRange.sort((p, f) => (p.displayTime > f.displayTime ? 1 : -1)));
    }

    return {
      status: 200,
      data: formattedTimeSlots,
    };
  }

  @Post('buyerRegistrationSyncSNS')
  public async buyerRegistrationSyncSNS(@Body() body: buyerRegistrationSyncSNSDto): Promise<any> {
    return this.fairService.sendRegistrationToSyncSNS(body);
  }

  @Post('updateWatchNowStatus')
  public async updateWatchNowStatus(@Body() body: updateStatusDto): Promise<any> {
    return this.fairService.updateWatchNowStatus(body.userId, body.seminarId)
  }

  @Post('updatePlaybackStatus')
  public async updatePlaybackStatus(@Body() body: updateStatusDto): Promise<any> {
    return this.fairService.updatePlaybackStatus(body.userId, body.seminarId)
  }

  @Get('retrySeminarRegistration')
  public retrySeminarRegistration(): Promise<any> {
    return this.fairService.retrySeminarRegistration();
  }

}
