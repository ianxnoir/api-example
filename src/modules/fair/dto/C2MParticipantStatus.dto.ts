import { IsString } from 'class-validator';

export interface C2MParticipantStatusInterface {
  c2mParticipantStatus: string;
  ssoUid?: string;
  fairCode: string;
  fiscalYear: string;
}

export class C2MParticipantStatus implements C2MParticipantStatusInterface {
  @IsString()
  c2mParticipantStatus: string;

  @IsString()
  fairCode: string;

  @IsString()
  fiscalYear: string;
}

export interface BuyerDetail {
  ssoUid: string;
  fairCode: string;
  fiscalYear: string;
}
