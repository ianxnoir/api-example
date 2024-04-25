import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from "@nestjs/swagger";
import { seminarType, sourceType, userType } from '../modules/seminar/seminar.type';

export class SeminarRegistrationCommonDto {
  @ApiProperty({
    description: 'fairCode',
    example: `[{
      fairCode: "xxx",
      fiscalYear: "xxx",
      userId: "ssouid",
    }]`,
    type: 'string',
  })
  @IsNotEmpty()
  public userData!: seminarRegUserData[]

  @ApiProperty({
    description: 'eventId',
    example: '100',
    type: 'string',
  })
  @IsNotEmpty()
  public eventId: string;

  @ApiProperty({
    description: 'systemCode',
    example: 'VEP',
    type: 'string',
  })
  @IsNotEmpty()
  public systemCode: string;
}

class seminarRegUserData {
  @IsNotEmpty()
  public userId: string;

  @IsOptional()
  public fairCode: string;

  @IsOptional()
  public fiscalYear: string;

  @IsOptional()
  public registrationNo: string;
}
class SeminarAnswersDto {
  @ApiProperty({
    description: 'isCheckedOption1',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public isCheckedOption1: string;

  @ApiProperty({
    description: 'isCheckedOption2',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public isCheckedOption2: string;

  @ApiProperty({
    description: 'isCheckedOption3',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public isCheckedOption3: string;

  @ApiProperty({
    description: 'option1Ans',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public option1Ans: string;

  @ApiProperty({
    description: 'option2Ans',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public option2Ans: string;

  @ApiProperty({
    description: 'option3Ans',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public option3Ans: string;
}

export class SeminarQuestionDto extends SeminarAnswersDto {
  @ApiProperty({
    description: 'option1Question',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public option1Question: string;

  @ApiProperty({
    description: 'option2Question',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public option2Question: string;

  @ApiProperty({
    description: 'option3Question',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public option3Question: string;
}

export class VEPSeminarRegistrationDto extends SeminarQuestionDto {
  @ApiProperty({
    description: 'seminarId',
    example: '18132',
    type: 'string',
  })
  @IsNotEmpty()
  public seminarId: string;

  @ApiProperty({
    description: 'seminarRegistrationType',
    example: '',
    type: 'string',
  })
  @IsNotEmpty()
  @IsEnum(seminarType)
  public seminarRegistrationType: seminarType;

  @ApiProperty({
    description: 'userRole',
    example: 'exhibitor',
    type: 'string',
  })
  @IsNotEmpty()
  @IsEnum(userType)
  public userRole!: userType;

  // @ApiProperty({
  //   description: 'registrationNo',
  //   example: 'exhibitor',
  //   type: 'string',
  // })
  // @IsOptional()
  // public registrationNo!: string;

  @ApiProperty({
    description: 'paymentSession',
    example: '',
    type: 'string',
  })
  @IsOptional()
  public paymentSession!: string;

  @ApiProperty({
    description: 'source',
    example: 'intelligence',
    type: 'string',
  })
  @IsNotEmpty()
  @IsEnum(sourceType)
  public source!: sourceType;

  @ApiProperty({
    description: 'systemCode',
    example: 'VEP',
    type: 'string',
  })
  @IsNotEmpty()
  public systemCode: string;

  @ApiProperty({
    description: 'fairCode',
    example: 'hkjewellery',
    type: 'string',
  })
  @IsNotEmpty()
  public fairCode!: string;

  @ApiProperty({
    description: 'fiscalYear',
    example: '2022',
    type: 'string',
  })
  @IsNotEmpty()
  public fiscalYear!: string;

  @ApiProperty({
    description: 'buyer id = ssouid, exhibitor id = ccdid',
    example: '',
    type: 'string',
  })
  @IsNotEmpty()
  public userId!: string;

  @ApiProperty({
    description: 'eventId',
    example: '100',
    type: 'string',
  })
  @IsNotEmpty()
  public eventId: string;

  @IsOptional()
  public snsStatus: boolean;

  @IsOptional()
  public checkDisclaimers: boolean;

  @IsOptional()
  public euConsentStatus: boolean

  @IsOptional()
  public badgeConsent: boolean

  @IsOptional()
  public c2mConsent: boolean

  @IsOptional()
  public registrationDetailConsent: boolean

  @IsOptional()
  public startTime: string;

  @IsOptional()
  public endTime: string;
}

export class SeminarRegistrationForEventDto extends SeminarRegistrationCommonDto {
}

export class SeminarAnswersWithSeminarId {
  @ApiProperty({
    description: 'seminarId',
    example: '18132',
    type: 'string',
  })
  @IsNotEmpty()
  public seminarId: string;

  @ApiProperty({
    description: 'isCheckedOption1',
    example: '1',
    type: 'string',
  })
  @IsOptional()
  public isCheckedOption1: string;

  @ApiProperty({
    description: 'isCheckedOption2',
    example: '1',
    type: 'string',
  })
  @IsOptional()
  public isCheckedOption2: string;

  @ApiProperty({
    description: 'isCheckedOption3',
    example: '1',
    type: 'string',
  })
  @IsOptional()
  public isCheckedOption3: string;

  @ApiProperty({
    description: 'option1Ans',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public option1Ans: string;

  @ApiProperty({
    description: 'option2Ans',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public option2Ans: string;

  @ApiProperty({
    description: 'option3Ans',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public option3Ans: string;
}

export class SeminarRegistrationForSeminarsDto extends SeminarRegistrationCommonDto {
  @ApiProperty({
    example: '[]',
    type: [SeminarAnswersWithSeminarId],
  })
  @IsOptional()
  seminarReg: SeminarAnswersWithSeminarId[];

  @ApiProperty({
    description: 'seminarId',
    example: '18132',
    type: 'string',
  })
  @IsOptional()
  public seminarId: string[];

  @IsOptional()
  public language: string;
}

export class SeminarsRegistrationDto {
  @ApiProperty({
    description: 'eventId',
    example: '100',
    type: 'string',
  })
  @IsNotEmpty()
  public eventId: string;

  @ApiProperty({
    description: 'language',
    example: 'en / sc / tc',
    type: 'string',
  })
  @IsNotEmpty()
  public language: string;

  @ApiProperty({
    description: 'registrationNo',
    example: '',
    type: 'string',
  })
  @IsNotEmpty()
  public registrationNo: string;

  @ApiProperty({
    example: '[]',
    type: [SeminarAnswersWithSeminarId],
  })
  @IsNotEmpty()
  seminarReg: SeminarAnswersWithSeminarId[];

  @ApiProperty({
    description: 'shouldSendConfirmationEmail',
    example: '0',
    type: 'string',
  })
  @IsOptional()
  public shouldSendConfirmationEmail: string;

  @ApiProperty({
    description: 'paymentSession',
    example: '',
    type: 'string',
  })
  @IsOptional()
  public paymentSession: string;

  @ApiProperty({
    description: 'systemCode',
    example: 'VEP',
    type: 'string',
  })
  @IsNotEmpty()
  public systemCode: string;
}


export class buyerRegistrationSyncSNSDto {
  @IsNotEmpty()
  public userId!: string;

  @IsNotEmpty()
  public fairCode!: string;

  @IsNotEmpty()
  public fiscalYear!: string;

  @IsNotEmpty()
  public language!: string;

  @IsNotEmpty()
  public eventId!: string;

  @IsNotEmpty()
  public seminarId!: string[];

  @IsOptional()
  public isRetry:boolean;
}

export class updateStatusDto {
  @IsNotEmpty()
  public userId!: string;

  @IsNotEmpty()
  public seminarId!: string;
}