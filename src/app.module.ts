import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import moment from 'moment-timezone';

import { configuration } from './config';
import { DatabaseModule } from './core/database/database.providers';
import { GlobalExceptionsFilter } from './core/filters';
import { LoggerMiddleware } from './core/utils';
import { UtilsModule } from './core/utils/utils';
import { VepValidationPipe } from './core/validation-pipe/vep-validation.pipe';
import { CacheControlModule } from './modules/cacheControl/cacheControl.module';
import { BuyerImportModule } from './modules/buyerImport/buyerImport.module';
import { CaptchaModule } from './modules/captcha/captcha.module';
import { FairModule } from './modules/fair/fair.module';
import { KolModule } from './modules/kol/kol.module';
import { ProfileModule } from './modules/profile/profile.module';
import { RegistrationModule } from './modules/registration/registration.module';
import { RtmpModule } from './modules/rtmp/rtmp.module';
import { SeminarModule } from './modules/seminar/seminar.module';
import { StarSpeakerModule } from './modules/starSpeaker/starSpeaker.module';
import { VideoModule } from './modules/video/video.module';
import { VodModule } from './modules/vod/vod.module';
import { HealthModule } from './modules/health/health.module';
import { AppService } from "./app.service";
import { ConferenceModule } from './modules/conference/conference.module';
import { ParticipantImportModule } from './modules/participantImport/participantImport.module';
import { RtmpSchedulerModule } from './modules/rtmp/schedulers/rtmpScheduler.module';
import { FormModule } from './modules/form/form.module';
import { CustomQuestionsModule } from './modules/customQuestions/customQuestions.module';
import { ElasticacheModule } from './core/elasticache/elasticache.providers';
import { ElasticacheClusterModule } from './core/elasticachecluster/elasticachecluster.providers';
import { ESModule } from './modules/esHelper/es.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    // Database
    DatabaseModule,

    VepValidationPipe,

    // Logger
    UtilsModule,

    //Redis
    ElasticacheModule,
    ElasticacheClusterModule,

    // API
    FairModule,
    StarSpeakerModule,
    ConferenceModule,
    RtmpModule,
    VodModule,
    KolModule,
    VideoModule,
    SeminarModule,
    ProfileModule,
    CaptchaModule,
    RegistrationModule,
    CacheControlModule,
    FormModule,
    BuyerImportModule,
    ParticipantImportModule,
    CustomQuestionsModule,
    ESModule,

    //Health
    HealthModule,
    AppService,
    RtmpSchedulerModule
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    moment.tz.setDefault('UTC');
  }
}
