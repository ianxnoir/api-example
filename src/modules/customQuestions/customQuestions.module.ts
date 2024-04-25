import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomQuestionsController } from './customQuestions.controller';
import { CustomQuestionsService } from './customQuestions.service';
import { DatabaseModule } from '../../core/database/database.providers';
import { FairCustomQuestionImportTask } from '../../dao/FairCustomQuestionImportTask';
import { ConfigService } from '@nestjs/config';
import { S3Service } from '../../core/utils/s3.service';
import { CustomQuestionSqsService } from '../sqs/customQuestionSqs.service';
import { FairCustomQuestion } from '../../dao/FairCustomQuestion';
import { FairCustomQuestionFilter } from '../../dao/FairCustomQuestionFilter';

@Module({
    imports: [
        TypeOrmModule.forFeature([FairCustomQuestionImportTask, FairCustomQuestion, FairCustomQuestionFilter]),
        DatabaseModule
    ],
    controllers: [CustomQuestionsController],
    providers: [CustomQuestionsService, ConfigService, S3Service, CustomQuestionSqsService],
    exports: [CustomQuestionsService]
})
export class CustomQuestionsModule { }