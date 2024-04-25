/* eslint-disable max-classes-per-file */
import { Type } from 'class-transformer';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class PayloadData {
  @IsNotEmpty()
  @IsString()
  public sbeSeminarId!: string;

  @IsOptional()
  @IsString()
  public ssoUid!: string;
  
  @IsNotEmpty()
  @IsBoolean()
  public isPublic: boolean;
}

export class JoinSeminarRequestDto {
  @IsNotEmpty()
  @IsString()
  public connectionId!: string;

  @IsNotEmpty()
  @Type(() => PayloadData)
  @ValidateNested()
  public payload: PayloadData;
}
