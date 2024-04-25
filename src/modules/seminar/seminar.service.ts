/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, HttpException, HttpStatus, Injectable, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import axios, { AxiosResponse } from 'axios';
import moment, { Moment } from 'moment-timezone';
import { AwsV4HttpService } from 'nestjs-aws-v4';
import { In, Repository } from 'typeorm';
import { ElasticacheClusterService } from '../../core/elasticachecluster/elasticachecluster.service';
import { Logger } from '../../core/utils';

import { SbeEndpointRequestDto } from '../../dto/sbeEndpointRequest.dto';
import { RtmpDetailDto, UpdateSeminarRequestDto, VodDetailDto } from '../../dto/seminarRequest.dto';
import { UpsertRatingRequestDto } from '../../dto/upsertRatingSeminarRequest.dto';

import { Connection as ConnectionEntity } from '../../entities/connection.entity';
import { Rating as RatingEntity } from '../../entities/rating.entity';
import { Seminar as SeminarEntity } from '../../entities/seminar.entity';
import { Registration as RegistrationEntity } from '../../entities/registration.entity';

import { SBEService } from '../api/sbe/sbe.service';
import { SBEQuery, Section, SubSection, SBESeminar, DisplayBlock, DisplayBlockItem, RegisterSeminar, RegisterEvent } from '../api/sbe/sbe.type';
import { KolService } from '../kol/kol.service';
import { RtmpService } from '../rtmp/rtmp.service';
import { VodService } from '../vod/vod.service';
import { Seminar, Speaker, SpeakerPanel, LogoPanel, StreamingType, CallbackEvent } from './seminar.type';
import { ConferenceElasticacheService } from '../conference/elasticache.service';
import { SeminarsRegistrationDto, VEPSeminarRegistrationDto } from '../../dto/seminarRegistration.dto';
import { FairRegistration } from '../../dao/FairRegistration';
import { RegistrationService } from '../registration/registration.service';
import { SeminarRegistrationReport } from '../../dao/SeminarRegistrationReport';
import { LambdaService } from '../api/lambda/lambda.service';
import { FairService } from '../fair/fair.service';
import { FairParticipant } from '../../dao/FairParticipant';

// const beforeStartTime = 5;
@Injectable()
export class SeminarService {
  constructor(
    @InjectRepository(FairParticipant) private fairParticipantRepository: Repository<FairParticipant>,
    @InjectRepository(SeminarEntity) private seminarRepository: Repository<SeminarEntity>,
    @InjectRepository(RatingEntity) private rateRepository: Repository<RatingEntity>,
    @InjectRepository(RegistrationEntity) private registrationRepository: Repository<RegistrationEntity>,
    @InjectRepository(ConnectionEntity) private connectionRepository: Repository<ConnectionEntity>,
    @InjectRepository(FairRegistration) private fairRegistrationRepository: Repository<FairRegistration>,
    @InjectRepository(SeminarRegistrationReport) private seminarRegistrationReportRepository: Repository<SeminarRegistrationReport>,
    private configService: ConfigService,
    private http: AwsV4HttpService,
    private sbeService: SBEService,
    private rtmpService: RtmpService,
    private vodService: VodService,
    private kolService: KolService,
    private registrationService: RegistrationService,
    private logger: Logger,
    private fairService: FairService,
    private lambdaService: LambdaService,
    private elastiCacheClusterService: ElasticacheClusterService,
    private conferenceElastiCacheClusterService: ConferenceElasticacheService
  ) {}

  public async healthCheck(): Promise<any> {
    return this.seminarRepository.createQueryBuilder().getMany();
  }

  public async getSeminarDataFromDBorRedis(sbeSeminarIds: string[], vmsProjectCode: string, vmsProjectYear: string, email: string | undefined): Promise<SeminarEntity[]> {
    const redisKey = email?.length ? `seminar_data_${vmsProjectCode}_${vmsProjectYear}_${email}` : `seminar_data_${vmsProjectCode}_${vmsProjectYear}`;
    return this.elastiCacheClusterService
      .getCache(redisKey)
      .then(async (redisContent) => {
        if (!redisContent) {
          const entities: SeminarEntity[] = await this.seminarRepository.find({
            where: { sbeSeminarId: In(sbeSeminarIds) },
          });
          if (!entities?.length) {
            this.logger.log(
              `getSeminarDataFromDBorRedis - error: can't find seminar data from db and redis, sbeSeminarIds: ${JSON.stringify({
                sbeSeminarIds,
                vmsProjectCode,
                vmsProjectYear,
              })}`
            );
            return [];
          }
          this.elastiCacheClusterService.setCache(redisKey, JSON.stringify(entities), 60 * 5).catch((error) => {
            this.logger.log(
              `getSeminarDataFromDBorRedis - error: can't set seminar data into redis, sbeSeminarIds: ${JSON.stringify({
                error,
                sbeSeminarIds,
                vmsProjectCode,
                vmsProjectYear,
              })}`
            );
          });

          return entities;
        }
        const parsedContent = JSON.parse(redisContent);
        console.log('redisContent', redisContent);

        parsedContent.forEach((content: SeminarEntity, index: number) => {
          parsedContent[index] = this.seminarRepository.create(content);
        });
        return parsedContent;
      })
      .catch((error) => {
        this.logger.log(`getSeminarDataFromDBorRedis - error: sbeSeminarIds: ${JSON.stringify(sbeSeminarIds)}, error: ${typeof error === 'string' ? error : JSON.stringify(error)}`);
        return [];
      });
  }

  public async insertSBEDataToTable(sbeParams: SbeEndpointRequestDto): Promise<any> {
    const query: SBEQuery = {
      ...sbeParams,
      displayPaidSeminars: 0,
    };

    const { data } = await this.sbeService.getSeminars(query);
    const subSections = data.sectionList.map((section: Section) => section.subSectionList).flat();
    const seminars = subSections.map((subSection: SubSection) => subSection.seminars).flat();
    const sbeSeminarIds = seminars.map((seminar: SBESeminar) => seminar.id);

    const redisKey = `seminar_data_${query.vmsProjectCode}_${query.vmsProjectYear}*`
    return this.clearAllCacheByPattern(redisKey)
    .then(() => {
      return this.createIfNull(sbeSeminarIds);
    })
    .then(result => {
      return {
        status: 200,
        result
      }
    })
    .catch(error => {
      this.logger.log(`insertSBEDataToTable error - detail: ${JSON.stringify({query, sbeSeminarIds})}, error: ${typeof error === "string" ? error : JSON.stringify(error)}`);
      return {
        status: 400,
        message: `errno: ${error?.errno}, sqlMessage: ${error?.sqlMessage}, sql: ${error?.sql}`
      }
    })
  }

