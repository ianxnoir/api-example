import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository, Not, In } from 'typeorm';
import { Kol as KolEntity } from '../../entities/kol.entity';
import { Seminar as SeminarEntity } from '../../entities/seminar.entity';

import { KolDetail } from '../seminar/seminar.type';

import { VideoService } from '../video/video.service';
import { VideoStatus } from '../video/video.type';

@Injectable()
export class KolService {
  constructor(
    @InjectRepository(SeminarEntity) private seminarRepository: Repository<SeminarEntity>,
    @InjectRepository(KolEntity) private kolRepository: Repository<KolEntity>,
    private videoService: VideoService
  ) {}

  public async remove(ssouid: string, kols: KolEntity[]): Promise<KolEntity[]> {
    const deletingVideoIds = kols.map((kol: KolEntity) => kol.playbackVideoId).filter((id: any): id is number => typeof id === 'number');
    void this.videoService.markStatus(ssouid, deletingVideoIds, VideoStatus.UNUSED);
    return this.kolRepository.remove(kols);
  }

  public async clear(ssouid: string, seminarId: number): Promise<KolEntity[]> {
    const deletingEntites = await this.kolRepository.find({ seminarId });
    return this.remove(ssouid, deletingEntites);
  }

  public async upsert(ssouid: string, seminarId: number, kolDetails: KolDetail[]): Promise<KolEntity[]> {
    // Check whether seminar exist
    await this.seminarRepository.findOneOrFail({ id: seminarId });

    // Remove unused vods
    const targetKolIds: number[] = kolDetails.map((kol: KolDetail) => kol.id).filter((n: any): n is number => typeof n === 'number');

    const deletingKols: KolEntity[] = await this.kolRepository.find({ seminarId, id: Not(In(targetKolIds)) });
    void this.remove(ssouid, deletingKols);

    // Upsert
    const existingVods: KolEntity[] = await this.kolRepository.find({ seminarId, id: In(targetKolIds) });
    const idMappingDict: Record<number, KolEntity> = existingVods.reduce((prev: Record<number, KolEntity>, kol: KolEntity) => ({ ...prev, [kol.id]: kol }), {});

    const now: Date = new Date();

    // look for replaced video id
    const unusedVideoIds: number[] = kolDetails.map((kol: KolDetail) => kol.id).filter((id: any): id is number => id);

    // Remove unused video ids
    void this.videoService.markStatus(ssouid, unusedVideoIds, VideoStatus.UNUSED);

    const upsertKolEntities = kolDetails.map((kolDetail: KolDetail) => {
      let kol: Nullable<KolEntity> = null;

      // if id exist
      if (kolDetail.id) {
        kol = idMappingDict[kolDetail.id];
      }

      // seperate video remove into another array map
      if (!kol) {
        // if vod not exist
        kol = new KolEntity();
        kol.creationTime = now;

        if (kolDetail.id) {
          kol.id = kolDetail.id;
        }
      }

      kol.seminarId = seminarId;
      kol.platformId = kolDetail.platformId !== undefined ? kolDetail.platformId : kol.platformId;
      kol.platformUrl = kolDetail.platformUrl !== undefined ? kolDetail.platformUrl : kol.platformUrl;
      kol.platformType = kolDetail.platformType;
      kol.playbackVideoId = kolDetail.playbackVideo?.id !== undefined ? kolDetail.playbackVideo?.id : kol.playbackVideoId;
      kol.lastUpdatedAt = now;
      kol.lastUpdatedBy = ssouid;

      return kol;
    });

    const usingVideoIds = upsertKolEntities.map((kol: KolEntity) => kol.playbackVideoId).filter((id: any): id is number => id);
    // Update using video status
    void this.videoService.markStatus(ssouid, usingVideoIds, VideoStatus.USING);

    // Upsert Entities
    return this.kolRepository.save(upsertKolEntities);
  }
}
