import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, Not, In } from 'typeorm';
import { Seminar as SeminarEntity } from '../../entities/seminar.entity';
import { Vod as VodEntity } from '../../entities/vod.entity';
import { VodDetail } from '../seminar/seminar.type';
import { VideoService } from '../video/video.service';
import { VideoStatus } from '../video/video.type';

@Injectable()
export class VodService {
  constructor(
    @InjectRepository(VodEntity) private vodRepository: Repository<VodEntity>,
    @InjectRepository(SeminarEntity) private seminarRepository: Repository<SeminarEntity>,
    private videoService: VideoService
  ) {}

  public async remove(ssouid: string, vods: VodEntity[]): Promise<VodEntity[]> {
    const deletingLiveVideoIds = vods.flatMap((vod: VodEntity) => [vod.playbackVideoId, vod.liveVideoId]).filter((id: any): id is number => id);
    void this.videoService.markStatus(ssouid, deletingLiveVideoIds, VideoStatus.UNUSED);
    return this.vodRepository.remove(vods);
  }

  public async clear(ssouid: string, seminarId: number): Promise<VodEntity[]> {
    const deletingEntites = await this.vodRepository.find({ seminarId });
    return this.remove(ssouid, deletingEntites);
  }

  public async upsert(ssouid: string, seminarId: number, vodDetails: VodDetail[]): Promise<VodEntity[]> {
    // Check whether seminar exist
    await this.seminarRepository.findOneOrFail({ id: seminarId });

    // Remove unused vods
    const targetVodIds: number[] = vodDetails.map((vod: VodDetail) => vod.id).filter((n: any): n is number => typeof n === 'number');
    const deletingVods: VodEntity[] = await this.vodRepository.find({ seminarId, id: Not(In(targetVodIds)) });
    void this.remove(ssouid, deletingVods);

    const existingVods: VodEntity[] = await this.vodRepository.find({ seminarId, id: In(targetVodIds) });
    const idMappingDict: Record<number, VodEntity> = existingVods.reduce((prev: Record<number, VodEntity>, vod: VodEntity) => ({ ...prev, [vod.id]: vod }), {});

    const now: Date = new Date();

    // look for replaced video id
    const unusedVideoIds: number[] = vodDetails.flatMap((vodDetail: VodDetail) => {
      let result = [];
      if (vodDetail.id && idMappingDict[vodDetail.id]) {
        const vod = idMappingDict[vodDetail.id];
        // if vod exist, compare whether video is different
        if (vodDetail.liveVideo?.id && vod.liveVideoId !== vodDetail.liveVideo.id) {
          result.push(vod.liveVideoId);
        }

        if (vodDetail.playbackVideo?.id && vod.playbackVideoId !== vodDetail.playbackVideo.id) {
          result.push(vod.playbackVideoId);
        }
      }
      return result;
    }).filter((id: any): id is number => id);

    // Remove unused video ids
    void this.videoService.markStatus(ssouid, unusedVideoIds, VideoStatus.UNUSED);

    const upsertVodEntities = vodDetails.map((vodDetail: VodDetail) => {
      let vod: Nullable<VodEntity> = null;

      // if id exist
      if (vodDetail.id) {
        vod = idMappingDict[vodDetail.id];
      }

      // seperate video remove into another array map
      if (!vod) {
        // if vod not exist
        vod = new VodEntity();
        vod.creationTime = now;
      }

      vod.seminarId = seminarId;
      vod.defaultLanguage = vodDetail.defaultLanguage;
      vod.language = vodDetail.language;
      vod.liveVideoId = vodDetail.liveVideo?.id !== undefined ? vodDetail.liveVideo?.id : vod.liveVideoId;
      vod.playbackVideoId = vodDetail.playbackVideo?.id !== undefined ? vodDetail.playbackVideo?.id : vod.playbackVideoId;
      vod.lastUpdatedAt = now;
      vod.lastUpdatedBy = ssouid;

      return vod;
    });

    const usingVideoIds = upsertVodEntities.flatMap((vod: VodEntity) => [vod.playbackVideoId, vod.liveVideoId]).filter((id: any): id is number => id);
    // Update using video status
    void this.videoService.markStatus(ssouid, usingVideoIds, VideoStatus.USING);

    // Upsert Entities
    return this.vodRepository.save(upsertVodEntities);
  }
}
