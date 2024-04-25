import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParticipantImportController } from './participantImport.controller';
import { ParticipantImportService } from './participantImport.service';
import { FairRegistrationStatus } from '../../dao/FairRegistrationStatus';
import { C2mParticipantStatus } from '../../dao/C2mParticipantStatus';
import { FairParticipant } from '../../dao/FairParticipant';
import { FairRegistrationCustomQuestion } from '../../dao/FairRegistrationCustomQuestion';
import { FairRegistrationTicketPass } from '../../dao/FairRegistrationTicketPass';
import { FairRegistration } from '../../dao/FairRegistration';
import { FairParticipantType } from '../../dao/FairParticipantType';
import { FairRegistrationType } from '../../dao/FairRegistrationType';
import { FairTicketPass } from '../../dao/FairTicketPass';
import { SeminarRegistrationSqsService } from '../sqs/seminarRegistrationSqs.service';
import { FairParticipantTypeRoleMapping } from '../../dao/FairParticipantTypeRoleMapping';
import { ActivitySqsService } from '../sqs/activitySqs.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      FairParticipant, 
      FairParticipantType,
      FairParticipantTypeRoleMapping,
      FairRegistration, 
      FairRegistrationType,
      FairRegistrationStatus, 
      FairRegistrationCustomQuestion,
      FairRegistrationTicketPass,      
      C2mParticipantStatus,
      FairTicketPass,
    ])
  ],
  controllers: [ParticipantImportController],
  providers: [ParticipantImportService, SeminarRegistrationSqsService, ActivitySqsService],
  exports: [ParticipantImportService],
})
export class ParticipantImportModule { }
