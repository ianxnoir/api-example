import { 
    HttpModule, 
    Module, 
    CacheModule
} from '@nestjs/common';
import { ContentCacheService } from './content-cache.service';

@Module({
  imports: [
    HttpModule,
    CacheModule.register()
  ],
  providers: [ContentCacheService],
  exports: [ContentCacheService],
})
export class ContentCacheModule {}
