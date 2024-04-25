export const SeminarRegistrationReportStatus = {
  PENDING: 0,
  DONE: 1,
  ERROR: 2
}

export interface SeminarRegistrationReportStatusInterface {
  tableId: number,
  status: number
}

export enum SeminarRegistrationReportStatusEnum {
  PENDING = 'PENDING',
  DONE = 'DONE',
  ERROR = 'ERROR'
}

export interface SeminarRegistrationReportInterface {
  fairCode: string;
  fiscalYear: string;
  sbeSeminarId: string;
  fileName: string;
  status: SeminarRegistrationReportStatusInterface["status"];
}
