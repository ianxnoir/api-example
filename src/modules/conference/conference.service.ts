import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import moment, { Moment } from 'moment-timezone';
import { SbeEndpointRequestDto } from '../../dto/sbeEndpointRequest.dto';
import { SBEService } from '../api/sbe/sbe.service';
import {
  DisplayBlock, DisplayBlockItem, SBEQuery, /* SBESeminar, */ SBEStarSpeakerData, Section,/* , SubSection */
  SubSection
} from '../api/sbe/sbe.type';
import { LogoPanel, StreamingType, FindAllFinalResult, /* ConfSeminarDetails, */ UniqueFilterCategory, FilterCategoryType, FilterCriteriaFromFn, FilterOptionDetail, ConfSeminarDetailsV2, GenerateFilterOptionsResult, OptionalInfo, SeminarRegistration, ISeminarRegistrationOption, Seminar, BaseRes, ModifiedSection, FilterFields } from '../conference/conference.type';
import { Seminar as SeminarEntity } from '../../entities/seminar.entity';
import { Video as VideoEntity } from '../../entities/video.entity';

import _ from "lodash";
// import { v4 as uuid } from "uuid"
// import fs from 'fs'

import { In, Repository } from 'typeorm';
import { StarSpeakersAndSeminars } from '../starSpeaker/starSpeaker.type';
import { ConfSpeaker, ConfSpeakerPanel, FilterSeminarCriteria } from './conference.type';
import { enDateFormat2, zhDateFormat1 } from './constants/dateFormat';
// import { Logger } from '../../core/utils';
import { ConfParticipant, SearchConfParticipantsReqInt, SearchConfParticipantsResData } from './dto/searchConferenceParticipants.dto';
import { FairRegistration } from '../../dao/FairRegistration';
import { CustomQuestion, GetCustomQuestionsReqInt, GetCustomQuestionsResData } from './dto/getCustomQuestions.dto';
import { FairCustomQuestion } from '../../dao/FairCustomQuestion';
import { GetConfParticipantReqInt, GetConfParticipantResData } from './dto/getConferenceParticipant.dto';
import { FairCustomQuestionFilter } from '../../dao/FairCustomQuestionFilter';
import { ParticipantTypeSearchDto } from './dto/ParticipantTypeSearch.dto';
import { ParticipantTypeByFairListDto } from './dto/ParticipantTypeByFairList.dto';
import { FairService } from '../fair/fair.service';
import { ContentService } from '../api/content/content.service';

import { FairSeminarRegistration } from '../../dao/FairSeminarRegistration';
import { FairRegistrationTicketPass } from '../../dao/FairRegistrationTicketPass';
import { FairTicketPassService } from '../../dao/FairTicketPassService';
import { FairParticipant } from '../../dao/FairParticipant';
import { VepErrorMsg } from '../../config/exception-constant';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { VepError } from '../../core/exception/exception';
import { ParticipantTicketPassNoteReqDto } from './dto/updateParticipantTicketPassNote.dto';
import { ConferenceC2MParticipantStatusListDto } from './dto/updateConferenceCToMParticipantStatus.dto';
import { SeminarRegistrationSqsService } from '../sqs/seminarRegistrationSqs.service';
import { constant } from '../../config/constant';
import { FairParticipantTypeRoleMapping } from '../../dao/FairParticipantTypeRoleMapping';
import { FairParticipantType } from '../../dao/FairParticipantType';
import { GetSeminarRegistrationsResInt } from './dto/getSeminarRegistrations.dto';
import { UpdateSeminarRegistrationResInt } from './dto/updateSeminarRegistration.dto';
import { ConferenceElasticacheService } from './elasticache.service';
import { wrapAwsXray } from './utils';
import { Kol } from '../../entities/kol.entity';
import { Vod } from '../../entities/vod.entity';
import { Rtmp } from '../../entities/rtmp.entity';
import { FairTicketPass } from '../../dao/FairTicketPass';
import { ConferenceFairDbService } from '../conferenceFairDb/conferenceFairDb.service';
// import { mockDataCateDate, mockDataDateCate } from './mockData';


@Injectable()
export class ConferenceService {
  constructor(
    private sbeService: SBEService,
    private fairService: FairService,
    private fairDbService: ConferenceFairDbService,
    private contentService: ContentService,
    private seminarRegistrationSqsService: SeminarRegistrationSqsService,
    @InjectRepository(SeminarEntity) private seminarRepository: Repository<SeminarEntity>,
    @InjectRepository(VideoEntity) private videoRepository: Repository<VideoEntity>,
    @InjectRepository(Kol) private kolRepository: Repository<Kol>,
    @InjectRepository(Rtmp) private rtmpRepository: Repository<Rtmp>,
    @InjectRepository(Vod) private vodRepository: Repository<Vod>,
    @InjectRepository(FairRegistration) private FairRegistrationRepository: Repository<FairRegistration>,
    @InjectRepository(FairRegistrationTicketPass) private FairRegistrationTicketPassRepository: Repository<FairRegistrationTicketPass>,
    @InjectRepository(FairSeminarRegistration) private FairSeminarRegistrationRepository: Repository<FairSeminarRegistration>,
    @InjectRepository(FairTicketPass) private FairTicketPassRepository: Repository<FairTicketPass>,
    @InjectRepository(FairTicketPassService) private FairTicketPassServiceRepository: Repository<FairTicketPassService>,
    @InjectRepository(FairParticipantType) private fairParticipantTypeRepository: Repository<FairParticipantType>,
    @InjectRepository(FairParticipantTypeRoleMapping) private fairParticipantTypeRoleMappingRepository: Repository<FairParticipantTypeRoleMapping>,
    @InjectRepository(FairCustomQuestionFilter) private FairCustomQuestionFilterRepository: Repository<FairCustomQuestionFilter>,
    private elastiCacheClusterService: ConferenceElasticacheService,
    private logger: Logger,
  ) { }

  private isQueryModeValid(queryMode: string | undefined) {
    if (queryMode === "A" || queryMode === "HS" || queryMode === "S" || queryMode === "H") {
      return queryMode
    } else {
      return "A"
    }
  }

  //NOTE: for speaker
  public async getAll(sbeParams: SbeEndpointRequestDto & { queryMode?: string }): Promise<Pick<StarSpeakersAndSeminars, "starSpeakersData">> {
    const query: SBEQuery = {
      ...sbeParams,
      queryMode: this.isQueryModeValid(sbeParams?.queryMode),
    };
    const sbeStarSpeakers = await this.sbeService.getStarSpeakers(query);

    const sortByLastName = (data: {
      id: string;
      surname: string;
      givenName: string;
      name: string;
      avatar: string;
      profile: string;
      companies: {
        name: string;
        logo: string;
        title: string;
      }[];
    }[]) => {

      const sortedData =
        data.sort((a, b) => {
          if (a.surname < b.surname) { return -1; }
          if (a.surname > b.surname) { return 1; }
          if (a.givenName < b.givenName) { return -1; }
          if (a.givenName > b.givenName) { return 1; }

          return 0
        }).map((e: any) => {
          delete e.surname; delete e.givenName;
          return e
        })
      return sortedData
    }


    const { data: starSpeakers } = sbeStarSpeakers;
    const starSpeakersData = starSpeakers.map((speaker: SBEStarSpeakerData) => {
      const companies: Array<{ name: string, logo: string, title: string }> = []
      if (speaker.otherCompany1 || speaker.otherCompanyLogoUrl1 || speaker.otherPosition1) companies.push({ name: speaker.otherCompany1, logo: speaker.otherCompanyLogoUrl1, title: speaker.otherPosition1 })
      if (speaker.otherCompany2 || speaker.otherCompanyLogoUrl2 || speaker.otherPosition2) companies.push({ name: speaker.otherCompany2, logo: speaker.otherCompanyLogoUrl2, title: speaker.otherPosition2 })
      if (speaker.otherCompany3 || speaker.otherCompanyLogoUrl3 || speaker.otherPosition3) companies.push({ name: speaker.otherCompany3, logo: speaker.otherCompanyLogoUrl3, title: speaker.otherPosition3 })
      if (speaker.otherCompany4 || speaker.otherCompanyLogoUrl4 || speaker.otherPosition4) companies.push({ name: speaker.otherCompany4, logo: speaker.otherCompanyLogoUrl4, title: speaker.otherPosition4 })

      return {
        id: speaker.id,
        surname: speaker.surname,
        givenName: speaker.givenName,
        name: speaker.displayName,
        avatar: speaker.photoUrl,
        profile: speaker.profile,
        companies: [{
          name: speaker.company,
          logo: speaker.companyLogoUrl,
          title: speaker.position
        }, ...companies],
      };
    });
    return {
      starSpeakersData: sortByLastName(starSpeakersData)
    };
  }