  public async findAll(sbeParams: SbeEndpointRequestDto): Promise<Seminar[]> {
    const query: SBEQuery = {
      ...sbeParams,
      displayPaidSeminars: 0,
      email: undefined
    };

    const { data } = await this.sbeService.getSeminars(query);
    const subSections = data.sectionList.map((section: Section) => section.subSectionList).flat();
    const seminars = subSections.map((subSection: SubSection) => subSection.seminars).flat();
    const sbeSeminarIds = seminars.map((seminar: SBESeminar) => seminar.id);

    const entities: SeminarEntity[] = await this.getSeminarDataFromDBorRedis(sbeSeminarIds, query.vmsProjectCode, query.vmsProjectYear!, query.email);

    const entitiesSemId = entities.map((e: Record<string, any>) => e.sbeSeminarId);
    const newExtraSeminarIdArr = sbeSeminarIds.filter((semId: string) => entitiesSemId.indexOf(semId) === -1);

    const idMappingDict: Record<string, SeminarEntity> = entities.reduce((prev: Record<string, SeminarEntity>, entity: SeminarEntity) => ({ ...prev, [entity.sbeSeminarId]: entity }), {});

    // Map to Seminars
    return Promise.all(
      seminars
        .filter((e: SBESeminar) => !newExtraSeminarIdArr.includes(e.id))
        .map((seminar: SBESeminar) => {
          const mStartTime = moment(seminar.startTime).tz('Asia/Hong_Kong');
          const mEndTime = moment(seminar.endTime).tz('Asia/Hong_Kong');
          const offsetHours = Math.floor(mStartTime.utcOffset() / 60);

          const displayBlocks = seminar.displayBlock.filter((block: DisplayBlock) => block.blockType === 'SPEAKER');

          const logoBlocks = seminar.displayBlock.filter((block: DisplayBlock) => block.blockType === 'SPONSOR');

          const logoPanels: LogoPanel[] = logoBlocks.map((block: DisplayBlock) => {
            const logos: string[] = block.displayBlockItem.map((blockItem: DisplayBlockItem) => blockItem.imageUrl);
            const title = block.type.toUpperCase().replace(/[`~!@#$%^&*()_|+=?;：:'",.<>{}[\]\\/]/gi, '');
            return { title, logos };
          });

          // Map to Panels
          const speakerPanels: SpeakerPanel[] = displayBlocks.map((block: DisplayBlock) => {
            // Map to Speakers
            const speakers: Speaker[] = block.displayBlockItem.map((blockItem: DisplayBlockItem) => ({
              id: blockItem.id,
              name: blockItem.name,
              title: blockItem.position,
              avatar: blockItem.imageUrl,
              profile: blockItem.description,
              speakerUrl:blockItem.speakerUrl,
              company: {
                name: blockItem.company,
                logo: blockItem.companyLogoUrl,
              },
            }));

            return {
              title: block.type.toUpperCase().replace(/[`~!@#$%^&*()_|+\-=?;：:'",.<>{}[\]\\/]/gi, ''),
              speakers,
            };
          });

          const streamingUrl = this.getStreamingUrl(idMappingDict[seminar.id], mEndTime);

          return {
            eventId: data.eventId,
            id: seminar.id,
            name: seminar.name,
            description: seminar.remarks,
            displayStatus: true,
            formattedStartDate: mStartTime.format('ddd, DD MMM YYYY').toUpperCase(),
            formattedDuration: `${mStartTime.format('HH:mm')}-${mEndTime.format('HH:mm')} (UTC/GMT+${offsetHours})`,
            startAt: seminar.startTime,
            endAt: seminar.endTime,
            now: moment().format(), // for frontend
            fulled: seminar.isFull === '1',
            registrationEnabled: seminar.isRegistrationStatusEnable === '1',
            registrationUrl: '', // TO-DO
            fullProgrammeUrl: seminar.attachmentUrl,
            language: seminar.language,
            type: seminar.semType,
            location: seminar.venue,
            bookmarked: seminar.isBookmarked === '1',
            qualificationLogo: [seminar.iconImageUrl1.trim(), seminar.iconImageUrl2.trim(), seminar.iconImageUrl3.trim(), seminar.iconImageUrl4.trim()].filter(Boolean),
            logoPanels,
            speakerPanels,
            // within event start/end or not end manually
            isLive: moment().isBetween(mStartTime, mEndTime) && !idMappingDict[seminar.id]?.endAt,
            nature: seminar.semNature,
            streamingType: idMappingDict[seminar.id].streamingType,
            isPublic: seminar.semLiveType === 'PU',
            isAbleToWatch: moment().isAfter(mStartTime.subtract(idMappingDict[seminar.id].beforeStartTime, 'm')),
            isRegistered: seminar.isRegistered === '1', // To-Do
            eventDetail: idMappingDict[seminar.id]?.convert(),
            isVideoUrlReady: !!streamingUrl,
            streamingUrl,
            vcPlaybackUrl: seminar.vcPlaybackUrl,
            isFull: seminar.isFull,
            vcPlaybackSetting: seminar.vcPlaybackSetting,
            beforeStartTime: idMappingDict[seminar.id].beforeStartTime,
            feedbackFormId: idMappingDict[seminar.id].feedbackFormId,
            registrationFormId: idMappingDict[seminar.id].registrationFormId,
            questionContent: seminar.questionContent,
            option1: seminar.option1,
            option1Ans: seminar.option1Ans,
            option2: seminar.option2,
            option2Ans: seminar.option2Ans,
            option3: seminar.option3,
            option3Ans: seminar.option3Ans,
            isCheckedOption1: seminar.isCheckedOption1,
            isCheckedOption2: seminar.isCheckedOption2,
            isCheckedOption3: seminar.isCheckedOption3,
            isDisplayOption1: seminar.isDisplayOption1,
            isDisplayOption1Ans: seminar.isDisplayOption1Ans,
            isDisplayOption2: seminar.isDisplayOption2,
            isDisplayOption2Ans: seminar.isDisplayOption2Ans,
            isDisplayOption3: seminar.isDisplayOption3,
            isDisplayOption3Ans: seminar.isDisplayOption3Ans,
            isDisplayQuestion: seminar.isDisplayQuestion,
            vmsProjectCode: sbeParams.vmsProjectCode
          };
        })
    );
  }

  public async findSeminar(sbeSeminarId: string, sbeParams: SbeEndpointRequestDto): Promise<Nullable<Seminar>> {
    const seminars: Seminar[] = await this.findAll(sbeParams);
    const targetSeminar = seminars.find((seminar: Seminar) => seminar.id === sbeSeminarId);

    return targetSeminar || null;
  }

  public async findOne(query: Record<string, any>): Promise<SeminarEntity> {
    return this.seminarRepository.findOneOrFail(query);
  }

  public async update(ssouid: string, updateEventDto: UpdateSeminarRequestDto): Promise<SeminarEntity | Record<string, any>> {
    let seminar: SeminarEntity = await this.seminarRepository.findOneOrFail({ sbeSeminarId: updateEventDto.sbeSeminarId });
    if (parseInt(updateEventDto.beforeStartTime.toString(), 10) !== updateEventDto.beforeStartTime || Number(updateEventDto.beforeStartTime) < 0) {
      throw new HttpException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Value of Minutes_before_to_display_watch_now_button_for_live_event should be a non-negative integer'
      }, HttpStatus.BAD_REQUEST);
    }

