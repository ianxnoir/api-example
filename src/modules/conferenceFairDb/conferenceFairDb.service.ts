import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, Repository } from 'typeorm';

import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
import { Logger } from '../../core/utils';
import { FairRegistration } from '../../dao/FairRegistration';
import { C2MParticipantStatusListItemDto } from '../registration/dto/updateCToMParticipantStatus.dto';
import * as AWSXRay from 'aws-xray-sdk';

@Injectable()
export class ConferenceFairDbService {

    constructor(
        private logger: Logger,
        @InjectRepository(FairRegistration) private FairRegistrationRepository: Repository<FairRegistration>,
    ) {
        this.logger.setContext(ConferenceFairDbService.name)
    }

    updateFairParticipantRegistrationRecordStatusListByIdsV2 = async (adminEmail: string, c2MParticipantStatusList: C2MParticipantStatusListItemDto[]): Promise<number> => {
        return getManager().transaction(async transactionalEntityManager => {
            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-updateFairParticipantRegistrationRecordStatusListByIdsV2', async (subsegment) => {
                try {
                    let affectedRowCount: number = 0
                    await Promise.all(
                        c2MParticipantStatusList.map(async (c2MParticipantStatusListItem) => {
                            if (c2MParticipantStatusListItem?.registrationRecordId && c2MParticipantStatusListItem?.status) {
                                let updateResult = await transactionalEntityManager
                                    .update(FairRegistration, c2MParticipantStatusListItem.registrationRecordId, { c2mParticipantStatusId: c2MParticipantStatusListItem.status.toString(), lastUpdatedBy: adminEmail, lastUpdatedTime: new Date() })
                                    .catch((error) => { throw new VepError(VepErrorMsg.Database_Error, error.message) })
                                affectedRowCount += updateResult.affected ?? 0
                            }
                        })
                    )
                    return affectedRowCount;
                } catch (error) {
                    this.logger.error(`Failed in update updateFairParticipantRegistrationRecordStatusListByIdsV2, err message: ${error.message}`)
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        })
    }

    queryFairRegByFairParticipantRegIdsV2 = async (participantRegIds: number[]): Promise<FairRegistration[] | undefined> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryFairRegByFairParticipantRegIdsV2', async (subsegment) => {
            try {
                const queryResult = await this.FairRegistrationRepository.findByIds(participantRegIds, {
                    relations: [
                        "fairParticipant",
                        "fairParticipantType",
                        "c2mParticipantStatus",
                        "fairRegistrationStatus",
                        "fairRegistrationType"
                    ]
                });
                return queryResult ?? []
            } catch (error) {
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    getParticipantRegistrationDetail = async (id: number) => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryFairRegByFairParticipantRegIds', async (subsegment) => {
            try {
                const result = await this.FairRegistrationRepository.findOne({
                    relations: [
                        "fairParticipant",
                        "fairRegistrationTicketPasses"
                    ],
                    where: { id: id }
                })
                return result
            } catch (error) {
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }
}