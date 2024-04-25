/* eslint-disable max-classes-per-file */
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { PlatformType, KolDetail, VodDetail, RtmpDetail, StreamingType } from '../modules/seminar/seminar.type';

export class KolDetailDto {
  @IsOptional()
  @IsNumber()
  public id: number;

  @IsNotEmpty()
  @IsEnum(PlatformType)
  public platformType: PlatformType;

  @IsOptional()
  @IsString()
  public platformId: string;

  @IsNotEmpty()
  @IsString()
  public platformUrl: string;

  @IsOptional()
  @IsNumber()
  public playbackVideoId: number;

  public convert(): KolDetail {
    return {
      id: this.id,
      platformType: this.platformType,
      platformId: this.platformId,
      platformUrl: this.platformUrl,
      playbackVideo: {
        id: this.playbackVideoId || null,
      },
    };
  }
}

export class VodDetailDto {
  @IsOptional()
  @IsNumber()
  public id: number;

  @IsNotEmpty()
  @IsString()
  public language: string;

  @IsNotEmpty()
  @IsBoolean()
  public defaultLanguage: boolean;

  @IsOptional()
  @IsNumber()
  public liveVideoId: number;

  @IsOptional()
  @IsNumber()
  public playbackVideoId: number;

  public convert(): VodDetail {
    return {
      id: this.id,
      language: this.language,
      defaultLanguage: this.defaultLanguage,
      liveVideo: {
        id: this.liveVideoId || null,
      },
      playbackVideo: {
        id: this.playbackVideoId || null,
      },
    };
  }
}

export class RtmpDetailDto {
  @IsOptional()
  @IsNumber()
  public id: number;

  @IsNotEmpty()
  @IsString()
  public language: string;

  @IsNotEmpty()
  @IsBoolean()
  public defaultLanguage: boolean;

  @IsNotEmpty()
  @IsString()
  public link: string;

  @IsNotEmpty()
  @IsString()
  public key: string;

  @IsOptional()
  @IsString()
  public liveUrl: string;

  @IsNotEmpty()
  @IsString()
  public expiredAt: Date;

  @IsOptional()
  @IsNumber()
  public playbackVideoId: number;

  public convert(): RtmpDetail {
    return {
      id: this.id,
      language: this.language,
      defaultLanguage: this.defaultLanguage,
      link: this.link,
      key: this.key,
      liveUrl: this.liveUrl,
      expiredAt: this.expiredAt,
      playbackVideo: {
        id: this.playbackVideoId || null,
      },
    };
  }
}

export class UpdateSeminarRequestDto {
  @IsNotEmpty()
  @IsString()
  public sbeSeminarId!: string;

  @IsNotEmpty()
  @IsEnum(StreamingType)
  public streamingType!: StreamingType;

  @IsOptional()
  @IsString()
  public surveyLink!: string;

  @IsNotEmpty()
  @IsNumber()
  public beforeStartTime!: number;

  @IsOptional()
  @IsString()
  public feedbackFormId!: string;

  @IsOptional()
  @IsString()
  public registrationFormId!: string;

  @IsOptional()
  @IsNumber()
  public pigeonholeSessionId!: number;

  @IsOptional()
  @IsString()
  public pigeonholePasscode!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => KolDetailDto)
  public kol!: KolDetailDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VodDetailDto)
  public vod!: VodDetailDto[];

  @ValidateNested({ each: true })
  @Type(() => RtmpDetailDto)
  public rtmp!: RtmpDetailDto[];
}
