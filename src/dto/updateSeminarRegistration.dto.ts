import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export interface UpdateSeminarRegistrationInterface {
  fairCode: string;
  year: string;
  seminarRegistrationId: number;
  type: 'watchNow' | 'playback'
}

export class UpdateSeminarRegistrationDto implements UpdateSeminarRegistrationInterface {
  @IsNotEmpty()
  @IsString()
  public fairCode: string;

  @IsNotEmpty()
  @IsString()
  public year: string;

  @IsNotEmpty()
  @IsNumber()
  public seminarRegistrationId: number;

  @IsNotEmpty()
  @IsString()
  public type: 'watchNow' | 'playback'
}