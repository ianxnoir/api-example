import { HttpModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticacheService } from '../../core/elasticache/elasticache.service';
import { UtilsModule } from '../../core/utils/utils';
import { CustomFormSubmission } from '../../dao/CustomFormSubmission';
import { CustomFormSubmissionFields } from '../../dao/CustomFormSubmissionFields';
import { ContentService } from '../api/content/content.service';
import { ExhibitorService } from '../api/exhibitor/exhibitor.service';
import { NotificationService } from '../api/notification/notification.service';
import { CaptchaModule } from '../captcha/captcha.module';
import { CustomFormDbService } from '../fairDb/customFormDb.service';
import { FormValidationModule } from '../formValidation/formValidation.module';
import { WordpressFormValidationService } from '../formValidation/wordpressFormValidation.service';
import { SqsService } from '../sqs/sqs.service';
import { CustomFormController } from './customForm.controller';
import { CustomFormService } from './customForm.service';
import { EnquiryFormController } from './enquiryForm.controller';
import { EnquiryFormService } from './enquiryForm.service';
import { FormController } from './form.controller';
import { FormService } from './form.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CustomFormSubmission,
            CustomFormSubmissionFields
        ]),
        FormValidationModule, UtilsModule, HttpModule, CaptchaModule],
    controllers: [FormController, CustomFormController, EnquiryFormController],
    providers: [FormService, CustomFormService, EnquiryFormService, WordpressFormValidationService, ContentService, ExhibitorService, NotificationService, CustomFormDbService, ElasticacheService, SqsService],
    exports: [],
})
export class FormModule { }
