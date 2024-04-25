import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { SeminarRegistrationReportStatusEnum, SeminarRegistrationReportStatusInterface } from '../dao/SeminarRegistrationReport.dao';

export class SeminarRegistrationReport {
  @IsNotEmpty()
  @IsString()
  public fairCode!: string;

  @IsNotEmpty()
  @IsString()
  public fiscalYear!: string;

  @IsNotEmpty()
  @IsString()
  public sbeSeminarId!: string;

  @IsNotEmpty()
  @IsString()
  public fileName!: string;

  @IsNotEmpty()
  @IsEnum(SeminarRegistrationReportStatusEnum)
  public status!: SeminarRegistrationReportStatusInterface["status"];
}

export class UpdateSeminarRegistrationStatus {
  @IsNotEmpty()
  @IsNumber()
  @Transform(({ value }) => parseInt(value))
  public tableId!: number;

  @IsNotEmpty()
  @IsEnum(SeminarRegistrationReportStatusEnum)
  public status!: SeminarRegistrationReportStatusInterface["status"];
}
