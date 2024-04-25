import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class UpsertRatingRequestDto {
  @IsNotEmpty()
  @IsString()
  public sbeSeminarId!: string;

  @IsNotEmpty()
  @IsNumber()
  public rate!: number;
}
