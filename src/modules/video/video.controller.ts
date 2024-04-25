import { Body, Controller, Get, Post } from '@nestjs/common';
import { Auth } from '../../decorators/auth.decorator';
import { BatchFindVideoRequest } from '../../dto/batchFindVideoRequest.dto';

import { FindVideoRequest } from '../../dto/findVideoRequest.dto';
import { UpdateVideosRequest } from '../../dto/updateVideoRequest.dto';
import { UpsertVideoRequest } from '../../dto/upsertVideoRequest.dto';

import { Video as VideoEntity } from '../../entities/video.entity';
import { VideoService } from './video.service';

@Controller(['video','admin/v1/video'])
export class VideoController {
  constructor(private videoService: VideoService) {}

  @Get()
  public async findOne(@Body() findVideoRequest: FindVideoRequest): Promise<Record<string, VideoEntity>> {
    const query = {
      ...findVideoRequest,
    };
    return {
      data: await this.videoService.findOne(query),
    };
  }

  @Post('batchFind')
  public async batchFind(@Body() batchFindVideoRequest: BatchFindVideoRequest): Promise<Record<string, VideoEntity[]>> {
    return {
      data: await this.videoService.batchFind(batchFindVideoRequest.taskIds),
    };
  }

  @Post('batch')
  public async batchUpdate(@Auth('SSOUID') ssouid: string, @Body() updateVideosRequest: UpdateVideosRequest): Promise<Record<string, VideoEntity[]>> {
    return {
      data: await this.videoService.batchUpdate(ssouid, updateVideosRequest),
    };
  }

  @Post('updateVodFileUrl')
  public async updateVodFileUrl(@Body() body: any): Promise<any> {
    return this.videoService.updateVodFileUrl(body);
  }

  @Post()
  public async upsert(@Auth('SSOUID') ssouid: string, @Body() upsertVideoRequest: UpsertVideoRequest): Promise<Record<string, any>> {
    const query = {
      ...upsertVideoRequest,
    };
    return {
      status: 200,
      data: await this.videoService.upsert(ssouid, query),
    };
  }
}
