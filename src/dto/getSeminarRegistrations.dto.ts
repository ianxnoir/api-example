import { IsNotEmpty, IsString } from "class-validator";

export interface GetSeminarRegistrationsInterface {
  fairCode: string;
  year: string;
}

export class GetSeminarRegistrationsDto implements GetSeminarRegistrationsInterface {
  @IsNotEmpty()
  @IsString()
  public fairCode: string;

  @IsNotEmpty()
  @IsString()
  public year: string;
}