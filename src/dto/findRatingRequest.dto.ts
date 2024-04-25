import { IsNotEmpty, IsString } from 'class-validator';

export class FindRatingRequestDto {
  @IsNotEmpty()
  @IsString()
  public sbeSeminarId!: string;
}
