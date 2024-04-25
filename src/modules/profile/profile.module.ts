import { HttpModule, Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UtilsModule } from '../../core/utils/utils';
import { C2mParticipantStatus } from '../../dao/C2mParticipantStatus';
import { FairFormTemplate } from '../../dao/FairFormTemplate';
import { FairParticipant } from '../../dao/FairParticipant';
import { FairParticipantType } from '../../dao/FairParticipantType';
import { FairPeriod } from '../../dao/FairPeriod';
import { FairRegistration } from '../../dao/FairRegistration';
import { FairRegistrationDynamicBm } from '../../dao/FairRegistrationDynamicBm';
import { FairRegistrationDynamicOthers } from '../../dao/FairRegistrationDynamicOthers';
import { FairRegistrationImportTask } from '../../dao/FairRegistrationImportTask';
import { FairRegistrationImportTaskActivityLog } from '../../dao/FairRegistrationImportTaskActivityLog';
import { FairRegistrationImportTaskLog } from '../../dao/FairRegistrationImportTaskLog';
import { FairRegistrationNob } from '../../dao/FairRegistrationNob';
import { FairRegistrationPreferredSuppCountryRegion } from '../../dao/FairRegistrationPreferredSuppCountryRegion';
import { FairRegistrationPregeneration } from '../../dao/FairRegistrationPregeneration';
import { FairRegistrationProductInterest } from '../../dao/FairRegistrationProductInterest';
import { FairRegistrationProductStrategy } from '../../dao/FairRegistrationProductStrategy';
import { FairRegistrationStatus } from '../../dao/FairRegistrationStatus';
import { FairRegistrationType } from '../../dao/FairRegistrationType';
import { FairRegistrationTypesOfTargetSuppliers } from '../../dao/FairRegistrationTypesOfTargetSuppliers';
import { RegistrationSerialNumberReservation } from '../../dao/RegistrationSerialNumberReservation';
import { SourceType } from '../../dao/SourceType';
import { VisitorType } from '../../dao/VisitorType';
import { Registration } from '../../entities/registration.entity';
import { BuyerService } from '../api/buyer/buyer.service';
import { C2MService } from '../api/c2m/content.service';
import { ContentService } from '../api/content/content.service';
import { FairModule } from '../fair/fair.module';
import { FairService } from '../fair/fair.service';
import { FairDbService } from '../fairDb/fairDb.service';
import { ProfileDbService } from '../fairDb/profileDb.service';
import { FormValidationModule } from '../formValidation/formValidation.module';
import { ProfileAdminController, ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

import { ContentCacheModule } from '../api/content/content-cache.module';
import { ElasticacheClusterModule } from '../../core/elasticachecluster/elasticachecluster.providers';
import { ESModule } from '../esHelper/es.module';

@Module({
  imports: [TypeOrmModule.forFeature([
    C2mParticipantStatus,
    FairPeriod,
    FairFormTemplate,
    FairParticipant,
    FairParticipantType,
    FairRegistration,
    FairParticipant,
    FairRegistrationImportTask,
    FairRegistrationImportTaskActivityLog,
    FairRegistrationImportTaskLog,
    FairRegistrationNob,
    FairRegistrationPreferredSuppCountryRegion,
    FairRegistrationProductInterest,
    FairRegistrationProductStrategy,
    FairRegistrationStatus,
    FairRegistrationType,
    Registration,
    FairRegistrationTypesOfTargetSuppliers,
    FairRegistrationDynamicBm,
    FairRegistrationDynamicOthers,
    RegistrationSerialNumberReservation,
    FairRegistrationPregeneration,
    SourceType,
    VisitorType
  ]), HttpModule, FairModule, UtilsModule, FormValidationModule, ESModule,
  ContentCacheModule,
  // In every 3 sceond, the function with @UseGuards(ThrottlerGuard) can only be called 300 times or less in this ECS instance
  ThrottlerModule.forRoot({
    limit: 3,
    ttl: 300,
  }),
  ElasticacheClusterModule],
  controllers: [ProfileController, ProfileAdminController],
  providers: [ProfileService, FairDbService, ProfileDbService, FairService, ContentService, C2MService, BuyerService],
})
export class ProfileModule { }