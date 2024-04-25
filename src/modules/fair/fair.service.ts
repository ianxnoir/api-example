import { HttpService, BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, getConnection, IsNull, Not, Repository } from 'typeorm';
import AWS from 'aws-sdk';
import { AxiosResponse } from 'axios';
import moment from 'moment-timezone';
import { constant } from '../../config/constant';
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
import { Logger } from '../../core/utils';
import { FairPeriod, MeetingType } from '../../dao/FairPeriod';
import { FairRegistration } from '../../dao/FairRegistration';
import { buyerRegistrationSyncSNSDto } from '../../dto/seminarRegistration.dto';
import { SsoUidByFairCodeQueryDto } from './dto/BuyerSsoUid.dto';
import { FairDetail, FairListingData, GetFairListingRequestDto, GetFairListingRespDto } from './dto/Fair.dto';
import { ConvertedFairParticipantSearchDto, FairFilterDto, SearchFairParticipantsInterface, SearchFairParticipantsResponse } from './dto/SearchFairParticipants.dto';
import * as AWSXRay from 'aws-xray-sdk';
import fairDatesData from './fairDates.json';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { Registration as RegistrationEntity } from '../../entities/registration.entity';
import { ContentCacheService } from '../api/content/content-cache.service';
import { ElasticacheClusterService } from '../../core/elasticachecluster/elasticachecluster.service';
import { CustomEsBuilder } from '../esHelper/esQueryBuilder';
import { ESService } from '../esHelper/esService';
import { esHelperUtil } from '../esHelper/es.util';
import { ESFairParticipantResponseDto, EsResultDto } from '../esHelper/esResult.dto';
import { FairDetailsFromDB, FairDetailsWithTypeFromDB } from './dto/GetFairSettingFromDB.dto';
import { ContentService } from '../api/content/content.service';
import { checkCurrentOrPastFairs } from './utils';
const searchFairParticipantIndex = 'vep-participant-search'

@Injectable()
export class FairService {
  constructor(
    private logger: Logger,
    private httpService: HttpService,
    private configService: ConfigService,
    @InjectRepository(RegistrationEntity) private registrationRepository: Repository<RegistrationEntity>,
    private contentCacheService: ContentCacheService,
    private contentService: ContentService,
    private esService: ESService,
    @InjectRepository(FairRegistration) private fairRegistrationRepository: Repository<FairRegistration>,
    private elasticacheClusterService: ElasticacheClusterService,
    @InjectRepository(FairPeriod) private fairPeriodRepository: Repository<FairPeriod>
  ) {}

  public async getWordpressSettings(fairCode: string): Promise<any> {

    const ApiName =  'getWordpressSettings';
    const ApiPara =  fairCode;
    const redisKey = `${ApiName}-${ApiPara}`;
    const cache = await this.getApiCache(redisKey);
    if(!cache){

      const baseUri = this.configService.get<string>('api.CONTENT_SERVICE_URI') || '';
      const request = this.httpService.get(`${baseUri}/wordpress/setting?fair=${fairCode}`);
      const response = await request.toPromise();

      // set cache if cant find in redis 
      this.setApiCache(redisKey , { data: response?.data });

      return Promise.resolve(response);

    }else{

      return Promise.resolve(cache);

    }

  }

  public async getWordpressCombinedFairSettings(fairCode: string): Promise<any> {

    const ApiName =  'getWordpressCombinedFairSettings';
    const ApiPara =  fairCode;
    const redisKey = `${ApiName}-${ApiPara}`;
    const cache = await this.getApiCache(redisKey);
    if(!cache){

      const baseUri = this.configService.get<string>('api.CONTENT_SERVICE_URI') || '';
      const request = this.httpService.get(`${baseUri}/wordpress/combinedFairSetting?fair=${fairCode}`);  
      const response = await request.toPromise();

      // set cache if cant find in redis 
      this.setApiCache(redisKey , { data: response?.data });

      return Promise.resolve(response);

    }else{

      return Promise.resolve(cache);

    }
 
  }

  // set API cache 
  public async setApiCache( redisKey: string,   apiReturn: any): Promise<Record<string, any>> {

    // create Redis cache by key and API return
    return this.elasticacheClusterService.setCache(redisKey, JSON.stringify(apiReturn), 60 * 60 * 4).catch(error => {
      return null;
    })
  }

  // get API cache by key
  public async getApiCache( redisKey: string): Promise<Record<string, any>> {
    return this.elasticacheClusterService.getCache(redisKey).then(async result => {
      if(result)
        return JSON.parse(result);
      else  
        return null;
    })
  }

  public async getAdminCombinedFairSettings(combinationName: string, fiscalYear: string): Promise<AxiosResponse> {
    const baseUri = this.configService.get('api.CONTENT_SERVICE_URI') || '';
    const request = this.httpService.get(`${baseUri}/admin/combinedFairSetting?combinationName=${combinationName}&fiscalYear=${fiscalYear}`);

    return request.toPromise();
  }

  public getFairsDateRange(fairCodes: Array<string>) {
    const data: Record<string, any> = fairDatesData;
    return fairCodes.map((code) => ({
      fairCode: code,
      ...data[code],
    }));
  }

  public async getFairDates(fairCode: string): Promise<Record<string, any>> {
    const physicalQ = `SELECT startTime as start, endTime as end from vepFairPeriod WHERE fairCode = "${fairCode}" and type = 1 ORDER by startTime`;
    const onlineQ = `SELECT startTime as start, endTime as end from vepFairPeriod WHERE fairCode = "${fairCode}" and type =0 ORDER by startTime`;
    const targetPhy = await getConnection().query(physicalQ);
    const targetOnline = await getConnection().query(onlineQ);

    const physical: any[] = targetPhy || [];
    const online: any[] = targetOnline || [];

    const physcialDates = this.renderPeriodDays(physical);
    const onlineDates = this.renderPeriodDays(online);

    return { physical: physcialDates, online: onlineDates };
  }

  public async getWordpressSites(): Promise<AxiosResponse> {
    const baseUri = this.configService.get<string>('api.CONTENT_SERVICE_URI') || '';
    const request = this.httpService.get(`${baseUri}/wordpress/sites`);

    return request.toPromise();
  }

  public async getCombinedFairByFairDict(fairCodes: string[]): Promise<Record<string, string[]>> {
    let combinedFairDict = {};

    await Promise.all(
      fairCodes.map(
        async (fairCode) =>
          new Promise<Record<string, string[]>>(async (resolve, reject) => {
            try {
              const { data } = await this.getWordpressCombinedFairSettings(fairCode);
              const combinedFairDataObj = JSON.parse(data.data);
              resolve({
                [fairCode]: combinedFairDataObj.data['combined-fair'].map((x: { url: string }) => x.url),
              });
            } catch (ex) {
              resolve({
                [fairCode]: [fairCode],
              });
            }
          })
      )
    ).then((results) => {
      combinedFairDict = results.reduce(
        (accResult: Record<string, string[]>, element: Record<string, string[]>) => ({
          ...accResult,
          ...element,
        }),
        {}
      );
    });

    return combinedFairDict;
  }

