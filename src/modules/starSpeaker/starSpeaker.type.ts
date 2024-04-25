import { Seminar } from '../seminar/seminar.type';

export type Company = {
  name: string;
  logo: string;
};

export type StarSpeaker = {
  id: string;
  name: string;
  title: string;
  avatar: string;
  profile: string;
  company: Company;
  bookmarked: boolean;
  speakerUrl:string;
  latestSeminar: Seminar | null;
};

export type SeminarSpeakerMapping = {
  seminar: Seminar;
  speakerIds: Array<any>;
};

export type StarSpeakersAndSeminars = {
  starSpeakersData: Array<any>;
  seminarsData: Array<any>;
};
