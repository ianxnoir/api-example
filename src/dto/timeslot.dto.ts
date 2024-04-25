/* eslint-disable max-classes-per-file */
import { IsNotEmpty } from 'class-validator';

export class TimeslotDto {
  @IsNotEmpty()
  public start!: any;

  @IsNotEmpty()
  public end!: any;
}

export class GroupedTimeslotsDto {
  public date!: Date;

  public timeslots!: Array<any>;
}
