import { Controller, Get } from '@nestjs/common';
import { RtmpSchedulerService } from './rtmpScheduler.service';

@Controller('rtmpScheduler')
export class RTMPSchedulerController {
  constructor(
    private rtmpSchedulerService: RtmpSchedulerService,
  ) {}

  @Get('/stopRtmpBySeminarEndTime')
  public stopRtmpBySeminarEndTime(): Promise<any> {
    return this.rtmpSchedulerService.stopRtmpBySeminarEndTime();
  }

  @Get('/updatePlaybackByExistingVODFile')
  public updatePlaybackByExistingVODFile(): Promise<any> {
    return this.rtmpSchedulerService.updatePlaybackByExistingVODFile();
  }
}
