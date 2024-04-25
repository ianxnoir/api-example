import { FindOperator } from 'typeorm';
import { VideoDetail } from '../video/video.type';

export type Speaker = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  profile: string;
  speakerUrl:string;
  company: {
    name: string;
    logo: string;
  };
};

export type SpeakerPanel = {
  title: string;
  speakers: Speaker[];
};

export type RegisteredSeminarByUser = {
  email?: string;
  vmsProjectCode: string;
  vmsProjectYear: string;
  language: string;
};

export type SeminarDetail = {
  fairCode: string;
  fiscalYear: string;
};

export type RegisteredSeminarByUserAndTimeRange = {
  userId: string;
  secondUserId: string;
  responderUserId: string;
  fairCode: string;
  startTime: string;
  endTime: string;
  flagFromVideoMeeting?: boolean;
};

export type LogoPanel = {
  title: string;
  logos: string[];
};

export type Seminar = {
  id: string;
  name: string;
  eventId: string;
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
  speakerPanels?: SpeakerPanel[];
  isLive: boolean;
  nature?: string;
  streamingType: StreamingType;
  isPublic: boolean;
  isAbleToWatch: boolean;
  isRegistered: boolean; // To-Do
  eventDetail: Nullable<EventDetail>;
  isVideoUrlReady: boolean;
  streamingUrl: Nullable<string>;
  isFull:string;
  vcPlaybackUrl:string
  vcPlaybackSetting:string
  vmsProjectCode?: string
};


export enum CallbackEvent {
  CLOSE_LIVE_STREAMING = 'CLOSE_LIVE_STREAMING',
  CHECK_MULTI_LOGIN = 'CHECK_MULTI_LOGIN',
  SEMINAR_PONG = 'SEMINAR_PONG',
  TEST = 'TEST',
}

export enum StreamingType {
  KOL = 'KOL',
  VOD = 'VOD',
  LIVE = 'LIVE',
}
export type RegisteredSeminar = {
  ssouid: string;
  fairCode: string;
  userRole: string;
  isPass: boolean;
  pageNum: string;
  itemPerPage: string;
  email: string;
  language: string;
  filteredFairCode?: string;
};

export type myAccountSeminar = {
  id: string;
  name: string;
  eventId: string;
  formattedStartDate: string;
  formattedDuration: string;
  startAt: string;
  endAt: string | null | undefined;
  now: string;
  language: string;
  type: string;
  location: string;
  isLive: boolean;
  isAbleToWatch: boolean;
  isVideoUrlReady: boolean;
};

export type EventDetail = {
  id: number;
  sbeSeminarId: string;
  streamingType?: StreamingType;
  surveyLink?: string | null;
  beforeStartTime: number;
  feedbackFormId?: string | null;
  registrationFormId?: string | null;
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
  EXTERNAL_SITE = 'EXTERNAL_SITE',
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

export enum sourceType {
  INHUB = 'intelligence hub',
  FAIRFORM = 'registration form',
  ADMIN = 'admin portal import',
}

export enum userType {
  BUYER = 'Buyer',
  Exhibitor = 'Exhibitor',
  Participant = 'Participant',
}

export enum seminarType {
  ON = 'Online',
  PY = 'Physical',
  PB = 'Playback',
  ALL = 'All',
}
