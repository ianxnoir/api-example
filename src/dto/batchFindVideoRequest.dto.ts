import { IsArray, IsNotEmpty } from 'class-validator';

export class BatchFindVideoRequest {
  @IsNotEmpty()
  @IsArray()
  public taskIds!: string[];
}
