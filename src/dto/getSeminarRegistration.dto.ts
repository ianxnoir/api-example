import { IsNotEmpty, IsNumberString, IsString } from "class-validator";

export interface GetSeminarRegistrationInterface {
  fairCode: string;
  year: string;
  seminarId: string;
  type: 'watchNow' | 'playback'
}

export class GetSeminarRegistrationDto implements GetSeminarRegistrationInterface {
  @IsNotEmpty()
  @IsString()
  public fairCode: string;

  @IsNotEmpty()
  @IsString()
  public year: string;

  @IsNotEmpty()
  @IsNumberString()
  public seminarId: string;

  @IsNotEmpty()
  @IsString()
  public type: 'watchNow' | 'playback'
}