  //NOTE: for seminar
  private async createIfNull(seminarIds: string[], createOnly = false): Promise<void> {
    return wrapAwsXray('ConferenceService', 'createIfNull', this.logger, async () => {
      const now: Date = new Date();
      let builder = await this.seminarRepository
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
      if (!createOnly) builder = builder.orUpdate({ conflict_target: ['sbeSeminarId'], overwrite: ['lastUpdatedAt'] })
      await builder.execute();
    })
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

  private filterByCriteria(dataArray: FindAllFinalResult[], criteria: { firstCriteria: string, secondCriteria: string }) {
    const { firstCriteria, secondCriteria } = criteria
    const firstFilterChooseAll = firstCriteria === "" || firstCriteria === "all"
    const secondFilterChooseAll = secondCriteria === "" || secondCriteria === "all"


    const finalResult = dataArray.filter(data => {
      const firstLayerValue = data.firstLayerFilter.value;
      const isFirstFilterDate = data.firstLayerFilter.type === "DATE"
      const secondLayerValue = data.secondLayerFilter.value


      const modifiedFirstCriteriaValue = isFirstFilterDate ? moment(firstCriteria).tz('Asia/Hong_Kong').format('ddd, DD MMM YYYY').toUpperCase() : firstCriteria
      const modifiedSecondCriteriaValue = !isFirstFilterDate ? moment(secondCriteria).tz('Asia/Hong_Kong').format('ddd, DD MMM YYYY').toUpperCase() : secondCriteria

      const firstFilterDateMatchingValue = modifiedFirstCriteriaValue === data.formattedStartDate
      const firstFilterCategoryMatchingValue = firstLayerValue === firstCriteria
      const secondFilterDateMatchingValue = modifiedSecondCriteriaValue === data.formattedStartDate
      const secondFilterCategoryMatchingValue = secondLayerValue === secondCriteria

      /*
        NOTE: 
        - if 1st filter layer is date, eligible seminar should match both the date & category filter value. Therefore you can see "&&" below
        - for the "||" condition, an escape for the filter is "all" 
      */
      return isFirstFilterDate
        ? (firstFilterChooseAll || firstFilterDateMatchingValue) && (secondFilterChooseAll || secondFilterCategoryMatchingValue)
        : (firstFilterChooseAll || firstFilterCategoryMatchingValue) && (secondFilterChooseAll || secondFilterDateMatchingValue)
    })

    return finalResult;
  }

  public determineFirstAppearanceForEachFilter(seminarDataForAll: FindAllFinalResult[]) {
    const dateOccurrenceMapping: Record<string, boolean> = {}
    const categoryOccurrenceMapping: Record<string, boolean> = {}

    return seminarDataForAll.map(individualSeminar => {
      let finalResult = { ...individualSeminar }
      const { firstLayerFilter } = individualSeminar
      const forDateKey = firstLayerFilter.type === "DATE" ? "first" : "second"
      const forCategoryKey = firstLayerFilter.type === "CATEGORY" ? "first" : "second"


      //NOTE: optimized algo --- remove duplicate logic
      if (individualSeminar[`${forDateKey}LayerFilter`].type === "DATE") {
        if (!dateOccurrenceMapping[individualSeminar[`${forDateKey}LayerFilter`].value]) {
          dateOccurrenceMapping[individualSeminar[`${forDateKey}LayerFilter`].value] = true

          finalResult = {
            ...finalResult,
            isFirstAppearDate: true
          }
        }
      }

      if (individualSeminar[`${forCategoryKey}LayerFilter`].type === "CATEGORY") {
        if (!categoryOccurrenceMapping[individualSeminar[`${forCategoryKey}LayerFilter`].value]) {
          categoryOccurrenceMapping[individualSeminar[`${forCategoryKey}LayerFilter`].value] = true

          finalResult = {
            ...finalResult,
            isFirstAppearCategory: true
          }
        }
      }

      return finalResult;
    })
  }

  //NOTE: version 1 for vep-conference(take ref from existing vep-tradeshow(check the seminar.service)), should fade out after optimization
  // public async findAll(sbeParams: SbeEndpointRequestDto, criteria: FilterSeminarCriteria): Promise<ConfSeminarDetails[]> {
  //   //  this.logger.INFO(Math.random().toString(), "E9999", `start enter service: findAll - ${new Date().toDateString()}, ${Date.now()}`)

  //   const query: SBEQuery = {
  //     ...sbeParams,
  //     displayPaidSeminars: 0,
  //   };

  //   const firstCategorySelectAll = criteria.firstCriteria === ""
  //   const secondCategorySelectAll = criteria.secondCriteria === "" && criteria.secondCriteria.length === 1

  //   //  this.logger.INFO(Math.random().toString(), "E9998", `start calling SBE api - ${new Date().toDateString()}, ${Date.now()}`)
  //   const { data } = await this.sbeService.getSeminars(query);
  //   //  this.logger.INFO(Math.random().toString(), "E9997", `end calling SBE api - - ${new Date().toDateString()}, ${Date.now()}`)

  //   const subSections = data.sectionList.map((section: Section) => section.subSectionList).flat();


  //   // newly added
  //   const subSectionsWithTypeAndValue = data.sectionList.map((section: Section) => section).flat();
  //   const seminarWithTypeAndValue = subSectionsWithTypeAndValue.map(section => section).flat()
  //   const sbeFooter = data?.footer

  //   // original
  //   const seminars = subSections.map((subSection: SubSection) => subSection.seminars).flat();
  //   const sbeSeminarIds = seminars.map((seminar: SBESeminar) => seminar.id);

  //   await this.createIfNull(sbeSeminarIds);
  //   const entities: SeminarEntity[] = await this.seminarRepository.find({
  //     where: { sbeSeminarId: In(sbeSeminarIds) },
  //   });

  //   const idMappingDict: Record<string, SeminarEntity> = entities.reduce((prev: Record<string, SeminarEntity>, entity: SeminarEntity) => ({ ...prev, [entity.sbeSeminarId]: entity }), {});


  //   // Map to Seminars
  //   const allSeminarData = (await Promise.all(
  //     seminarWithTypeAndValue?.map(seminarInfo => {
  //       return seminarInfo.subSectionList.map(list => {
  //         return list.seminars.map(((seminar: SBESeminar) => {
  //           const firstLayerFilter = {
  //             type: seminarInfo.sectionType,
  //             value: seminarInfo.sectionValue
  //           }

  //           const secondLayerFilter = {
  //             type: list.subSectionType,
  //             value: list.subSectionValue
  //           }

  //           const mStartTime = moment(seminar.startTime).tz('Asia/Hong_Kong');
  //           const mEndTime = moment(seminar.endTime).tz('Asia/Hong_Kong');
  //           const offsetHours = Math.floor(mStartTime.utcOffset() / 60);

  //           const displayBlocks = seminar.displayBlock.filter((block: DisplayBlock) => block.blockType === 'SPEAKER');
  //           const logoBlocks = seminar.displayBlock.filter((block: DisplayBlock) => block.blockType === 'SPONSOR');

  //           const logoPanels: LogoPanel[] = logoBlocks.map((block: DisplayBlock) => {
  //             const logos: string[] = block.displayBlockItem.map((blockItem: DisplayBlockItem) => blockItem.imageUrl).filter(e => e.trim().length > 0);
  //             const title = block.type.toUpperCase().replace(/[`~!@#$%^&*()_|+=?;：:'",.<>{}[\]\\/]/gi, '');
  //             return { title, logos };
  //           });

  //           // Map to Panels
  //           const speakerPanels: ConfSpeakerPanel[] = displayBlocks.map((block: DisplayBlock) => {
  //             // Map to Speakers
  //             const speakers: ConfSpeaker[] = block.displayBlockItem.map((blockItem: DisplayBlockItem) => ({
  //               id: blockItem.id,
  //               name: blockItem.name,
  //               title: blockItem.position,
  //               avatar: blockItem.imageUrl,
  //               profile: blockItem.description,
  //               company: {
  //                 name: blockItem.company,
  //                 logo: blockItem.companyLogoUrl,
  //               },
  //               otherCompanies: [
  //                 {
  //                   companyName: blockItem.otherCompany1,
  //                   position: blockItem.otherPosition1,
  //                   logo: blockItem.otherCompanyLogoUrl1
  //                 },
  //                 {
  //                   companyName: blockItem.otherCompany2,
  //                   position: blockItem.otherPosition2,
  //                   logo: blockItem.otherCompanyLogoUrl2

  //                 },
  //                 {
  //                   companyName: blockItem.otherCompany3,
  //                   position: blockItem.otherPosition3,
  //                   logo: blockItem.otherCompanyLogoUrl3
  //                 },
  //                 {
  //                   companyName: blockItem.otherCompany4,
  //                   position: blockItem.otherPosition4,
  //                   logo: blockItem.otherCompanyLogoUrl4
  //                 }
  //               ]
  //             }));

  //             return {
  //               title: block.type.toUpperCase().replace(/[`~!@#$%^&*()_|+\-=?;：:'",.<>{}[\]\\/]/gi, ''),
  //               speakers,
  //             };
  //           });

  //           const streamingUrl = this.getStreamingUrl(idMappingDict[seminar.id], mEndTime);
  //           const beforeStartTime = 10;

  //           let finalResult: FindAllFinalResult = {
  //             firstLayerFilter,
  //             secondLayerFilter,
  //             id: seminar.id,
  //             name: seminar.name,
  //             description: seminar.remarks,
  //             displayStatus: true,
  //             formattedStartDate: mStartTime.format('ddd, DD MMM YYYY').toUpperCase(),
  //             formattedDuration: `${mStartTime.format('HH:mm')}-${mEndTime.format('HH:mm')} (UTC/GMT+${offsetHours})`,
  //             startAt: seminar.startTime,
  //             endAt: seminar.endTime,
  //             now: moment().format(), // for frontend
  //             fulled: seminar.isFull === '1',
  //             registrationEnabled: seminar.isRegistrationStatusEnable === '1',
  //             registrationUrl: '', // TO-DO
  //             fullProgrammeUrl: seminar.attachmentUrl,
  //             language: seminar.language,
  //             type: seminar.semType,
  //             location: seminar.venue,
  //             bookmarked: seminar.isBookmarked === '1',
  //             qualificationLogo: [seminar.iconImageUrl1.trim(), seminar.iconImageUrl2.trim(), seminar.iconImageUrl3.trim(), seminar.iconImageUrl4.trim()].filter(Boolean),
  //             logoPanels,
  //             speakerPanels,
  //             isLive: moment().isBetween(mStartTime, mEndTime),
  //             nature: seminar.semNature,
  //             streamingType: idMappingDict[seminar.id].streamingType,
  //             isPublic: seminar.semLiveType === 'PU',
  //             isAbleToWatch: moment().isAfter(mStartTime.subtract(beforeStartTime, 'm')),
  //             isRegistered: seminar.isRegistered === '1', // To-Do
  //             eventDetail: idMappingDict[seminar.id]?.convert() || {},
  //             isVideoUrlReady: !!streamingUrl,
  //             streamingUrl,
  //             vcPlaybackUrl: seminar.vcPlaybackUrl,
  //             isFull: seminar.isFull,
  //             vcPlaybackSetting: seminar.vcPlaybackSetting,
  //             recommendedText: seminar.recommendedText,
  //             recommendedTextBackgroundColor: seminar.recommendedTextBackgroundColor,
  //             recommendedTextColor: seminar.recommendedTextColor,
  //           }

  //           return finalResult;
  //         })).flat()
  //       }).flat()
  //     }))).flat()


  //   const isFirstFilterDate = allSeminarData?.length > 0 ? allSeminarData[0].firstLayerFilter.type === "DATE" : false

  //   const targetSeminarData = (firstCategorySelectAll && secondCategorySelectAll) ? allSeminarData : this.filterByCriteria(allSeminarData, criteria)
  //   const sortedSeminarData = this.sortDataByCategory(targetSeminarData);
  //   const seminarWithFirstAppearance = this.determineFirstAppearanceForEachFilter(sortedSeminarData);


  //   //NOTE: if 1st layer filter is date, "uniqueSecondFilterValues" should adapt handleFilterUniqueCategory() since 2nd layer must be category
  //   const uniqueFirstFilterValues = isFirstFilterDate ? this.handleFilterUniqueDate(allSeminarData) : this.handleFilterUniqueCategory(allSeminarData, true)
  //   const uniqueSecondFilterValues = !isFirstFilterDate ? this.handleFilterUniqueDate(allSeminarData) : this.handleFilterUniqueCategory(allSeminarData, false)


  //   const uniqueFirstCategory = {
  //     identifier: "first",
  //     type: allSeminarData?.length > 0 ? allSeminarData[0].firstLayerFilter.type : "<no_first_type>",
  //     values: uniqueFirstFilterValues
  //   }

  //   const uniqueSecondCategory = {
  //     identifier: "second",
  //     type: allSeminarData?.length > 0 ? allSeminarData[0].secondLayerFilter.type : "<no_second_type>",
  //     values: uniqueSecondFilterValues
  //   }

  //   //  this.logger.INFO(Math.random().toString(), "E996", `end calling: findAll - ${new Date().toDateString()}, ${Date.now()}`)

  //   return [{
  //     seminarData: seminarWithFirstAppearance,
  //     categories: [uniqueFirstCategory, uniqueSecondCategory],
  //     seminarDataAmount: seminarWithFirstAppearance.length,
  //     sbeFooter,
  //   }]
  // }

  public async getAllSeminarsFromSbe(sbeParams: any) {
    return wrapAwsXray('ConferenceService', 'getAllSeminarsFromSbe', this.logger, async () => {
      const query: SBEQuery = {
        ...sbeParams,
        displayPaidSeminars: 0,
      };

      const { data } = await this.sbeService.getSeminars(query);



      const subSectionsWithTypeAndValue = data.sectionList.map((section: Section) => section).flat();

      const allSeminarIds = []
      for (const subSection of subSectionsWithTypeAndValue) {
        for (const seminarGp of subSection.subSectionList) {
          for (const seminar of seminarGp.seminars) {
            allSeminarIds.push(seminar.id)
          }
        }
      }

      await this.createIfNull(allSeminarIds);
      const entitiesV2 = await this.seminarRepository.find({ where: { sbeSeminarId: In(allSeminarIds) }, });
      const idMappingDictV2: Record<string, SeminarEntity> = entitiesV2.reduce((prev: Record<string, SeminarEntity>, entity: SeminarEntity) => ({ ...prev, [entity.sbeSeminarId]: entity }), {});


      return {
        sbeFooter: data?.footer,
        subSectionsWithTypeAndValue,
        idMappingDictV2
      }
    })
  }

  public getAllSeminarsV3(origSeminarArray: Section[], idMappingDictV2: Record<string, SeminarEntity>): Promise<ModifiedSection[]> {
    return wrapAwsXray('ConferenceService', 'getSeminarV3', this.logger, async () => {
      const modifiedSectionData: ModifiedSection[] = origSeminarArray.map((sectionListLevel) => {
        const newSectionListLevel = sectionListLevel.subSectionList.map((subSectionListLevel) => {
          const newGroupSeminars = subSectionListLevel.seminars.map((seminar) => {


            /*    const allSeminarData: FindAllFinalResult[] = []
               for (const seminarInfo of origSeminarArray || []) {
                 for (const list of seminarInfo.subSectionList ? seminarInfo.subSectionList : seminarInfo) {
                   for (const seminar of list.seminars ? list.seminars : list) { */
            const firstLayerFilter = {
              type: sectionListLevel.sectionType,
              value: sectionListLevel.sectionValue,
              sortOrder: Number(sectionListLevel?.sortOrder) || -999
            }

            const secondLayerFilter = {
              type: subSectionListLevel.subSectionType,
              value: subSectionListLevel.subSectionValue,
              sortOrder: Number(subSectionListLevel?.sortOrder) || -999
            }

            const mStartTime = moment(seminar.startTime).tz('Asia/Hong_Kong');
            const mEndTime = moment(seminar.endTime).tz('Asia/Hong_Kong');
            const offsetHours = Math.floor(mStartTime.utcOffset() / 60);

            const displayBlocks = seminar.displayBlock.filter((block: DisplayBlock) => block.blockType === 'SPEAKER');
            const logoBlocks = seminar.displayBlock.filter((block: DisplayBlock) => block.blockType === 'SPONSOR');

            const logoPanels: LogoPanel[] = logoBlocks.map((block: DisplayBlock) => {
              const logos: string[] = block.displayBlockItem.map((blockItem: DisplayBlockItem) => blockItem.imageUrl).filter(e => e.trim().length > 0);
              const title = block.type/* .toUpperCase().replace(/[`~!@#$%^&*()_|+=?;：:'",.<>{}[\]\\/]/gi, '') */;
              return { title, logos };
            });

            // Map to Panels
            const speakerPanels: ConfSpeakerPanel[] = displayBlocks.map((block: DisplayBlock) => {
              const speakers: ConfSpeaker[] = block.displayBlockItem.map((blockItem: DisplayBlockItem) => ({
                id: blockItem.id,
                name: blockItem.name,
                title: blockItem.position,
                avatar: blockItem.imageUrl,
                profile: blockItem.description,
                company: {
                  name: blockItem.company,
                  logo: blockItem.companyLogoUrl,
                },
                otherCompanies: [
                  {
                    companyName: blockItem.otherCompany1,
                    position: blockItem.otherPosition1,
                    logo: blockItem.otherCompanyLogoUrl1
                  },
                  {
                    companyName: blockItem.otherCompany2,
                    position: blockItem.otherPosition2,
                    logo: blockItem.otherCompanyLogoUrl2

                  },
                  {
                    companyName: blockItem.otherCompany3,
                    position: blockItem.otherPosition3,
                    logo: blockItem.otherCompanyLogoUrl3
                  },
                  {
                    companyName: blockItem.otherCompany4,
                    position: blockItem.otherPosition4,
                    logo: blockItem.otherCompanyLogoUrl4
                  }
                ]
              }));

              return {
                title: block.type/* .toUpperCase().replace(/[`~!@#$%^&*()_|+\-=?;：:'",.<>{}[\]\\/]/gi, '') */,
                speakers,
              };
            });

            const streamingUrl = this.getStreamingUrl(idMappingDictV2[seminar.id] || {}, mEndTime);
            const beforeStartTime = 10;
            const currentTime = moment()

            let finalResult: FindAllFinalResult = {
              firstLayerFilter,
              secondLayerFilter,
              id: seminar.id,
              name: seminar.name,
              description: seminar.remarks,
              displayStatus: true,
              formattedStartDate: mStartTime.format('ddd, DD MMM YYYY').toUpperCase(),
              formattedDuration: `${mStartTime.format('HH:mm')}-${mEndTime.format('HH:mm')} (UTC/GMT+${offsetHours})`,
              startAt: seminar.startTime,
              endAt: seminar.endTime,
              now: currentTime.format(), // for frontend
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
              isLive: currentTime.isBetween(mStartTime, mEndTime),
              nature: seminar.semNature,
              streamingType: idMappingDictV2[seminar.id]?.streamingType,
              session: currentTime.isBefore(mStartTime) ? 'before' : currentTime.isAfter(mEndTime) ? 'after' : 'between',
              isPublic: seminar.semLiveType === 'PU',
              isAbleToWatch: currentTime.isAfter(mStartTime.subtract(beforeStartTime, 'm')),
              isRegistered: seminar.isRegistered === '1', // To-Do
              eventDetail: idMappingDictV2[seminar.id]?.convert() || {},
              isVideoUrlReady: !!streamingUrl,
              streamingUrl,
              vcPlaybackUrl: seminar.vcPlaybackUrl,
              isFull: seminar.isFull,
              vcPlaybackSetting: seminar.vcPlaybackSetting,
              recommendedText: seminar.recommendedText,
              recommendedTextBackgroundColor: seminar.recommendedTextBackgroundColor,
              recommendedTextColor: seminar.recommendedTextColor,
              sortOrder: seminar.sortOrder,
            }

            return finalResult;
          })

          return {
            ...subSectionListLevel,
            seminars: newGroupSeminars
          }
        })

        return {
          ...sectionListLevel,
          subSectionList: newSectionListLevel
        }
      })


      return modifiedSectionData
    })
  }

  public getAllSeminarsV2(origSeminarArray: any[], idMappingDictV2: Record<string, SeminarEntity>): Promise<FindAllFinalResult[]> {
    return wrapAwsXray('ConferenceService', 'getSeminarV2', this.logger, async () => {
      const allSeminarData: FindAllFinalResult[] = []
      for (const seminarInfo of origSeminarArray || []) {
        for (const list of seminarInfo.subSectionList) {
          for (const seminar of list.seminars) {
            const firstLayerFilter = {
              type: seminarInfo.sectionType,
              value: seminarInfo.sectionValue
            }

            const secondLayerFilter = {
              type: list.subSectionType,
              value: list.subSectionValue
            }

            const mStartTime = moment(seminar.startTime).tz('Asia/Hong_Kong');
            const mEndTime = moment(seminar.endTime).tz('Asia/Hong_Kong');
            const offsetHours = Math.floor(mStartTime.utcOffset() / 60);

            const displayBlocks = seminar.displayBlock.filter((block: DisplayBlock) => block.blockType === 'SPEAKER');
            const logoBlocks = seminar.displayBlock.filter((block: DisplayBlock) => block.blockType === 'SPONSOR');

            const logoPanels: LogoPanel[] = logoBlocks.map((block: DisplayBlock) => {
              const logos: string[] = block.displayBlockItem.map((blockItem: DisplayBlockItem) => blockItem.imageUrl).filter(e => e.trim().length > 0);
              const title = block.type/* .toUpperCase().replace(/[`~!@#$%^&*()_|+=?;：:'",.<>{}[\]\\/]/gi, '') */;
              return { title, logos };
            });

            // Map to Panels
            const speakerPanels: ConfSpeakerPanel[] = displayBlocks.map((block: DisplayBlock) => {
              // Map to Speakers
              const speakers: ConfSpeaker[] = block.displayBlockItem.map((blockItem: DisplayBlockItem) => ({
                id: blockItem.id,
                name: blockItem.name,
                title: blockItem.position,
                avatar: blockItem.imageUrl,
                profile: blockItem.description,
                company: {
                  name: blockItem.company,
                  logo: blockItem.companyLogoUrl,
                },
                otherCompanies: [
                  {
                    companyName: blockItem.otherCompany1,
                    position: blockItem.otherPosition1,
                    logo: blockItem.otherCompanyLogoUrl1
                  },
                  {
                    companyName: blockItem.otherCompany2,
                    position: blockItem.otherPosition2,
                    logo: blockItem.otherCompanyLogoUrl2

                  },
                  {
                    companyName: blockItem.otherCompany3,
                    position: blockItem.otherPosition3,
                    logo: blockItem.otherCompanyLogoUrl3
                  },
                  {
                    companyName: blockItem.otherCompany4,
                    position: blockItem.otherPosition4,
                    logo: blockItem.otherCompanyLogoUrl4
                  }
                ]
              }));

              return {
                title: block.type/* .toUpperCase().replace(/[`~!@#$%^&*()_|+\-=?;：:'",.<>{}[\]\\/]/gi, '') */,
                speakers,
              };
            });

            const streamingUrl = this.getStreamingUrl(idMappingDictV2[seminar.id] || {}, mEndTime);
            const beforeStartTime = 10;

            let finalResult: FindAllFinalResult = {
              firstLayerFilter,
              secondLayerFilter,
              sortOrder: Number(seminar.sortOrder),
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
              isLive: moment().isBetween(mStartTime, mEndTime),
              nature: seminar.semNature,
              streamingType: idMappingDictV2[seminar.id]?.streamingType,
              isPublic: seminar.semLiveType === 'PU',
              isAbleToWatch: moment().isAfter(mStartTime.subtract(beforeStartTime, 'm')),
              isRegistered: seminar.isRegistered === '1', // To-Do
              eventDetail: idMappingDictV2[seminar.id]?.convert() || {},
              isVideoUrlReady: !!streamingUrl,
              streamingUrl,
              vcPlaybackUrl: seminar.vcPlaybackUrl,
              isFull: seminar.isFull,
              vcPlaybackSetting: seminar.vcPlaybackSetting,
              recommendedText: seminar.recommendedText,
              recommendedTextBackgroundColor: seminar.recommendedTextBackgroundColor,
              recommendedTextColor: seminar.recommendedTextColor,
            }

            allSeminarData.push(finalResult);
          }
        }
      }

      return allSeminarData
    })
  }


  public async findAllV2(sbeParams: SbeEndpointRequestDto, criteria: FilterSeminarCriteria, optionalInfo: Partial<OptionalInfo>): Promise<ConfSeminarDetailsV2[]> {
    return wrapAwsXray('ConferenceService', 'findAllV2', this.logger, async () => {
      const query: SBEQuery = {
        ...sbeParams,
        displayPaidSeminars: 0,
      };

      const { subSectionsWithTypeAndValue, idMappingDictV2, sbeFooter } = await this.getAllSeminarsFromSbe(query)
      const allSeminarData = await this.getAllSeminarsV2(subSectionsWithTypeAndValue, idMappingDictV2)


      const { isDateFirstLayer, uniqueFirstCategory, uniqueSecondCategory } = this.handleUniqueFilterValues(allSeminarData);
      const { sortedDateOptions, categoryOptions } = this.generateFilterOptions({ uniqueFirstCategory, uniqueSecondCategory }, sbeParams.language)

      const dateCurrActiveValueFromFn = isDateFirstLayer ? criteria?.firstCriteria : criteria?.secondCriteria
      const categoryCurrActiveValueFromFn = isDateFirstLayer ? criteria?.secondCriteria : criteria?.firstCriteria

      const dateOptionsMatchTodayIndex = sortedDateOptions.findIndex(({ value }) => {
        const today = moment().tz('Asia/Hong_Kong')
        const dateFilterOptionInMoment = moment(value).tz('Asia/Hong_Kong')
        const isDateFilterOptionMatchToday = today.isSame(dateFilterOptionInMoment, "day")

        return isDateFilterOptionMatchToday;
      })

      const hasDateOptionMatchToday = dateOptionsMatchTodayIndex !== -1
      const relatedDateFilterOrder = isDateFirstLayer ? "first" : "second"
      const desiredDateFilterValue = dateCurrActiveValueFromFn === ""
        ? hasDateOptionMatchToday
          ? sortedDateOptions[dateOptionsMatchTodayIndex].value
          : "all"
        : dateCurrActiveValueFromFn
      const desiredCategoryFilterValue = categoryCurrActiveValueFromFn === "" ? "all" : categoryCurrActiveValueFromFn
      const modifiedCriteria = (relatedDateFilterOrder === "first")
        ? {
          firstCriteria: desiredDateFilterValue,
          secondCriteria: desiredCategoryFilterValue
        } : {
          firstCriteria: desiredCategoryFilterValue,
          secondCriteria: desiredDateFilterValue
        }

      const firstCategorySelectAll = modifiedCriteria.firstCriteria === "all"
      const secondCategorySelectAll = modifiedCriteria.secondCriteria === "all"

      const seminarDataForModal = optionalInfo?.seminarId ? allSeminarData.filter(seminar => seminar?.id === optionalInfo?.seminarId) : [];
      const targetSeminarData = (firstCategorySelectAll && secondCategorySelectAll) ? allSeminarData : this.filterByCriteria(allSeminarData, modifiedCriteria)
      const sortedSeminarData = await this.handleSortSeminar(targetSeminarData, dateCurrActiveValueFromFn);
      const seminarWithFirstAppearance = this.determineFirstAppearanceForEachFilter(sortedSeminarData);
      const categoriesForFn = this.handleFnFilterOptions({ sortedDateOptions, categoryOptions }, modifiedCriteria, isDateFirstLayer)



      /* //NOTE: debug object for filtering
      const e = sortedSeminarData.map(s => {
        return {
          startAt: s.startAt,
          endAt: s.endAt,
          name: s.name,
          firstLayerFilterValue: s.firstLayerFilter.value,
          secondLayerFilterValue: s.secondLayerFilter.value,
          isFirstAppearDate: s.isFirstAppearDate,
          isFirstAppearCat: s.isFirstAppearCategory,
        }
      })
      
      
      //NOTE: debug object for filtering
      const d = seminarWithFirstAppearance.map(s => {
        return {
          startAt: s.startAt,
          endAt: s.endAt,
          firstLayerFilterValue: s.firstLayerFilter.value,
          secondLayerFilterValue: s.secondLayerFilter.value,
          name: s.name,
          isFirstAppearDate: s.isFirstAppearDate,
          isFirstAppearCat: s.isFirstAppearCategory,
        }
      })
      
      console.log(e)
      console.log('final return result', d) */


      //  this.logger.INFO(Math.random().toString(), "E991", `finish service: findAll - ${new Date().toDateString()}, ${Date.now()}`)

      return [{
        seminarData: seminarWithFirstAppearance,
        seminarDataForModal,
        categories: categoriesForFn,
        seminarDataAmount: seminarWithFirstAppearance.length,
        sbeFooter,
      }]
    })
  }

  // private handleSortSeminarV3 = async (targetSeminars: Section[], dateCurrActiveValue: string) => {
  //   //NOTE: for local dev only, dont commit

  //   //const mappingForSortOrder = []
  //   //const mappingForSortOrder2 = []

  //   //Case1: DATE-CATE - Specific Date
  //   if (targetSeminars[0].sectionType === FilterCategoryType.DATE && dateCurrActiveValue !== "all") {
  //     //const sortedBySubSectionList = _.orderBy(targetSeminars, sectionList => sectionList.subSectionList[0].subSectionValue, "asc")
  //     const sortedResult = targetSeminars.map((eachSectionList) => {

  //       //Level 2
  //       const sortedSubSectionList = _.orderBy(eachSectionList.subSectionList, "sortOrder", "asc")

  //       /*for testing (L2)
  //       const orderForSubSectionList = sortedSubSectionList.map((temp) =>{
  //         return temp.sortOrder
  //       })
  //       mappingForSortOrder.push(orderForSubSectionList)
  //       */

  //       //Level 3
  //       const sortedSeminars = sortedSubSectionList.map((eachSubSectionList) => {
  //         const eachSortedSeminar = _.orderBy(eachSubSectionList.seminars, "sortOrder", "asc")
  //         // eachSubSectionList.map((eachSeminar) => {
  //         return eachSortedSeminar
  //       })

  //       /*for testing (L3)
  //       const orderForSubSectionList2 = sortedSeminars.map((tempSeminar) =>{
  //         return tempSeminar.map((temp) => {
  //           return temp.sortOrder
  //         })
  //       })
  //       mappingForSortOrder2.push(orderForSubSectionList2)
  //       */

  //       //final return
  //       return sortedSeminars
  //     })

  //     return sortedResult   //const sortedSeminarData = sortedResult
  //   }

  //   //Case2: CATE-DATE and Specific Date
  //   if (targetSeminars[0].sectionType === FilterCategoryType.CATEGORY && dateCurrActiveValue !== "all") {
  //     //Level 1
  //     const sortedSubSectionList = _.orderBy(targetSeminars, "sortOrder", "asc")

  //     //Level 3
  //     const sortedSeminars = sortedSubSectionList.map((eachSectionList) => {
  //       eachSectionList.subSectionList.map((eachSubSectionList) => {
  //         const eachSortedSeminar = _.orderBy(eachSubSectionList.seminars, "sortOrder", "asc")
  //         // eachSubSectionList.map((eachSeminar) => {
  //         return eachSortedSeminar
  //       })
  //       return eachSectionList
  //     })

  //     return sortedSeminars   //const sortedSeminarData = sortedSeminar
  //   }

  //   //All Date
  //   if (dateCurrActiveValue === "all") {
  //     //Case3: CATE - DATE
  //     if (targetSeminars[0].sectionType === FilterCategoryType.CATEGORY) {
  //       //Level 2
  //       const sortedResult = targetSeminars.map((eachSectionList) => {
  //         const sortedSubSectionList = _.orderBy(eachSectionList.subSectionList, "subSectionValue", "asc")

  //         //Level 3
  //         const sortedSeminars = sortedSubSectionList.map((eachSubSectionList) => {
  //           const eachSortedSeminar = _.orderBy(eachSubSectionList.seminars, "sortOrder", "asc")
  //           // eachSubSectionList.map((eachSeminar) => {
  //           return eachSortedSeminar
  //         })
  //         return sortedSeminars
  //       })

  //       return sortedResult //const sortedSeminarData = sortedSeminar
  //     }

  //     //Case4: DATE - CATE
  //     if (targetSeminars[0].sectionType === FilterCategoryType.DATE) {
  //       //Level 1
  //       const sortedSubSectionList = _.orderBy(targetSeminars, "sectionValue", "asc")

  //       //Level 3
  //       const sortedSeminars = sortedSubSectionList.map((eachSectionList) => {
  //         eachSectionList.subSectionList.map((eachSubSectionList) => {
  //           const eachSortedSeminar = _.orderBy(eachSubSectionList.seminars, "sortOrder", "asc")
  //           // eachSubSectionList.map((eachSeminar) => {
  //           return eachSortedSeminar
  //         })
  //         return eachSectionList
  //       })

  //       return sortedSeminars   //const sortedSeminarData = sortedResult
  //     }
  //   }
  //   return [];
  // }

  private handleSortSeminarV2 = async (targetSeminars: Section[], dateCurrActiveValue: string, idMappingDictV2: Record<string, SeminarEntity>) => {
    return wrapAwsXray('ConferenceService', 'handleSortSeminarV2', this.logger, async () => {
      if (targetSeminars.length <= 0) return [] as FindAllFinalResult[];

      const isDateFilterChooseAll = dateCurrActiveValue === "all" || dateCurrActiveValue === ""
      const isFirstLayerDateFilter = targetSeminars[0].sectionType === FilterCategoryType.DATE
      const newSortedSeminarArrayByDate = isFirstLayerDateFilter ? _.orderBy(targetSeminars, "sectionValue", "asc") : _.orderBy(targetSeminars, "subSectionList.subSectionValue", "asc");

      let finalResult = null

      //NOTE: Unless date filter is "all", rest of the cases should filter the seminar data by category and time
      if (isDateFilterChooseAll) {
        finalResult = await this.sortDataByCategoryV2(newSortedSeminarArrayByDate, idMappingDictV2, true)
      } else {
        //NOTE: if fell into this case, dateCurrActiveValue is not "all", which means there is a specific value(eg. 2022-03-16)
        const filteredDateSeminar = newSortedSeminarArrayByDate.filter(seminars => { return seminars?.subSectionList?.length > 0 })
        finalResult = await this.sortDataByCategoryV2(filteredDateSeminar, idMappingDictV2)
      }


      return finalResult;
    })
  }

  private handleSortSeminar = (targetSeminars: FindAllFinalResult[], dateCurrActiveValue: string) => {
    return wrapAwsXray('ConferenceService', 'handleSortSeminar', this.logger, async () => {
      const isDateFilterChooseAll = dateCurrActiveValue === "all" || dateCurrActiveValue === ""

      //NOTE: Unless date filter is "all", rest of the cases should filter the seminar data by category and time
      if (isDateFilterChooseAll) {
        const sortedSeminar = _.orderBy(targetSeminars, ["startAt", "endAt"], ["asc", "asc"])

        return sortedSeminar;
      } else {
        return this.sortDataByCategory(targetSeminars)
      }
    })
  }

  private handleUniqueFilterValues(allSeminarData: FindAllFinalResult[]) {
    const isDateFirstLayer = allSeminarData?.length > 0 ? allSeminarData[0].firstLayerFilter.type === "DATE" : false

    //NOTE: if 1st layer filter is date, "uniqueSecondFilterValues" should adapt handleFilterUniqueCategory() since 2nd layer must be category
    const uniqueFirstFilterValues = isDateFirstLayer ? this.handleFilterUniqueDate(allSeminarData) : this.handleFilterUniqueCategory(allSeminarData, true)
    const uniqueSecondFilterValues = !isDateFirstLayer ? this.handleFilterUniqueDate(allSeminarData) : this.handleFilterUniqueCategory(allSeminarData, false)

    const uniqueFirstCategory = {
      identifier: "first",
      type: allSeminarData?.length > 0 ? allSeminarData[0].firstLayerFilter.type : "<no_first_type>",
      values: uniqueFirstFilterValues
    }

    const uniqueSecondCategory = {
      identifier: "second",
      type: allSeminarData?.length > 0 ? allSeminarData[0].secondLayerFilter.type : "<no_second_type>",
      values: uniqueSecondFilterValues
    }

    return {
      uniqueFirstCategory,
      uniqueSecondCategory,
      isDateFirstLayer
    };
  }

  private handleFnFilterOptions(filterCategories: GenerateFilterOptionsResult, criteria: FilterCriteriaFromFn, isDateFirstLayer: boolean) {
    const initializedFilterCategories = this.initFilterOptions(filterCategories, criteria, isDateFirstLayer);

    //NOTE: wrap into array to match frontend appSync query format
    return [initializedFilterCategories];
  }

  private getMomentLocale(locale: string | string[] | undefined) {
    if (locale == 'en') {
      return 'en'
    } else if (locale == 'cn') {
      return 'zh-cn'
    } else if (locale == 'zh') {
      return 'zh-hk'
    } else {
      return 'en'
    }
  }


  //NOTE: date should be HK date
  private formatLocaleDate(date: string | undefined, currentDateFormat: string | moment.MomentBuiltinFormat | undefined, locale: string | string[] | undefined, enDateFormat: string, zhDateFormat: string) {
    return moment(date, currentDateFormat)
      .tz('Asia/Hong_Kong')
      .locale(this.getMomentLocale(locale))
      .format(this.getMomentLocale(locale) == 'en' ? enDateFormat : zhDateFormat)
  }


  private handleFinalizedDateOptions(dateValues: string[], locale: string) {
    const sortedDateSet = dateValues.sort(function (a, b) {
      const dateA = new Date(a).getTime()
      const dateB = new Date(b).getTime()

      return dateA - dateB
    })
    const finalDateOptions = sortedDateSet.map(date => {
      return {
        label: this.formatLocaleDate(date, moment.ISO_8601, locale, enDateFormat2, zhDateFormat1),
        value: moment(date).format("YYYY-MM-DD"),
      }
    })

    return finalDateOptions;
  }

  private generateFilterOptions = (categories: UniqueFilterCategory, locale: string) => {
    const { uniqueFirstCategory, uniqueSecondCategory } = categories

    const isDateFirstLayer = categories?.uniqueFirstCategory?.type?.toUpperCase() === FilterCategoryType.DATE
    const sortedDateOptions: { label: string, value: string }[] = this.handleFinalizedDateOptions(isDateFirstLayer ? uniqueFirstCategory?.values : uniqueSecondCategory?.values, locale)
    const categoryOptions = Object.values(categories).filter(category => category.type === FilterCategoryType.CATEGORY)[0]?.values || []

    return {
      sortedDateOptions,
      categoryOptions
    }
  }

  private initFilterOptions(sortedFilters: GenerateFilterOptionsResult, criteria: FilterCriteriaFromFn, isDateFirstLayer: boolean /* locale: string,  */) {
    const { sortedDateOptions, categoryOptions } = sortedFilters
    const { firstCriteria, secondCriteria } = criteria

    const dateCurrActiveValueFromUpperLevel = isDateFirstLayer ? firstCriteria : secondCriteria
    const categoryCurrActiveValueFromUpperLevel = isDateFirstLayer ? secondCriteria : firstCriteria

    const totalDateOptions = sortedDateOptions.length > 0 ? [{
      //NOTE: render related locale "all" label should be done by frontend
      label: "all",
      value: "all",
      isActive: false,
      type: FilterCategoryType.DATE,
    }, ...sortedDateOptions] : sortedDateOptions

    const totalCategoryOptions = categoryOptions.length > 1 ? ["all", ...categoryOptions] : categoryOptions


    const finalizedOptionsForDate = totalDateOptions.reduce((acc, { value, label }, i) => {
      // const dateValueInCorrectFormat = value !== "all" ? moment(value).format("YYYY-MM-DD") : value
      const isCurrDateOptionActive = dateCurrActiveValueFromUpperLevel === value

      acc.push({
        type: FilterCategoryType.DATE,
        value/* : dateValueInCorrectFormat */,
        label,
        isActive: isCurrDateOptionActive
      })

      return acc
    }, [] as FilterOptionDetail[])

    const finalizedOptionsForCategory = totalCategoryOptions.reduce((acc, categoryName, i) => {
      const isCurrCategoryOptionActive = categoryCurrActiveValueFromUpperLevel === categoryName

      acc.push({
        type: FilterCategoryType.CATEGORY,
        label: categoryName,
        value: categoryName,
        isActive: isCurrCategoryOptionActive
      })

      return acc
    }, [] as FilterOptionDetail[])


    return {
      firstCategory: isDateFirstLayer ? finalizedOptionsForDate : finalizedOptionsForCategory,
      secondCategory: isDateFirstLayer ? finalizedOptionsForCategory : finalizedOptionsForDate
    }
  }

  private handleFilterUniqueDate(targetSeminarDataForDate: FindAllFinalResult[]) {
    if (targetSeminarDataForDate) {
      const uniqueFirstFilterValuesInScope = _.uniqBy(targetSeminarDataForDate, "formattedStartDate").map(elem => elem.startAt)

      return uniqueFirstFilterValuesInScope
    } else {
      return []
    }
  }

  private handleSortSeminarByCategorySortOrder = async (isFirstFilterLayerCategory: boolean, fullSeminarDatas: Section[], idMappingDictV2: Record<string, SeminarEntity>) => {
    return wrapAwsXray('ConferenceService', 'handleSortSeminarByCategorySortOrder', this.logger, async () => {
      let finalResult = null

      if (isFirstFilterLayerCategory) {
        const sortedFirstLayerCategorySeminar = fullSeminarDatas.sort((a, b) => { return (Number(a?.sortOrder) || -1) - (Number(b?.sortOrder) || 0) });

        const sortedInnerSeminars = sortedFirstLayerCategorySeminar.reduce((acc, eachSectionList) => {
          const sortedSubSectionListWithSeminars = eachSectionList.subSectionList.map(eachSubSectionList => {
            const sortedSeminars = _.orderBy(eachSubSectionList.seminars, "sortOrder", "asc")

            return {
              ...eachSubSectionList,
              seminars: sortedSeminars
            }

          })

          acc.push({
            ...eachSectionList,
            subSectionList: sortedSubSectionListWithSeminars
          })

          return acc
        }, [] as any)

        finalResult = sortedInnerSeminars
      } else {
        const sortedSecondLayerCategorySeminar = fullSeminarDatas.reduce((acc, oneSectionList) => {
          const sortedSubSectionList = oneSectionList.subSectionList.sort((a, b) => { return (Number(a?.sortOrder) || -1) - (Number(b?.sortOrder) || 0) });
          const sortedSubSectionListWithSeminars = sortedSubSectionList.map((oneSubSectionList) => {
            const sortedSeminars = _.orderBy(oneSubSectionList.seminars, ["sortOrder", "startTime"], ["asc", "asc"])

            return {
              ...oneSubSectionList,
              seminars: sortedSeminars
            }
          })


          acc.push({
            ...oneSectionList,
            subSectionList: sortedSubSectionListWithSeminars
          })


          return acc
        }, [] as any)

        finalResult = sortedSecondLayerCategorySeminar
      }

      const modifiedAllSeminars = await this.getAllSeminarsV3(finalResult, idMappingDictV2);

      return modifiedAllSeminars
    })
  }

  private sortDataByCategoryV2 = async (filteredSeminarData: Section[], idMappingDictV2: Record<string, SeminarEntity>, ignoreCategory = false) => {
    return wrapAwsXray('ConferenceService', 'sortDataByCategoryV2', this.logger, async () => {
      if (filteredSeminarData.length === 0) return [] as FindAllFinalResult[];

      let flattenSortedSeminarData: FindAllFinalResult[] = []
      if (ignoreCategory) {
        const sortedArrayByCategorySortOrder = await this.getAllSeminarsV3(filteredSeminarData, idMappingDictV2)

        for (const eachSectionList of sortedArrayByCategorySortOrder) {
          for (const seminarGroup of eachSectionList.subSectionList) {
            for (const seminar of seminarGroup.seminars) {
              flattenSortedSeminarData.push(seminar)
            }
          }
        }

        flattenSortedSeminarData = _.orderBy(flattenSortedSeminarData, ["firstLayerFilter.value", "sortOrder", "startAt", "name"], ["asc", "asc", "asc", "asc"])
      }
      else {
        const isFirstFilterLayerCategory = filteredSeminarData[0].sectionType === "CATEGORY"
        const sortedArrayByCategorySortOrder = await this.handleSortSeminarByCategorySortOrder(isFirstFilterLayerCategory, filteredSeminarData, idMappingDictV2)

        for (const eachSectionList of sortedArrayByCategorySortOrder) {
          for (const seminarGroup of eachSectionList.subSectionList) {
            const sortedSeminarsByStartTime = _.orderBy(seminarGroup.seminars, ["sortOrder", "startAt", "name"], ["asc", "asc", "asc"])

            for (const seminar of sortedSeminarsByStartTime) {
              flattenSortedSeminarData.push(seminar)
            }
          }
        }
      }

      // const seminarSortedByCategory = _.chain(allSeminarData)
      //   .groupBy(seminar => { return seminar[isFirstFilterLayerCategory ? "firstLayerFilter" : "secondLayerFilter"].value })
      //   .toPairs()
      //   .sortBy(keyValueArray => {
      //     //NOTE: Sort by seminar key by alphabetical order  
      //     return keyValueArray[0]
      //   })
      //   /* .sortBy(keyValueArray => {
      //     //NOTE: Sort BETWEEN seminar groups
      //     return keyValueArray[1][0].startAt
      //   }) */
      //   .map(keyValueArray => {
      //     // NOTE: Sort WITHIN seminars group
      //     const sortedArrayInEachGroupSeminarData = _.orderBy(keyValueArray[1], ["startAt", "endAt"], ["asc", "asc"])

      //     return sortedArrayInEachGroupSeminarData
      //   })
      //   .flatten()
      //   .value()

      return flattenSortedSeminarData
    })
  }

  private sortDataByCategory = (allSeminarData: FindAllFinalResult[]) => {
    if (allSeminarData.length === 0) return allSeminarData;

    const isFirstFilterLayerCategory = allSeminarData[0].firstLayerFilter.type === "CATEGORY"
    const seminarSortedByCategory = _.chain(allSeminarData)
      .groupBy(seminar => { return seminar[isFirstFilterLayerCategory ? "firstLayerFilter" : "secondLayerFilter"].value })
      .toPairs()
      .sortBy(keyValueArray => {
        //NOTE: Sort by seminar key by alphabetical order  
        return keyValueArray[0]
      })
      /* .sortBy(keyValueArray => {
        //NOTE: Sort BETWEEN seminar groups
        return keyValueArray[1][0].startAt
      }) */
      .map(keyValueArray => {
        // NOTE: Sort WITHIN seminars group
        const sortedArrayInEachGroupSeminarData = _.orderBy(keyValueArray[1], ["startAt", "endAt"], ["asc", "asc"])

        return sortedArrayInEachGroupSeminarData
      })
      .flatten()
      .value()

    return seminarSortedByCategory
  }

  private handleFilterUniqueCategory(targetSeminarDataForCategory: FindAllFinalResult[], isFirstLayer: boolean) {
    if (targetSeminarDataForCategory) {
      const uniqueItems = targetSeminarDataForCategory
        .map(seminar => isFirstLayer ? seminar.firstLayerFilter.value : seminar.secondLayerFilter.value)
        .filter((value, i, selfArray) => selfArray.indexOf(value) === i)
      const uniqueItemsSortedByAlphabet = uniqueItems.sort((a, b) => a.localeCompare(b));

      return uniqueItemsSortedByAlphabet
    } else {
      return []
    }
  }

  public async callSbeSeminars(query: SBEQuery) {
    return wrapAwsXray('ConferenceService', 'callSbeSeminars', this.logger, async () => {
      return await this.sbeService.getSeminars(query);
    })
  }

  public async findAllV3(sbeParams: SbeEndpointRequestDto, criteria: FilterSeminarCriteria, optionalInfo: Partial<OptionalInfo>): Promise<ConfSeminarDetailsV2[]> {
    return wrapAwsXray('ConferenceService', 'findAllV3', this.logger, async () => {
      const query: SBEQuery = {
        ...sbeParams,
        displayPaidSeminars: 0,
      };

      //NOTE: comment it is only for testing
      const { data } = await this.callSbeSeminars(query);

      if (typeof criteria !== 'string' && optionalInfo.seminarId) {
        criteria.optionalSeminarId = optionalInfo.seminarId
      }

      //NOTE: local mock data for development
      // const mockDataWithFakeSortOrder = /* mockDataCateDate */ mockDataDateCate.sectionList.reduce((finalResult, oneSectionList) => {
      //   const newElem = { ...oneSectionList, sortOrder: String(Math.floor(Math.random() * 10000)) }

      //   const newSubSectionListWithFakeSortOrder = oneSectionList.subSectionList.reduce((finalResult, oneSubSectionList) => {
      //     const newElem = { ...oneSubSectionList, sortOrder: String(Math.floor(Math.random() * 10000)) }

      //     finalResult.push(newElem);

      //     return finalResult
      //   }, [] as any)


      //   finalResult.push({ ...newElem, subSectionList: newSubSectionListWithFakeSortOrder })

      //   return finalResult
      // }, [] as any)

      // console.log(query)

      // //NOTE: this is only for local dev
      // const data = {
      //   ...mockDataDateCate,
      //   sectionList: mockDataWithFakeSortOrder
      // }


      /*gen file starts NOTE: only for local dev*/
      /*  const fileName = `./fake-mock-data-${uuid()}.json`
       fs.writeFileSync(fileName, JSON.stringify(data), 'utf8');
       console.log("JSON file has been saved.", fileName); */
      /*gen file ends*/

      const sbeFooter = data.footer
      const { sectionListForModal, sectionList, dateValue, modifiedCriteria, isDateFirstLayer, uniqueFirstCategory, uniqueSecondCategory } = await this.filterSeminars(
        [...data.sectionList],
        criteria)
      data.sectionList = sectionList

      const { subSectionsWithTypeAndValue, idMappingDictV2 } = await this.reformatSBESeminars(data)
      const { subSectionsWithTypeAndValue: subSectionsWithTypeAndValueForModal, idMappingDictV2: idMappingDictV2ForModal } = await this.reformatSBESeminars({ ...data, sectionList: sectionListForModal })

      const sortedSeminarData = await this.handleSortSeminarV2(subSectionsWithTypeAndValue, dateValue, idMappingDictV2)
      const sortedSeminarDataForModal = await this.handleSortSeminarV2(subSectionsWithTypeAndValueForModal, dateValue, idMappingDictV2ForModal)

      //NOTE: this is for debug only 
      /* const a = sortedSeminarData.map(elem => { return { firstLayerOrder: elem.firstLayerFilter.sortOrder, secondLayerOrder: elem.secondLayerFilter.sortOrder, startTime: elem.startAt } }) */


      //Rudy's version
      // const sortedSeminarData = await this.handleSortSeminarV3(subSectionsWithTypeAndValue, dateValue);
      // const allSeminarData = await this.getAllSeminarsV3(sortedSeminarData, idMappingDictV2)
      //const allSeminarData = await this.getAllSeminarsV2(sortedSeminarData, idMappingDictV2)  //(subSectionsWithTypeAndValue, idMappingDictV2)


      const { sortedDateOptions, categoryOptions } = this.generateFilterOptions({ uniqueFirstCategory, uniqueSecondCategory }, sbeParams.language)

      const seminarDataForModal = optionalInfo?.seminarId ? sortedSeminarDataForModal.filter(seminar => seminar?.id === optionalInfo?.seminarId) : [];
      const seminarWithFirstAppearance = this.determineFirstAppearanceForEachFilter(sortedSeminarData);

      //RUDY'S version
      // const seminarDataForModal = optionalInfo?.seminarId ? allSeminarData.filter(seminar => seminar?.id === optionalInfo?.seminarId) : [];
      // const seminarWithFirstAppearance = this.determineFirstAppearanceForEachFilter(allSeminarData);
      const categoriesForFn = this.handleFnFilterOptions({ sortedDateOptions, categoryOptions }, modifiedCriteria, isDateFirstLayer)

      return [{
        seminarData: seminarWithFirstAppearance,
        seminarDataForModal,
        categories: categoriesForFn,
        seminarDataAmount: seminarWithFirstAppearance.length,
        sbeFooter,
      }]
    })
  }

  public async filterSeminars(sectionList: Section[], criteria: FilterSeminarCriteria | string) {
    return wrapAwsXray('ConferenceService', 'filterSeminars', this.logger, async () => {
      let result: any = {
        sectionListForModal: [],
        sectionList,
        dateValue: '',
        categoryValue: '',
        modifiedCriteria: typeof criteria === 'string' ? { firstCriteria: '', secondCriteria: '' } : criteria,
        isDateFirstLayer: false,
        uniqueFirstCategory: { identifier: 'first', type: '', values: [] as string[] },
        uniqueSecondCategory: { identifier: 'second', type: '', values: [] as string[] }
      }

      // find specific seminar
      if (typeof criteria === 'string') {
        for (const s of sectionList) {
          for (const ss of s.subSectionList) {
            for (const se of ss.seminars) {
              if (String(se.id) === String(criteria)) {
                result.sectionList = [{
                  ...s,
                  subSectionList: [{
                    ...ss,
                    seminars: [se]
                  }]
                }]
                return result
              }
            }
          }
        }
        result.sectionList = []
        return result
      }

      result.uniqueFirstCategory.type = sectionList[0]?.sectionType
      result.uniqueSecondCategory.type = sectionList[0]?.subSectionList[0]?.subSectionType

      const isDateFirstLayer = result.isDateFirstLayer = result.uniqueFirstCategory.type === 'DATE'
      const dateCurrActiveValueFromFn = isDateFirstLayer ? criteria?.firstCriteria : criteria?.secondCriteria
      const categoryCurrActiveValueFromFn = isDateFirstLayer ? criteria?.secondCriteria : criteria?.firstCriteria

      result.dateValue = dateCurrActiveValueFromFn
      result.categoryValue = categoryCurrActiveValueFromFn



      const int_dates: Record<string, FilterFields> = {}
      const int_categories: Record<string, FilterFields> = {}
      for (const s of sectionList) {
        (isDateFirstLayer ? int_dates : int_categories)[s.sectionValue] = {
          value: s.sectionValue,
          sortOrder: Number(s.sortOrder) || -1
        }
        for (const ss of s.subSectionList) {
          (isDateFirstLayer ? int_categories : int_dates)[ss.subSectionValue] = {
            value: ss.subSectionValue,
            sortOrder: Number(ss.sortOrder) || -1
          }
          for (const se of ss.seminars) {
            int_dates[se.startTime.split('T')[0]] = {
              value: se.startTime.split('T')[0],
              sortOrder: Number(se.sortOrder) || -1
            }
          }
        }
      }
      const uniqueDateFilters = Object.values(int_dates).sort((a, b) => a.value.localeCompare(b.value)).map(obj => obj.value)
      const uniqueCategoryFilters = Object.values(int_categories).sort((a, b) => (a.sortOrder - b.sortOrder)).map(obj => obj.value)
      result.uniqueFirstCategory.values = isDateFirstLayer ? uniqueDateFilters : uniqueCategoryFilters
      result.uniqueSecondCategory.values = isDateFirstLayer ? uniqueCategoryFilters : uniqueDateFilters

      const dateOptions = uniqueDateFilters /* Object.keys(sectionList.reduce<Record<string, true>>((r, s) => {
        if (isDateFirstLayer) {
          r[s.sectionValue] = true
        }
        else {
          for (const ss of s.subSectionList) {
            r[ss.subSectionValue] = true
          }
        }
        return r
      }, {})) */

      const dateOptionsMatchTodayIndex = uniqueDateFilters.findIndex(value => {
        const today = moment().tz('Asia/Hong_Kong')
        const dateFilterOptionInMoment = moment(value).tz('Asia/Hong_Kong')
        const isDateFilterOptionMatchToday = today.isSame(dateFilterOptionInMoment, "day")
        return isDateFilterOptionMatchToday;
      })
      const hasDateOptionMatchToday = dateOptionsMatchTodayIndex !== -1
      if (hasDateOptionMatchToday) result.dateValue = dateOptions[dateOptionsMatchTodayIndex]

      const relatedDateFilterOrder = isDateFirstLayer ? "first" : "second"
      const desiredDateFilterValue = dateCurrActiveValueFromFn === ""
        ? hasDateOptionMatchToday
          ? dateOptions[dateOptionsMatchTodayIndex]
          : "all"
        : dateCurrActiveValueFromFn
      const desiredCategoryFilterValue = categoryCurrActiveValueFromFn === "" ? "all" : categoryCurrActiveValueFromFn
      const firstCriteria = relatedDateFilterOrder === "first" ? desiredDateFilterValue : desiredCategoryFilterValue
      const secondCriteria = relatedDateFilterOrder === "first" ? desiredCategoryFilterValue : desiredDateFilterValue
      result.modifiedCriteria = { firstCriteria, secondCriteria }

      const firstCategorySelectAll = firstCriteria === "all"
      const secondCategorySelectAll = secondCriteria === "all"

      type NewSBESeminar = any // SBESeminar & { firstFilterLayer: string; secondFilterLayer: string }

      if (firstCategorySelectAll && secondCategorySelectAll) {
        if (criteria.optionalSeminarId) {
          let oneSectionList: Section | undefined, oneSubSection: SubSection | undefined, seminar: NewSBESeminar | undefined
          for (oneSectionList of sectionList) {
            for (oneSubSection of oneSectionList.subSectionList) {
              seminar = oneSubSection.seminars.find(se => String(se.id) === String(criteria.optionalSeminarId))
              if (seminar) break
            }
            if (seminar) break
          }
          if (seminar) {
            result.sectionListForModal = [{
              sectionType: oneSectionList?.sectionType,
              sectionValue: oneSectionList?.sectionValue,
              sortOrder: oneSectionList?.sortOrder,
              subSectionList: [{
                subSectionType: oneSubSection?.subSectionType,
                subSectionValue: seminar.secondFilterLayer,
                sortOrder: seminar.secondLayerSortOrder,
                seminars: [seminar]
              }]
            }] as Section[]
          }
        }
        return result
      }

      // filter
      result.sectionList = sectionList.reduce<Section[]>((allSectionList, oneSectionList) => {
        if (oneSectionList.subSectionList.length) {
          const subSectionType = oneSectionList.subSectionList[0].subSectionType
          const seminars = oneSectionList.subSectionList.reduce<NewSBESeminar[]>((r_, ss) => {
            for (const se of ss.seminars) {
              const formattedStartDate = moment(se.startTime).tz('Asia/Hong_Kong').format('ddd, DD MMM YYYY').toUpperCase()
              r_.push({
                ...se,
                firstFilterLayer: isDateFirstLayer ? formattedStartDate : oneSectionList.sectionValue,
                secondFilterLayer: isDateFirstLayer ? ss.subSectionValue : formattedStartDate,
                firstLayerSortOrder: oneSectionList.sortOrder,
                secondLayerSortOrder: ss.sortOrder,
              })
            }
            return r_
          }, [])

          const modifiedFirstCriteriaValue = isDateFirstLayer ? moment(firstCriteria).tz('Asia/Hong_Kong').format('ddd, DD MMM YYYY').toUpperCase() : firstCriteria
          const modifiedSecondCriteriaValue = !isDateFirstLayer ? moment(secondCriteria).tz('Asia/Hong_Kong').format('ddd, DD MMM YYYY').toUpperCase() : secondCriteria

          const filtered = seminars.filter(se =>
            (firstCategorySelectAll || (se.firstFilterLayer === modifiedFirstCriteriaValue)) &&
            (secondCategorySelectAll || (se.secondFilterLayer === modifiedSecondCriteriaValue))
          )

          if (criteria.optionalSeminarId && !result.sectionListForModal.length) {
            const seminar = seminars.find(se => String(se.id) === String(criteria.optionalSeminarId))
            if (seminar) {
              result.sectionListForModal = [{
                sectionType: oneSectionList.sectionType,
                sectionValue: oneSectionList.sectionValue,
                sortOrder: oneSectionList.sortOrder,
                subSectionList: [{
                  subSectionType,
                  subSectionValue: seminar.secondFilterLayer,
                  sortOrder: seminar.secondLayerSortOrder,
                  seminars: [seminar]
                }]
              }] as Section[]
            }
          }

          allSectionList.push(filtered.reduce<Section>((r, se) => {
            let ss = r.subSectionList.find(ss => ss.subSectionValue === se.secondFilterLayer)

            //DEBUG: see if it is okay to add the "sortOrder" like this when SBE api is ready on 20 July
            if (!ss) r.subSectionList.push(ss = {
              sortOrder: se?.secondLayerSortOrder,
              subSectionValue: se?.secondFilterLayer,
              subSectionType,
              seminars: []
            })
            ss.seminars.push(se)
            return r
          }, { ...oneSectionList, subSectionList: [] }))
        }
        return allSectionList
      }, [])

      return result
    })
  }

  async getSBESeminarsDetail(seminarIds: string[]) {
    return wrapAwsXray('ConferenceService', 'getSBESeminarsDetail_v3', this.logger, async () => {
      // NOTE: orig version
      // return await this.seminarRepository.find({ where: { sbeSeminarId: In(seminarIds) }, });

      // NOTE: v2 version take away playback join

      const seminarDetails = await wrapAwsXray('ConferenceService', 'getSBESeminarsDetail_v3_l1', this.logger, async () => {
        return await
          this.seminarRepository.createQueryBuilder('s')
            // .leftJoinAndSelect("s.kol", "kol")
            // .leftJoinAndSelect("s.rtmps", "rtmp")
            // .leftJoinAndSelect("s.vods", "vod")
            .where("sbeSeminarId IN (:...ids) ", { ids: seminarIds })
            .getMany()
      })

      if (seminarDetails.length) {
        // NOTE: v3 version take away any join
        const kolIds = seminarDetails.filter(s => s.streamingType === StreamingType.KOL).map(s => s.id)
        const rtmpIds = seminarDetails.filter(s => s.streamingType === StreamingType.LIVE).map(s => s.id)
        const vodIds = seminarDetails.filter(s => s.streamingType === StreamingType.VOD).map(s => s.id)

        if (kolIds.length || rtmpIds.length || vodIds.length) {
          await wrapAwsXray('ConferenceService', 'getSBESeminarsDetail_v3_l2', this.logger, async () => {
            const [kols, rtmps, vods] = await Promise.all([
              !kolIds.length ? [] as Kol[] : this.kolRepository.createQueryBuilder().where("seminarId IN (:...ids)", { ids: kolIds }).getMany(),
              !rtmpIds.length ? [] as Rtmp[] : this.rtmpRepository.createQueryBuilder().where("seminarId IN (:...ids)", { ids: rtmpIds }).getMany(),
              !vodIds.length ? [] as Vod[] : this.vodRepository.createQueryBuilder().where("seminarId IN (:...ids)", { ids: vodIds }).getMany()
            ])

            for (const s of seminarDetails) {
              switch (s.streamingType) {
                case StreamingType.KOL: {
                  s.kol = kols.find(k => k.seminarId === s.id) as Kol
                  break
                }
                case StreamingType.LIVE: {
                  s.rtmps = rtmps.filter(r => r.seminarId === s.id)
                  break
                }
                case StreamingType.KOL: {
                  s.vods = vods.filter(v => v.seminarId === s.id)
                  break
                }
              }
            }
          })

          const mapping = {} as Record<string, Kol | Vod | Rtmp>
          const ids = seminarDetails.reduce((finalResults, seminarDetail) => {
            const { kol, vods = [], rtmps = [] } = seminarDetail;

            if (kol?.playbackVideoId) {
              finalResults.push(kol?.playbackVideoId)
              mapping[kol.playbackVideoId] = kol
            }

            for (const vod of vods) {
              if (vod.playbackVideoId) {
                finalResults.push(vod.playbackVideoId)
                mapping[vod.playbackVideoId] = vod
              }

              if (vod.liveVideoId) {
                finalResults.push(vod.liveVideoId)
                mapping[vod.liveVideoId] = vod
              }
            }

            for (const rtmp of rtmps) {
              if (rtmp.playbackVideoId) {
                finalResults.push(rtmp.playbackVideoId)
                mapping[rtmp.playbackVideoId] = rtmp
              }
            }

            return finalResults;
          }, [] as number[])

          if (ids.length) {
            await wrapAwsXray('ConferenceService', 'getSBESeminarsDetail_v3_l3', this.logger, async () => {
              const allVideos = await
                this.videoRepository.createQueryBuilder()
                  .where("id in (:...ids)", { ids })
                  .getMany()

              for (const video of allVideos) {
                const entity = mapping[video.id]
                if ('liveVideoId' in entity && entity.liveVideoId === video.id) entity.liveVideo = video
                else if (entity.playbackVideoId === video.id) entity.playbackVideo = video
              }
            })
          }
        }
      }

      return seminarDetails;
    })
  }

  public async reformatSBESeminars(data: any) {
    return wrapAwsXray('ConferenceService', 'reformatSBESeminars', this.logger, async () => {
      const subSectionsWithTypeAndValue = data.sectionList as Section[]

      const allSeminarIds = []
      for (const subSection of subSectionsWithTypeAndValue) {
        for (const seminarGp of subSection.subSectionList) {
          for (const seminar of seminarGp.seminars) {
            allSeminarIds.push(seminar.id)
          }
        }
      }

      // get those already exists
      const entitiesV2 = allSeminarIds.length ? await this.getSBESeminarsDetail(allSeminarIds) : []

      // TODO no need to create as can be created at admin portal
      /* const notFound = allSeminarIds.filter(id => !entitiesV2.find(e => e.sbeSeminarId == id))
      if (notFound.length) {
        await this.createIfNull(notFound, true)
        entitiesV2.push(...await this.getSBESeminarsDetail(notFound))
      } */

      const idMappingDictV2: Record<string, SeminarEntity> = entitiesV2.reduce((prev: Record<string, SeminarEntity>, entity: SeminarEntity) => ({ ...prev, [entity.sbeSeminarId]: entity }), {});

      return {
        sbeFooter: data?.footer,
        subSectionsWithTypeAndValue,
        idMappingDictV2
      }
    })
  }

  public async getParticipants({ from, size, ...params }: SearchConfParticipantsReqInt): Promise<SearchConfParticipantsResData & BaseRes> {
    return wrapAwsXray('ConferenceService', 'getParticipants', this.logger, async () => {
      const qb = this.constructSearchConferenceParticipantsQB({ from, size, ...params });

      const sql = qb.getSql()
      const sqlParams = qb.getParameters()
      const total_size = await qb.getCount();
      let data: ConfParticipant[] = [];
      if (total_size > 0) {
        data = await qb.getMany();
      }

      return {
        sql,
        params: JSON.stringify(sqlParams),
        from,
        size,
        total_size,
        participants: data,
        sensitiveKeyword: false
      }
    })
  }

  public constructSearchConferenceParticipantsQB({ fairCode, fiscalYear, projectYear, ...params }: SearchConfParticipantsReqInt | GetConfParticipantReqInt) {
    let result = this.FairRegistrationRepository
      .createQueryBuilder('fairRegistration')
      .distinct()
      .leftJoin('fairRegistration.fairParticipantType', 'fairParticipantType')
      .leftJoin('fairRegistration.fairRegistrationStatus', 'fairRegistrationStatus')
      .leftJoin('fairRegistration.c2mParticipantStatus', 'c2mParticipantStatus')
      .select(['fairRegistration.id', 'fairRegistration.displayName', 'fairRegistration.position', 'fairRegistration.companyName'])
      .where('fairParticipantType.fairParticipantTypeCode = :typeCode', { typeCode: 'GENERAL_PARTICIPANT' })
      .andWhere('fairRegistrationStatus.fairRegistrationStatusCode = :statusCode', { statusCode: 'CONFIRMED' })
      .andWhere('c2mParticipantStatus.c2mParticipantStatusCode = :c2mStatusCode', { c2mStatusCode: 'ACTIVE' })
      .andWhere('fairRegistration.fairCode = :fairCode', { fairCode })
      .andWhere(fiscalYear ? 'fairRegistration.fiscalYear = :fiscalYear' : "1=1", { fiscalYear })
      .andWhere(projectYear ? 'fairRegistration.projectYear = :projectYear' : "1=1", { projectYear })
      .orderBy('fairRegistration.displayName')

    if ('id' in params) {
      result = result
        .leftJoin('fairRegistration.fairParticipant', 'fairParticipant')
        .leftJoin('fairRegistration.fairRegistrationCustomQuestions', 'fairRegistrationCustomQuestion')
        .addSelect(['fairParticipant.ssoUid', 'fairRegistration.addressCountryCode', 'fairRegistrationCustomQuestion.questionNum', 'fairRegistrationCustomQuestion.categoryCode', 'fairRegistrationCustomQuestion.optionText'])
        .andWhere('fairRegistration.id = :id', params);
    }
    else if ('ssoUid' in params) {
      result = result
        .leftJoin('fairRegistration.fairParticipant', 'fairParticipant')
        .addSelect(['fairRegistration.firstName', 'fairRegistration.lastName', 'fairParticipantType.fairParticipantTypeDesc', 'fairParticipant.ssoUid', 'fairParticipant.emailId'])
        .andWhere('fairParticipant.ssoUid = :ssoUid', params)
    }
    else {
      const { keywordType, keyword, filterCountry, from, size,
        filterQ1 = [],
        filterQ2 = [],
        filterQ3 = [],
        filterQ4 = [],
        filterQ5 = [],
        filterQ6 = [],
        filterQ7 = [],
        filterQ8 = [],
        filterQ9 = [],
        filterQ10 = []
      } = params;

      if (typeof from === 'number' && typeof size === 'number') {
        result = result.offset(from).limit(size);
      }

      if (keyword && keyword.length) {
        const keyword_ = `%${keyword}%`;
        let columns: string[] = []
        switch (keywordType) {
          case 'displayName': {
            columns.push('displayName')
            break;
          }
          case 'position': {
            columns.push('position')
            break;
          }
          case 'companyName': {
            columns.push('companyName')
            break;
          }
          case 'all':
          default: {
            columns.push('displayName', 'position', 'companyName')
            break;
          }
        }
        let sql = ''
        for (const column of columns) {
          if (column !== columns[0]) sql += ' OR '
          sql += `(MATCH(fairRegistration.${column}) AGAINST (:keyword) OR fairRegistration.${column} LIKE :keyword_)`
        }
        result = result.andWhere(`(${sql})`, { keyword, keyword_ })
      }

      if (filterCountry && filterCountry.length) {
        result = result.andWhere('fairRegistration.addressCountryCode = :filterCountry', { filterCountry });
      }

      const filters = [filterQ1, filterQ2, filterQ3, filterQ4, filterQ5, filterQ6, filterQ7, filterQ8, filterQ9, filterQ10];
      for (let i = 0; i < 10; i += 1) {
        const filter = filters[i];
        if (filter.length) {
          result = result.andWhere(`EXISTS (SELECT 'x' FROM fairRegistrationCustomQuestion rcq LEFT JOIN fairCustomQuestionFilter cqf ON rcq.questionNum = cqf.questionNum WHERE rcq.fairRegistrationId = fairRegistration.id AND cqf.fairCode = :fairCode AND ${projectYear ? 'cqf.projectYear = :projectYear' : '1=1'} AND ${fiscalYear ? 'cqf.fiscalYear = :fiscalYear' : '1=1'} AND cqf.filterNum = ${i + 1} AND rcq.categoryCode IN (:...q${i + 1}))`,
            {
              [`q${i + 1}`]: filter, fairCode, ...{
                ...projectYear && { projectYear },
                ...fiscalYear && { fiscalYear }
              }
            }
          )
        }
      }
    }

    return result;
  }

  public async getParticipant(body: GetConfParticipantReqInt): Promise<GetConfParticipantResData & BaseRes> {
    return wrapAwsXray('ConferenceService', 'getParticipant', this.logger, async () => {
      const qb = this.constructSearchConferenceParticipantsQB(body);
      const sql = qb.getSql()
      const params = qb.getParameters()
      const participant = await qb.getOne()
      if (participant && !body.ssoUid) {
        // resolve country name for display
        const { code } = await this.contentService.retrieveRawJson('COUNTRY')
        const data = Object.keys(code).map(k => code[k])
        participant.addressCountryCode =
          (data.find(({ code }) => code === participant.addressCountryCode) || {})[body.lang] ||
          participant.addressCountryCode
      }
      return { sql, params: JSON.stringify(params), participant }
    });
  }

  public async getCustomQuestions({ lang, fairCode, projectYear, fiscalYear }: GetCustomQuestionsReqInt): Promise<GetCustomQuestionsResData & BaseRes> {
    return wrapAwsXray('ConferenceService', 'getCustomQuestions', this.logger, async () => {
      lang = lang.charAt(0).toLocaleUpperCase() + lang.charAt(1);

      const result = this.FairCustomQuestionFilterRepository
        .createQueryBuilder('fairCustomQuestionFilter')
        .leftJoin(FairCustomQuestion, 'fairCustomQuestion',
          'fairCustomQuestion.questionNum = fairCustomQuestionFilter.questionNum AND ' +
          'fairCustomQuestion.fairCode = :fairCode AND ' +
          (projectYear ? 'fairCustomQuestion.projectYear = :projectYear': '1=1') + ' AND ' +
          (fiscalYear ? 'fairCustomQuestion.fiscalYear = :fiscalYear': '1=1'),
          { fairCode, projectYear, fiscalYear })
        .leftJoin(FairCustomQuestion, 'parent',
          'fairCustomQuestion.parentCategoryCode = parent.categoryCode AND ' +
          'parent.fairCode = :fairCode AND ' +
          (projectYear ? 'parent.projectYear = :projectYear': '1=1') + ' AND ' +
          (fiscalYear ? 'parent.fiscalYear = :fiscalYear': '1=1'),
          { fairCode, projectYear, fiscalYear })
        .select([
          'fairCustomQuestion.questionNum AS questionNum',
          'fairCustomQuestion.categoryCode AS categoryCode',
          'fairCustomQuestion.parentCategoryCode AS parentCategoryCode',
          `fairCustomQuestion.value${lang} AS value`,
          `fairCustomQuestion.valueEn AS valueEn`,
          `fairCustomQuestionFilter.filterNum AS filterNum`,
          `fairCustomQuestionFilter.filterName${lang} AS filterLabel`,
          `fairCustomQuestionFilter.filterNameEn AS filterLabelEn`,
          'fairCustomQuestion.sequence As sequence'
        ])
        .where('fairCustomQuestionFilter.fairCode = :fairCode', { fairCode })
        .andWhere(fiscalYear ? 'fairCustomQuestion.fiscalYear = :fiscalYear' : "1=1", { fiscalYear })
        .andWhere(projectYear ? 'fairCustomQuestion.projectYear = :projectYear' : "1=1", { projectYear })
        .orderBy('fairCustomQuestionFilter.filterNum')
        .addOrderBy('IFNULL(parent.questionNum, fairCustomQuestion.questionNum)')
        .addOrderBy('IFNULL(parent.sequence, 0)')
        .addOrderBy('IFNULL(fairCustomQuestion.sequence, 0)')

      const sql = result.getSql()
      const params = result.getParameters()
      const rawQuestions: CustomQuestion[] = await result.getRawMany()

      const parentSequence: string[] = []
      const intermediate = rawQuestions.reduce((r, q) => {
        // is child
        if (q.parentCategoryCode) {
          if (parentSequence.indexOf(q.parentCategoryCode) === -1) parentSequence.push(q.parentCategoryCode)
          r[q.parentCategoryCode] = r[q.parentCategoryCode] || [undefined]
          r[q.parentCategoryCode].push(q)
        }
        else if (!q.parentCategoryCode) {
          if (parentSequence.indexOf(q.categoryCode) === -1) parentSequence.push(q.categoryCode)
          r[q.categoryCode] = r[q.categoryCode] || [undefined]
          r[q.categoryCode][0] = q
        }
        return r
      }, {} as Record<string, CustomQuestion[]>)

      const questions = parentSequence.reduce((r, c) => {
        r.push(...intermediate[c])
        return r
      }, [] as CustomQuestion[])

      return { sql, params: JSON.stringify(params), questions }
    });
  }

  public async searchParticipantType(query: ParticipantTypeSearchDto): Promise<ParticipantTypeByFairListDto> {
    let participantTypeByFairList: ParticipantTypeByFairListDto = new ParticipantTypeByFairListDto()
    let fairDetailList: { fairCode: string, fairSettingFairCode: string, fiscalYear: string }[] = []

    await Promise.all(
      query.fairCodes.map(fairCode => {
        return new Promise<{ fairCode: string, fairSettingFairCode: string, fiscalYear: string }>(async (resolve, reject) => {
          try {
            const { data } = await this.fairService.getWordpressSettings(fairCode);
            if (data.data.website_type !== "conference") {
              reject("Wrong website type")
            }
            resolve({
              fairCode,
              fairSettingFairCode: data.data.fair_code,
              fiscalYear: data.data.fiscal_year
            })
          } catch (ex) {
            reject(ex)
          }
        })
      })
    ).then((results) => {
      fairDetailList = results;
    }).catch((ex) => {
      throw new Error('Failed to retrieve fair setting');
    })

    if (fairDetailList.length > 0) {
      participantTypeByFairList.roleByFair = await this.retieveParticipantTypeByFairList(query.ssoUid, query.emailId, fairDetailList)
    }

    return participantTypeByFairList
  }

  private async retieveParticipantTypeByFairList(ssoUid: string, emailId: string, fairDetailList: { fairCode: string, fairSettingFairCode: string, fiscalYear: string }[]) {
    const queryResults = await this.queryFairRegParticipantByFairCodeSsoUid(ssoUid, emailId,
      fairDetailList.map(x => {
        return {
          fairCode: x.fairSettingFairCode,
          fiscalYear: x.fiscalYear
        }
      })
    )

    return queryResults.filter(q => q.fairParticipantType?.fairParticipantTypeCode === "GENERAL_PARTICIPANT").map(q => {
      return {
        registrationNo: `${q.serialNumber}${q.projectYear.substring(2)}${q.sourceTypeCode}${q.visitorTypeCode}${q.projectNumber}`,
        fairCode: fairDetailList.find(x => x.fairSettingFairCode == q.fairCode)!.fairCode,
        participantType: q.fairParticipantType?.fairParticipantTypeCode ?? "",
        tier: q.tier ?? "",
        companyCcdId: "",
        suppierUrn: "",
        exhibitorType: "",
        c2mStatus: q.c2mParticipantStatus?.c2mParticipantStatusCode ?? "",
        registrationStatus: q.fairRegistrationStatus?.fairRegistrationStatusCode ?? "",
      }
    })
  }

  queryFairRegParticipantByFairCodeSsoUid = async (ssoUid: string, emailId: string, fairDetails: { fairCode: string, fiscalYear: string }[]): Promise<FairRegistration[]> => {
    return wrapAwsXray('ConferenceService', 'queryFairRegParticipantByFairCodeSsoUid', this.logger, async () => {
      const queryObject = await this.FairRegistrationRepository
        .createQueryBuilder("r")
        .leftJoinAndSelect("r.fairParticipant", "fp")
        .leftJoinAndSelect("r.fairParticipantType", "fpt")
        .leftJoinAndSelect("r.c2mParticipantStatus", "c2mStatus")
        .leftJoinAndSelect("r.fairRegistrationStatus", "regStatus")
        .leftJoinAndSelect("r.fairRegistrationType", "regType")
        .leftJoinAndSelect("r.fairRegistrationProductInterests", "productInterests")
        .leftJoinAndSelect("r.fairRegistrationProductStrategies", "productStrategies")
        .leftJoinAndSelect("r.fairRegistrationPreferredSuppCountryRegions", "preferredSuppCountryRegions")

      fairDetails.forEach((fairDetail, idx) => {
        queryObject.orWhere(`(fp.ssoUid = :ssoUid${idx} AND r.fairCode = :fairCode${idx} AND r.fiscalYear = :fiscalYear${idx})`,
          { [`ssoUid${idx}`]: ssoUid, [`fairCode${idx}`]: fairDetail.fairCode, [`fiscalYear${idx}`]: fairDetail.fiscalYear })
        queryObject.orWhere(`(fp.emailId = :emailId${idx} AND r.fairCode = :fairCode${idx} AND r.fiscalYear = :fiscalYear${idx})`,
          { [`emailId${idx}`]: emailId, [`fairCode${idx}`]: fairDetail.fairCode, [`fiscalYear${idx}`]: fairDetail.fiscalYear })
      });

      const queryResult = await queryObject.getMany()

      return queryResult ?? []
    })
  }

  async getSeminarRegistrations(ssoUid: string, fairCode: string, year: string, option: ISeminarRegistrationOption = {}): Promise<GetSeminarRegistrationsResInt> {
    return wrapAwsXray('ConferenceService', 'getSeminarRegistrations', this.logger, async () => {
      let qb = this.FairSeminarRegistrationRepository.createQueryBuilder('vepFairSeminarRegistration')
        .leftJoin(FairParticipant, 'fairParticipant', 'vepFairSeminarRegistration.userId = fairParticipant.ssoUid')
        .leftJoin('fairParticipant.fairRegistrations', 'fairRegistration')
        .leftJoin('fairRegistration.fairParticipantType', 'fairParticipantType')
        .where('fairParticipantType.fairParticipantTypeCode = :typeCode', { typeCode: 'GENERAL_PARTICIPANT' })
        .andWhere('vepFairSeminarRegistration.seminarRegStatus = 1')
        .andWhere('fairRegistration.fairCode = :fairCode', { fairCode })
        .andWhere('fairRegistration.fiscalYear = :year', { year })
        .andWhere('vepFairSeminarRegistration.userId = :ssoUid', { ssoUid })
        .andWhere('vepFairSeminarRegistration.fairCode = :fairCode', { fairCode })
        .andWhere('vepFairSeminarRegistration.fiscalYear = :year', { year })

      if (option.seminarRegistrationId) {
        qb = qb.andWhere('vepFairSeminarRegistration.id = :id', { id: option.seminarRegistrationId })
      }
      else if (option.seminarId) {
        qb = qb
          .andWhere('vepFairSeminarRegistration.seminarRegistrationType = :type', { type: option.type })
          .andWhere('vepFairSeminarRegistration.seminarId = :seminarId', { seminarId: option.seminarId })
      }

      const sql = qb.getSql()
      const params = qb.getParameters()
      const seminarRegistrations = (await qb.getMany())
        .map(sr => ({
          id: sr.id,
          seminarRegistrationType: sr.seminarRegistrationType,
          seminarId: sr.seminarId,
          watchNowStatus: sr.watchNowStatus,
          playBackStatus: sr.playBackStatus
        }) as SeminarRegistration)

      return { params: JSON.stringify(params), sql, data: seminarRegistrations }
    });
  }

  async getTicketPassService(ssoUid: string) {
    return wrapAwsXray('ConferenceService', 'getTicketPassService', this.logger, async () => {
      return await this.FairTicketPassServiceRepository.createQueryBuilder('fairTicketPassService')
        .leftJoin('fairTicketPassService.fairTicketPass', 'fairTicketPass')
        .leftJoin(FairRegistrationTicketPass, 'fairRegistrationTicketPass', 'fairRegistrationTicketPass.ticketPassCode = fairTicketPass.ticketPassCode')
        .leftJoin('fairRegistrationTicketPass.fairRegistration', 'fairRegistration')
        .leftJoin('fairRegistration.fairParticipant', 'fairParticipant')
        .where('fairParticipant.ssoUid = :ssoUid', { ssoUid })
        .andWhere('fairTicketPassService.ticketPassServiceCode = :serviceCode', { serviceCode: 'PLAYBACK' })
        .getOne()
    })
  }

  async updateSeminarRegistration(ssoUid: string, type: 'watchNow' | 'playback', fairCode: string, year: string, seminarRegistrationId: number): Promise<UpdateSeminarRegistrationResInt> {
    return wrapAwsXray('ConferenceService', 'updateSeminarRegistration', this.logger, async () => {
      const { sql, params, data } = await this.getSeminarRegistrations(ssoUid, fairCode, year, { seminarRegistrationId })
      const seminarRegistration = data[0]
      if (!seminarRegistration) return { sql, params, data: { result: 'fail' } }
      const key = type === 'watchNow' ? 'watchNowStatus' : 'playBackStatus'
      const current = seminarRegistration[key] || 0
      await this.FairSeminarRegistrationRepository.update(seminarRegistrationId, { [key]: current + 1 })
      return { sql, params, data: { result: 'success' } }
    })
  }

  public async updateCToMParticipantStatusListV2(adminUser: AdminUserDto, c2MParticipantStatusListDto: ConferenceC2MParticipantStatusListDto) {
    let c2MParticipantStatusList = c2MParticipantStatusListDto?.actions
    if (!c2MParticipantStatusList || !c2MParticipantStatusList?.length) {
      throw new VepError(VepErrorMsg.Validation_Error, 'Parameter missing')
    }

    let fairParticipantRegIds = c2MParticipantStatusList.map(function (item) { return item.registrationRecordId });

    let fairRegs = await this.fairDbService.queryFairRegByFairParticipantRegIdsV2(fairParticipantRegIds);

    let updateResult = await this.fairDbService.updateFairParticipantRegistrationRecordStatusListByIdsV2(adminUser.emailAddress, c2MParticipantStatusList);

    let afterUpdate = await this.fairDbService.queryFairRegByFairParticipantRegIdsV2(fairParticipantRegIds);

    if (updateResult) {
      return {
        isSuccess: true,
        "user-activity": fairRegs?.map(item => {
          let after = afterUpdate?.find(_item => _item.id == item.id);
          return {
            registrationNo: `${item.serialNumber}${item.projectYear?.substring(2)}${item.sourceTypeCode}${item.visitorTypeCode}${item.projectNumber}`,
            actionType: 'Update Participant C2M Status',
            description: `Update C2M Status from ${item.c2mParticipantStatus.c2mParticipantStatusCode} to ${afterUpdate?.find(_item => _item.id == item.id)?.c2mParticipantStatus?.c2mParticipantStatusCode}`,
            beforeUpdate: item,
            afterUpdate: after
          }
        })
      }
    } else {
      throw new VepError(VepErrorMsg.Database_Error, 'Cannot update any Fair Registration record by Ids')
    }
  }

  public async updateParticipantTicketandNoteById(adminUser: AdminUserDto, id: number, data: ParticipantTicketPassNoteReqDto): Promise<any> {
    return wrapAwsXray('ConferenceService', 'updateSeminarRegistration', this.logger, async () => {
      if (data.generalParticipantRemark != null && data.ticketPassCode != null) {
        let recordData = await this.fairDbService.getParticipantRegistrationDetail(id)
        if (!recordData) {
          throw new VepError(VepErrorMsg.Database_Error, '')
        }
        let record = {
          fairParticipantId: recordData.fairParticipantId,
          fairParticipantTypeId: recordData.fairParticipantTypeId,
          generalBuyerRemark: recordData.generalBuyerRemark,
          fairRegistrationStatusId: recordData.fairRegistrationStatusId,
          fiscalYear: recordData.fiscalYear,
          fairCode: recordData.fairCode,
          registrationNo: recordData.serialNumber + recordData.projectYear.substring(2, 4) + recordData.sourceTypeCode + recordData.visitorTypeCode + recordData.projectNumber,
          ssoUid: recordData.fairParticipant.ssoUid,
          fairRegistrationId: recordData.fairRegistrationTicketPasses[0].fairRegistrationId,
          ticketPassCode: recordData.fairRegistrationTicketPasses[0].ticketPassCode,
        }

        if (data.generalParticipantRemark == record?.generalBuyerRemark
          && data.ticketPassCode == record?.ticketPassCode) {
          return { error: VepErrorMsg.User_InvalidPermission, msg: 'Same Data. Nothing do with DB' }
        }

        if (record?.fairRegistrationStatusId != '1' && data.generalParticipantRemark == record?.generalBuyerRemark) {
          return { error: VepErrorMsg.User_InvalidPermission, msg: 'Only CONFIRMED registration is allowed to update ticket pass' }
        }

        let isUpdatedRemarks = false
        if (data.generalParticipantRemark != record.generalBuyerRemark) {
          await this.FairRegistrationRepository.update(id, { generalBuyerRemark: data.generalParticipantRemark, lastUpdatedBy: adminUser.emailAddress })
          isUpdatedRemarks = true
        }
        let isUpdatedTicketPass = false
        if (data.ticketPassCode != record.ticketPassCode && record.fairRegistrationStatusId == '1') {
          await this.FairRegistrationTicketPassRepository.update({ fairRegistrationId: id.toString() }, { ticketPassCode: data.ticketPassCode, lastUpdatedBy: adminUser.emailAddress })
          await this.FairRegistrationRepository.update(id, { lastUpdatedBy: adminUser.emailAddress })
          isUpdatedTicketPass = true
          switch (data.ticketPassCode) {
            case '':
              await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.CANCEL, record, '')
              break;
            default:
              await this.sendSeminarRegistrationRequest(constant.SEMINAR_REGISTRATION_EVENT.CANCEL_REGISTER, record, data.ticketPassCode)
              break;
          }
        }

        const afterUpdate = await this.fairDbService.getParticipantRegistrationDetail(id)

        const userActivities = []
        const registrationNo = `${recordData.serialNumber}${recordData.projectYear?.substring(2)}${recordData.sourceTypeCode}${recordData.visitorTypeCode}${recordData.projectNumber}`

        if (isUpdatedRemarks) {
          userActivities.push({
            registrationNo: registrationNo,
            beforeUpdate: recordData,
            afterUpdate,
            actionType: "Update Participant Remark",
            description: `Update General Participant Remark from ${record.generalBuyerRemark} to ${data.generalParticipantRemark}`
          })
        }

        if (isUpdatedTicketPass) {
          userActivities.push({
            registrationNo: registrationNo,
            beforeUpdate: recordData,
            afterUpdate,
            actionType: "Update Participant Ticket Pass",
            description: `Change ticket pass from ${record.ticketPassCode} to ${data.ticketPassCode}`
          })
        }

        return {
          isSuccess: true,
          "user-activity": userActivities
        }
      } else {
        throw new VepError(VepErrorMsg.Database_Error, 'Data is empty')
      }
    })
  }

