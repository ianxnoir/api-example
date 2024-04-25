import { Controller, UseInterceptors, Param, Body, Get, Put, Delete } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { Logger } from '../../core/utils';
import { CacheControlService } from './cacheControl.service';

@ApiTags('Cache Control API')
@Controller(['/cache-control/', '/admin/v1/fair/cache-control/'])
export class CacheControlController {
  constructor(private logger: Logger, private cacheControlService: CacheControlService) {
    this.logger.setContext(CacheControlController.name);
  }

  @Get('/:key')
  @UseInterceptors(ResponseInterceptor)
  public async getCacheByKey(@Param('key') key: string) {
    return await this.cacheControlService.getCacheByKey(key);
  }

  @Put('/:key')
  @UseInterceptors(ResponseInterceptor)
  public async setCacheByKey(@Param('key') key: string, @Body() body: { value: unknown }) {
    return await this.cacheControlService.setCacheByKey(key, body.value);
  }

  @Delete('/all')
  @UseInterceptors(ResponseInterceptor)
  public async clearAllCache() {
    return await this.cacheControlService.clearAllCache();
  }
}
