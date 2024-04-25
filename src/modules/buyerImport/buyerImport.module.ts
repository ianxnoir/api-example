import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FairRegistrationImportTask } from '../../dao/FairRegistrationImportTask';
import { BuyerImportController } from './buyerImport.controller';
import { BuyerImportService } from './buyerImport.service';
import { DatabaseModule } from '../../core/database/database.providers';
import { FairRegistration } from '../../dao/FairRegistration';
@Module({
  imports: [
    TypeOrmModule.forFeature([FairRegistrationImportTask, FairRegistration]),
    DatabaseModule
  ],
  controllers: [BuyerImportController],
  providers: [BuyerImportService],
  exports: [BuyerImportService],
})
export class BuyerImportModule {}