  private sendSeminarRegistrationRequest = async (actionType: string, data: any, ticketPassCode: string) => {
    const { userRole } = await this.getSeminarUserRole(data.fairParticipantTypeId);
    const requestBody = {
      actionType: actionType,
      fairCode: data.fairCode,
      fiscalYear: data.fiscalYear,
      userRole: userRole,
      userId: data.ssoUid,
      registrationId: data.fairRegistrationId,
      regNum: data.registrationNo,
      source: 'Admin Portal Ticket Pass Change',
      ticketPass: ticketPassCode,
      seminarDetails: []
    }
    return this.seminarRegistrationSqsService.sendMessage(requestBody, data.registrationNo)
  }

  public async getSeminarUserRole(id: string) {
    return wrapAwsXray('ConferenceService', 'getSeminarUserRole', this.logger, async () => {
      const { fairParticipantTypeCode } = await this.fairParticipantTypeRepository.findOne({
        where: {
          id
        }
      }).then(result => {
        return {
          fairParticipantTypeCode: result?.fairParticipantTypeCode ?? ""
        }
      })

      return await this.fairParticipantTypeRoleMappingRepository.findOne({
        where: {
          fairParticipantTypeCode
        }
      }).then(result => {
        return {
          userRole: result?.userRole ?? ""
        }
      })
    })
  }

