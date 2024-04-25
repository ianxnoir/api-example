import { ApiProperty } from '@nestjs/swagger';
import { FindOperator } from 'typeorm';
import { SbeEndpointRequestDto } from '../../dto/sbeEndpointRequest.dto';
import { VideoDetail } from '../video/video.type';
// import { FilterOptionDetailDto } from './dto/getSeminarsOptimised.dto';

export interface BaseRes {
  sql: string
  params: string
}

export interface BaseResDtoInt<T> extends BaseRes {
  data: T
}

export interface ConfSeminarDetailsV2 {
  seminarDataForModal: FindAllFinalResult[]
  seminarData: FindAllFinalResult[],
  sbeFooter: string,
  categories: {
    firstCategory: FilterOptionDetail[];
    secondCategory: FilterOptionDetail[];
  }[],
  seminarDataAmount: number
}

export interface ConfSeminarDetails {
  seminarData: FindAllFinalResult[],
  sbeFooter: string,
  categories: CategoriesDetail[],
  seminarDataAmount: number
}


export interface SortedOptions {
  label: string
  value: string
}

export interface GenerateFilterOptionsResult {
  sortedDateOptions: SortedOptions[]
  categoryOptions: string[]
}


export interface CategoriesDetail {
  identifier: string
  values: string[]
  type: string
}

export interface UniqueFilterCategory {
  uniqueFirstCategory: CategoriesDetail
  uniqueSecondCategory: CategoriesDetail
}

export interface FilterCriteriaFromFn {
  firstCriteria: string
  secondCriteria: string
}

export enum FilterCategoryType {
  DATE = "DATE",
  CATEGORY = "CATEGORY"
}

export interface FilterOptionDetail {
  label: string,
  value: string,
  isActive: boolean
  type: FilterCategoryType
}

export interface FilterLayer {
  type: string;
  value: string;
  sortOrder?: number
};

export interface FindAllFinalResult {
  firstLayerFilter: FilterLayer
  secondLayerFilter: FilterLayer
  id: string;
  name: string;
  description: string;
  displayStatus: boolean;
  formattedStartDate: string;
  formattedDuration: string;
  startAt: string;
  endAt: string;
  now: string;
  fulled: boolean;
  registrationEnabled: boolean;
  registrationUrl: string;
  fullProgrammeUrl: string;
  language: string;
  type: string;
  location: string;
  bookmarked: boolean;
  qualificationLogo: string[];
  logoPanels: LogoPanel[];
  speakerPanels: ConfSpeakerPanel[];
  isLive: boolean;
  nature: string;
  streamingType: StreamingType;
  session?: 'before' | 'between' | 'after',
  isPublic: boolean;
  isAbleToWatch: boolean;
  isRegistered: boolean;
  eventDetail: EventDetail;
  isVideoUrlReady: boolean;
  streamingUrl: Nullable<string>;
  vcPlaybackUrl: string;
  isFull: string;
  vcPlaybackSetting: string;
  recommendedText: string;
  recommendedTextBackgroundColor: string;
  recommendedTextColor: string;
  isFirstAppearDate?: boolean
  isFirstAppearCategory?: boolean
  sortOrder?: number;
}

export interface ConfSpeakerCompany {
  name: string;
  logo: string;
};

export interface ConfSpeakerOtherCompany {
  companyName: string,
  position: string,
  logo: string
}

export type ConfSpeaker = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  profile: string;
  company: ConfSpeakerCompany
  otherCompanies: ConfSpeakerOtherCompany[]
};

export type ConfSpeakerPanel = {
  title: string;
  speakers: ConfSpeaker[];
};

export type LogoPanel = {
  title: string;
  logos: string[];
};

export type Seminar = {
  id: string;
  name: string;
  description?: string;
  displayStatus: boolean;
  formattedStartDate: string;
  formattedDuration: string;
  startAt?: string;
  endAt?: string;
  fulled?: boolean;
  registrationEnabled?: boolean;
  registrationUrl?: string;
  fullProgrammeUrl?: string;
  language?: string;
  type?: string;
  location?: string;
  bookmarked?: boolean;
  qualificationLogo?: string[];
  logoPanels?: LogoPanel[];
  speakerPanels?: ConfSpeakerPanel[];
  isLive: boolean;
  nature?: string;
  streamingType: StreamingType;
  isPublic: boolean;
  isAbleToWatch: boolean;
  isRegistered: boolean; // To-Do
  eventDetail: Nullable<EventDetail>;
  isVideoUrlReady: boolean;
  streamingUrl: Nullable<string>;
};

