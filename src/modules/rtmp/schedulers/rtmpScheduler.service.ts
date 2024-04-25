import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, getConnection, In } from 'typeorm';
import { Rtmp as RtmpEntity } from '../../../entities/rtmp.entity';
import { LambdaService } from '../../api/lambda/lambda.service';
import * as tencentcloud from "tencentcloud-sdk-nodejs";
import moment from 'moment';

@Injectable()
export class RtmpSchedulerService {
  private tencentCredentialArn: string;
  constructor(
    @InjectRepository(RtmpEntity) private rtmpRepository: Repository<RtmpEntity>,
    private configService: ConfigService,
    private lambdaService: LambdaService
  ) {
    this.tencentCredentialArn = this.configService.get<any>('tencentCredentialArn');
  }

  public updatePlaybackByExistingVODFile() {
    return this.rtmpRepository.createQueryBuilder("rtmpRepository")
    .where("rtmpProcessStatus = :rtmpProcessStatus", { rtmpProcessStatus: 1 })
    .andWhere("vodFileDetail is not null")
    .getMany()
    .then(result => {
      if (!result?.length) {
        return Promise.reject({
          status: 200,
          message: "No pending playback records to be updated"
        })
      }
      const pendingPromise: Promise<any>[] = result.flatMap(rtmp => {
        const vodFiles = JSON.parse(rtmp.vodFileDetail!);
        let endTime = vodFiles[0]?.endTime;
        let targetVOD: Record<string, any> = vodFiles[0];
        vodFiles.forEach((vod: any) => {
            if (moment(parseInt(endTime)).isBefore(moment(parseInt(vod.endTime)))) {
              endTime = vod.endTime;
              targetVOD = vod;
            }
        })

        if (targetVOD.vodVideoUrl) {
          return this.rtmpRepository.update({ id: rtmp.id }, { liveUrl: targetVOD.vodVideoUrl, rtmpProcessStatus: 2 })
          .then(result => {
            if (!result?.affected) {
              return {
                status: 401,
                data: rtmp,
                vodDetail: vodFiles || ""
              }
            }
            return {
              status: 200,
              data: rtmp,
              vodDetail: vodFiles || ""
            }
          })
          .catch(error => {
            return {
              status: 400,
              error: error?.message ?? JSON.stringify(error),
              vodDetail: vodFiles || ""
            }
          })
        } else {
          return Promise.resolve({
            status: 402,
            data: rtmp,
            vodDetail: vodFiles || ""
          })
        }
      })
      return Promise.all(pendingPromise);
    })
    .then(result => {
      return {
        status: 200,
        data: result
      }
    })
    .catch(error => {
      return {
        status: 400,
        message: error?.message ?? JSON.stringify(error)
      }
    })
  }

  public stopRtmpBySeminarEndTime() {
    return this.rtmpRepository.createQueryBuilder("rtmpRepository")
    .leftJoinAndSelect("rtmpRepository.seminar", "vepFairSeminar")
    .where("(rtmpRepository.expiredAt <= :now and rtmpRepository.rtmpProcessStatus = :rtmpProcessStatus)", { now: moment.tz('Asia/Hong_Kong').format("YYYY-MM-DD HH:mm:ss"), rtmpProcessStatus: 0 })
    .orWhere("(vepFairSeminar.endAt is not null and rtmpRepository.rtmpProcessStatus = :rtmpProcessStatus)", { rtmpProcessStatus: 0 })
    .getMany()
    .then(rtmpRecords => {
      if (!rtmpRecords?.length) {
        return Promise.reject({
          status: 200,
          message: "No pending RTMP records to be stopped"
        })
      }
      if (!this.tencentCredentialArn?.length) {
        return Promise.reject({
          status: 200,
          message: "Missing tencent credential arn"
        })
      }
      return Promise.all([
        Promise.resolve(rtmpRecords),
        this.lambdaService.getSecretValue(this.tencentCredentialArn),
      ])
    })
    .then(([rtmpRecords, tencentCredential]) => {
      if (!tencentCredential?.data?.data?.length) {
        return Promise.reject({
          status: 200,
          message: "Cant get Tencent credential from Secret Mananger"
        })
      }
      const credential = JSON.parse(tencentCredential?.data?.data);
      const rtmpPromise: Promise<any>[] = [];
      rtmpRecords.forEach(rtmp => {

        const fairCode = rtmp.link?.split("-")?.[3] ?? "";
        const streamName = rtmp.key?.split("?")?.[0] ?? "";
        const domainName = rtmp.liveUrl?.split("/")?.[2] ?? "";

        if (fairCode?.length && streamName?.length && domainName?.length) {
          const LiveClient = tencentcloud.live.v20180801.Client;
          const client = new LiveClient({
            credential: {
              secretId: credential[`${fairCode}_access_key`],
              secretKey: credential[`${fairCode}_secret_key`]
            },
            region: "",
            profile: {
              httpProfile: {
                endpoint: "live.tencentcloudapi.com",
              },
            },
          });
          rtmpPromise.push(
            client.DropLiveStream({
                "StreamName": streamName,
                "DomainName": domainName,
                "AppName": "live"
              })
              .then((data) => {
                  return Promise.resolve({
                    status: 200,
                    recordId: rtmp.id,
                    requestId: data.RequestId
                  });
                },
                (error) => {
                  return Promise.resolve({
                    status: 400,
                    recordId: rtmp.id,
                    error: error?.message ?? JSON.stringify(error)
                  });
                })
              .catch(error => {
                return Promise.resolve({
                  status: 400,
                  recordId: rtmp.id,
                  error: error?.message ?? JSON.stringify(error)
                });
              })
            );
        } else {
          rtmpPromise.push(Promise.resolve({
            status: 400,
            message: "Missing required info",
            detail: JSON.stringify(rtmp)
          }));
        }
      })
      return Promise.all(rtmpPromise)
    })
    .then(result => {
      const successRecordIds: string[] = [];
      const failRecordIds: string[] = [];
      result.forEach((record: any) => {
        if (record.status === 200) {
          successRecordIds.push(record.recordId)
        } else {
          failRecordIds.push(record.recordId)
        }
      })
      return Promise.all([
        getConnection()
        .createQueryBuilder()
        .update(RtmpEntity)
        .set({ rtmpProcessStatus: 1 })
        .where({ id: In(successRecordIds.concat(failRecordIds)) })
        .execute(),
        Promise.resolve({
          successRecordIds,
          failRecordIds
        }),
      ]);
    })
    .then(([updateResult, recordDetails]) => {
      return {
        status: 200,
        data: {
          updateResult,
          recordDetails
        }
      }
    })
    .catch(error => {
      return {
        status: error?.status ?? 400,
        message: error?.message ?? JSON.stringify(error)
      };
    })
  }
}
