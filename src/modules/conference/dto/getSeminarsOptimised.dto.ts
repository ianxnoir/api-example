import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { SbeEndpointRequestDto } from '../../../dto/sbeEndpointRequest.dto';
import { TranscodeStatus, VideoDetail, VideoStatus } from '../../video/video.type';
import { ConfSeminarDetailsV2, ConfSpeaker, ConfSpeakerCompany, ConfSpeakerOtherCompany, ConfSpeakerPanel, EventDetail, FilterCategoryType, FilterLayer, FilterOptionDetail, FilterSeminarCriteria, FilterSeminarReq as GetSeminarsV2, FindAllFinalResult, KolDetail, LogoPanel, OptionalInfo, PlatformType, RtmpDetail, StreamingType, VodDetail } from '../conference.type';

export class FilterSeminarCriteriaDto implements FilterSeminarCriteria {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    firstCriteria: string

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    secondCriteria: string
}


export class LogoPanelDto implements LogoPanel {
    @ApiProperty()
    title: string;

    @ApiProperty({ isArray: true })
    logos: string[];
}

export class ConfSpeakerDtoCompany implements ConfSpeakerCompany {
    @ApiProperty()
    name: string;

    @ApiProperty()
    logo: string;

}
export class ConfSpeakerOtherCompanyDto implements ConfSpeakerOtherCompany {
    @ApiProperty()
    companyName: string

    @ApiProperty()
    position: string

    @ApiProperty()
    logo: string

}


export class OptionalInfoDto implements Partial<OptionalInfo> {
    @ApiProperty()
    @IsString()
    seminarId: string
}

export class GetSeminarsV2Dto implements GetSeminarsV2 {
    @ApiProperty()
    @IsNotEmpty()
    public sbeParams: SbeEndpointRequestDto

    @ApiProperty()
    @IsNotEmpty()
    public criteria: FilterSeminarCriteriaDto

    @ApiProperty()
    @IsNotEmpty()
    public optionalInfo: OptionalInfoDto
}

export class FilterOptionDetailDto implements FilterOptionDetail {
    @ApiProperty()
    label: string

    @ApiProperty()
    value: string

    @ApiProperty()
    isActive: boolean

    @ApiProperty({ enum: FilterCategoryType })
    type: any
}


export class VideoDetailDto implements VideoDetail {
    @ApiProperty({
        nullable: true
    })
    id: number;

    @ApiProperty({
        nullable: true
    })
    taskId?: string

    @ApiProperty({ enum: TranscodeStatus })
    transcodeStatus?: TranscodeStatus;

    @ApiProperty({ enum: VideoStatus })
    videoStatus?: VideoStatus;

    @ApiProperty({ nullable: true })
    fileName?: string;

    @ApiProperty({ nullable: true })
    fileUrl?: string

    @ApiProperty({ nullable: true })
    lastUpdatedBy?: string

    @ApiProperty()
    lastUpdatedAt?: Date;

    @ApiProperty()
    creationTime?: Date;

};

export class KolDetailDto implements KolDetail {
    @ApiProperty()
    id?: number;

    @ApiProperty({ enum: PlatformType })
    platformType: PlatformType;

    @ApiProperty()
    platformId?: string;

    @ApiProperty()
    platformUrl?: string;

    @ApiProperty({ type: VideoDetailDto })
    playbackVideo?: VideoDetailDto;

    @ApiProperty()
    creationTime?: Date;

    @ApiProperty()
    lastUpdateAt?: Date;

    @ApiProperty()
    lastUpdateBy?: string;

};

export class VodDetailDto implements VodDetail {
    @ApiProperty()
    id?: number;

    @ApiProperty()
    language: string;

    @ApiProperty()
    defaultLanguage: boolean;

    @ApiProperty({ type: VideoDetailDto })
    liveVideo?: VideoDetailDto;

    @ApiProperty({ type: VideoDetailDto })
    playbackVideo?: VideoDetailDto;

    @ApiProperty()
    creationTime?: Date;

    @ApiProperty()
    lastUpdatedAt?: Date;

    @ApiProperty()
    lastUpdatedBy?: string;

};

export class RtmpDetailDto implements RtmpDetail {
    @ApiProperty()
    id?: number;

    @ApiProperty()
    language: string;

    @ApiProperty()
    defaultLanguage: boolean;

    @ApiProperty()
    link: string;

    @ApiProperty()
    key: string;

    @ApiProperty({ nullable: true })
    liveUrl: string

    @ApiProperty()
    expiredAt: Date;

    @ApiProperty({ type: VideoDetailDto })
    playbackVideo?: VideoDetailDto;

    @ApiProperty()
    lastUpdatedBy?: string;

    @ApiProperty()
    lastUpdatedAt?: Date;

    @ApiProperty()
    creationTime?: Date;

};

export class EventDetailDto implements EventDetail {
    @ApiProperty()
    id: number;

    @ApiProperty()
    sbeSeminarId: string;

    @ApiProperty({ description: "can be 'KOL', 'VOD' or 'LIVE'" })
    streamingType?: StreamingType;

