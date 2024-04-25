import { Module } from '@nestjs/common';
import { ContentService } from '../api/content/content.service';
import { CaptchaModule } from '../captcha/captcha.module';
import { BusinessRuleFormValidationService } from './businessRuleFormValidation.service';
import { WordpressFormValidationService } from './wordpressFormValidation.service';
import { ContentCacheModule } from '../api/content/content-cache.module';
  
@Module({
  imports: [CaptchaModule,ContentCacheModule],
  controllers: [],
  providers: [BusinessRuleFormValidationService, WordpressFormValidationService, ContentService],
  exports: [BusinessRuleFormValidationService, WordpressFormValidationService],
})
export class FormValidationModule {}
