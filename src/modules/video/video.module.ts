import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticacheClusterService } from '../../core/elasticachecluster/elasticachecluster.service';
import { Video as VideoEntity } from '../../entities/video.entity';
import { VideoController } from './video.controller';
import { VideoService } from './video.service';

@Module({
  imports: [TypeOrmModule.forFeature([VideoEntity])],
  controllers: [VideoController],
  providers: [VideoService, ElasticacheClusterService],
})
export class VideoModule {}
