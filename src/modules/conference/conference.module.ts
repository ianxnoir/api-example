import { CacheModule, HttpModule, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsV4HttpModule } from 'nestjs-aws-v4';
import { Seminar as SeminarEntity } from '../../entities/seminar.entity';
import { Rtmp as RtmpEntity } from '../../entities/rtmp.entity';
import { Rating as RatingEntity } from '../../entities/rating.entity';
import { Vod as VodEntity } from '../../entities/vod.entity';
import { Kol as KolEntity } from '../../entities/kol.entity'
import { Video as VideoEntity } from '../../entities/video.entity'
import { Connection as ConnectionEntity } from '../../entities/connection.entity'
import { ConferenceSeminar as ConferenceSeminarEntity } from '../../entities/confSeminar.entity';

import { ConferenceController } from './conference.controller';
import { ConferenceService } from './conference.service';
// import { SeminarService } from '../seminar/seminar.service';
// import { RtmpService } from '../rtmp/rtmp.service';
// import { VodService } from '../vod/vod.service';
// import { KolService } from '../kol/kol.service';
// import { VideoService } from '../video/video.service';
import { SBEModule } from '../api/sbe/sbe.module';
import { LambdaModule } from '../api/lambda/lambda.module';
import { FairModule } from '../fair/fair.module';
import { ContentService } from '../api/content/content.service';
import { FairRegistration } from '../../dao/FairRegistration';
import { FairCustomQuestion } from '../../dao/FairCustomQuestion';
import { FairCustomQuestionFilter } from '../../dao/FairCustomQuestionFilter';
import { FairService } from '../fair/fair.service';
import { FairPeriod } from '../../dao/FairPeriod';
import { C2MService } from '../api/c2m/content.service';
import { FairRegistrationStatus } from '../../dao/FairRegistrationStatus';
import { FairParticipant } from '../../dao/FairParticipant';
import { FairSeminarRegistration } from '../../dao/FairSeminarRegistration';
import { FairTicketPass } from '../../dao/FairTicketPass';
import { FairTicketPassService } from '../../dao/FairTicketPassService';
import { FairRegistrationTicketPass } from '../../dao/FairRegistrationTicketPass';
import { SeminarRegistrationSqsService } from '../sqs/seminarRegistrationSqs.service';
import { FairParticipantTypeRoleMapping } from '../../dao/FairParticipantTypeRoleMapping';
import { FairParticipantType } from '../../dao/FairParticipantType';
import { ConferenceElasticacheService } from './elasticache.service';
import { FairRegistrationPregeneration } from '../../dao/FairRegistrationPregeneration';
import { Registration } from '../../entities/registration.entity';
import { ContentCacheService } from '../api/content/content-cache.service';
import { ConferenceFairDbService } from '../conferenceFairDb/conferenceFairDb.service';
import { ElasticacheClusterModule } from '../../core/elasticachecluster/elasticachecluster.providers';
import { ESModule } from '../esHelper/es.module';

@Module({
  imports: [
    LambdaModule,
    SBEModule,
    HttpModule,
    FairModule,
    TypeOrmModule.forFeature([
      ConferenceSeminarEntity,
      SeminarEntity,
      RatingEntity,
      RtmpEntity,
      KolEntity,
      VodEntity,
      VideoEntity,
      ConnectionEntity,
      FairRegistration,
      FairPeriod,
      FairRegistrationStatus,
      FairParticipant,
      FairParticipantType,
      FairParticipantTypeRoleMapping,
      FairCustomQuestion,
      FairCustomQuestionFilter,
      FairSeminarRegistration,
      FairRegistrationTicketPass,
      FairRegistrationPregeneration,
      FairTicketPass,
      FairTicketPassService,
      Registration
    ]),
    AwsV4HttpModule.register({
      region: 'ap-east-1',
      service: 'execute-api',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_SIGV4 || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_SIGV4 || '',
      },
    }),
    CacheModule.register(),
    ESModule,
    ElasticacheClusterModule
  ],
  controllers: [ConferenceController],
  providers: [ConferenceService, ConferenceFairDbService, ContentService, ContentCacheService, FairService, C2MService, SeminarRegistrationSqsService, ConferenceElasticacheService
  ],
})
export class ConferenceModule { }