  public async getActiveFairs(returnAll: boolean = false): Promise<FairDetail[]> {
    let fairDetailList: FairDetail[] = await this.getOpenFairs(returnAll);

    let activeFairDetailList: FairDetail[] = [];

    const combinedFairByFairDict = await this.getCombinedFairByFairDict(fairDetailList.map((x) => x.fair_code));

    for (let fairDetail of fairDetailList) {
      let start = moment.parseZone(`${fairDetail.hybrid_fair_start_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ');
      let end = moment.parseZone(`${fairDetail.hybrid_fair_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ');
      let currentTime = moment(new Date());

      if (combinedFairByFairDict[fairDetail.fair_code].length > 1) {
        for (let siblingfairCode of combinedFairByFairDict[fairDetail.fair_code].filter((x) => x != fairDetail.fair_code)) {
          const siblingFairEndDate = moment.parseZone(`${fairDetailList.find((x) => x.fair_code == siblingfairCode)!.hybrid_fair_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ');
          if (siblingFairEndDate.isSameOrAfter(end)) {
            end = siblingFairEndDate;
          }
        }
      }

      if (start.isSameOrBefore(currentTime) && end.isSameOrAfter(currentTime)) {
        activeFairDetailList.push(fairDetail);
      }
    }

    return activeFairDetailList;
  }

  public async getBeforeFairs(): Promise<FairDetail[]> {
    let fairDetailList: FairDetail[] = await this.getOpenFairs();

    let activeFairDetailList: FairDetail[] = [];

    const combinedFairByFairDict = await this.getCombinedFairByFairDict(fairDetailList.map((x) => x.fair_code));

    for (let fairDetail of fairDetailList) {
      let end = moment.parseZone(`${fairDetail.hybrid_fair_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ');
      let currentTime = moment(new Date());

      if (combinedFairByFairDict[fairDetail.fair_code].length > 1) {
        for (let siblingfairCode of combinedFairByFairDict[fairDetail.fair_code].filter((x) => x != fairDetail.fair_code)) {
          const siblingFairEndDate = moment.parseZone(`${fairDetailList.find((x) => x.fair_code == siblingfairCode)!.hybrid_fair_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ');
          if (siblingFairEndDate.isSameOrAfter(end)) {
            end = siblingFairEndDate;
          }
        }
      }

      if (end.isSameOrAfter(currentTime)) {
        activeFairDetailList.push(fairDetail);
      }
    }

    return activeFairDetailList;
  }

  public async getOpenFairs(returnAll: boolean = false): Promise<FairDetail[]> {
    const data = await this.getWordpressSites();
    const sites = JSON.parse(data.data.data);
    let fairCodes: string[] = [];
    Object.keys(sites.sites).forEach((fairCode: string) => {
      if (sites.sites[fairCode].deleted == '0') {
        fairCodes.push(fairCode);
      }
    });
    let fairDetailList: FairDetail[] = [];

    await Promise.all(
      fairCodes.map(
        async (fairCode) => new Promise<FairDetail>(async (resolve, reject) => {
          try {
            const { data } = await this.getWordpressSettings(fairCode);
            if (returnAll || data.data.website_type == "tradeshow"){
              resolve({
                fair_code: fairCode,
                fair_short_name: data.data.fair_short_name,
                vms_project_year: data.data.vms_project_year,
                vms_project_no: data.data.vms_project_no,
                fiscal_year: data.data.fiscal_year,
                fair_type: data.data.fair_type,
                eoa_fair_id: data.data.eoa_fair_id,
                online_event_start_datetime: data.data.online_event_start_datetime,
                online_event_end_datetime: data.data.online_event_end_datetime,
                wins_event_start_datetime: data.data.wins_event_start_datetime,
                wins_event_end_datetime: data.data.wins_event_end_datetime,
                c2m_start_datetime: data.data.c2m_start_datetime,
                c2m_end_datetime: data.data.c2m_end_datetime,
                hybrid_fair_start_datetime: data.data.hybrid_fair_start_datetime,
                hybrid_fair_end_datetime: data.data.hybrid_fair_end_datetime,
                seminar_year: data.data.seminar_year
              });
            } else {
              resolve(new FairDetail());
            }
          } catch (ex) {
            resolve(new FairDetail());
          }
        })
      )
    )
      .then((results) => {
        fairDetailList = results;
      })
      .catch((ex) => {
        throw new BadRequestException('Failed to retrieve fair setting');
      });

    return fairDetailList.filter((fairDetail) => fairDetail.fair_code != null && fairDetail.fair_code != '' && fairDetail.fiscal_year != null && fairDetail.fiscal_year != '');
  }

  public async getFairListing(query: GetFairListingRequestDto , currentUser: AdminUserDto | undefined = undefined): Promise<GetFairListingRespDto> {
    try {
      let fairDetailList: FairDetail[] = await this.getOpenFairs(true);
      // aor is not counted in Fair List but aor can be a form in admin portal
      if (query.withoutAor) {
        fairDetailList = fairDetailList.filter((fairDetail) => (fairDetail.fair_code != "aor"));
      }
      
      // show the fair list only if user have the corresponding access right
      if(currentUser?.fairAccessList){
        let userFairAccessList = new Set<string>(currentUser.fairAccessList.split(','))
        fairDetailList = fairDetailList.filter((fairDetail) => userFairAccessList.has(fairDetail.fair_code) );
      }

      const currentYear = moment().year();
      fairDetailList = fairDetailList.filter((fairDetail) => Number(fairDetail.vms_project_year) >= currentYear || Number(fairDetail.vms_project_year) >= currentYear - 3);

      let fairList: FairListingData[] = fairDetailList.map((fairDetail) => ({
        fairCode: fairDetail.fair_code,
        fairShortName: fairDetail.fair_short_name?.en ?? fairDetail.fair_short_name,
        vmsProjectNo: fairDetail.vms_project_no,
      }));

      if (query.withYears) {
        fairList = fairDetailList.map((fairDetail) => ({
          fairCode: fairDetail.fair_code,
          fairShortName: fairDetail.fair_short_name?.en ?? fairDetail.fair_short_name,
          vmsProjectNo: fairDetail.vms_project_no,
          fairYear: fairDetail.vms_project_year,
          fiscalYear: fairDetail.fiscal_year,
        }));
      }

      return {
        total_size: fairList.length,
        data: fairList,
      };
    } catch (error) {
      throw new VepError(VepErrorMsg.Fair_Listing_Error, error.message);
    }
  }

  // VT-22558: Iterate fair setting data from previous years instead of getting only one year data
  public async getFairListingFromDB (query: GetFairListingRequestDto , currentUser: AdminUserDto | undefined = undefined): Promise<GetFairListingRespDto> {
    try {
      let fairDetailList: FairDetailsWithTypeFromDB[] = await this.getOpenFairsFromDB(true);
      // aor is not counted in Fair List but aor can be a form in admin portal
      if (query.withoutAor) {
        fairDetailList = fairDetailList.filter((fairDetail) => (fairDetail.fairCode != "aor"));
      }
      
      // show the fair list only if user have the corresponding access right
      if (currentUser?.fairAccessList) {
        let userFairAccessList = new Set<string>(currentUser.fairAccessList.split(','));
        fairDetailList = fairDetailList.filter((fairDetail) => userFairAccessList.has(fairDetail.fairCode));
      }
      

      const currentYear = moment().year();
      fairDetailList = fairDetailList.filter((fairDetail) => Number(fairDetail.vmsProjectYear) >= currentYear || Number(fairDetail.vmsProjectYear) >= currentYear - 3);

      let fairList: FairListingData[] = fairDetailList.map((fairDetail) => ({
        fairCode: fairDetail.fairCode,
        fairShortName: JSON.parse(fairDetail.fairShortName)?.en ?? fairDetail.fairShortName,
        vmsProjectNo: fairDetail.vmsProjectNo,
      }));

      fairList = fairList.filter((value, index, self) =>
          index === self.findIndex((fair) => (
            fair.fairCode === value.fairCode && fair.vmsProjectNo === value.vmsProjectNo
        ))
      )

      if (query.withYears) {
        fairList = fairDetailList.map((fairDetail) => ({
          fairCode: fairDetail.fairCode,
          fairShortName: JSON.parse(fairDetail.fairShortName)?.en ?? fairDetail.fairShortName,
          vmsProjectNo: fairDetail.vmsProjectNo,
          fairYear: fairDetail.vmsProjectYear,
          fiscalYear: fairDetail.fiscalYear,
          seminarYear: fairDetail.seminarYear,
          type: fairDetail.type
        }));
      }

      return {
        total_size: fairList.length,
        data: fairList,
      };
    } catch (error) {
      throw new VepError(VepErrorMsg.Fair_Listing_From_Database_Error, error.message);
    }
  }

  // Iterate fair setting data from previous years instead of getting only one year data
  public async getOpenFairsFromDB (returnAll: boolean = false): Promise<FairDetailsWithTypeFromDB[]> {
    const data = await this.getWordpressSites();
    const sites = JSON.parse(data.data.data);
    let fairCodes: string[] = [];

    Object.keys(sites.sites).forEach((fairCode: string) => {
      if (sites.sites[fairCode].deleted == '0') {
        fairCodes.push(fairCode);
      }
    });

    let fairDetailList: FairDetailsWithTypeFromDB[] = [];
    
    await Promise.all(
      fairCodes.map(
        async (fairCode: string) => new Promise(async (resolve) => {
            try {
              const { data } = await this.getWordpressSettings(fairCode);

              // only include fair setting with its website_types as "tradeshow"
              if (returnAll || data.data.website_type == "tradeshow"){
                const result: FairDetailsFromDB[] = await this.contentService.retrieveOpenFairsFromDB(fairCode);
                const modifiedResult: FairDetailsWithTypeFromDB[] = checkCurrentOrPastFairs(result, data)
                resolve(modifiedResult)
              } else {
                resolve([new FairDetailsWithTypeFromDB()]);
              }
            } catch (ex) {
              resolve([new FairDetailsWithTypeFromDB()]);
            }
        }))
    ).then((response: FairDetailsWithTypeFromDB[] | any[]) => {
      fairDetailList = response.flat()
    }).catch ((error) => {
      throw new VepError(VepErrorMsg.Open_Fairs_From_Database_Error, error.message);
    })

    // filter the fair setting without fairCode or fiscalYear
    return fairDetailList.filter((fairDetail) => fairDetail.fairCode != "" && fairDetail.fiscalYear != "");
  }

  public getSsoUidByFairCode = async (query: SsoUidByFairCodeQueryDto): Promise<Optional<any>> => {
    try {
      const fairSetting = await this.getWordpressSettings(query.fairCode)
        .then((data) => {
          return data;
        })
        .catch((error) => {
          throw new VepError(VepErrorMsg.ContentService_FailToRetrieveFairSetting, `The Fair Code (${query.fairCode}) does not exist`);
        });
      this.logger.debug(fairSetting.data.data);

      const data = await this.fairRegistrationRepository
        .findAndCount({
          relations: ['fairParticipant'],
          where: [
            {
              fairCode: query.fairCode,
              fairParticipant: { ssoUid: Not(IsNull()) },
            },
          ],
          order: {
            id: 'ASC',
          },
          take: query.size,
          skip: query.pageNum * query.size,
        })
        .catch((error) => {
          throw new VepError(VepErrorMsg.Database_Error, error.message);
        });

      const ssoUidList = data[0].map((item) => item.fairParticipant.ssoUid).filter((ssouid) => ssouid) ?? [];
      return ssoUidList;
    } catch (error) {
      if (error.name === 'VepError') {
        throw new VepError(error.vepErrorMsg, error.errorDetail);
      }
      throw new VepError(VepErrorMsg.Fair_SsoUid_Not_Found_Error, `Unable to Get the SsoUid by Fair Code - ${query.fairCode}`);
    }
  };

  public async getMultipleFairDatas(fairCodes: string[]): Promise<Record<string, any>[]> {
    const result: Promise<any>[] = [];
    fairCodes.forEach((fair) => {
      result.push(this.getFairData(fair, true));
    });
    return Promise.all(result).then((combinedFairResult) =>
      // filter duplicate fair record by combinationName
      // combinedFairResult.filter((value, index, self) => value.status === 200 && index === self.findIndex((thisFair) => thisFair.combinationName === value.combinationName))
      combinedFairResult.filter((value, index, self) => value.status === 200 && value.fairType === 'combined' ? index === self.findIndex((thisFair) => thisFair.combinationName === value.combinationName) : value.fairType === 'single')
    );
  }

  public async getFairData(fairCode: string, resolve?: boolean): Promise<any> {
    return this.getWordpressCombinedFairSettings(fairCode)
      .then((result) => {
        const combinedFairs = JSON.parse(result?.data.data);
        return {
          combinationName: combinedFairs.data.combination_name,
          relatedFair: combinedFairs.data['combined-fair'].map((fair: Record<string, string>) => fair.url),
        };
      })
      .catch(() =>
        // no combinded fair record
        ({
          combinationName: '',
          relatedFair: [fairCode],
        })
      )
      .then(async (combinedFairs) => Promise.all([Promise.resolve(combinedFairs.combinationName), ...combinedFairs.relatedFair.map(async (fair: string) => this.getWordpressSettings(fair))]))
      .then((result) => {
        const response = {
          [constant.API_RESPONSE_FIELDS.STATUS]: constant.API_RESPONSE_CODE.SUCCESS,
          [constant.FAIR_RELATIONSHIP.FAIR_TYPE]: result[0] ? constant.FAIR_RELATIONSHIP.COMBINED : constant.FAIR_RELATIONSHIP.SINGLE,
          combinationName: result[0],
          relatedFair: result.filter((fair, index) => index !== 0).map((fair) => fair.data.data),
        };
        return resolve ? Promise.resolve(response) : response;
      })
      .catch(() => {
        // no fair record found
        const response = {
          [constant.API_RESPONSE_FIELDS.STATUS]: constant.API_RESPONSE_CODE.FAIL,
          [constant.API_RESPONSE_FIELDS.MESSAGE]: constant.FAIR_RELATIONSHIP.NO_RECORD,
          combinationName: '',
          relatedFair: [],
        };
        return resolve ? Promise.resolve(response) : response;
      });
  }

  public computeCombinedFairTimeslots(fairTimeslots: Record<string, any>[]): Record<string, any> {
    let desiredFairTimeslots: Record<string, any> = {};
    fairTimeslots.forEach((nextTimeslots: Record<string, any>) => {
      desiredFairTimeslots = this.combineFairTimeslots(desiredFairTimeslots, nextTimeslots);
    });
    return desiredFairTimeslots;
  }

  public combineFairTimeslots(fairTimeslotsA: Record<string, any>, fairTimeslotsB: Record<string, any>): Record<string, any> {
    const { physical: physicalTimeslotsA, online: onlineTimeslotsA } = fairTimeslotsA;
    const { physical: physicalTimeslotsB, online: onlineTimeslotsB } = fairTimeslotsB;
    return {
      physical: this.combineTimeslots(physicalTimeslotsA || [], physicalTimeslotsB || []),
      online: this.combineTimeslots(onlineTimeslotsA || [], onlineTimeslotsB || []),
    };
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public combineTimeslots(timeslotsA: Record<string, any>[], timeslotsB: Record<string, any>[]): Record<string, any>[] {
    let desiredTimeslots: Record<string, any>[] = [];
    let faPtr = 0;
    let fbPtr = 0;
    while (timeslotsA[faPtr] || timeslotsB[fbPtr]) {
      // let lastTimeslot = desiredTimeslots[desiredTimeslots.length - 1];
      if (!timeslotsA[faPtr]) {
        desiredTimeslots.push(timeslotsB[fbPtr++]);
        // if (lastTimeslot && this.isOverlap(lastTimeslot, timeslotsB[fbPtr])) {
        //   desiredTimeslots[desiredTimeslots.length - 1] = this.combineTimeslot(lastTimeslot, timeslotsB[fbPtr++]);
        // } else {
        //   desiredTimeslots.push(timeslotsB[fbPtr++]);
        // }
        continue;
      }

      if (!timeslotsB[fbPtr]) {
        desiredTimeslots.push(timeslotsA[faPtr++]);
        // if (lastTimeslot && this.isOverlap(lastTimeslot, timeslotsA[faPtr])) {
        //   desiredTimeslots[desiredTimeslots.length - 1] = this.combineTimeslot(lastTimeslot, timeslotsA[faPtr++]);
        // } else {
        //   desiredTimeslots.push(timeslotsA[faPtr++]);
        // }
        continue;
      }

      if (!this.isOverlap(timeslotsA[faPtr], timeslotsB[faPtr])) {
        if (timeslotsA[faPtr].start < timeslotsB[fbPtr].start) {
          desiredTimeslots.push(timeslotsA[faPtr++]);
        } else {
          desiredTimeslots.push(timeslotsB[fbPtr++]);
        }
      } else {
        desiredTimeslots.push(this.combineTimeslot(timeslotsA[faPtr++], timeslotsB[fbPtr++]));
      }

      // if (!this.isOverlap(timeslotsA[faPtr], timeslotsB[faPtr])) {
      //   if (timeslotsA[faPtr].start < timeslotsB[fbPtr].start) {
      //     desiredTimeslots.push(timeslotsA[faPtr++]);
      //   } else {
      //     desiredTimeslots.push(timeslotsB[fbPtr++]);
      //   }
      // } else if (timeslotsA[faPtr].start < timeslotsB[fbPtr].start) {
      //   timeslotsA[faPtr] = this.combineTimeslot(timeslotsA[faPtr], timeslotsB[fbPtr++]);
      // } else {
      //   timeslotsB[fbPtr] = this.combineTimeslot(timeslotsA[faPtr++], timeslotsB[fbPtr]);
      // }
    }
    return desiredTimeslots;
  }


  public async searchFairParticipantsFilterOption(fairDatas: Record<string, any>[], participantsProductCategoryIdList: string[]) {
    const fairFilterOption = fairDatas
      .flatMap((x) => x.relatedFair)
      .map((x) => ({
        key: x.fair_code,
        en: x.fair_short_name?.en ?? '',
        tc: x.fair_short_name?.tc ?? '',
        sc: x.fair_short_name?.sc ?? '',
      }));

    // promise.all for get country, nob, stId from contentService
    const promiseResults = await Promise.all(
      [
        this.contentCacheService.retrieveRawJson('COUNTRY'),
        this.contentCacheService.retrieveRawJson('NOB'),
        this.contentCacheService.retrieveRawJson('STRUCTURETAG'),
      ]
    );

    const countrySymbol = Object.keys(promiseResults[0].code).map((countryCode) => ({
      key: promiseResults[0].code[countryCode].code,
      ...promiseResults[0].code[countryCode],
    }));

    const natureofBusinessSymbols = Object.keys(promiseResults[1].code).map((nobCode) => ({
      key: promiseResults[1].code[nobCode].code,
      ...promiseResults[1].code[nobCode],
    }));

    const productCategoryList = Object.keys(promiseResults[2].stId)
      .filter((x) => participantsProductCategoryIdList.includes(x))
      .map((stId) => ({
        key: stId,
        en: promiseResults[2].stId[stId].stEn,
        tc: promiseResults[2].stId[stId].stTc,
        sc: promiseResults[2].stId[stId].stSc,
      }));

    return {
      participatingFair: fairFilterOption,
      countrySymbol,
      natureofBusinessSymbols,
      productCategoryList,
    };
  }

  public async searchFairParticipantsV2(searchQuery: SearchFairParticipantsInterface): Promise<SearchFairParticipantsResponse> {
    return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairService-searchFairParticipantsV2', async (subsegment) => {
      try {
        const { lang, from, keyword, size, fairCodes, filterParticipatingFair, filterCountry, filterNob, filterProductCategory, alphabet, ssoUidList } = searchQuery
        let fairDatas: Record<string, any>[] = [];

        const hiddenRecordList: string[] = [];

        let anySingleFairFromCombinedFair: FairFilterDto[] = []

        if (fairCodes && fairCodes.length) {
          fairDatas = await this.getMultipleFairDatas(fairCodes);

          anySingleFairFromCombinedFair = fairDatas.flatMap(fairRecord => fairRecord.relatedFair.map((relatedFair: { fair_code: string, fiscal_year: string }) => {
            return {
              fairCode: relatedFair.fair_code,
              fiscalYear: relatedFair.fiscal_year
            }
          }))

          if (filterParticipatingFair && filterParticipatingFair?.length) {
            anySingleFairFromCombinedFair = anySingleFairFromCombinedFair.filter(x => filterParticipatingFair.includes(x.fairCode))
          }
        }

        const convertSearchObj: ConvertedFairParticipantSearchDto = {
          filterFair: anySingleFairFromCombinedFair,
          filterCountry,
          filterNob,
          filterProductCategory,
          alphabet,
          ssoUidList,
          hiddenRecordList,
          keyword,
          from,
          size
        }

        const esResult = await this.searchFairParticipantFromES(convertSearchObj)
        return await this.convertESResultToFairParticipantResponse(esResult, lang)
      } catch (error) {
        this.logger.ERROR('', '', error, this.searchFairParticipantsV2.name);
        throw new VepError(VepErrorMsg.Fair_Search_Participant_Error, error.message);
      } finally {
        subsegment?.close();
      }
    })
  }

  private async searchFairParticipantFromES(convertSearchObj: ConvertedFairParticipantSearchDto): Promise<EsResultDto> {
    const index = searchFairParticipantIndex
    let queryBuilder = new CustomEsBuilder()
    const builtQuery = queryBuilder.buildOpenSearchBuyerQuery(convertSearchObj).buildOpenSearchBuyerAggregations().displaySelectedESFields().build()
    return await this.esService.constructESQuery(index, builtQuery)
  }

  private async convertESResultToFairParticipantResponse(esResult: EsResultDto, lang: string): Promise<SearchFairParticipantsResponse> {
    let result = esHelperUtil.replaceHitesResultWithInnerHit(esResult, lang)
    result = esHelperUtil.replaceNestedAggregationResult(result, lang)
    result = this.mapAggregationLabel(result, lang)
    return result
  }

  private async mapAggregationLabel(esResult: ESFairParticipantResponseDto, lang: string): Promise<ESFairParticipantResponseDto>{
    const masterData = await Promise.all(
      [
        this.contentCacheService.retrieveOpenFairCombination(),
        this.contentCacheService.retrieveRawJson("NOB"),
        this.contentCacheService.retrieveRawJson("COUNTRY"),
        this.contentCacheService.retrieveRawJson("STRUCTURETAG_V2")
      ]
    ).then(results => {
      return {
        openFairs: results[0],
        nob: results[1],
        addressCountry: results[2],
        structureTag: results[3],
      }
    })

    esResult.aggregations.participatingFair = esResult.aggregations.participatingFair.map(
      (fair: any) => {
        return {
          ...fair,
          label: masterData.openFairs.openFairsDict[fair.id]?.["fair_short_name"]?.[lang] ?? ""
        }
      }
    )

    esResult.aggregations.natureofBusinessSymbols = esResult.aggregations.natureofBusinessSymbols.map(
      (nob: any) => {
        return {
          ...nob,
          label: masterData.nob["code"][parseInt(nob.id)]?.[lang] ?? ""
        }
      }
    ).filter((nob: any) => nob.id !== "")

    esResult.aggregations.countrySymbol = esResult.aggregations.countrySymbol.map(
      (countrySymbol: any) => {
        return {
          ...countrySymbol,
          label: masterData.addressCountry["code"][countrySymbol.id]?.[lang] ?? ""
        }
      }
    ).filter((countrySymbol: any) => countrySymbol.id !== "")

    const stLangCode = "st" + lang.charAt(0).toUpperCase() + lang.slice(1)
    esResult.aggregations.productCategoryList = esResult.aggregations.productCategoryList.map(
      (productCategory: any) => {
        return {
          ...productCategory,
          label: masterData.structureTag["stId"][productCategory.id]?.[stLangCode] ?? ""
        }
      }
    ).filter((productCategory: any) => productCategory.id !== "")

    return esResult
  }

  public async getFairPeriod(fairCode: string, fairYear: string, type: MeetingType): Promise<Record<string, any>> {
    return this.fairPeriodRepository
      .createQueryBuilder('fairPeriod')
      .where('fairPeriod.fairCode = :fairCode', { fairCode })
      .andWhere('fairPeriod.fairYear = :fairYear', { fairYear })
      .andWhere('fairPeriod.type = :type', { type })
      .getMany()
      .then((res: Record<string, any>[]) => {
        const formattedRes = res
          .map((e: Record<string, any>) => ({
            recordId: e.id,
            fairCode: e.fairCode,
            startTime: e.startTime,
            endTime: e.endTime,
          }))
          .sort((a: Record<string, any>, b: Record<string, any>) => moment(a.startTime).diff(b.startTime));
        return {
          status: 200,
          data: formattedRes,
        };
      })
      .catch((err: any) => ({
        status: 400,
        message: err?.message ?? JSON.stringify(err),
      }));
  }

  public async postFairPeriod(email: string, fairCode: string, fairYear: string, body: { type: MeetingType; timeRange: Record<string, string>[] }): Promise<Record<string, any>> {
    const { timeRange, type } = body;

    // TO-DO update to validate fiscal yr and fairCode pair
    // try {
    //   const result = await this.getWordpressSettings(fairCode);
    //   const data = result.data?.data;
    //   if (!(data?.fair_code === fairCode && data?.vms_project_year === fairYear)) {
    //     return {
    //       status: 400,
    //       message: 'Unknown fairCode and fairYear pair'
    //     };
    //   }
    // } catch (err) {
    //   return {
    //     status: 400,
    //     message: `Unknown fairCode and fairYear pair, ${err.message ?? JSON.stringify(err)}`
    //   };
    // }

    if (Number(type) !== 2 && Number(type) !== 1 && Number(type) !== 0) {
      return {
        status: 400,
        message: 'the input type is wrong',
      };
    }

    if (!timeRange.length) {
      return {
        status: 400,
        message: 'missing data to be inserted',
      };
    }

    if (timeRange.some((time: Record<string, string>) => !moment(time.startTime).isValid() || !moment(time.endTime).isValid())) {
      return {
        status: 400,
        message: 'some timeRange inserted are not valid',
      };
    }

    if (timeRange.some((time: Record<string, string>) => this.checkDateAfter(time.startTime, time.endTime))) {
      return {
        status: 400,
        message: 'some inserted date startTime is over endTime',
      };
    }

    if ( Number(type) === 2 ) {
      const duplicateDateCheck = await this.duplicateDateCheck(timeRange, fairCode, fairYear);
      if (duplicateDateCheck.length) {
        return {
          status: 400,
          message: 'selected date(s) already exists timeslot',
        };
      }
    } else {
      const collideResult = this.complexCheckCollide(timeRange, fairCode, fairYear, type);
      if (
        (await collideResult).length
      ) {
        return {
          status: 400,
          message: 'collision exists between timeRange',
        };
      }
    }

    const newData = body?.timeRange?.map((e: Record<string, string>) => ({
      fairCode,
      fairYear,
      startTime: moment(moment(e.startTime).toDate().setSeconds(0)).toISOString(),
      endTime: moment(moment(e.endTime).toDate().setSeconds(0)).toISOString(),
      type: Number(type),
      createdBy: email,
      creationTime: new Date(),
    }));
    try {
      await getConnection().createQueryBuilder().insert().into('vepFairPeriod').values(newData).execute();

      return {
        status: 200,
      };
    } catch (err) {
      return {
        status: 400,
        message: err?.message ?? JSON.stringify(err),
      };
    }
  }

  public async deleteFairPeriod(email: string, fairCode: string, recordIds: number[]): Promise<any> {
    let startTime: string = '';
    let endTime: string = '';
    try {
      const result = await this.getWordpressSettings(fairCode);
      const data = result.data?.data;

      startTime = data?.fair_registration_start_datetime;
      endTime = data?.fair_registration_end_datetime;

      if (data?.fair_code !== fairCode) {
        return {
          status: 400,
          message: 'Unknown fairCode and fairYear pair',
        };
      }
    } catch (err) {
      return {
        status: 400,
        message: `Unknown fairCode and fairYear pair, ${err.message ?? JSON.stringify(err)}`,
      };
    }

    if (!email || !fairCode) {
      return {
        status: 400,
        message: `Request fail with wrong ${email ? '' : 'email'} ${fairCode ? '' : 'fairCode'}`,
      };
    }

    if (recordIds.length) {
      try {
        //*****Is current meeting validation - Start*****
        const conditionArr = recordIds.map((recordId) => {
          return `id = '${recordId}'`;
        });
        const condition = `WHERE (${conditionArr.join(' OR ')}) AND (fairCode = "${fairCode}") AND (type != 2)`;
        const q = `SELECT id, fairCode, fairYear as fiscalYear, startTime, endTime FROM vepFairDb.vepFairPeriod ${condition}`;
        const timeRanges = await getConnection().query(q);
        const baseUri = this.configService.get<string>('api.C2M_SERVICE_URI') || '';
        const request = await this.httpService.post(`${baseUri}c2m/countMeetingBetweenTimeslot`, {timeRanges}).toPromise();

        const betweenMeetingCount = parseInt(request.data.meetingCount);

        if (betweenMeetingCount > 0) {
          return {
            status: 400,
            // message: `${betweenMeetingCount} meeting(s) exists between timerange`,
            message: `The deletion of date range has affected the existing record, please cancel the related meeting request before apply the deletion.`,
          };
        }
        //*****Is current meeting validation - End*****
        //*****Is between fair registration validation - Start*****
        const getCipTimeslotCondition = `WHERE (${conditionArr.join(' OR ')}) AND (fairCode = "${fairCode}") AND (type = 2)`;
        const getCipTimeslotQ = `SELECT COUNT(*) as cipTimeslotCount FROM vepFairDb.vepFairPeriod ${getCipTimeslotCondition}`;
        const cipTimeslotCountRes = await getConnection().query(getCipTimeslotQ);
        const cipTimeslotCount = parseInt(cipTimeslotCountRes[0].cipTimeslotCount);
        const isBtwRegistration = (moment().isAfter(moment(startTime).tz('Asia/Hong_Kong', true)) && moment().isBefore(moment(endTime).tz('Asia/Hong_Kong', true)));

        if (cipTimeslotCount > 0 && isBtwRegistration) {
          return {
            status: 400,
            message: 'Not allow to remove cip timeslot during fair registration period',
          };
        }
        //*****Is between fair registration validation - End*****

        await getConnection().createQueryBuilder().delete().from('vepFairPeriod').where('vepFairPeriod.id IN (:...ids)', { ids: recordIds }).execute();
        return {
          status: 200,
          betweenMeetingCount
        };
      } catch (err) {
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      }
    } else {
      return {
        status: 400,
        message: 'Please provide your record IDs for deletion',
      };
    }
  }

  public async getBuyerRegistrationStatus(ssoUid: string, projectNumber: string, projectYear: string): Promise<any> {
    const q = `SELECT fr.fairRegistrationStatusId, frs.fairRegistrationStatusCode FROM fairRegistration fr 
              INNER JOIN fairRegistrationStatus frs ON fr.fairRegistrationStatusId = frs.id 
              INNER JOIN fairParticipant fp ON fr.fairParticipantId = fp.id
              WHERE fp.ssoUid = "${ssoUid}" AND fr.projectNumber = "${projectNumber}" AND fr.projectYear = "${projectYear}"
              `;
    const connection: Connection = getConnection();
    return connection.query(q);
  }

  public checkPermission(permissionRequiredArray: number[], userPermissionArray: number[], checkAll: boolean): boolean {
    if (checkAll && permissionRequiredArray.every((v: number) => userPermissionArray.includes(v))) {
      return true;
    }
    if (!checkAll && permissionRequiredArray.some((v: number) => userPermissionArray.includes(v))) {
      return true;
    }
    return false;
  }

  //use fiscal year in BE and DB
  private async complexCheckCollide(timeRange: Record<string, string>[], fairCode: string, year: string, type: number): Promise<any[]> {
    const connection: Connection = getConnection();
    const serverTzArr = await connection.query('SELECT @@global.time_zone as serverTz');

    const currentRecordQuery = `select id, DATE_FORMAT(startTime, "%Y-%m-%d %H:%i") as startTime, 
                                DATE_FORMAT(endTime, "%Y-%m-%d %H:%i") as endTime 
                                from vepFairPeriod where fairCode = "${fairCode}" and fairYear = "${year}" and type = ${type}`;

    const res = await connection.query(currentRecordQuery);
    const isHavingCurrentRecord = Boolean(res.length);

    const startQuery = isHavingCurrentRecord
      ? `WITH vepFairPeriod AS( SELECT 
                        ${res[0]?.id} ID, 
                        "${res[0]?.startTime}" Starttime, 
                        "${res[0]?.endTime}" Endtime `
      : `WITH vepFairPeriod AS( SELECT
                          1 ID, 
                          "${moment(timeRange[0].startTime).tz(serverTzArr[0].serverTz).format('yyyy-MM-DD HH:mm')}" Starttime, 
                          "${moment(timeRange[0].endTime).tz(serverTzArr[0].serverTz).format('yyyy-MM-DD HH:mm')}" Endtime `;

    const middleMsg01 = (index: number): string => `UNION ALL SELECT ${res[index].id},"${res[index].startTime}", "${res[index].endTime}"`;

    let tempQuery = startQuery;

    for (let i = 1; i < res.length; i++) {
      tempQuery += middleMsg01(i);
    }

    const middleMsg02 = (index: number): string =>
      `UNION ALL SELECT ${isHavingCurrentRecord ? <number>res[res.length - 1].id + index + 1 : index + 2}, "${moment(timeRange[index].startTime)
        .tz(serverTzArr[0].serverTz)
        .format('yyyy-MM-DD HH:mm')}", "${moment(timeRange[index].endTime).tz(serverTzArr[0].serverTz).format('yyyy-MM-DD HH:mm')}"`;

    for (let j = isHavingCurrentRecord ? 0 : 1; j < timeRange.length; j++) {
      tempQuery += middleMsg02(j);
    }

    const endQuery = `) SELECT DISTINCT b.* FROM vepFairPeriod t
     JOIN vepFairPeriod b ON 
     t.Starttime<=b.Endtime
     AND t.Endtime>=b.Starttime
     AND b.ID <> t.ID`;

    const queryAll = tempQuery + endQuery;

    return connection.query(queryAll);
  }

  private async duplicateDateCheck(timeRange: Record<string, string>[], fairCode: string, fiscalYear: string) {
    const existCIPDateArr: string[] = [];
    const newInputDateArr: string[] = [];

    let query = `
      SELECT 
        id,
        DATE_FORMAT(startTime, "%Y-%m-%d") as startDate,
        DATE_FORMAT(endTime, "%Y-%m-%d") as endDate,
        startTime,
        endTime,
        CONCAT(DATE_FORMAT(startTime, "%Y%m%d"), DATE_FORMAT(endTime, "%Y%m%d")) as timeslotDateKey,
        GROUP_CONCAT(getTimeslot.timeslot) as timeslotGroup
      FROM vepFairDb.vepFairPeriod as cipTimeslot
      LEFT JOIN (
        SELECT
          id as getTimeslotId,
          CONCAT(DATE_FORMAT(startTime, "%T"), " - ", DATE_FORMAT(endTime, "%T")) as timeslot
        FROM vepFairDb.vepFairPeriod as getTimeslot
      ) getTimeslot ON getTimeslot.getTimeslotId = cipTimeslot.id
      WHERE type = 2 AND fairCode = "${fairCode}" AND fairYear = "${fiscalYear}"
      GROUP BY timeslotDateKey
    `
    .split('\n')
    .join('')
    .replace(/ +/g, ' ');

    const cipTimeslotResult = await getConnection().query(query)
    cipTimeslotResult.map((res: any) => {
      const fromDate = moment(res.startDate)
      const toDate = moment(res.endDate)
      const diff = toDate.diff(fromDate, 'days')
      for (let i = 0; i <= diff; i++) {
        const existDate = moment(res.startDate).add(i, 'days')
        existCIPDateArr.push(moment(existDate).format('YYYY-MM-DD'))
      }
    })

    const newInputDate = timeRange[0]
    const newFromDate = moment(newInputDate.startTime)
    const newToDate = moment(newInputDate.endTime)
    const newDiff = newToDate.diff(newFromDate, 'days')
    for (let i = 0; i <= newDiff; i++) {
      const newDate = moment(newInputDate.startTime).add(i, 'days')
      newInputDateArr.push(moment(newDate).format('YYYY-MM-DD'))
    }

    const compareResult =  newInputDateArr.filter(date => existCIPDateArr.includes(date))
    return compareResult
  }

  private checkDateAfter(startTime: string, endTime: string): boolean {
    return moment(startTime).isAfter(endTime);
  }

  private renderPeriodDays(periods: any[]): { start: string; end: string }[] {
    return periods.flatMap((period: Record<string, any>) => {
      const periodStart = moment(period.start);
      const periodEnd = moment(period.end);

      // Included the last day
      const diffInDays = Math.ceil(periodEnd.diff(periodStart, 'd', true));

      const days = Array(diffInDays).fill(null);

      return days.map((v: any, idx: number) => {
        const start = periodStart.clone().add(idx, 'd');
        const end = start.clone().hour(periodEnd.hour()).minute(periodEnd.minute()).second(periodEnd.second()).millisecond(periodEnd.millisecond());

        // Add 1 day if the end hour is earlier
        if (end.isSameOrBefore(start)) end.add(1, 'd');

        return {
          start: start.toISOString(),
          end: end.toISOString(),
        };
      });
    });
  }

  // this function should be called when two timeslot is overlaped
  private combineTimeslot(timeslotA: Record<string, any>, timeslotB: Record<string, any>): Record<string, any> {
    return {
      start: timeslotA.start < timeslotB.start ? timeslotA.start : timeslotB?.start,
      end: timeslotA.end > timeslotB.end ? timeslotA.end : timeslotB?.end,
    };
  }

  private isOverlap(timeslotA: Record<string, any>, timeslotB: Record<string, any>): boolean {
    return !(timeslotA?.end < timeslotB?.start || timeslotB?.end < timeslotA?.start);
  }

  public async sendRegistrationToSyncSNS(body: buyerRegistrationSyncSNSDto, isRetry?: boolean): Promise<any> {
    try{
    const getFairRegistration = await this.getFairRegistration(body.userId, body.fairCode, body.fiscalYear);
    //@ts-ignore
    if (getFairRegistration?.status === 400) {
      return {
        status: 400,
        //@ts-ignore
        message: getFairRegistration?.message ?? JSON.stringify(getFairRegistration),
      }
    }

    const sns = new AWS.SNS({
      region: this.configService.get('s3.region'),
    });

    let param = {
      fairRegistrationId: getFairRegistration.id,
      status: 'PENDING',
      syncType: 'SBE_SEMINAR_SYNC',
      fairRegistrationSyncSystem: [
        {
          systemCode: 'SBE_SEMINAR',
          eventId: body.eventId,
          language: body.language,
          sbeSystemCode: 'VEP',
          seminarId: body.seminarId,
        },
      ],
      creationTime: Date.now(),
    };

    let snsParam = {
      TopicArn: this.configService.get('sns.topicArc'),
      Message: JSON.stringify(param),
      MessageAttributes: {
        event: {
          DataType: 'String',
          StringValue: 'SBE_SEMINAR_SYNC',
        },
      },
    };

    return sns.publish(snsParam).promise()
    .then((result) => {
      if (result.MessageId !== "") {
        this.updateSNSStatusAfterSent(body.userId, body.seminarId[0])
        isRetry ? this.updateSNSStatusForRetryCount(body.userId, body.seminarId[0]) : null
      }
      return result
    }).then((result) => {
      return {
        status: 200,
        data: {
          MessageId: result?.MessageId ?? '',
          SequenceNumber: result?.SequenceNumber ?? '',
        }
      }
    })
      .catch((error) => ({
        status: 400,
        message: error?.message ?? JSON.stringify(error),
      }));
    } catch (error:any) {
      this.logger.log(JSON.stringify({ section: 'Fair', action: 'sendRegistrationToSyncSNS_error', step: 'error', detail: { error, body } }));
      return {
        status: 400,
        message: error?.message ?? JSON.stringify(error),
      }
    }
  }

  public async getFairRegistration(ssoUid: string, fairCode: string, fiscalYear: string) {
    return this.fairRegistrationRepository
      .createQueryBuilder('fairRegistration')
      .leftJoinAndSelect('fairRegistration.fairParticipant', 'fairParticipant')
      .where('fairParticipant.ssoUid = :ssoUid', { ssoUid })
      .andWhere('fairRegistration.fairCode = :fairCode', { fairCode })
      .andWhere('fairRegistration.fiscalYear = :fiscalYear', { fiscalYear })
      .getOne()
      .then((result) => {
        if (!result || !result?.fairParticipant) {
          return {
            id: undefined,
            status: 400,
            message: 'Could not found any data'
          }
        }
        return result;
      });
  }

  public async getCIPTimeslotGroup(fairCode: string, fiscalYear: string) {
    try {
      const cipTimeslotGroupByDate: any[] = [];
      const cipTimeslotDateArr: any[] = [];

      let query = `
        SELECT 
          id,
          DATE_FORMAT(startTime, "%Y-%m-%d") as startDate,
          DATE_FORMAT(endTime, "%Y-%m-%d") as endDate,
          startTime,
          endTime,
          CONCAT(DATE_FORMAT(startTime, "%Y%m%d"), DATE_FORMAT(endTime, "%Y%m%d")) as timeslotDateKey,
          GROUP_CONCAT(getTimeslot.timeslot ORDER BY startTime ASC) as timeslotGroup
        FROM vepFairDb.vepFairPeriod as cipTimeslot
        LEFT JOIN (
          SELECT
            id as getTimeslotId,
            CONCAT(DATE_FORMAT(startTime, "%T"), " - ", DATE_FORMAT(endTime, "%T")) as timeslot
          FROM vepFairDb.vepFairPeriod as getTimeslot
        ) getTimeslot ON getTimeslot.getTimeslotId = cipTimeslot.id
        WHERE type = 2 AND fairCode = "${fairCode}" AND fairYear = "${fiscalYear}"
        GROUP BY timeslotDateKey
      `
      .split('\n')
      .join('')
      .replace(/ +/g, ' ');

      const cipTimeslotResult = await getConnection().query(query)

      cipTimeslotResult.map((res: any) => {
        const fromDate = moment(res.startDate)
        const toDate = moment(res.endDate)
        const diff = toDate.diff(fromDate, 'days')
        for (let i = 0; i <= diff; i++) {
          const newDate = moment(res.startDate).add(i, 'days')
          cipTimeslotDateArr.push(moment(newDate).format('YYYY-MM-DD'))

          if (
            !cipTimeslotGroupByDate.find(obj => {return obj.date === newDate})
          ) {
            const tampTimeslot: string[] = res.timeslotGroup.split(',');
            const availableTimeRange: {displayTime: string, startTime: string, endTime: string}[] = tampTimeslot.map((timeBubble: string) => {
              const timeslotArr: string[] = timeBubble.split(' - ');
              return {
                displayTime: `${moment(timeslotArr[0], 'HH:mm:ss').format('HH:mm')} - ${moment(timeslotArr[1], 'HH:mm:ss').format('HH:mm')}`,
                startTime: `${moment(newDate).format('YYYY-MM-DD')}T${moment(timeslotArr[0], 'HH:mm:ss').format('HH:mm')}:00+08:00`,
                endTime:   `${moment(newDate).format('YYYY-MM-DD')}T${moment(timeslotArr[1], 'HH:mm:ss').format('HH:mm')}:00+08:00`
              }
            })
            const newGroup = {
              availableDate: moment(newDate).format('YYYY-MM-DD'),
              availableTimeRange: availableTimeRange
            }

            cipTimeslotGroupByDate.push(newGroup)
          }
        }
      })

      return {
        status: 200,
        data: cipTimeslotGroupByDate,
      };
    } catch (err) {
      return {
        status: 400,
        message: err?.message ?? JSON.stringify(err),
      };
    }

  }

  public async updateSNSStatusAfterSent(userId: string, seminarId: string): Promise<any> {
    return this.registrationRepository
      .createQueryBuilder('vepFairSeminarRegistration')
      .update(RegistrationEntity)
      .set({ snsStatus: 1 })
      .where('vepFairSeminarRegistration.userId = :userId', { userId })
      .andWhere('vepFairSeminarRegistration.seminarId = :seminarId', { seminarId })
      .execute()
      .then((result) => {
        this.logger.log(`successfully update SNS status, response:${result}`)
        return {
          status: 200,
          message: "successfully update SNS status"
        };
      })
      .catch((err: any) => {
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

  public async updateSNSStatusForRetryCount(userId: string, seminarId: string): Promise<any> {
    return this.registrationRepository
      .createQueryBuilder('vepFairSeminarRegistration')
      .update(RegistrationEntity)
      .set({ retrySnsCount: () => "retrySnsCount + 1" })
      .where('vepFairSeminarRegistration.userId = :userId', { userId })
      .andWhere('vepFairSeminarRegistration.seminarId = :seminarId', { seminarId })
      .execute()
      .then((result) => {
        this.logger.log(`successfully update retry SNS count, response:${result}`)
        return {
          status: 200,
          message: "successfully update retry SNS count"
        };
      })
      .catch((err: any) => {
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }


  public async updateWatchNowStatus(userId: string, seminarId: string): Promise<any> {
    return this.registrationRepository
      .createQueryBuilder('vepFairSeminarRegistration')
      .update(RegistrationEntity)
      .set({ watchNowStatus: ()=>"watchNowStatus + 1" })
      .where('vepFairSeminarRegistration.userId = :userId', { userId })
      .andWhere('vepFairSeminarRegistration.seminarId = :seminarId', { seminarId })
      .execute()
      .then((result) => {
        this.logger.log(`successfully update watchNow status, response:${result}`)
        return {
          status: 200,
          message: "successfully update watchNow status"
        };
      })
      .catch((err: any) => {
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

  public async updatePlaybackStatus(userId: string, seminarId: string): Promise<any> {
    return this.registrationRepository
      .createQueryBuilder('vepFairSeminarRegistration')
      .update(RegistrationEntity)
      .set({ playBackStatus: () => "playBackStatus + 1" })
      .where('vepFairSeminarRegistration.userId = :userId', { userId })
      .andWhere('vepFairSeminarRegistration.seminarId = :seminarId', { seminarId })
      .execute()
      .then((result) => {
        this.logger.log(`successfully update playback status, response:${result}`)
        return {
          status: 200,
          message: "successfully update playback status"
        };
      })
      .catch((err: any) => {
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

  public async retrySeminarRegistration(): Promise<any> {

    let resultArray: Promise<any>[] = []
    return this.registrationRepository
      .createQueryBuilder('vepFairSeminarRegistration')
      .where('vepFairSeminarRegistration.snsStatus = 0')
      .andWhere('vepFairSeminarRegistration.retrySnsCount < 6 ')
      .orderBy('vepFairSeminarRegistration.id', 'ASC')
      .limit(5)
      .getMany()
      .then((result: any) => {
        if (result.length === 0) {
          this.logger.log(JSON.stringify({
            action: `get target records`,
            section: `Seminar Registration - retrySendingRegistration via SNS`,
            step: 'error',
            detail: `no target records got for sending retry. Result: ${JSON.stringify(result)}`,
          }));
          return Promise.reject({
            status: 400,
            message: `no target records got for sending retry. Result: ${JSON.stringify(result)}`,
          })
        }
        result.forEach((retrySendingSns: any) => {
          retrySendingSns.seminarId = [retrySendingSns.seminarId]
          resultArray.push(this.sendRegistrationToSyncSNS(retrySendingSns, true))
        });

        return Promise.allSettled(resultArray)
      })
        .catch((error) => {
          this.logger.log(JSON.stringify({
            action: `retrySendingRegistration via SNS catch error`,
            section: `Seminar Registration - retrySendingRegistration via SNS`,
            step: 'catch error',
            detail: error?.message ?? JSON.stringify(error),
          }));
          return {
            status: error?.status ?? 400,
            message: error?.message ?? JSON.stringify(error),
          }
        });
  }
}
