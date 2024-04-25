import { IsNotEmpty, IsString } from 'class-validator';

export class FindVideoRequest {
  @IsNotEmpty()
  @IsString()
  public taskId!: string;
}
