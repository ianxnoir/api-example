import { IsArray, IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class RtmpUpsertRequestDto {
  @IsNotEmpty()
  @IsString()
  public sbeSeminarId!: string;

  @IsNotEmpty()
  @IsDateString()
  public endAt: string;

  @IsNotEmpty()
  @IsArray()
  public languages!: string[];

  @IsNotEmpty()
  @IsString()
  public fairCode!: string;
}
