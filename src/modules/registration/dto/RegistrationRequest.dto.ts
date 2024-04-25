import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsEnum, ValidateNested, IsBooleanString, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { LANG } from './SubmitForm.enum';

// @GET: Request Query
export class RegistrationRequestDto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Fair Code',
    example: 'hkjewellery',
    required: true,
  })
  fairCode: string;

  @ApiPropertyOptional({
    description: "emailId, regexp: /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/",
    example: 'temp@gmail.com',
  })
  @IsString()
  emailId: string;

  @ApiPropertyOptional({
    description: 'lang',
    example: 'en',
  })
  @IsEnum(LANG)
  lang: string;

  @ApiPropertyOptional({
    description: 'slug',
    example: '\/event\/hkjewellery\/en\/form\/elementor-17026\/',
  })
  slug: string

  @ApiPropertyOptional({
    description: 'Use the Dummy Template',
    example: 'true',
  })
  @IsBooleanString()
  @IsOptional()
  useDummy: string
}
export class RegistrationRequestV2Dto {
  @IsNotEmpty()
  @ApiProperty({
    description: 'Fair Code',
    example: 'hkjewellery',
    required: true,
  })
  fairCode: string;

  @ApiPropertyOptional({
    description: "emailId, regexp: /^(([^<>()\[\]\\.,;:\s@\"]+(\.[^<>()\[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/",
    example: 'temp@gmail.com',
  })
  @IsString()
  emailId: string;

  @ApiPropertyOptional({
    description: 'lang',
    example: 'en',
  })
  @IsEnum(LANG)
  lang: string;

  @ApiPropertyOptional({
    description: 'short slug',
    example: 'organic-buyer-registration-form',
  })
  slug: string

  @ApiPropertyOptional({
    description: 'Use the Dummy Template',
    example: 'true',
  })
  @IsBooleanString()
  @IsOptional()
  useDummy: string
}

export class RegistrationDetailsResponseDto {
  @ApiProperty({
    description: 'fiscal year',
    example: '2021',
  })
  fiscal_year: string;

  @ApiProperty({
    description: 'eoaFairId',
    example: '2021',
  })
  eoa_fair_id: string;

  @ApiProperty({
    description: 'Fair Registration Enabled or Disabled',
    example: 1,
  })
  fair_registration: any;

  @ApiProperty({
    description: 'Fair Registration - Start Date',
    example: '2021-01-01 00:00',
  })
  fair_registration_start_datetime: string;

  @ApiProperty({
    description: 'Fair Registration - End Date',
    example: '2021-12-31 00:00',
  })
  fair_registration_end_datetime: string;

  @ApiProperty({
    description: 'AOR Registration Enabled or Disabled',
    example: 1,
  })
  always_on_form_display: any;

  @ApiProperty({
    description: 'AOR Registration - Start Date',
    example: '2021-01-01 00:00',
  })
  aor_form_registration_start_datetime: string;

  @ApiProperty({
    description: 'AOR Registration - End Date',
    example: '2021-12-31 00:00',
  })
  aor_form_registration_end_datetime: string;

  @ApiProperty({
    description: 'CIP Registration Enabled or Disabled',
    example: 1,
  })
  cip_form_registration: any;

  @ApiProperty({
    description: 'CIP Registration - Start Date',
    example: '2021-01-01 00:00',
  })
  cip_form_registration_start_datetime: string;

  @ApiProperty({
    description: 'CIP Registration - End Date',
    example: '2021-12-31 00:00',
  })
  cip_form_registration_end_datetime: string;
  
  @ApiProperty({
    description: 'MISSION Registration Enabled or Disabled',
    example: 1,
  })
  mission_form_registration: any;

  @ApiProperty({
    description: 'MISSION Registration - Start Date',
    example: '2021-01-01 00:00',
  })
  mission_form_registration_start_datetime: string;

  @ApiProperty({
    description: 'MISSION Registration - End Date',
    example: '2021-12-31 00:00',
  })
  mission_form_registration_end_datetime: string;

  @ApiProperty({
    description: 'Seminar Registration Enabled or Disabled',
    example: 1,
  })
  seminar_registration: any;

  @ApiProperty({
    description: 'Seminar Registration - Start Date',
    example: '2021-01-01 00:00',
  })
  seminar_registration_start_datetime: string;

  @ApiProperty({
    description: 'Seminar Registration - End Date',
    example: '2021-12-31 00:00',
  })
  seminar_registration_end_datetime: string;
}

export class RegistrationSuccessfulResponseDto {
  @ApiProperty({
    description: 'eligibility',
    example: true,
  })
  eligibility: Boolean;

  @ApiProperty({
    description: 'code',
    example: 'ELIGIBLE',
  })
  code: String;

  @ApiPropertyOptional({
    description: 'registration Form',
    example: '',
  })
  registrationFormUrl: String;
}

// @GET: Successful Response Data of Fair Setting
export class FairSettingSuccessfulResponseDto {
  @ApiProperty({
    example: '1634609620918',
  })
  timestamp: Number;

  @ApiProperty({
    example: '200',
  })
  status: Number;

  @ApiProperty({
    example: RegistrationSuccessfulResponseDto,
  })
  data: RegistrationSuccessfulResponseDto;
}

export enum RegistrationStatus {
  CONFIRMED = 1,
  CANCELLED = 2,
  REJECTED = 3,
  SUBMITED = 4,
  INCOMPLETE = 5,
}

export enum RegistrationStatusCode {
  SUBMITTED = "SUBMITTED",
  CONFIRMED = "CONFIRMED",
  REJECTED = "REJECTED",
  CANCELLED = "CANCELLED",
  INCOMPLETE = "INCOMPLETE",
  PENDING_APPROVALS = "PENDING_APPROVALS",
  PENDING = "PENDING",
  FAILED = "FAILED",
}

export class UpdateRegistrationStatusRequestDto {
  @IsNotEmpty()
  @IsEnum([1,2,3,5])
  @ApiProperty({
    example: 1,
    enum: [1,2,3,5]
  })
  status: number;
}

export class RegistrationIDStatusDto {
  @IsNotEmpty()
  @IsEnum([1,2,3,5])
  @ApiProperty({
    example: 1,
    enum: [1,2,3,5]
  })
  status: number;
  @IsNotEmpty()
  @ApiProperty({
    example: 1,
  })
  registrationRecordId: number;
}

export class BulkUpdateRegistrationStatusRequestDto {
  @IsNotEmpty()
  @ValidateNested({each: true})
  @Type(() => RegistrationIDStatusDto)
  @ApiProperty({
    type: [RegistrationIDStatusDto],
    example: [
      {
        registrationRecordId: 1,
        status: 1
      }
    ],
  })
  actions: [RegistrationIDStatusDto];
}

export class UpdateRegistrationStatusResponseDto {
  @ApiProperty({
    example: 'success',
  })
  result: String;
}

export class EligibilityResponseDto {
  eligibility: boolean
  code: string
  registrationFormUrl: string

  constructor() {
      this.eligibility = false
      this.code= ""
      this.registrationFormUrl = ""
  }
}