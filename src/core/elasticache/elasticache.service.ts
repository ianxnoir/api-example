import { Injectable } from '@nestjs/common';
import { promisify } from 'util';
import { RedisService } from 'nestjs-redis';
import { VepError } from '../exception/exception';
import { VepErrorMsg } from '../../config/exception-constant';
import { Redis } from 'ioredis';

@Injectable()
export class ElasticacheService {
  private client: Redis;
  constructor(private readonly redisService: RedisService) {
    
  }

  setClient(name: string) {
    this.client = this.redisService.getClient(name);
  }

  async getCache(key : string){
    const getAsync = promisify(this.client.get).bind(this.client);
    const response = await getAsync(key);
    return response;
  }

  async setCache(key : string, value : number | string, expireSecond? : number) {
    if (expireSecond) {
      const setAsync = promisify(this.client.setex).bind(this.client);
      const response = await setAsync(key,expireSecond,value)
      return response
    } else {
      const setAsync = promisify(this.client.set).bind(this.client);
      const response = await setAsync(key,value)
      return response
    }
  }

  // get key from redis
  getElastiCacheKeyValue = async (key: string): Promise<string | null> => {
    try {
      return await this.client.get(key)
    } catch (ex) {
      throw new VepError(VepErrorMsg.Get_ElastiCache_Error, `Failed to get elastiCache, key: ${key}, ex: ${JSON.stringify(ex)}`);
    }
  };

  // set key/value to redis
  setElastiCacheKeyValue = async (key: string, value: string, expirationTimeInSecond?: number): Promise<boolean> => {
    let response: string | null = ""
    try {
      if (expirationTimeInSecond) {
        response = await this.client.setex(key, expirationTimeInSecond, value)
      } else {
        response = await this.client.set(key, value)
      }
      if (response != "OK") {
        throw new VepError(VepErrorMsg.Set_ElastiCache_Error, `Failed to set setElastiCacheKeyValue, key: ${key}, expirationTimeInSecond: ${expirationTimeInSecond}`);
      }
      return true
    } catch (ex) {
      if (ex.name === 'VepError') {
        throw new VepError(ex.vepErrorMsg, ex.errorDetail);
      }
      throw new VepError(VepErrorMsg.Set_ElastiCache_Error, `Failed to set elastiCache, ex: ${JSON.stringify(ex)}`);
    }
  };

  // delete key from redis (after get), if key is null represent that key is already removed
  deleteElastiCacheKeyValue = async (key: string): Promise<boolean> => {
    try {
      return (!!await this.client.getdel(key))
    } catch (ex) {
      throw new VepError(VepErrorMsg.Get_ElastiCache_Error, `Failed to del elastiCache, key: ${key}, ex: ${JSON.stringify(ex)}`);
    }
  };
  // without unmanageable throw
  getKeysByPattern = async (pattern: string): Promise<any> => {
    return this.client.keys(pattern);
  }

    // without unmanageable throw
  deleteCacheByKey = (key: string): Promise<any> => {
    return this.client.del(key);
  }
}
