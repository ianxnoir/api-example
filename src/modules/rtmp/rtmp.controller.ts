import { Body, Controller, Post } from '@nestjs/common';
import moment, { Moment } from 'moment-timezone';
import { RtmpPlaybackRequestDto } from '../../dto/rtmpPlaybackRequest.dto';
import { RtmpUpsertRequestDto } from '../../dto/rtmpUpsertRequest.dto';
import { RtmpDetail } from '../seminar/seminar.type';
import { RtmpService } from './rtmp.service';

@Controller(['rtmp','admin/v1/rtmp'])
export class RtmpController {
  constructor(private rtmpService: RtmpService) {}

  @Post()
  public async generateRtmpByArray(@Body() req: RtmpUpsertRequestDto): Promise<Record<string, any>> {
    const { sbeSeminarId, languages, endAt, fairCode } = req;

    // Set Deadline after 15 minutes of valid date
    const validBeforeAt: Moment = moment(endAt).tz('Asia/Hong_Kong').add({ hours: 2 });

    const data = languages.map(async (language: string): Promise<RtmpDetail> => await this.rtmpService.generate(sbeSeminarId, validBeforeAt, language, fairCode));
    const result = await Promise.all(data);
    const mappedData = result.map(data => data );

    return {
      status: 200,
      data: mappedData
    };
  }

  @Post('/updateRtmpVODFileDetail')
  public async updateRtmpPlaybackUrl(@Body() req: RtmpPlaybackRequestDto): Promise<any> {
    const { key, vodVideoUrl, endTime, fileId } = req;
    return this.rtmpService.updateRtmpVODFileDetail({ key, fileId, endTime, vodVideoUrl });
  }
}
