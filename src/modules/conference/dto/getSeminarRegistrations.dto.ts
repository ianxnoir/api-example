import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";
import { BaseResDtoInt, SeminarRegistration } from "../conference.type";

export interface GetSeminarRegistrationsReqInt {
  fairCode: string;
  year: string;
}

export class GetSeminarRegistrationsReqDto implements GetSeminarRegistrationsReqInt {
  @ApiProperty({
    type: String,
    description: 'fair code',
    example: 'bnr'
  })
  @IsNotEmpty()
  @IsString()
  public fairCode: string;

  @ApiProperty({
    type: String,
    description: 'fiscal year of the fair',
    example: '2223'
  })
  @IsNotEmpty()
  @IsString()
  public year: string;
}

export interface GetSeminarRegistrationsResInt extends BaseResDtoInt<SeminarRegistration[]> {}

export class GetSeminarRegistrationsResDto implements GetSeminarRegistrationsResInt {
  @ApiProperty({
      type: String,
      description: 'related SQL',
      example: ''
  })
  sql: string

  @ApiProperty({
      type: String,
      description: 'related SQL parameters in JSON string',
      example: []
  })
  params: string

  @ApiProperty({
      type: [SeminarRegistration],
      description: 'seminar registrations returned',
      example: []
  })
  data: SeminarRegistration[];
}
