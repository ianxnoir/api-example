import { IsNotEmpty, IsString } from 'class-validator';

export class RtmpPlaybackRequestDto {
  @IsNotEmpty()
  @IsString()
  public key!: string;

  @IsNotEmpty()
  @IsString()
  public fileId: string;

  @IsNotEmpty()
  @IsString()
  public endTime: string;

  @IsNotEmpty()
  @IsString()
  public vodVideoUrl: string;
}
