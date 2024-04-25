import { ElasticacheService } from './elasticache.service';
import { Module } from '@nestjs/common';
import { RedisModule} from 'nestjs-redis'
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => configService.get<any>('redis'),         // or use async method
      inject:[ConfigService]
    }),
  ],
  providers: [ElasticacheService],
  exports: [ElasticacheService]
})
export class ElasticacheModule {}
