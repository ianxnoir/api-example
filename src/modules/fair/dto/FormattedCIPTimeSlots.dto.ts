export class FormattedTimeSlotsDataDto {
  displayTime: string;
  startTime: string;
  endTime: string;

}

export class FormattedTimeSlotsDto {
  availableData:string;
  availableTimeRange: FormattedTimeSlotsDataDto;

}