  public async getFairTicketPass(fairCode: string, projectYear: string) {
    return wrapAwsXray('ConferenceService', 'getFairTicketPass', this.logger, async () => {
      return await this.FairTicketPassRepository.find({
        where: {
          fairCode,
          projectYear
        }
      })
    })
  }

  public async findOneSeminarEvent(query: Record<string, any>): Promise<SeminarEntity> {
    return this.seminarRepository.findOneOrFail(query);
  }

  public async checkSeminarIsEnded(sbeSeminarId: string) {
    return wrapAwsXray('ConferenceService', 'checkSeminarIsEnded', this.logger, async () => {
      const eventDetail = await this.seminarRepository.createQueryBuilder().where("sbeSeminarId = :id", { id: sbeSeminarId }).getOne()
      return !!eventDetail && !!eventDetail.endAt
    })
  }

  public async findOneSeminar(sbeSeminarId: string, sbeParams: SbeEndpointRequestDto): Promise<Nullable<Seminar>> {
    const { subSectionsWithTypeAndValue: seminarsFromSbe, idMappingDictV2 } = await this.getAllSeminarsFromSbe(sbeParams);
    const seminars: Seminar[] = await this.getAllSeminarsV2(seminarsFromSbe, idMappingDictV2);
    const targetSeminar = seminars.find((seminar: Seminar) => seminar.id === sbeSeminarId);

    return targetSeminar || null;
  }

