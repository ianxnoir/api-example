import { CacheModule, HttpModule, Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AwsV4HttpModule } from 'nestjs-aws-v4';
import { Connection as ConnectionEntity } from '../../entities/connection.entity';
import { Kol as KolEntity } from '../../entities/kol.entity';
import { Rating as RatingEntity } from '../../entities/rating.entity';
import { Registration as RegistrationEntity } from '../../entities/registration.entity';
import { FairRegistration as FairRegistrationEntity } from '../../dao/FairRegistration';
import { Rtmp as RtmpEntity } from '../../entities/rtmp.entity';
import { Seminar as SeminarEntity } from '../../entities/seminar.entity';
import { Video as VideoEntity } from '../../entities/video.entity';
import { Vod as VodEntity } from '../../entities/vod.entity';
import { LambdaModule } from '../api/lambda/lambda.module';
import { SBEModule } from '../api/sbe/sbe.module';
import { ConferenceElasticacheService } from '../conference/elasticache.service';
import { KolService } from '../kol/kol.service';
import { RtmpService } from '../rtmp/rtmp.service';
import { SeminarService } from '../seminar/seminar.service';
import { VideoService } from '../video/video.service';
import { VodService } from '../vod/vod.service';
import { StarSpeakerController } from './starSpeaker.controller';
import { StarSpeakerService } from './starSpeaker.service';
import { FairService } from '../fair/fair.service';
import { ContentService } from '../api/content/content.service';
import { FairPeriod } from '../../dao/FairPeriod';
import { ElasticacheService } from '../../core/elasticache/elasticache.service';
import { RegistrationService } from '../registration/registration.service';
import { BuyerService } from '../api/buyer/buyer.service';
import { SqsService } from '../sqs/sqs.service';
import { InvokeLambdaService } from '../invokeLambda/invokeLambda.service';
import { FairDbService } from '../fairDb/fairDb.service';
import { WordpressFormValidationService } from '../formValidation/wordpressFormValidation.service';
import { RegFormLinkDbService } from '../fairDb/regFormLinkDb.service';
import { BusinessRuleFormValidationService } from '../formValidation/businessRuleFormValidation.service';
import { C2MService } from '../api/c2m/content.service';
import { CaptchaService } from '../captcha/captcha.service';
import { S3Service } from '../../core/utils';
import { FairRegistrationFormSubmission } from '../../dao/FairRegistrationFormSubmission';
import { FairRegistrationStatus } from '../../dao/FairRegistrationStatus';
import { FairParticipant } from '../../dao/FairParticipant';
import { FairRegistrationFormLinkTask } from '../../dao/FairRegistrationFormLinkTask';
import { SeminarRegistrationReport } from '../../dao/SeminarRegistrationReport';
import { ElasticacheClusterService } from '../../core/elasticachecluster/elasticachecluster.service';
import { EligibilityService } from '../registration/eligibility.service';
import { ExhibitorService } from '../api/exhibitor/exhibitor.service';
import { FairRegistrationPregeneration } from '../../dao/FairRegistrationPregeneration';
import { ContentCacheService } from '../api/content/content-cache.service';
import { ESModule } from '../esHelper/es.module';

@Module({
  imports: [
    SBEModule,
    TypeOrmModule.forFeature([
      SeminarEntity,
      RatingEntity,
      FairPeriod,
      FairRegistrationPregeneration,
      RegistrationEntity,
      FairRegistrationEntity,
      FairRegistrationFormSubmission,
      FairRegistrationStatus,
      FairParticipant,
      FairRegistrationFormLinkTask,
      RtmpEntity,
      KolEntity,
      VodEntity,
      VideoEntity,
      ConnectionEntity,
      SeminarRegistrationReport,
    ]),
    AwsV4HttpModule.register({
      region: 'ap-east-1',
      service: 'execute-api',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID_SIGV4 || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY_SIGV4 || '',
      },
    }),
    HttpModule,
    LambdaModule,
    ESModule,
    CacheModule.register(),
  ],
  controllers: [StarSpeakerController],
  providers: [
    StarSpeakerService,
    SeminarService,
    RegistrationService,
    EligibilityService,
    ExhibitorService,
    BuyerService,
    S3Service,
    SqsService,
    InvokeLambdaService,
    FairDbService,
    RegFormLinkDbService,
    WordpressFormValidationService,
    BusinessRuleFormValidationService,
    C2MService,
    CaptchaService,
    ContentService,
    RtmpService,
    RtmpService,
    VodService,
    KolService,
    FairService,
    VideoService,
    ElasticacheService,
    ElasticacheClusterService,
    ConferenceElasticacheService,
    ContentCacheService
  ],
})
export class StarSpeakerModule {}