    seminar.surveyLink = updateEventDto.surveyLink;
    seminar.beforeStartTime = updateEventDto.beforeStartTime;
    seminar.feedbackFormId = updateEventDto.feedbackFormId;
    seminar.registrationFormId = updateEventDto.registrationFormId;
    seminar.pigeonholeSessionId = updateEventDto.pigeonholeSessionId;
    seminar.pigeonholePasscode = updateEventDto.pigeonholePasscode;
    seminar.streamingType = updateEventDto.streamingType;
    seminar.lastUpdatedAt = new Date();
    seminar.lastUpdatedBy = ssouid;
    await this.seminarRepository.save(seminar);

    // update rtmp
    if (updateEventDto.streamingType === StreamingType.LIVE) {
      void this.kolService.clear(ssouid, seminar.id);
      void this.vodService.clear(ssouid, seminar.id);
      const rtmpDtos = updateEventDto.rtmp;
      if (rtmpDtos) {
        await this.rtmpService.upsert(
          ssouid,
          seminar.id,
          rtmpDtos.map((rtmpDto: RtmpDetailDto) => rtmpDto.convert())
        );
      }
    }

    // update vod
    if (updateEventDto.streamingType === StreamingType.VOD) {
      void this.rtmpService.clear(ssouid, seminar.id);
      void this.kolService.clear(ssouid, seminar.id);
      const vodDtos = updateEventDto.vod;
      if (vodDtos) {
        await this.vodService.upsert(
          ssouid,
          seminar.id,
          vodDtos.map((vodDto: VodDetailDto) => vodDto.convert())
        );
      }
    }

    // update kol
    if (updateEventDto.streamingType === StreamingType.KOL) {
      void this.vodService.clear(ssouid, seminar.id);
      void this.rtmpService.clear(ssouid, seminar.id);
      const kolDto = updateEventDto.kol;
      if (kolDto) {
        await this.kolService.upsert(ssouid, seminar.id, [kolDto.convert()]);
      }
    }

