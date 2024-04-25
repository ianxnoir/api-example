import { CacheModule, HttpModule, Module } from '@nestjs/common';
import { CacheControlController } from './cacheControl.controller';
import { CacheControlService } from './cacheControl.service';

@Module({
  imports: [
    HttpModule,
    CacheModule.register()
  ],
  controllers: [CacheControlController],
  providers: [CacheControlService],
  exports: [CacheControlService],
})
export class CacheControlModule {}
