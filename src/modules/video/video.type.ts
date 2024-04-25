export enum TranscodeStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum VideoStatus {
  USING = 'USING',
  UNUSED = 'UNUSED',
  CANCELLED = 'CANCELLED',
}

export type VideoQuery = {
  seminarId?: number;
  taskId?: string;
  transcodeStatus?: TranscodeStatus;
  videoStatus?: VideoStatus;
  fileUrl?: string;
  fileName?: string;
};

export type VideoDetail = {
  id: number | null;
  taskId?: string | null;
  transcodeStatus?: TranscodeStatus;
  videoStatus?: VideoStatus;
  fileName?: string | null;
  fileUrl?: string | null;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: Date;
  creationTime?: Date;
};