  public async findOneSeminarV2(sbeSeminarId: string, sbeParams: SbeEndpointRequestDto): Promise<Nullable<Seminar>> {
    return wrapAwsXray('ConferenceService', 'findOneSeminarV2', this.logger, async () => {
      const { data } = await this.callSbeSeminars(sbeParams);
      const { sectionList } = await this.filterSeminars(data.sectionList, sbeSeminarId)
      data.sectionList = sectionList
      const { subSectionsWithTypeAndValue, idMappingDictV2 } = await this.reformatSBESeminars(data)
      const seminars = await this.getAllSeminarsV2(subSectionsWithTypeAndValue, idMappingDictV2)
      return seminars[0] || null;
    })
  }

  public joinConfSeminar(connectionId: string, fairCode: string, sbeSeminarId: string): Promise<any> {
    const refCacheKey = `${fairCode}_${sbeSeminarId}`;
    return this.elastiCacheClusterService
      .getCache(refCacheKey)
      .then((seminarCachePublic: any): any => {
        this.logger.log(`joinSeminarCachePublic step1 result: ${seminarCachePublic}`);

        if (!seminarCachePublic?.length) {
          return this.elastiCacheClusterService.setCache(refCacheKey, JSON.stringify({
            connectionId: [connectionId]
          }));
        }

        const parsedJson = JSON.parse(seminarCachePublic);
        return this.elastiCacheClusterService.setCache(refCacheKey, JSON.stringify({
          connectionId: [...parsedJson.connectionId, connectionId]
        }));
      })
      .catch((error) => {
        this.logger.log(`joinSeminarCachePublic error: ${JSON.stringify(error)}`);
        return {
          status: 400,
          error: `${error}`,
        };
      });
  }

}
