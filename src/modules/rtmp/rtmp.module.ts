import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticacheClusterService } from '../../core/elasticachecluster/elasticachecluster.service';
import { Rtmp as RtmpEntity } from '../../entities/rtmp.entity';
import { Seminar as SeminarEntity } from '../../entities/seminar.entity';
import { Video as VideoEntity } from '../../entities/video.entity';
import { LambdaModule } from '../api/lambda/lambda.module';
import { VideoService } from '../video/video.service';
import { RtmpController } from './rtmp.controller';
import { RtmpService } from './rtmp.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeminarEntity, RtmpEntity, VideoEntity]), LambdaModule],
  controllers: [RtmpController],
  providers: [RtmpService, VideoService, ConfigService, ElasticacheClusterService],
})
export class RtmpModule {}