export enum CallbackEvent {
  CLOSE_LIVE_STREAMING = 'CLOSE_LIVE_STREAMING',
}

export enum StreamingType {
  KOL = 'KOL',
  VOD = 'VOD',
  LIVE = 'LIVE',
}

export type EventDetail = {
  id: number;
  sbeSeminarId: string;
  streamingType?: StreamingType;
  surveyLink?: string | null;
  pigeonholeSessionId?: number | null;
  pigeonholePasscode?: string | null;
  kol?: KolDetail;
  vods?: VodDetail[];
  rtmps?: RtmpDetail[];
  lastUpdatedBy?: string;
  lastUpdatedAt?: Date;
  creationTime?: Date;
  isEnded?: boolean;
};

export enum PlatformType {
  YOUTUBE = 'YOUTUBE',
  FACEBOOK = 'FACEBOOK',
  VIMEO = 'VIMEO',
  YOUKU = 'YOUKU',
  TENCENT = 'TENCENT',
  EXTERNAL_SITE = 'EXTERNAL_SITE'
}

export type KolDetail = {
  id?: number;
  platformType: PlatformType;
  platformId?: string;
  platformUrl?: string;
  playbackVideo?: VideoDetail;
  creationTime?: Date;
  lastUpdateAt?: Date;
  lastUpdateBy?: string;
};

export type VodDetail = {
  id?: number;
  language: string;
  defaultLanguage: boolean;
  liveVideo?: VideoDetail;
  playbackVideo?: VideoDetail;
  creationTime?: Date;
  lastUpdatedAt?: Date;
  lastUpdatedBy?: string;
};

export type RtmpDetail = {
  id?: number;
  language: string;
  defaultLanguage: boolean;
  link: string;
  key: string;
  liveUrl: string | null;
  expiredAt: Date;
  playbackVideo?: VideoDetail;
  lastUpdatedBy?: string;
  lastUpdatedAt?: Date;
  creationTime?: Date;
};

export type RatingFindOptions = {
  seminarId?: FindOperator<string>;
  lastUpdatedBy?: FindOperator<string>;
};

export interface FilterSeminarReq {
  sbeParams: SbeEndpointRequestDto,
  criteria: FilterSeminarCriteria,
  optionalInfo: Partial<OptionalInfo>
}

export interface FilterSeminarCriteria {
  firstCriteria: string,
  secondCriteria: string
  optionalSeminarId?: string
}

export class SeminarRegistration {
  @ApiProperty({
    type: Number,
    description: 'seminar registration ID',
    example: 1
  })
  id: number

  @ApiProperty({
    type: String,
    description: 'seminar registration type',
    example: 'Online'
  })
  seminarRegistrationType: 'Online' | 'Physical' | 'Playback' | 'All'

  @ApiProperty({
    type: String,
    description: 'SBE seminar ID',
    example: ''
  })
  seminarId: string

  @ApiProperty({
    type: Number,
    description: 'count of watch now',
    example: 0
  })
  watchNowStatus: number

  @ApiProperty({
    type: Number,
    description: 'count of playback',
    example: 0
  })
  playBackStatus: number

  @ApiProperty({
    type: String,
    description: 'playback effective start time',
    example: ''
  })
  effectiveStartTime?: string | null

  @ApiProperty({
    type: String,
    description: 'playback effective end time',
    example: ''
  })
  effectiveEndTime?: string | null
}

export interface OptionalInfo {
  seminarId: string
}

export interface ISeminarRegistrationOption {
  type?: 'Online' | 'Playback'
  seminarId?: string
  seminarRegistrationId?: number
}


//NOTE: interface that used by the "sortOrder" feature
export interface ModifiedSection {
  sectionType: string;
  sectionValue: string;
  sortOrder?: string;
  subSectionList: ModifiedSubSection[];
}

export type ModifiedSubSection = {
  subSectionType: string;
  subSectionValue: string;
  sortOrder?: string;
  seminars: FindAllFinalResult[];
};



export interface FilterFields {
  value: string, 
  sortOrder: number
}