    return this.seminarRepository.findOneOrFail({ id: seminar.id });
  }

  public async upsertRating(ssouid: string, upsertRatingDto: UpsertRatingRequestDto): Promise<RatingEntity> {
    let ratingEntity = await this.rateRepository.findOne({
      sbeSeminarId: upsertRatingDto.sbeSeminarId,
      lastUpdatedBy: ssouid,
    });

    if (!ratingEntity) {
      const now = new Date();
      ratingEntity = new RatingEntity();
      ratingEntity.sbeSeminarId = upsertRatingDto.sbeSeminarId;
      ratingEntity.creationTime = now;
      ratingEntity.lastUpdatedAt = now;
      ratingEntity.lastUpdatedBy = ssouid;
    }

    ratingEntity.rate = upsertRatingDto.rate;
    return this.rateRepository.save(ratingEntity);
  }

  public async getVepFairSeminarRegistration(userId: string, seminarId: string): Promise<any> {
    return this.registrationRepository
      .createQueryBuilder('vepFairSeminarRegistration')
      .where('vepFairSeminarRegistration.userId = :userId', { userId })
      .andWhere('vepFairSeminarRegistration.seminarId = :seminarId', { seminarId })
      .getMany()
      .then((registrationRow) => {
        return registrationRow;
      })
      .catch((err) => {
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

  public async postSeminarRegistrationRecord(registration: VEPSeminarRegistrationDto[]): Promise<any> {
    const pendingRecords: Record<string, any>[] = [];
    let apiResult: any = {};
    // assuming always one user

    const existingSeminarRecord = await this.getVepFairSeminarRegistration(registration[0].userId, registration[0].seminarId);

    // check existing record if duplicate
    if (existingSeminarRecord.find((seminar: any) => seminar.userId == registration[0].userId && seminar.seminarId == registration[0].seminarId)) {
      this.logger.log(`Record already exists in DB error: ${(apiResult as any)?.error?.message ?? JSON.stringify((apiResult as any)?.error)}`);
      return {
        status: 405,
        message: 'Record already exists in DB',
      };
    }

    //Buyer Registration 
    if (registration[0].checkDisclaimers) {
      apiResult = await this.registrationService.submitShortRegistration({
        fairCode: registration[0].fairCode,
        ssoUid: registration[0].userId,
        euConsentStatus: registration[0].euConsentStatus ?? false,
        badgeConsent: registration[0].badgeConsent ?? false,
        c2mConsent: registration[0].c2mConsent ?? false,
        registrationDetailConsent: registration[0].registrationDetailConsent ?? false,
      });
      if (!apiResult?.isSubmitSuccess || !apiResult?.registrationNo?.length) {
        this.logger.log(`Submit short registration form  error: ${(apiResult as any)?.error?.message ?? JSON.stringify((apiResult as any)?.error)}`);
        return {
          status: 400,
          message: (apiResult as any)?.error,
          // message: {
          //   code: (apiResult as any)?.code,

          // }
        };
      }
    }

    const fairRegistrationsData = await this.fairParticipantRepository.find({
      relations: ['fairRegistrations'],
      select: ['ssoUid'],
      where: {
        ssoUid: registration[0].userId
      }
    });

    try {
      const fairReg = fairRegistrationsData.length
        ? fairRegistrationsData[0].fairRegistrations.find((e:Record<string, any>) => (e.fairCode === registration[0].fairCode && e.fiscalYear === registration[0].fiscalYear))
        : <Record<string, any>>{};
      apiResult.registrationNo = `${fairReg?.serialNumber}${fairReg?.projectYear?.substring(fairReg?.projectYear.length - 2)}${fairReg?.sourceTypeCode}${fairReg?.visitorTypeCode}${fairReg?.projectNumber}`;
    } catch (error) {
      return {
        status: 400,
        message: `error: ${error?.error}, sqlMessage: ${error?.sqlMessage}, sql: ${error?.sql}`,
      };
    }

    registration.forEach(async (record) => {
      const now = new Date();
      const eventEntity = new RegistrationEntity();
      eventEntity.fairCode = record.fairCode;
      eventEntity.fiscalYear = record.fiscalYear;
      eventEntity.seminarRegistrationType = record.seminarRegistrationType || 'All';
      eventEntity.userRole = record.userRole;
      eventEntity.userId = record.userId;
      eventEntity.eventId = record.eventId;
      eventEntity.systemCode = record.systemCode || 'VEP';
      eventEntity.paymentSession = record.paymentSession;
      eventEntity.isCheckedOption1 = record.isCheckedOption1 == 'Y' ? 'yes' : 'no';
      eventEntity.isCheckedOption2 = record.isCheckedOption2 == 'Y' ? 'yes' : 'no';
      eventEntity.isCheckedOption3 = record.isCheckedOption3 == 'Y' ? 'yes' : 'no';
      eventEntity.option1Question = record.option1Question;
      eventEntity.option2Question = record.option2Question;
      eventEntity.option3Question = record.option3Question;
      eventEntity.option1Ans = record.option1Ans;
      eventEntity.option2Ans = record.option2Ans;
      eventEntity.option3Ans = record.option3Ans;
      eventEntity.seminarId = record.seminarId;
      eventEntity.seminarRegStatus = '1';
      eventEntity.shouldSendConfirmationEmail = '0';
      eventEntity.snsStatus = record.snsStatus? 1 : 0 ;
      eventEntity.emailNotiStatus = 0;
      eventEntity.webNotiStatus = 0;
      eventEntity.watchNowStatus = 0;
      eventEntity.playBackStatus = 0;
      eventEntity.source = record.source;
      eventEntity.startTime = moment(record.startTime).tz('Asia/Hong_Kong').format('YYYY-MM-DD HH:mm:ss');
      eventEntity.endTime = moment(record.endTime).tz('Asia/Hong_Kong').format('YYYY-MM-DD HH:mm:ss');
      eventEntity.creationTime = now;
      eventEntity.createdBy = record.userId;
      eventEntity.lastUpdatedBy = record.userId;
      eventEntity.lastUpdatedTime = now;
      pendingRecords.push(eventEntity);
    });

    return this.registrationRepository
      .save(pendingRecords)
      .then((result: any) => {
        this.logger.log(`save registration records success, detail: ${JSON.stringify(result)}, records: ${JSON.stringify(pendingRecords)}`);
        return {
          status: 200,
          registrationNo: apiResult?.registrationNo,
        };
      })
      .catch((error) => {
        return {
          status: 400,
          message: `error: ${error?.error}, sqlMessage: ${error?.sqlMessage}, sql: ${error?.sql}`,
        };
      });
  }

  public async getFairRegistrationInfo(userData: Record<string, any>[]): Promise<any> {
    const query = this.fairRegistrationRepository.createQueryBuilder('fairRegistration').leftJoinAndSelect('fairRegistration.fairParticipant', 'fairParticipant');

    for (let i = 0; i < userData.length; i++) {
      if (i === 0) {
        query.where('(fairParticipant.ssoUid = :ssouid AND fairRegistration.fairCode = :fairCode AND fairRegistration.fiscalYear = :fiscalYear)', {
          ssouid: userData[i].userId,
          fairCode: userData[i].fairCode,
          fiscalYear: userData[i].fiscalYear,
        });
      } else {
        query.orWhere(`(fairParticipant.ssoUid = :ssouid${i} AND fairRegistration.fairCode = :fairCode${i} AND fairRegistration.fiscalYear = :fiscalYear${i})`, {
          [`ssouid${i}`]: userData[i].userId,
          [`fairCode${i}`]: userData[i].fairCode,
          [`fiscalYear${i}`]: userData[i].fiscalYear,
        });
      }
    }
    const result = await query.getMany();
    return result.map((fairRegistration: Record<string, any>, index) => {
      fairRegistration.registrationNo = userData[index].registrationNo;
      return fairRegistration;
    });
  }

  public async postRegisterEvents(eventRegistrationDto: RegisterEvent): Promise<any> {
    const eventRegistration: RegisterEvent = {
      companyName: eventRegistrationDto.companyName,
      countryCode: eventRegistrationDto.countryCode,
      email: eventRegistrationDto.email,
      eventId: eventRegistrationDto.eventId,
      firstName: eventRegistrationDto.firstName,
      lastName: eventRegistrationDto.lastName,
      language: eventRegistrationDto.language,
      registrationNo: eventRegistrationDto.registrationNo,
      title: eventRegistrationDto.title,
      systemCode: eventRegistrationDto.systemCode,
      salutation: eventRegistrationDto.salutation,
    };

    return this.sbeService.postRegisterEvent(eventRegistration);
  }

  public async postRegisterSeminar(SeminarsRegistrationDto: SeminarsRegistrationDto): Promise<any> {
    let seminarRegister: {
      isCheckedOption1: string;
      isCheckedOption2: string;
      isCheckedOption3: string;
      option1Ans: string;
      option2Ans: string;
      option3Ans: string;
      seminarId: string;
      seminarRegStatus: string;
    }[] = [];
    if (SeminarsRegistrationDto) {
      SeminarsRegistrationDto.seminarReg.map((seminar: any) => {
        seminarRegister.push({
          isCheckedOption1: seminar.isCheckedOption1 == 'Y' ? '1' : '0',
          isCheckedOption2: seminar.isCheckedOption2 == 'Y' ? '1' : '0',
          isCheckedOption3: seminar.isCheckedOption3 == 'Y' ? '1' : '0',
          option1Ans: seminar.option1Ans ?? '',
          option2Ans: seminar.option2Ans ?? '',
          option3Ans: seminar.option3Ans ?? '',
          seminarId: seminar.seminarId,
          seminarRegStatus: '1',
        });
      });
    }

    const seminarRegistration: RegisterSeminar = {
      eventId: SeminarsRegistrationDto.eventId,
      language: SeminarsRegistrationDto.language,
      paymentSession: SeminarsRegistrationDto.paymentSession,
      registrationNo: SeminarsRegistrationDto.registrationNo,
      seminarReg: seminarRegister,
      shouldSendConfirmationEmail: SeminarsRegistrationDto.shouldSendConfirmationEmail,
      systemCode: SeminarsRegistrationDto.systemCode,
    };

    return this.sbeService.postRegisterSeminar(seminarRegistration);
  }

  public async getMultiBuyerProfile(buyerRecord: Record<string, any>[]): Promise<any> {
    const basePath = this.configService.get<string>('api.BUYER_SERVICE_URI') || '';

    const apiPromise: Promise<any>[] = [];
    buyerRecord.forEach((record) => {
      apiPromise.push(
        axios.post(
          `${basePath}profile`,
          { fairCodes: record.fairCodes },
          {
            headers: {
              'x-access-token': '0',
              'x-sso-uid': `${record.ssouid}`,
              'x-email-id': `${record.email}`,
              'x-sso-firstname': '0',
              'x-sso-lastname': '0',
            },
          }
        )
      );
    });

    return Promise.allSettled(apiPromise).then((result) => {
      const responseData: any = [];
      result.forEach((res) => {
        if (res.status === 'fulfilled' && res.value) {
          responseData.push(res.value);
        }
      });

      return responseData;
    });
  }

  public async getBuyerProfilePreferredLanguage(buyerRecord: Record<string, any>): Promise<any> {
    const basePath = this.configService.get<string>('api.BUYER_SERVICE_URI') || '';
    return axios
      .post(
        `${basePath}profile`,
        { fairCodes: [buyerRecord.fairCode] },
        {
          headers: {
            'x-access-token': '0',
            'x-sso-uid': `${buyerRecord.fairParticipant.ssoUid}`,
            'x-email-id': `${buyerRecord.fairParticipant.emailId}`,
            'x-sso-firstname': '0',
            'x-sso-lastname': '0',
          },
        }
      )
      .then((result) => {
        return result?.data?.data?.preferredLanguage || 'en';
      })
      .catch((error) => {
        this.logger.log(`getBuyerProfilePreferredLanguage error: ${error?.message ?? JSON.stringify(error)}`);
        return 'en';
      });
  }

  public async findOneRating(sbeSeminarId: string, ssouid: string): Promise<RatingEntity> {
    return this.rateRepository.findOneOrFail({ sbeSeminarId, lastUpdatedBy: ssouid });
  }

  public async findRatings(sbeSeminarId: string): Promise<RatingEntity[]> {
    return this.rateRepository.find({ sbeSeminarId });
  }

  public clearAllCacheByPattern(keyPattern: string): Promise<any> {
    return this.elastiCacheClusterService
      .getKeysByPattern(keyPattern)
      .then((result: string[]) => {
        const deletePromise: Promise<any>[] = [];
        result?.length &&
          result.forEach((key) => {
            deletePromise.push(
              this.elastiCacheClusterService
                .deleteCacheByKey(key)
                .then(() => {
                  return `Successfully delete ${key} from redis`;
                })
                .catch((error) => {
                  return `Error deleteing ${key} from redis`;
                })
            );
          });
          return Promise.allSettled(deletePromise);
      })
      .then((result) => {
        return {
          status: 200,
          result,
        };
      })
      .catch((error) => {
        return {
          status: 400,
          message: error?.message ?? JSON.stringify(error),
        };
      });
  }

  private kickUserAndDeleteCache(cacheKey: string, connectionId: string): Promise<any> {
    return this.actionCallbackToUser(CallbackEvent.CHECK_MULTI_LOGIN, connectionId, {})
      .then((result) => {
        this.logger.log(`kickUserAndDeleteCache step1 result: ${JSON.stringify(result)}`);
        return this.elastiCacheClusterService.deleteCacheByKey(cacheKey);
      })
      .then((result) => {
        this.logger.log(`kickUserAndDeleteCache step2 result: ${JSON.stringify(result)}`);
        return Promise.resolve({
          status: 200,
        });
      })
      .catch((error) => {
        this.logger.log(`kickUserAndDeleteCache error: ${JSON.stringify(error)}`);
        return Promise.resolve({
          status: 400,
          data: `cacheKey: ${cacheKey}, connectionId: ${connectionId}`,
          error: error?.response?.data ?? error?.message ?? JSON.stringify(error),
        });
      });
  }

  public joinSeminarCachePublic(connectionId: string, sbeSeminarId: string): Promise<any> {
    const refCacheKey = `seminarCache_${sbeSeminarId}_public`;
      return this.elastiCacheClusterService
      .getCache(refCacheKey)
      .then((seminarCachePublic: any): any => {
        this.logger.log(`joinSeminarCachePublic step1 result: ${seminarCachePublic}`);

        if (!seminarCachePublic?.length) {
          return this.elastiCacheClusterService.setCache(refCacheKey, JSON.stringify([connectionId]));
        }

        let parsedJson = JSON.parse(seminarCachePublic);
        parsedJson.push(connectionId);
        parsedJson =  [...new Set(parsedJson)];
        return this.elastiCacheClusterService.setCache(refCacheKey, JSON.stringify(parsedJson));
      })
      .catch((error) => {
        this.logger.log(`joinSeminarCachePublic error: ${JSON.stringify(error)}`);
        return {
          status: 400,
          error: `${error}`,
        };
      });
  }

  public joinSeminarCache(connectionId: string, sbeSeminarId: string, ssoUid: string): Promise<any> {
    const refCacheKey = `seminarCache_${sbeSeminarId}_${ssoUid}`;
    return this.elastiCacheClusterService
      .getCache(refCacheKey)
      .then((oldConnectionId: any): any => {
        this.logger.log(`joinSeminarCache step1 result: ${oldConnectionId}`);

        if (oldConnectionId?.length && ssoUid?.length) {
          return this.kickUserAndDeleteCache(refCacheKey, oldConnectionId);
        }

        return Promise.resolve({
          status: 200,
          message: `Cant find target cache: ${refCacheKey}`,
        });
      })
      .then((result) => {
        this.logger.log(`joinSeminarCache step2 result: ${JSON.stringify(result)}`);
        return this.elastiCacheClusterService.setCache(refCacheKey, connectionId);
      })
      .catch((error) => {
        this.logger.log(`joinSeminarCache error: ${JSON.stringify(error)}`);
        return {
          status: 400,
          error: `${error}`,
        };
      });
  }

  public async joinSeminar(connectionId: string, sbeSeminarId: string, ssoUid: string): Promise<ConnectionEntity> {
    const seminar = await this.findOne({ sbeSeminarId });
    let connection = await this.connectionRepository.findOne({ connectionId });

    if (connection) {
      throw new BadRequestException(`${connectionId} connection exists on ${sbeSeminarId} seminar already`);
    }

    connection = new ConnectionEntity();
    connection.seminarId = seminar.id;
    connection.connectionId = connectionId;
    if (ssoUid) {
      connection.ssoUid = ssoUid;
    }
    connection.creationTime = new Date();
    connection.disconnectedAt = null;
    return this.connectionRepository.save(connection);
  }

  public async endSeminar(sbeSeminarId: string, isPublic: boolean): Promise<any> {
    let isConference = false;
    return this.seminarRepository
      .findOne({ sbeSeminarId })
      .then((result: SeminarEntity | undefined) => {
        this.logger.log(`endSeminar step1 result: ${JSON.stringify(result)}`);
        if (!result) {
          return Promise.reject({
            status: 400,
            message: 'Couldnt find the seminar from db',
          });
        }
        result.endAt = new Date();
        return this.seminarRepository.save(result);
      })
      .then((result) => {
        this.logger.log(`endSeminar step2 result: ${JSON.stringify(result)}`);
        return this.elastiCacheClusterService.getKeysByPattern(`seminarCache_${sbeSeminarId}*`);
      })
      .then(async (cacheKeys: string[]) => {
        if (!cacheKeys?.length) {
          const cacheKeysFromConference: string[] = await this.conferenceElastiCacheClusterService.getKeysByPattern(`*_${sbeSeminarId}`);

          if (!cacheKeysFromConference?.length) {
            return Promise.reject({
              status: 400,
              message: 'Couldnt find any seminar cache from cache',
            });
          } else {
            isConference = true;
            return Promise.all([
              cacheKeysFromConference,
              Promise.allSettled(
                cacheKeysFromConference.map((key: string) =>
                  this.conferenceElastiCacheClusterService
                    .getCache(key)
                    .then((value) => {
                      const parsedValue = JSON.parse(value);
                      return JSON.stringify(parsedValue.connectionId);
                    })
                    .catch((error) => {
                      return Promise.reject({
                        status: 400,
                        message: JSON.stringify(error),
                      });
                    })
                )
              ),
            ]);
          }
        }

        if (isPublic) {
          return Promise.all([cacheKeys, Promise.allSettled([this.elastiCacheClusterService.getCache(`seminarCache_${sbeSeminarId}_public`)])]);
        }
        return Promise.all([cacheKeys, Promise.allSettled(cacheKeys.map((key: string) => this.elastiCacheClusterService.getCache(key)))]);
      })
      .then(([cacheKeys, connectionIds]) => {
        if (!connectionIds?.length) {
          return Promise.reject({
            status: 400,
            message: 'Couldnt find any seminar connection id from cache',
          });
        }
        const endSeminarPromise: Promise<any>[] = [];
        const failToGetConnectionIdByCacheKey: any[] = [];
        connectionIds.forEach((promiseSettledResult, index: number) => {
          if (promiseSettledResult.status === 'fulfilled') {
            if (isPublic || isConference) {
              const parsedJsonConnectionIds = JSON.parse(promiseSettledResult.value);
              parsedJsonConnectionIds.forEach((connectionId: string) => {
                endSeminarPromise.push(this.actionCallbackToUser(CallbackEvent.CLOSE_LIVE_STREAMING, connectionId, {}));
              });
            } else {
              endSeminarPromise.push(this.actionCallbackToUser(CallbackEvent.CLOSE_LIVE_STREAMING, promiseSettledResult.value, {}));
            }
          } else {
            failToGetConnectionIdByCacheKey.push({
              error: promiseSettledResult.reason,
              index,
              detail: cacheKeys[index],
            });
          }
        });

        this.logger.log(`endSeminar step3 endSeminarPromise: ${JSON.stringify(endSeminarPromise)}, failToGetConnectionIdByCacheKey: ${JSON.stringify(failToGetConnectionIdByCacheKey)}`);
        return Promise.allSettled(endSeminarPromise);
      })
      .then((result) => {
        this.logger.log(`kickUserAndDeleteCache finish result: ${JSON.stringify(result)}`);
        return result;
      })
      .catch((error) => {
        this.logger.log(`kickUserAndDeleteCache error: ${JSON.stringify(error)}`);
        return {
          status: error?.status ?? 400,
          message: error?.status === 400 ? error?.message : `errno: ${error?.errno}, sqlMessage: ${error?.sqlMessage}, sql: ${error?.sql}`,
        };
      });
  }

  public async checkMultiLogin(sbeSeminarId: string, ssoUid: string, userUuid: string): Promise<Record<string, any>> {
    const seminar = await this.findOne({ sbeSeminarId });
    const connections = await this.connectionRepository.find({ seminarId: seminar.id });

    const returnPromise = connections.map(async (connection: ConnectionEntity): Promise<any> => {
      await this.actionCallbackToUser(CallbackEvent.CHECK_MULTI_LOGIN, connection.connectionId, { sbeSeminarId, ssoUid, userUuid });
    });

    const responses = await Promise.allSettled(returnPromise);

    return {
      responses,
    };
  }

  public async actionCallbackToUser(event: CallbackEvent, targetConnectionId: string, payload: Record<string, any> = {}): Promise<AxiosResponse> {
    const wsUrl = this.configService.get<string>('api.WEBSOCKET_URI_SEMINAR');
    const url = `${wsUrl}/@connections/${targetConnectionId}`;

    return this.http.post(url, { event, payload }).toPromise();
  }

  public async killConnection(connectionId: string): Promise<any> {
    const wsUrl = this.configService.get<string>('api.WEBSOCKET_URI_SEMINAR');
    const url = `${wsUrl}/@connections/${connectionId}`;

    return this.http.delete(url).toPromise();
  }

  public getLive(@Query() query: any): Seminar[] {
    if (query.fairCode !== undefined && query.lang !== undefined) {
      return [];
    }

    throw new BadRequestException('Missing Parameters');
  }

  private async createIfNull(seminarIds: string[]): Promise<any> {
    const now: Date = new Date();
    return this.seminarRepository
      .createQueryBuilder()
      .insert()
      .into(SeminarEntity)
      .values(
        seminarIds.map((id: string) => ({
          sbeSeminarId: id,
          creationTime: now,
          lastUpdatedAt: now,
          endAt: null,
        }))
      )
      .orUpdate({ conflict_target: ['sbeSeminarId'], overwrite: ['lastUpdatedAt'] })
      .execute();
  }

  private getStreamingUrl(seminar: SeminarEntity, endAt: Moment): Nullable<string> {
    let liveUrl = null;
    let playbackUrl = null;

    const isPlayback = endAt.isSameOrBefore() || !!seminar.endAt;

    if (seminar.streamingType === StreamingType.KOL) {
      liveUrl = seminar?.kol?.platformUrl;
      playbackUrl = seminar?.kol?.playbackVideo?.fileUrl;
    } else if (seminar.streamingType === StreamingType.VOD) {
      const defaultVideo = seminar?.vods?.find((v: any) => v.defaultLanguage);
      liveUrl = defaultVideo?.liveVideo?.fileUrl;
      playbackUrl = defaultVideo?.playbackVideo?.fileUrl;
    } else if (seminar.streamingType === StreamingType.LIVE) {
      const defaultVideo = seminar?.rtmps?.find((v: any) => v.defaultLanguage);
      liveUrl = defaultVideo?.liveUrl;
      playbackUrl = defaultVideo?.playbackVideo?.fileUrl;
    }

    playbackUrl = playbackUrl || null;
    liveUrl = liveUrl || null;

    return isPlayback ? playbackUrl : liveUrl;
  }
  public seminarPing(connectionId: string) {
    return this.actionCallbackToUser(CallbackEvent.SEMINAR_PONG, connectionId, {})
      .then((result) => {
        return {
          status: 200,
          result: result.data,
        };
      })
      .catch((error) => {
        return {
          status: 400,
          message: error.message ?? JSON.stringify(error),
        };
      });
  }

  public async getSeminarRegistrationAns(userId: string, seminarId: string[]): Promise<any> {
    return this.registrationRepository
      .createQueryBuilder('vepFairSeminarRegistration')
      .where('vepFairSeminarRegistration.userId = :userId', { userId })
      .andWhere('vepFairSeminarRegistration.seminarId IN (:...seminarId)', { seminarId })
      .getMany()
      .then((res) => {
        const registrationRow: any[] = [];
        res.forEach((result) => {
          registrationRow.push({
            seminarId: result.seminarId,
            isCheckedOption1: result.isCheckedOption1,
            isCheckedOption2: result.isCheckedOption2,
            isCheckedOption3: result.isCheckedOption3,
            option1Ans: result.option1Ans,
            option2Ans: result.option2Ans,
            option3Ans: result.option3Ans,
          });
        });
        return registrationRow;
      })
      .catch((err) => {
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

  public async getSeminarRegistrationWithPagination(
    targetFairData: Record<string, any>[],
    combinedFairData: Record<string, any>[] | undefined,
    userId: string,
    userRole: string,
    isPass: boolean,
    email: string,
    language: string,
    itemPerPage: string,
    pageNum: string,
    fairCode: string,
    filteredFairCode?: string
  ): Promise<any> {
    try {
      let seminarData: any[] = [];
      const responseData: any = [];
      targetFairData.forEach(async (fairData: any) => {
     
          const vmsData = {
            vmsProjectCode: fairData.projectNo,
            vmsProjectYear: fairData.projectYear,
            systemCode: 'VEP',
            language: language,
            email: email,
          };

         responseData.push(this.findAll(vmsData))
      })
      const sbeSeminarData: any = await Promise.allSettled(responseData)
      .catch((e)=>{
        return e
      })

      sbeSeminarData.forEach((sbeSeminarArr:any) => {
        if (sbeSeminarArr.status === 'fulfilled' && sbeSeminarArr.value) {
          seminarData = [...seminarData, ...sbeSeminarArr.value];
        }
      });
      const currentSeminarIdArr: string[] = [];
      const pastSeminarIdArr: string[] = [];

      const promise: Promise<any>[] = [];
      promise.push(this.fairService.getFairDates(fairCode));

      const fairDates = await Promise.all(promise);

      const fairPeriod = fairDates[0].online.concat(fairDates[0].physical);

      let fairStartTime = '';
      let fairEndTime = '';
      for (const timeSlot of fairPeriod) {
        const tempStartTime = timeSlot.start;
        const tempEndTime = timeSlot.end;

        if (tempStartTime) {
          if (!fairStartTime) {
            fairStartTime = tempStartTime;
          } else {
            if (moment(tempStartTime).isSameOrBefore(fairStartTime)) {
              fairStartTime = tempStartTime;
            }
          }
        }

        if (tempEndTime) {
          if (!fairEndTime) {
            fairEndTime = tempEndTime;
          } else {
            if (moment(tempEndTime).isSameOrAfter(fairEndTime)) {
              fairEndTime = tempEndTime;
            }
          }
        }
      }

      // console.log(fairStartTime, fairEndTime, 'fairDates')
      seminarData.map((data: any) => {
        const now = moment().tz('Asia/Hong_Kong').format();
        const eventEndTime = data.formattedDuration.substring(6, 11);
        const seminarEndTime = moment(`${data.formattedStartDate}, ${eventEndTime}`, 'ddd, DD MMM YYYY, HH:mm').tz('Asia/Hong_Kong').subtract(8, 'h').format();

        // if (moment(seminarEndTime).isBefore(fairEndTime)) {
          if (data.eventDetail.isEnded) {
            pastSeminarIdArr.push(`(vepFairSeminarRegistration.seminarId = ${data.id})`);
          } else if (moment(now).isAfter(seminarEndTime)) {
            pastSeminarIdArr.push(`(vepFairSeminarRegistration.seminarId = ${data.id})`);
          } else if (moment(now).isBefore(seminarEndTime)) {
            currentSeminarIdArr.push(`(vepFairSeminarRegistration.seminarId = ${data.id})`);
          }
        // }
      });
      let totalCount = 0
      const seminarIdQuery = ((isPass && pastSeminarIdArr.length) || (!isPass && currentSeminarIdArr.length)) && isPass ? `( ${pastSeminarIdArr.join(' OR ')} )` : `( ${currentSeminarIdArr.join(' OR ')} )`;

      const queryArr: string[] = [];
      if (!filteredFairCode) {
        targetFairData.forEach(async (fair) => {
          queryArr.push(
            `(vepFairSeminarRegistration.userId = '${userId}' AND vepFairSeminarRegistration.fairCode = '${fair.fairCode}' AND vepFairSeminarRegistration.fiscalYear = '${fair.fiscalYear}')`
          );
        });
      } else {
        queryArr.push(
          `(vepFairSeminarRegistration.userId = '${userId}' AND vepFairSeminarRegistration.fairCode = '${targetFairData[0].fairCode}' AND vepFairSeminarRegistration.fiscalYear = '${targetFairData[0].fiscalYear}')`
        );
      }
      let dataList:any[] = []
      let query = `( ${queryArr.join(' OR ')} )`;
      if ((isPass && pastSeminarIdArr.length) || (!isPass && currentSeminarIdArr.length)) {
      query += ` AND ${seminarIdQuery}`;
      totalCount = await this.registrationRepository.createQueryBuilder('vepFairSeminarRegistration').where(query).getCount();
      }

      if(totalCount == 0){
        dataList = []
      }else{
        dataList = await this.registrationRepository
          .createQueryBuilder('vepFairSeminarRegistration')
          .where(query)
          .take(Number(itemPerPage))
          .skip(Number(itemPerPage) * (Number(pageNum) - 1))
          .getMany();
      }
      const responseSeminarData: any[] = dataList.map((seminar: any) => {
        const targetSeminar = seminarData.find((data: any) => seminar.seminarId == data.id);

        const combinedFairDict = (vmsProjectCode: string) => {
          return combinedFairData?.find((data: Record<string,any> ) => data.projectNo === vmsProjectCode)?.fairCode
        }

        if (isPass) {
          return {
            isPass: true,
            id: targetSeminar.id,
            eventId: targetSeminar.eventId,
            name: targetSeminar.name,
            formattedStartDate: targetSeminar.formattedStartDate,
            formattedDuration: targetSeminar.formattedDuration,
            startAt: targetSeminar.startAt as string,
            endAt: targetSeminar.endAt,
            now: moment().format(),
            beforeStartTime:targetSeminar.beforeStartTime,
            isRegistered: targetSeminar.isRegistered,
            language: targetSeminar.language as string,
            type: targetSeminar.type as string,
            location: targetSeminar.location as string,
            isLive: targetSeminar.isLive,
            isAbleToWatch: targetSeminar.isAbleToWatch,
            isVideoUrlReady: targetSeminar.isVideoUrlReady,
            isFull: targetSeminar.isFull,
            vcPlaybackUrl: targetSeminar.vcPlaybackUrl,
            vcPlaybackSetting: targetSeminar.vcPlaybackSetting ?? '',
            kolPlatformType: targetSeminar?.eventDetail?.kol?.platformType ?? '',
            isEnd: targetSeminar.eventDetail.isEnded,
            fairCode: combinedFairDict(targetSeminar.vmsProjectCode),
          };
        } else {
          return {
            isPass: false,
            id: targetSeminar.id,
            name: targetSeminar.name,
            isRegistered: targetSeminar.isRegistered,
            eventId: targetSeminar.eventId,
            formattedStartDate: targetSeminar.formattedStartDate,
            formattedDuration: targetSeminar.formattedDuration,
            startAt: targetSeminar.startAt as string,
            endAt: targetSeminar.endAt,
            now: moment().format(),
            language: targetSeminar.language as string,
            beforeStartTime:targetSeminar.beforeStartTime,
            type: targetSeminar.type as string,
            location: targetSeminar.location as string,
            isLive: targetSeminar.isLive,
            isAbleToWatch: targetSeminar.isAbleToWatch,
            isVideoUrlReady: targetSeminar.isVideoUrlReady,
            isFull: targetSeminar.isFull,
            vcPlaybackUrl: targetSeminar.vcPlaybackUrl,
            vcPlaybackSetting: targetSeminar.vcPlaybackSetting ?? '',
            kolPlatformType: targetSeminar?.eventDetail?.kol?.platformType ?? '',
            isEnd: targetSeminar.eventDetail.isEnded,
            fairCode: combinedFairDict(targetSeminar.vmsProjectCode),
          };
        }
      });

      return {
        filterOptions: combinedFairData,
        userId: userId,
        recordPerPage: itemPerPage,
        totalPage: Math.ceil(totalCount / Number(itemPerPage)),
        totalRecord: totalCount,
        currentPage: pageNum,
        userRole: userRole,
        seminar: !dataList.length? dataList : responseSeminarData,
      };
    } catch (err) {
      return {
        status: 400,
        message: err?.message ?? JSON.stringify(err),
      };
    }
  }

  public getSeminarReport(page: number, size: number) {
    return this.seminarRegistrationReportRepository
      .findAndCount({
        order: {
          id: 'DESC',
        },
        take: size,
        skip: page * size,
      })
      .then(([result, total]) => {
        return {
          status: 200,
          data: result,
          total,
        };
      })
      .catch((error) => {
        return {
          status: 400,
          message: error?.message ?? JSON.stringify(error),
        };
      });
  }

  public submitSeminarReport(fairCode: string, fiscalYear: string, seminarName: string, eventId: string, sbeSeminarId: string, fileName: string) {
    return this.seminarRegistrationReportRepository
      .save({ fairCode, fiscalYear, seminarName, eventId, sbeSeminarId, fileName, creationTime: new Date() })
      .then((result) => {
        if (!result?.id) {
          return Promise.reject({
            status: 400,
            message: 'Cant save data to db',
            result,
          });
        }

        return this.lambdaService.triggerBatchJob();
      })
      .then((result) => {
        this.logger.log(`Successfully submit seminar report: ${JSON.stringify(result.data ?? {})}`);
        return {
          status: 200,
          result: result?.data,
        };
      })
      .catch((error) => {
        this.logger.log(`Error submitting seminar report: ${JSON.stringify(error)}}`);
        return {
          status: error?.status ?? 400,
          message: JSON.stringify(error),
        };
      });
  }

  public async getRegisteredSeminars(email: string, vmsProjectCode: string, vmsProjectYear: string, language: string): Promise<any> {
    return this.sbeService
      .getRegisteredSeminars({ email, systemCode: 'VEP', vmsProjectCode, vmsProjectYearFrom: vmsProjectYear, vmsProjectYearTo: vmsProjectYear, language })
      .then((result) => {
        if (!result?.data?.registeredEventList?.length) {
          return {
            status: 400,
            seminars: [],
            message: 'No registered event',
          };
        }

        if (!result?.data?.registeredEventList?.[0]?.sectionList?.length) {
          return {
            status: 400,
            seminars: [],
            message: 'No registered seminar',
          };
        }

        const subSections = result?.data?.registeredEventList?.[0]?.sectionList?.map((section: Section) => section.subSectionList).flat();

        return {
          status: 200,
          seminars: subSections.map((subSection: SubSection) => subSection.seminars).flat(),
        };
      })
      .catch((error) => {
        return {
          status: 400,
          seminars: [],
          message: typeof error === 'string' ? error : JSON.stringify(error),
        };
      });
  }

  public async countRegisteredSeminarsByUserAndTimeRange(userId: string, secondUserId: string, responderUserId: string, fairCode: string, startTime: string, endTime: string, flagFromVideoMeeting: boolean = false): Promise<any> {
    return this.fairService
      .getMultipleFairDatas([fairCode])
      .then((fairData: any): any => {
        if (!fairData?.length || fairData?.[0]?.status !== 200 || !fairData?.[0]?.relatedFair?.length) {
          return {
            status: 400,
            message: 'Cant find combinded fair',
          };
        }

        const query = this.registrationRepository
          .createQueryBuilder('vepFairSeminarRegistration')
          .where(`(userId = '${userId}' OR userId = '${secondUserId}' OR userId = '${responderUserId}')`)
          .andWhere('(startTime IS NOT NULL and endTime IS NOT NULL)');

        let fairQuery = ' ( ';
        fairData?.[0]?.relatedFair?.forEach((fair: any, index: number) => {
          if (index === 0) {
            fairQuery += ` (fairCode = '${fair.fair_code}' and fiscalYear = '${fair.fiscal_year}') `;
          } else {
            fairQuery += ` OR (fairCode = '${fair.fair_code}' and fiscalYear = '${fair.fiscal_year}') `;
          }
        });

        fairQuery += ` ) `;

        if (flagFromVideoMeeting) {
          return query
          .andWhere(fairQuery)
          .andWhere(
            `(startTime < '${endTime}') AND ('${startTime}' < endTime)`
          )
          .orWhere(
            `(startTime = '${endTime}')`
          )
          .getCount();
        } else {
          return query
          .andWhere(fairQuery)
          // https://stackoverflow.com/questions/325933/determine-whether-two-date-ranges-overlap
          .andWhere(
            `(startTime < '${endTime}') AND ('${startTime}' < endTime)`
          )
          .getCount();
        }
      })
      .then((result) => {
        return {
          status: 200,
          count: result,
        };
      })
      .catch((error) => {
        return {
          status: 400,
          message: `errno: ${error?.errno}, sqlMessage: ${error?.sqlMessage}, sql: ${error?.sql}`,
        };
      });
  }

  public async getSeminarRegistrationForAdmin(userId: string, fairCode: string, fiscalYear: string): Promise<any> {
    let query = `(vepFairSeminarRegistration.userId = '${userId}' AND vepFairSeminarRegistration.fairCode = '${fairCode}' AND vepFairSeminarRegistration.fiscalYear = '${fiscalYear}')`;

    return this.registrationRepository
      .createQueryBuilder('vepFairSeminarRegistration')
      .where(query)
      .getMany()
      .then((seminar) => {
        return seminar;
      })
      .catch((err) => {
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

  public async getSeminarRegistrationByUser(userId: string, fairCode: string, fiscalYear: string): Promise<any> {
    let query = `(vepFairSeminarRegistration.userId = '${userId}' AND vepFairSeminarRegistration.fairCode = '${fairCode}' AND vepFairSeminarRegistration.fiscalYear = '${fiscalYear}')`;

    return this.registrationRepository
      .createQueryBuilder('vepFairSeminarRegistration')
      .where(query)
      .getMany()
      .then((seminar) => {
        return seminar;
      })
      .catch((err) => {
        return {
          status: 400,
          message: err?.message ?? JSON.stringify(err),
        };
      });
  }

  public async findAllSeminarsForReminder(sbeParams: SbeEndpointRequestDto): Promise<any[]> {
    const query: SBEQuery = {
      ...sbeParams,
      displayPaidSeminars: 0,
    };

    const { data } = await this.sbeService.getSeminars(query);
    const subSections = data.sectionList.map((section: Section) => section.subSectionList).flat();
    const seminars = subSections.map((subSection: SubSection) => subSection.seminars).flat();


    return seminars.map((seminar: SBESeminar) => {
      return {
        id: seminar.id,
        name: seminar.name,
        startAt: seminar.startTime,
        nature: seminar.semNature,
      };
    })
  }

  public addCache(key: string, value: string) {
    return this.elastiCacheClusterService.setCache(key, value);
  }

  public deleteCache(key: string) {
    return this.elastiCacheClusterService.deleteCacheByKey(key);
  }

  public getCache(key: string) {
    return this.elastiCacheClusterService.getCache(key);
  }

  public getKeysByPattern(key: string) {
    return this.elastiCacheClusterService.getKeysByPattern(key);
  }

  // testing
  public getAllCache(): Promise<any> {
    return this.elastiCacheClusterService.getKeysByPattern(`*`)
    .then(keys => {
      return Promise.all(keys.map(async (key: string) => { return {key, value: await this.elastiCacheClusterService.getCache(key)} }))
    })
}
}
