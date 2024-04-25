import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";
import { BaseResDtoInt } from "../conference.type";

export interface UpdateSeminarRegistrationReqInt {
  fairCode: string;
  year: string;
  seminarRegistrationId: number;
  type: 'watchNow' | 'playback'
}

export class UpdateSeminarRegistrationReqDto implements UpdateSeminarRegistrationReqInt {
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

  @ApiProperty({
    type: Number,
    description: 'seminar registration ID',
    example: 1
  })
  @IsNotEmpty()
  @IsNumber()
  public seminarRegistrationId: number;

  @ApiProperty({
    type: String,
    description: 'type of video action',
    example: 'watchNow'
  })
  @IsNotEmpty()
  @IsString()
  public type: 'watchNow' | 'playback'
}

export class UpdateSeminarRegistrationResData {
  @ApiProperty({
    type: String,
    description: 'whether the operation is success or fail',
    example: 'success'
  })
  result: 'success'|'fail'
}

export interface UpdateSeminarRegistrationResInt extends BaseResDtoInt<UpdateSeminarRegistrationResData> {}

export class UpdateSeminarRegistrationResDto implements UpdateSeminarRegistrationResInt {
  @ApiProperty({
      type: String,
      description: 'related SQL',
      example: ''
  })
  sql: string

  @ApiProperty({
      type: String,
      description: 'related SQL parameters in JSON string',
      example: ''
  })
  params: string

  @ApiProperty({
      type: String,
      description: 'whether the operation is success or fail',
      example: []
  })
  data: UpdateSeminarRegistrationResData;
}