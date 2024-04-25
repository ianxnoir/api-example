import { ApiProperty } from '@nestjs/swagger';
import { LogoPanel, Seminar, StreamingType } from '../conference.type';
import { ConfSpeakerPanelDto, EventDetailDto, LogoPanelDto } from './getSeminarsOptimised.dto';

export class SeminarDto implements Seminar {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description?: string;

    @ApiProperty()
    displayStatus: boolean;

    @ApiProperty()
    formattedStartDate: string;

    @ApiProperty()
    formattedDuration: string;

    @ApiProperty()
    startAt?: string;

    @ApiProperty()
    endAt?: string;

    @ApiProperty()
    fulled?: boolean;

    @ApiProperty()
    registrationEnabled?: boolean;

    @ApiProperty()
    registrationUrl?: string;

    @ApiProperty()
    fullProgrammeUrl?: string;

    @ApiProperty()
    language?: string;

    @ApiProperty()
    type?: string;

    @ApiProperty()
    location?: string;

    @ApiProperty()
    bookmarked?: boolean;

    @ApiProperty()
    qualificationLogo?: string[];

    @ApiProperty({ type: LogoPanelDto, isArray: true })
    logoPanels?: Array<LogoPanel>;

    @ApiProperty({ type: ConfSpeakerPanelDto, isArray: true })
    speakerPanels?: Array<ConfSpeakerPanelDto>;

    @ApiProperty()
    isLive: boolean;

    @ApiProperty()
    nature?: string;

    @ApiProperty({ enum: StreamingType })
    streamingType: StreamingType;

    @ApiProperty()
    isPublic: boolean;

    @ApiProperty()
    isAbleToWatch: boolean;

    @ApiProperty()
    isRegistered: boolean;

    @ApiProperty({ nullable: true, type: EventDetailDto })
    eventDetail: EventDetailDto;

    @ApiProperty()
    isVideoUrlReady: boolean;

    @ApiProperty({ nullable: true })
    streamingUrl: string;

};

export class GetOneSeminarEventDetailResponse {
    @ApiProperty()
    data: SeminarDto
}