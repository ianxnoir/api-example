import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RTMPSchedulerController } from './rtmpScheduler.controller';
import { Rtmp as RtmpEntity } from '../../../entities/rtmp.entity';
import { Seminar } from '../../../entities/seminar.entity';
import { Video } from '../../../entities/video.entity';
import { RtmpSchedulerService } from './rtmpScheduler.service';
import { LambdaModule } from '../../api/lambda/lambda.module';

@Module({
  imports: [TypeOrmModule.forFeature([RtmpEntity, Seminar, Video]), LambdaModule],
  controllers: [RTMPSchedulerController],
  providers: [RtmpSchedulerService],
  exports: [RtmpSchedulerService],
})
export class RtmpSchedulerModule {}
