import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticacheModule } from '../../core/elasticache/elasticache.providers';
import { ElasticacheService } from '../../core/elasticache/elasticache.service';
import { UtilsModule } from '../../core/utils/utils';
import { C2mParticipantStatus } from '../../dao/C2mParticipantStatus';
import { FairRegistrationFormLinkTask } from '../../dao/FairRegistrationFormLinkTask';
import { FairRegistrationFormLinkTaskEntry } from '../../dao/FairRegistrationFormLinkTaskEntry';
import { FairFormTemplate } from '../../dao/FairFormTemplate';
import { FairParticipant } from '../../dao/FairParticipant';
import { FairParticipantType } from '../../dao/FairParticipantType';
import { FairPeriod } from '../../dao/FairPeriod';
import { FairRegistration } from '../../dao/FairRegistration';
import { FairRegistrationDynamicBm } from '../../dao/FairRegistrationDynamicBm';
import { FairRegistrationFormSubmission } from '../../dao/FairRegistrationFormSubmission';
import { FairRegistrationImportTask } from '../../dao/FairRegistrationImportTask';
import { FairRegistrationImportTaskActivityLog } from '../../dao/FairRegistrationImportTaskActivityLog';
import { FairRegistrationImportTaskLog } from '../../dao/FairRegistrationImportTaskLog';
import { FairRegistrationNob } from '../../dao/FairRegistrationNob';
import { FairRegistrationPreferredSuppCountryRegion } from '../../dao/FairRegistrationPreferredSuppCountryRegion';
import { FairRegistrationProductInterest } from '../../dao/FairRegistrationProductInterest';
import { FairRegistrationProductStrategy } from '../../dao/FairRegistrationProductStrategy';
import { FairRegistrationStatus } from '../../dao/FairRegistrationStatus';
import { FairRegistrationType } from '../../dao/FairRegistrationType';
import { FairRegistrationTypesOfTargetSuppliers } from '../../dao/FairRegistrationTypesOfTargetSuppliers';
import { RegistrationSerialNumberReservation } from '../../dao/RegistrationSerialNumberReservation';
import { SourceType } from '../../dao/SourceType';
import { VisitorType } from '../../dao/VisitorType';
import { C2MService } from '../api/c2m/content.service';
import { ContentService } from '../api/content/content.service';
import { FairService } from '../fair/fair.service';
import { RegFormLinkDbService } from '../fairDb/regFormLinkDb.service';
import { FairDbService } from '../fairDb/fairDb.service';
import { FormValidationModule } from '../formValidation/formValidation.module';
import { RegistrationController } from './registration.controller';
import { RegistrationService } from './registration.service';
import { BuyerService } from '../api/buyer/buyer.service';
import { InvokeLambdaService } from '../invokeLambda/invokeLambda.service';
import { SqsService } from '../sqs/sqs.service';
import { EligibilityService } from './eligibility.service';
import { ExhibitorService } from '../api/exhibitor/exhibitor.service';
import { FairRegistrationPregeneration } from '../../dao/FairRegistrationPregeneration';
import { Registration } from '../../entities/registration.entity';
import { ContentCacheModule } from '../api/content/content-cache.module';
import { ElasticacheClusterModule } from '../../core/elasticachecluster/elasticachecluster.providers';
import { ESModule } from '../esHelper/es.module';

@Module({
  imports: [TypeOrmModule.forFeature([
    C2mParticipantStatus,
    FairRegistrationFormLinkTask,
    FairRegistrationFormLinkTaskEntry,
    FairPeriod,
    FairFormTemplate,
    FairParticipant,
    FairParticipantType,
    FairRegistration,
    FairRegistrationFormSubmission,
    FairRegistrationImportTask,
    FairRegistrationImportTaskActivityLog,
    FairRegistrationImportTaskLog,
    FairRegistrationNob,
    FairRegistrationPregeneration,
    FairRegistrationPreferredSuppCountryRegion,
    FairRegistrationProductInterest,
    FairRegistrationProductStrategy,
    FairRegistrationStatus,
    FairRegistrationType,
    Registration,
    FairRegistrationTypesOfTargetSuppliers,
    FairRegistrationDynamicBm,
    RegistrationSerialNumberReservation,
    SourceType,
    VisitorType
  ]), FormValidationModule, UtilsModule, HttpModule, ElasticacheModule,ContentCacheModule, ElasticacheClusterModule, ESModule],
  controllers: [RegistrationController],
  providers: [RegistrationService, EligibilityService, ExhibitorService, ContentService, InvokeLambdaService, FairDbService, RegFormLinkDbService, FairService, C2MService, ElasticacheService, BuyerService, SqsService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
