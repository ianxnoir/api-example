import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import * as crypto from 'crypto-js';
import { Moment } from 'moment-timezone';
import { Repository, Not, In } from 'typeorm';
import { Rtmp as RtmpEntity } from '../../entities/rtmp.entity';
import { Seminar as SeminarEntity } from '../../entities/seminar.entity';
import { LambdaService } from '../api/lambda/lambda.service';

import { RtmpDetail } from '../seminar/seminar.type';
import { VideoService } from '../video/video.service';
import { VideoStatus } from '../video/video.type';

@Injectable()
export class RtmpService {
  private CSSSecretArn: string;
  constructor(
    @InjectRepository(SeminarEntity) private seminarRepository: Repository<SeminarEntity>,
    @InjectRepository(RtmpEntity) private rtmpRepository: Repository<RtmpEntity>,
    private configService: ConfigService,
    private videoService: VideoService,
    private lambdaService: LambdaService
  ) {
    this.CSSSecretArn = this.configService.get('css.secretArn') || '';
  }

  public async remove(ssouid: string, rtmps: RtmpEntity[]): Promise<RtmpEntity[]> {
    const deletingVideoIds = rtmps.map((rtmp: RtmpEntity) => rtmp.playbackVideoId).filter((id: any): id is number => id);
    void this.videoService.markStatus(ssouid, deletingVideoIds, VideoStatus.UNUSED);
    return this.rtmpRepository.remove(rtmps);
  }

  public async clear(ssouid: string, seminarId: number): Promise<RtmpEntity[]> {
    const deletingEntites = await this.rtmpRepository.find({ seminarId });
    return this.remove(ssouid, deletingEntites);
  }

  public async updateRtmpVODFileDetail(params: Record<string, any>): Promise<any> {
    const { key, fileId, endTime, vodVideoUrl } = params;
    return this.rtmpRepository.findOne({ key })
    .then(result => {
      if (!result) {
        return Promise.reject({
          status: 400,
          message: "Cant find the rtmp detail by rtmp steaming key"
        })
      }
      const oldVodObject = result?.vodFileDetail ?? '[]';
      const newVodObject = JSON.parse(oldVodObject);

      newVodObject.push({
        fileId,
        endTime,
        vodVideoUrl,
      })

      return this.rtmpRepository.update({ id: result.id }, { vodFileDetail: JSON.stringify(newVodObject) });
    })
    .then(result => {
      if (result.affected) {
        return {
          status: 200
        }
      }

      return Promise.reject({
        status: 400,
        message: "No record updated"
      })
    })
    .catch(error => {
      return {
        status: error?.status ?? 400,
        message: error?.message ?? JSON.stringify(error)
      }
    })
  }

  public async upsert(ssouid: string, seminarId: number, rtmpDetails: RtmpDetail[]): Promise<RtmpEntity[]> {
    // Check whether seminar exist
    await this.seminarRepository.findOneOrFail({ id: seminarId });
    // Remove unused rtmps
    const targetRtmpIds: number[] = rtmpDetails.map((rtmp: RtmpDetail) => rtmp.id).filter((n: any): n is number => typeof n === 'number');
    const deletingRtmps: RtmpEntity[] = await this.rtmpRepository.find({ seminarId, id: Not(In(targetRtmpIds)) });
    void this.remove(ssouid, deletingRtmps);

    const existingRtmps: RtmpEntity[] = await this.rtmpRepository.find({ seminarId, id: In(targetRtmpIds) });
    const idMappingDict: Record<number, RtmpEntity> = existingRtmps.reduce((prev: Record<number, RtmpEntity>, rtmp: RtmpEntity) => ({ ...prev, [rtmp.id]: rtmp }), {});

    const now: Date = new Date();

    // look for replaced video id
    const unusedVideoIds: number[] = rtmpDetails.map((rtmp: RtmpDetail) => rtmp.id).filter((id: any): id is number => id);

    // Update unused video status
    void this.videoService.markStatus(ssouid, unusedVideoIds, VideoStatus.UNUSED);

    // Upsert entity here
    const upsertRtmpEntities = rtmpDetails.map((rtmpDetail: RtmpDetail) => {
      let rtmp: Nullable<RtmpEntity> = null;

      if (rtmpDetail.id) {
        rtmp = idMappingDict[rtmpDetail.id];
      }

      if (!rtmp) {
        // if rtmp not exist
        rtmp = new RtmpEntity();
        rtmp.creationTime = now;

        if (rtmpDetail.id) {
          rtmp.id = rtmpDetail.id;
        }
      }

      // Update rtmp
      rtmp.seminarId = seminarId;
      rtmp.key = rtmpDetail.key;
      rtmp.defaultLanguage = rtmpDetail.defaultLanguage;
      rtmp.language = rtmpDetail.language;
      rtmp.link = rtmpDetail.link;
      rtmp.liveUrl = rtmpDetail.liveUrl || null;
      rtmp.playbackVideoId = rtmpDetail.playbackVideo?.id !== undefined ? rtmpDetail.playbackVideo?.id : rtmp.playbackVideoId;
      rtmp.lastUpdatedAt = now;
      rtmp.lastUpdatedBy = ssouid;
      rtmp.expiredAt = rtmpDetail.expiredAt;

      return rtmp;
    });

    const usingVideoIds = upsertRtmpEntities.map((rtmp: RtmpEntity) => rtmp.playbackVideoId).filter((id: any): id is number => id);
    // Update using video status
    void this.videoService.markStatus(ssouid, usingVideoIds, VideoStatus.USING);

    // Upsert Entities
    return this.rtmpRepository.save(upsertRtmpEntities);
  }

