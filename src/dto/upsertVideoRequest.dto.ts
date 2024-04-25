import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { TranscodeStatus, VideoStatus } from '../modules/video/video.type';

export class UpsertVideoRequest {
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
  public fileName!: string;

  @IsOptional()
  @IsString()
  public fileUrl!: string;
}