    @ApiProperty({ nullable: true })
    surveyLink?: string;

    @ApiProperty({ nullable: true })
    pigeonholeSessionId?: number

    @ApiProperty({ nullable: true })
    pigeonholePasscode?: string

    @ApiProperty({ type: KolDetailDto })
    kol?: KolDetailDto;

    @ApiProperty({ type: VodDetailDto, isArray: true })
    vods?: VodDetailDto[];

    @ApiProperty({ type: RtmpDetailDto, isArray: true })
    rtmps?: RtmpDetailDto[];

    @ApiProperty()
    lastUpdatedBy?: string;

    @ApiProperty()
    lastUpdatedAt?: Date;

    @ApiProperty()
    creationTime?: Date;

    @ApiProperty()
    isEnded?: boolean;
}

export class FilterLayerDto implements FilterLayer {
    @ApiProperty()
    type: string;

    @ApiProperty()
    value: string;

}

export class ConfSpeakerDto implements ConfSpeaker {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    avatar: string;

    @ApiProperty()
    profile: string;

    @ApiProperty({ isArray: true, type: ConfSpeakerDtoCompany })
    company: ConfSpeakerDtoCompany

    @ApiProperty({ isArray: true, type: ConfSpeakerOtherCompanyDto })
    otherCompanies: ConfSpeakerOtherCompanyDto[]

}


export class ConfSpeakerPanelDto implements ConfSpeakerPanel {
    @ApiProperty()
    title: string;

    @ApiProperty({ isArray: true, type: ConfSpeakerDto })
    speakers: ConfSpeakerDto[];
}

export class FindAllResultDto implements FindAllFinalResult {
    @ApiProperty()
    id: string;

    @ApiProperty()
    name: string;

    @ApiProperty()
    description: string;

    @ApiProperty()
    displayStatus: boolean;

    @ApiProperty()
    formattedStartDate: string;

    @ApiProperty()
    formattedDuration: string;

    @ApiProperty()
    startAt: string;

    @ApiProperty()
    endAt: string;

    @ApiProperty()
    now: string;

    @ApiProperty()
    fulled: boolean;

    @ApiProperty()
    registrationEnabled: boolean;

    @ApiProperty()
    registrationUrl: string;

    @ApiProperty()
    fullProgrammeUrl: string;

    @ApiProperty()
    language: string;

    @ApiProperty()
    type: string;

    @ApiProperty()
    location: string;

    @ApiProperty()
    bookmarked: boolean;

    @ApiProperty({ isArray: true })
    qualificationLogo: string[];

    @ApiProperty()
    isLive: boolean;

    @ApiProperty()
    nature: string;

    @ApiProperty()
    isPublic: boolean;

    @ApiProperty()
    isAbleToWatch: boolean;

    @ApiProperty()
    isRegistered: boolean;

    @ApiProperty()
    isVideoUrlReady: boolean;

    @ApiProperty({ nullable: true })
    streamingUrl: string

    @ApiProperty()
    vcPlaybackUrl: string;

    @ApiProperty()
    isFull: string;

    @ApiProperty()
    vcPlaybackSetting: string;

    @ApiProperty()
    recommendedText: string;

    @ApiProperty()
    recommendedTextBackgroundColor: string;

    @ApiProperty()
    recommendedTextColor: string;

    @ApiProperty()
    isFirstAppearDate?: boolean

    @ApiProperty()
    isFirstAppearCategory?: boolean

    @ApiProperty({ type: FilterLayerDto })
    firstLayerFilter: FilterLayerDto;

    @ApiProperty({ type: FilterLayerDto })
    secondLayerFilter: FilterLayerDto

    @ApiProperty({ isArray: true, type: LogoPanelDto })
    logoPanels: LogoPanelDto[];

    @ApiProperty({ isArray: true, type: ConfSpeakerPanelDto })
    speakerPanels: ConfSpeakerPanelDto[];

    @ApiProperty({ enum: StreamingType })
    streamingType: StreamingType;

    @ApiProperty({ type: EventDetailDto })
    eventDetail: EventDetailDto;
}


export class GetSeminarV2CategoryDto {
    @ApiProperty({ isArray: true, type: FilterOptionDetailDto })
    firstCategory: FilterOptionDetailDto[];

    @ApiProperty({ isArray: true, type: FilterOptionDetailDto })
    secondCategory: FilterOptionDetailDto[];
}


export class GetSeminarV2ResultDto implements ConfSeminarDetailsV2 {
    @ApiProperty({ isArray: true, type: FindAllResultDto })
    seminarDataForModal: Array<FindAllResultDto>

    @ApiProperty({ isArray: true, type: FindAllResultDto })
    seminarData: Array<FindAllResultDto>

    @ApiProperty({description: "this may be html"})
    sbeFooter: string

    @ApiProperty({ isArray: true, type: GetSeminarV2CategoryDto })
    categories: Array<GetSeminarV2CategoryDto>

    @ApiProperty()
    seminarDataAmount: number
}

export class GetSeminarV2Response {
    @ApiProperty()
    data: GetSeminarV2ResultDto
}