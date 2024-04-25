/* eslint-disable max-classes-per-file */
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { TranscodeStatus, VideoStatus } from '../modules/video/video.type';

export class UpdateVideoRequest {
  @IsNotEmpty()
  @IsString()
  public taskId!: string;

  @IsOptional()
  @IsEnum(TranscodeStatus)
  public trancodeStatus!: TranscodeStatus;

  @IsOptional()
  @IsEnum(VideoStatus)
  public videoStatus!: VideoStatus;

  @IsOptional()
  @IsString()
  public fileId!: string;

  @IsOptional()
  @IsString()
  public fileName!: string;

  @IsOptional()
  @IsString()
  public fileUrl!: string;
}

export class UpdateVideosRequest {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UpdateVideoRequest)
  public videos!: UpdateVideoRequest[];
}
