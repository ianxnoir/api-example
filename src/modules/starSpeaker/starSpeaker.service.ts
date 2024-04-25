import { Injectable } from '@nestjs/common';
import moment from 'moment-timezone';
import { SbeEndpointRequestDto } from '../../dto/sbeEndpointRequest.dto';

import { SBEService } from '../api/sbe/sbe.service';
import { SBEQuery, SBEStarSpeakerData } from '../api/sbe/sbe.type';
import { SeminarService } from '../seminar/seminar.service';
import { Seminar, Speaker, SpeakerPanel } from '../seminar/seminar.type';
import { SeminarSpeakerMapping, StarSpeakersAndSeminars } from './starSpeaker.type';

@Injectable()
export class StarSpeakerService {
  constructor(private sbeService: SBEService, private seminarService: SeminarService) {}

  public async getAll(sbeParams: SbeEndpointRequestDto, withSeminar: boolean = false): Promise<StarSpeakersAndSeminars> {
    const query: SBEQuery = {
      ...sbeParams,
      queryMode: 'HS',
    };
    const sbeStarSpeakers = await this.sbeService.getStarSpeakers(query);
    const seminars = await this.seminarService.findAll(sbeParams);
    const { data: starSpeakers } = sbeStarSpeakers;

    // Mapping for seminar & speakers
    const seminarSpeakers = seminars.map((seminar: Seminar) => {
      const panels = seminar.speakerPanels || [];

      return {
        seminar,
        speakerIds: panels.flatMap((panel: SpeakerPanel) => panel.speakers).map((speaker: Speaker) => speaker.id),
      };
    });

    let filteredSeminarSpeakers = seminarSpeakers.filter((semainarSpeaker: any) => moment(semainarSpeaker.seminar.startAt).isAfter() && semainarSpeaker.speakerIds.length > 0);
    const upcomingSeminarsFound = filteredSeminarSpeakers.length > 0;

    if (!upcomingSeminarsFound) {
      filteredSeminarSpeakers = seminarSpeakers.filter((semainarSpeaker: any) => moment(semainarSpeaker.seminar.startAt).isBefore() && semainarSpeaker.speakerIds.length > 0);
    }

    const starSpeakersData = starSpeakers.map((speaker: SBEStarSpeakerData) => {
      const matchedMapping = filteredSeminarSpeakers.find((mapping: SeminarSpeakerMapping) => mapping.speakerIds.includes(speaker.id));

      return {
        id: speaker.id,
        name: speaker.displayName,
        title: speaker.position,
        avatar: speaker.photoUrl,
        profile: speaker.profile,
        speakerUrl:speaker.speakerUrl,
        company: {
          name: speaker.company,
          logo: speaker.companyLogoUrl,
        },
        bookmarked: false,
        latestSeminar: matchedMapping ? matchedMapping.seminar : null,
      };
    });

    return {
      starSpeakersData: starSpeakersData.sort(() => 0.5 - Math.random()),
      seminarsData: withSeminar ? seminars : [],
    };
  }
}
