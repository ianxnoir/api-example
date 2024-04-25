import { CacheModule, HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FairParticipant } from '../../dao/FairParticipant';
import { FairPeriod } from '../../dao/FairPeriod';
import { FairRegistration } from '../../dao/FairRegistration';
import { FairRegistrationPregeneration } from '../../dao/FairRegistrationPregeneration';
import { FairRegistrationStatus } from '../../dao/FairRegistrationStatus';
import { Registration } from '../../entities/registration.entity';
import { C2MService } from '../api/c2m/content.service';
import { ContentService } from '../api/content/content.service';
import { FairDbService } from '../fairDb/fairDb.service';
import { FairController } from './fair.controller';
import { FairService } from './fair.service';
import { ContentCacheModule } from '../api/content/content-cache.module';
import { ElasticacheClusterModule } from '../../core/elasticachecluster/elasticachecluster.providers';
import { ESModule } from '../esHelper/es.module';
import { ESService } from '../esHelper/esService';

@Module({
  imports: [TypeOrmModule.forFeature([
    FairRegistration,
    FairParticipant,
    FairRegistrationStatus,
    FairRegistrationPregeneration,
    Registration,
    FairPeriod,
  ]), HttpModule,
    ContentCacheModule,
  CacheModule.register(),
  ElasticacheClusterModule,
  ESModule
  ],
  controllers: [FairController],
  providers: [FairService, FairDbService, ContentService, C2MService, ESService],
})
export class FairModule {}
