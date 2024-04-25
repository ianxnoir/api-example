export type SBEStarSpeakerResponse = {
  data: SBEStarSpeakerData[];
};

export type SBEStarSpeakerData = {
  id: string;
  givenName: string;
  surname: string;
  displayName: string;
  position: string;
  company: string;
  profile: string;
  photoUrl: string;
  companyLogoUrl: string;
  otherCompany1:string;
  otherCompany2:string;
  otherCompany3:string;
  otherCompany4:string;
  otherCompanyLogoUrl1:string;
  otherCompanyLogoUrl2:string;
  otherCompanyLogoUrl3:string;
  otherCompanyLogoUrl4:string;
  otherPosition1:string;
  otherPosition2:string;
  otherPosition3:string;
  otherPosition4:string;
  speakerUrl:string;
};

export type SBEQuery = {
  vmsProjectCode: string;
  vmsProjectYear?: string;
  systemCode: string;
  displayPaidSeminars?: number;
  language: string;
  queryMode?: string;
  email?: string;
  registrationNo?:string;
  vmsProjectYearFrom?: string;
  vmsProjectYearTo?: string;
};

export type SBESeminarResponse = {
  timestamp: number;
  status: number;
  message: string;
  messageId: string;
  data: SBESeminarData;
};


export type SBERegistrationResponse = {
  data:string;
  message:string;
  messageId:string;
  sat:string
  status: number;
  timestamp:number
};

type SBESeminarData = {
  footer: string
  eventName: string;
  eventRegistrationUrl: string;
  eventThemeColor: string;
  eventId: string;
  eventStartDay: string;
  eventEndDay: string;
  sectionList: Section[];
};

export type Section = {
  sectionType: string;
  sectionValue: string;
  sortOrder?: string;
  subSectionList: SubSection[];
};

export type SubSection = {
  subSectionType: string;
  subSectionValue: string;
  sortOrder?: string ;
  seminars: SBESeminar[];
};

export type SBESeminar = {
  id: string;
  name: string;
  shortName: string;
  startTime: string;
  endTime: string;
  isAllowCancel: string;
  isRecommended: string;
  recommendedText: string;
  recommendedTextBackgroundColor: string;
  recommendedTextColor: string;
  highlightedEventImageUrl: string;
  isFull: string;
  isRegistered: string;
  isRegistrationStatusEnable: string;
  language: string;
  venue: string;
  isBookmarked: string;
  displayBlock: DisplayBlock[];
  remarks: string;
  attachmentUrl: string;
  semType: string;
  semNature: string;
  semPaidType: string;
  seminarDetail: string;
  iconImageUrl1: string;
  iconImageUrl2: string;
  iconImageUrl3: string;
  iconImageUrl4: string;
  semLiveType: string;
  vcLiveSetting: string;
  vcPlaybackSetting: string;
  vcLiveUrl: string;
  vcPlaybackUrl: string;
  questionContent: string;
  option1: string;
  option1Ans: string;
  option2: string;
  option2Ans: string;
  option3: string;
  option3Ans: string;
  isCheckedOption1: string;
  isCheckedOption2: string;
  isCheckedOption3: string;
  isDisplayOption1: string;
  isDisplayOption1Ans: string;
  isDisplayOption2: string;
  isDisplayOption2Ans: string;
  isDisplayOption3: string;
  isDisplayOption3Ans: string;
  isDisplayQuestion: string;
  sortOrder?: number;
};

export type DisplayBlock = {
  blockType: string;
  type: string;
  displayBlockItem: DisplayBlockItem[];
};

export type DisplayBlockItem = {
  id: string;
  name: string;
  imageUrl: string;
  websiteUrl: string;
  description: string;
  company: string;
  companyLogoUrl: string;
  position: string;
  isStar: string,
  isHighlight: string,
  otherCompany1: string,
  otherPosition1: string,
  otherCompany2: string,
  otherPosition2: string,
  otherCompany3: string,
  otherPosition3: string,
  otherCompany4: string,
  otherPosition4: string,
  otherCompanyLogoUrl1: string,
  otherCompanyLogoUrl2: string,
  otherCompanyLogoUrl3: string,
  otherCompanyLogoUrl4: string,
  speakerUrl:string
};

export type RegisterEvent = {
  companyName: string;
  countryCode: string;
  email: string;
  eventId: string;
  firstName: string;
  language: string;
  lastName: string;
  registrationNo: string;
  salutation: string | null;
  systemCode: string;
  title: string | null;
};

export type RegisterSeminar = {
  eventId: string;
  language: string;
  paymentSession: string;
  registrationNo: string;
  seminarReg:seminarReg[];
  shouldSendConfirmationEmail:string;
  systemCode: string;
};

export type seminarReg = {
  isCheckedOption1: string;
  isCheckedOption2: string;
  isCheckedOption3: string;
  option1Ans: string | null;
  option2Ans: string | null;
  option3Ans: string | null;
  seminarId:string;
  seminarRegStatus:string;
};