  public async generate(sbeSeminarId: string, expiredAt: Moment, language: string, fairCode: string): Promise<RtmpDetail> {
    const rtmpConfig = await this.getCSSConfig(fairCode);
    const streamName: string = crypto.MD5(sbeSeminarId + language.toUpperCase()).toString();
    const pushTuple: Record<string, string> = this.generatePushUrl(streamName, expiredAt, rtmpConfig.pushDomain, rtmpConfig.apiKey);
    const playBackTuple: Record<string, string> = this.generatePlaybackUrl(streamName, rtmpConfig.playbackDomain);

    return {
      language,
      defaultLanguage: false,
      key: pushTuple.key,
      link: pushTuple.rtmpUrl,
      liveUrl: playBackTuple.hlsUrl,
      expiredAt: expiredAt.toDate(),
    };
  }

  private generatePushUrl(streamName: string, time: Moment, pushDomain: string, key: string): Record<string, string> {
    const appName = this.configService.get<string>('api.TENCENT_APP_NAME');
    let hexTime = '';
    let extStr = '';

    if (key && time) {
      hexTime = time.unix().toString(16).toUpperCase();
      const txSecret = crypto.MD5(`${key}${streamName}${hexTime}`).toString();
      extStr = `?txSecret=${txSecret}&txTime=${hexTime}`;
    }

    return {
      time: `${time}`,
      hexTime,
      key: `${streamName}${extStr}`,
      rtmpUrl: `rtmp://${pushDomain}/${appName}/`,
      rtmpFullUrl: `rtmp://${pushDomain}/${appName}/${streamName}${extStr}`,
      webrtcUrl: `webrtc://${pushDomain}/${appName}/`,
      webrtcFulUrl: `webrtc://${pushDomain}/${appName}/${streamName}${extStr}`,
    };
  }

  private generatePlaybackUrl(streamName: string, playBackDomain: string): Record<string, string> {
    const appName = this.configService.get<string>('api.TENCENT_APP_NAME');
    return {
      rtmpUrl: `rtmp://${playBackDomain}/${appName}/${streamName}`,
      flvUrl: `https://${playBackDomain}/${appName}/${streamName}.flv`,
      hlsUrl: `https://${playBackDomain}/${appName}/${streamName}.m3u8`,
      webrtcUrl: `webrtc://${playBackDomain}/${appName}/${streamName}`,
    };
  }

  public getCSSConfig(fairCode: string): Promise<any> {
    if (!this.CSSSecretArn?.length) {
      return Promise.reject({
        status: 400,
        message: 'Missing CSSSecretArn'
      })
    }

    return this.lambdaService.getSecretValue(this.CSSSecretArn)
    .then(result => {
      if (result?.data?.status !== 200 || !result?.data?.data?.length) {
        return Promise.reject({
          status: 400,
          message: 'Something wrong requesting the api'
        })
      }

      const secretData = JSON.parse(result?.data?.data)

      if (!secretData[`${fairCode}_api_key`] || !secretData[`${fairCode}_push_domain`] || !secretData[`${fairCode}_playback_domain`]) {
        return Promise.reject({
          status: 400,
          message: 'Cant find the target css api key or push domain or playback domain by fair code'
        })
      }
      return {
        status: 200,
        apiKey: secretData[`${fairCode}_api_key`],
        pushDomain: secretData[`${fairCode}_push_domain`],
        playbackDomain: secretData[`${fairCode}_playback_domain`],
      }
    })
    .catch(error => {
      return {
        status: error?.status || 400,
        message: error?.message || JSON.parse(error)
      }
    })
  }
}
