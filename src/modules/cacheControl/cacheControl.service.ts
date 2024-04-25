import { Injectable, Inject, CACHE_MANAGER } from '@nestjs/common';
import { Logger } from '../../core/utils';
import { Cache } from 'cache-manager';
import { VepError } from '../../core/exception/exception';
import { VepErrorMsg } from '../../config/exception-constant';

@Injectable()
export class CacheControlService {
    readonly CACHE_TTL: number = 1800;
    constructor(
        private logger: Logger,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
    ) {
        this.logger.setContext(CacheControlService.name);
    }

    public async getCacheByKey(key: string): Promise<unknown> {
        const cache = await this.cacheManager.get(key);
        if (cache == undefined) {
            throw new VepError(VepErrorMsg.General_Error, `Cache not found, key: ${key}`)
        }
        return cache
    }

    public async setCacheByKey(key: string, value: unknown): Promise<unknown> {
        return await this.cacheManager.set(key, value, { ttl: this.CACHE_TTL });
    }

    public async clearAllCache() {
        this.logger.log(`debug: reset cache`);
        await this.cacheManager.reset()
        return {
            isSuccess: true
        }
    }
}