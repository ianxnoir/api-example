/* eslint-disable max-classes-per-file */
import { Type } from 'class-transformer';
import { IsNotEmpty, IsString, ValidateNested } from 'class-validator';

export class PayloadData {
  @IsNotEmpty()
  @IsString()
  public sbeSeminarId!: string;

  @IsNotEmpty()
  @IsString()
  public fairCode!: string;
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
