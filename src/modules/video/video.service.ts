import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ElasticacheClusterService } from '../../core/elasticachecluster/elasticachecluster.service';

import { UpdateVideosRequest, UpdateVideoRequest } from '../../dto/updateVideoRequest.dto';

import { Video as VideoEntity } from '../../entities/video.entity';

import { VideoQuery, TranscodeStatus, VideoStatus } from './video.type';

@Injectable()
export class VideoService {
  constructor(
    @InjectRepository(VideoEntity) 
    private videoRepository: Repository<VideoEntity>,
    private elastiCacheClusterService: ElasticacheClusterService,
    ) {}

  public async findOne(query: VideoQuery): Promise<VideoEntity> {
    return this.videoRepository.findOneOrFail({ ...query });
  }

  public async findAll(query: VideoQuery): Promise<VideoEntity[]> {
    return this.videoRepository.find({ ...query });
  }

  public async batchFind(taskIds: string[]): Promise<VideoEntity[]> {
    return this.videoRepository.find({ taskId: In(taskIds) });
  }

  public async upsert(ssouid: string, query: VideoQuery): Promise<any> {
    if (!query.taskId) {
      throw new BadRequestException('Failed to retrieve fair setting');
    }

    let video = await this.videoRepository.findOne({ taskId: query.taskId });

    // create one if entity doesn't exist
    if (!video) {
      video = new VideoEntity();
      video.creationTime = new Date();
      video.transcodeStatus = TranscodeStatus.IN_PROGRESS;
      video.videoStatus = VideoStatus.UNUSED;
      video.taskId = query.taskId;
    }

    if (query.videoStatus) {
      video.videoStatus = query.videoStatus;
    }

    if (query.transcodeStatus) {
      video.transcodeStatus = query.transcodeStatus;
    }

    if (query.fileName) {
      video.fileName = query.fileName;
    }

    if (query.fileUrl) {
      video.fileUrl = query.fileUrl;
    }

    video.lastUpdatedBy = ssouid;
    video.lastUpdatedAt = new Date();

    return this.videoRepository.save(video);
  }

  public async markStatus(ssouid: string, ids: number[], videoStatus: VideoStatus): Promise<void> {
    await this.videoRepository.update({ id: In(ids) }, { videoStatus, lastUpdatedBy: ssouid, lastUpdatedAt: new Date() });
  }

  public async batchUpdate(ssouid: string, updateVideosRequest: UpdateVideosRequest): Promise<any> {
    const idMappingDict: Record<string, UpdateVideoRequest> = updateVideosRequest.videos.reduce(
      (prev: Record<string, UpdateVideoRequest>, updateVideoRequest: UpdateVideoRequest) => ({ ...prev, [updateVideoRequest.taskId]: updateVideoRequest }),
      {}
    );

    const taskIds = Object.keys(idMappingDict);
    const pendingVideos: VideoEntity[] = [];
    const failIds: string[] = [];
    return this.videoRepository.find({ taskId: In(taskIds) })
    .then(videoResult => {
      taskIds?.length && taskIds.forEach(taskId => {
        const video = videoResult.find(video => video.taskId === taskId);
        if (video) {
          pendingVideos.push(video);
        } else {
          failIds.push(taskId);
        }
      })

      if (pendingVideos?.length) {
        const videoEntities = pendingVideos.map((videoEntity: VideoEntity) => {
          videoEntity.lastUpdatedBy = ssouid;
          videoEntity.lastUpdatedAt = new Date();
          videoEntity.fileId = idMappingDict[videoEntity.taskId]?.fileId || videoEntity.fileId;
          videoEntity.fileName = idMappingDict[videoEntity.taskId]?.fileName || videoEntity.fileName;
          videoEntity.fileUrl = idMappingDict[videoEntity.taskId]?.fileUrl || videoEntity.fileUrl;
          videoEntity.transcodeStatus = idMappingDict[videoEntity.taskId]?.trancodeStatus || videoEntity.transcodeStatus;
    
          return videoEntity;
        });

        return this.videoRepository.save(videoEntities);
      }

      return Promise.reject({
        status: 400,
        message: 'No pending video to be updated'
      })
    })
    .then(result => {
      return {
        status: 200,
        failIds,
        successIds: result
      }
    })
    .catch(error => {
      return {
        status: 400,
        failIds,
        successIds: [],
        message: error?.message ?? JSON.stringify(error)
      }
    })

  }

  public clearAllCacheByPattern(keyPattern: string): Promise<any> {
    return this.elastiCacheClusterService
      .getKeysByPattern(keyPattern)
      .then((result: string[]) => {
        const deletePromise: Promise<any>[] = [];
        result?.length &&
          result.forEach((key) => {
            deletePromise.push(
              this.elastiCacheClusterService
                .deleteCacheByKey(key)
                .then(() => {
                  return `Successfully delete ${key} from redis`;
                })
                .catch((error) => {
                  return `Error deleteing ${key} from redis`;
                })
            );
          });
        return Promise.allSettled(deletePromise);
      })
      .then((result) => {
        return {
          status: 200,
          result,
        };
      })
      .catch((error) => {
        return {
          status: 400,
          message: error?.message ?? JSON.stringify(error),
        };
      });
  }

  public async updateVodFileUrl(fileInfo: any): Promise<any> {
    const idMappingDict: any = fileInfo?.length && fileInfo.reduce(
      (prev: any, currentFileInfo: any) => ({ ...prev, [currentFileInfo.fileId]: currentFileInfo }),
      {}
    );

    const fileIds = Object.keys(idMappingDict);
    const pendingVideos: VideoEntity[] = [];
    const failIds: string[] = [];
    return this.clearAllCacheByPattern(`seminar_data_${fileInfo.vmsProjectCode}_${fileInfo.vmsProjectYear}*`)
    .then(() => {
      return this.videoRepository.find({ fileId: In(fileIds) })
    })
    .then(videoResult => {
      fileIds.forEach(fileId => {
        const video = videoResult.find(video => video.fileId === fileId);
        if (video) {
          pendingVideos.push(video);
        } else {
          failIds.push(fileId);
        }
      })

      if (pendingVideos?.length) {
        const videoEntities = pendingVideos.map((videoEntity: VideoEntity) => {
          videoEntity.lastUpdatedAt = new Date();
          videoEntity.fileUrl = idMappingDict[videoEntity.fileId]?.fileUrl;
          videoEntity.transcodeStatus = idMappingDict[videoEntity.fileId]?.trancodeStatus;
          return videoEntity;
        });

        return this.videoRepository.save(videoEntities);
      }

      return Promise.reject({
        status: 400,
        message: 'No pending video to be updated'
      })
    })
    .then(result => {
      return {
        status: 200,
        failIds,
        successIds: result
      }
    })
    .catch(error => {
      return {
        status: 400,
        failIds,
        successIds: [],
        message: error?.message ?? JSON.stringify(error)
      }
    })

  }
}
