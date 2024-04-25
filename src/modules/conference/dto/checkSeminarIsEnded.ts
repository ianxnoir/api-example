import { ApiProperty } from "@nestjs/swagger";
import { BaseResDtoInt } from "../conference.type";


export class CheckSeminarIsEndedResData {
  @ApiProperty({
    type: String,
    description: 'whether the operation is success or fail',
    example: 'success'
  })
  result: 'success'|'fail'
}

export interface CheckSeminarIsEndedResInt extends BaseResDtoInt<CheckSeminarIsEndedResData> {}

export class CheckSeminarIsEndedResDto implements CheckSeminarIsEndedResInt {
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
      description: 'whether the seminar is ended or not',
      example: []
  })
  data: CheckSeminarIsEndedResData;
}