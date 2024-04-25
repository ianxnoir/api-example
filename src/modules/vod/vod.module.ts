import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticacheClusterService } from '../../core/elasticachecluster/elasticachecluster.service';
import { Rtmp as RtmpEntity } from '../../entities/rtmp.entity';
import { Seminar as SeminarEntity } from '../../entities/seminar.entity';
import { Video as VideoEntity } from '../../entities/video.entity';
import { Vod as VodEntity } from '../../entities/vod.entity';
import { VideoService } from '../video/video.service';
import { VodService } from './vod.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeminarEntity, RtmpEntity, VodEntity, VideoEntity])],
  providers: [VodService, VideoService, ElasticacheClusterService],
})
export class VodModule {}
