import { IsNotEmpty, IsString } from 'class-validator';

export class GetUserTicketPermissionRequest {
  @IsNotEmpty()
  @IsString()
  public ssoUid!: string;
}
