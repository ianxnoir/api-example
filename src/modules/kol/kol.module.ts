import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ElasticacheClusterService } from '../../core/elasticachecluster/elasticachecluster.service';
import { Kol as KolEntity } from '../../entities/kol.entity';
import { Seminar as SeminarEntity } from '../../entities/seminar.entity';
import { Video as VideoEntity } from '../../entities/video.entity';
import { VideoService } from '../video/video.service';
import { KolService } from './kol.service';

@Module({
  imports: [TypeOrmModule.forFeature([SeminarEntity, KolEntity, VideoEntity])],
  providers: [KolService, VideoService, ElasticacheClusterService],
})
export class KolModule {}
