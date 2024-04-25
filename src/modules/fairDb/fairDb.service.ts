import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { getManager, In, Repository, SelectQueryBuilder, UpdateResult } from 'typeorm';
import moment from 'moment-timezone';

import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
import { Logger } from '../../core/utils';
import { C2mParticipantStatus } from '../../dao/C2mParticipantStatus';
import { FairParticipantType } from '../../dao/FairParticipantType';
import { FairRegistration } from '../../dao/FairRegistration';
import { FairParticipant } from '../../dao/FairParticipant';
import { FairRegistrationProductInterest } from '../../dao/FairRegistrationProductInterest';
import { FairRegistrationProductStrategy } from '../../dao/FairRegistrationProductStrategy';
import { FairRegistrationStatus } from '../../dao/FairRegistrationStatus';
import { FairRegistrationType } from '../../dao/FairRegistrationType';
import { StructureTagDataDto } from '../api/content/dto/StructureTagData.dto';
import { UpdateFairParticipantRegistrationRecordDto } from '../profile/dto/UpdateFairParticipantRegistrationRecord.dto';
import { C2MParticipantStatusDto, C2MParticipantStatusListItemDto } from '../registration/dto/updateCToMParticipantStatus.dto';
import { QueryActiveFairParticipantRegistrationsQuery, RegNoPreGenObjectLiteral } from './dto/fairDb.service.dto';
import * as AWSXRay from 'aws-xray-sdk';
import { FairRegistrationRemarkReqDto } from '../registration/dto/updateFairRegistration.dto';
import { FairParticipantInflencingReqDto } from '../profile/dto/fairParticipantInflencingReq.dto';
import { ContentService } from '../api/content/content.service';
import { CouncilwiseDataType, GeneralDefinitionDataRequestDTOType } from '../api/content/content.enum';
import { SearchFairParticipantsInterface } from '../fair/dto/SearchFairParticipants.dto';
import { CouncilwiseDataDto } from '../api/content/dto/councilwiseDataResp.dto';
import { FairService } from '../fair/fair.service';
import { SearchC2mExcludedParticipantByFairListObj } from '../profile/dto/searchC2mExcludedParticipant.dto';
import { C2MService } from '../api/c2m/content.service';
import { C2MParticipantStatusInterface } from '../fair/dto/C2MParticipantStatus.dto';
import { VisitorType } from '../../dao/VisitorType';
import { NameHelper } from '../../helper/nameHelper';
import { C2MProductInterestUpdateDto, UpdateC2MProfileReqDto } from '../profile/dto/updateC2MProfileReq.dto';
import { FairRegistrationPreferredSuppCountryRegion } from '../../dao/FairRegistrationPreferredSuppCountryRegion';
import { Subsegment } from 'aws-xray-sdk';
import { FairRegistrationPregeneration } from '../../dao/FairRegistrationPregeneration';

@Injectable()
export class FairDbService {

    constructor(
        private logger: Logger,
        private ContentService: ContentService,
        private FairService: FairService,
        private C2MService: C2MService,
        @InjectRepository(FairRegistration) private FairRegistrationRepository: Repository<FairRegistration>,
        @InjectRepository(FairRegistrationStatus) private FairRegistrationStatusRepository: Repository<FairRegistrationStatus>,
        @InjectRepository(FairRegistrationPregeneration) private fairRegistrationPregenerationRepository: Repository<FairRegistrationPregeneration>,
        @InjectRepository(FairParticipant) private FairParticipantRepository: Repository<FairParticipant>
    ) {
        this.logger.setContext(FairDbService.name)
    }

    queryFairRegByFairCodeSsoUid = async (ssoUid: string, emailId: string, fairDetails: { fairCode: string, fiscalYear: string }[]): Promise<FairRegistration[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryFairRegByFairCodeSsoUid', async (subsegment) => {
            try {
                const queryObject = await this.FairRegistrationRepository
                    .createQueryBuilder("r")
                    .leftJoinAndSelect("r.fairParticipant", "fp")
                    .leftJoinAndSelect("r.fairParticipantType", "fpt")
                    .leftJoinAndSelect("r.c2mParticipantStatus", "c2mStatus")
                    .leftJoinAndSelect("r.fairRegistrationStatus", "regStatus")
                    .leftJoinAndSelect("r.fairRegistrationType", "regType")
                    .leftJoinAndSelect("r.fairRegistrationProductInterests", "productInterests")
                    .leftJoinAndSelect("r.fairRegistrationProductStrategies", "productStrategies")
                    .leftJoinAndSelect("r.fairRegistrationPreferredSuppCountryRegions", "preferredSuppCountryRegions")

                fairDetails.forEach((fairDetail, idx) => {
                    queryObject.orWhere(`(fp.ssoUid = :ssoUid${idx} AND r.fairCode = :fairCode${idx} AND r.fiscalYear = :fiscalYear${idx})`,
                        { [`ssoUid${idx}`]: ssoUid, [`fairCode${idx}`]: fairDetail.fairCode, [`fiscalYear${idx}`]: fairDetail.fiscalYear })
                    queryObject.orWhere(`(fp.emailId = :emailId${idx} AND r.fairCode = :fairCode${idx} AND r.fiscalYear = :fiscalYear${idx})`,
                        { [`emailId${idx}`]: emailId, [`fairCode${idx}`]: fairDetail.fairCode, [`fiscalYear${idx}`]: fairDetail.fiscalYear })
                });

                const queryResult = await queryObject.getMany()

                return queryResult ?? []
            } catch (error) {
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    queryShortFairRegByFairCodeSsoUid = async (ssoUid: string, emailId: string, fairDetails: { fairCode: string, fiscalYear: string }[]): Promise<FairRegistration[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryShortFairRegByFairCodeSsoUid', async (subsegment) => {
            try {
                const queryObject = await this.FairRegistrationRepository
                    .createQueryBuilder("r")
                    .leftJoinAndSelect("r.fairParticipant", "fp")
                    .leftJoinAndSelect("r.fairParticipantType", "fpt")
                    .leftJoinAndSelect("r.c2mParticipantStatus", "c2mStatus")
                    .leftJoinAndSelect("r.fairRegistrationStatus", "regStatus")
                    .leftJoinAndSelect("r.fairRegistrationType", "regType")

                fairDetails.forEach((fairDetail, idx) => {
                    queryObject.orWhere(`(fp.ssoUid = :ssoUid${idx} AND r.fairCode = :fairCode${idx} AND r.fiscalYear = :fiscalYear${idx})`,
                        { [`ssoUid${idx}`]: ssoUid, [`fairCode${idx}`]: fairDetail.fairCode, [`fiscalYear${idx}`]: fairDetail.fiscalYear })
                    queryObject.orWhere(`(fp.emailId = :emailId${idx} AND r.fairCode = :fairCode${idx} AND r.fiscalYear = :fiscalYear${idx})`,
                        { [`emailId${idx}`]: emailId, [`fairCode${idx}`]: fairDetail.fairCode, [`fiscalYear${idx}`]: fairDetail.fiscalYear })
                });

                const queryResult = await queryObject.getMany()

                return queryResult ?? []
            } catch (error) {
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    queryFairRegByFairCodeEmail = async (emailId: string, fairCode: string, fiscalYear: string): Promise<FairRegistration[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryFairRegByFairCodeEmail', async (subsegment) => {
            try {
                const queryObject = await this.FairRegistrationRepository
                    .createQueryBuilder("r")
                    .leftJoinAndSelect("r.fairParticipant", "fp")
                    .leftJoinAndSelect("r.fairParticipantType", "fpt")
                    .leftJoinAndSelect("r.c2mParticipantStatus", "c2mStatus")
                    .leftJoinAndSelect("r.fairRegistrationStatus", "regStatus")
                    .leftJoinAndSelect("r.fairRegistrationType", "regType")
                    .where(`(fp.emailId = :emailId AND r.fairCode = :fairCode AND r.fiscalYear = :fiscalYear)`,
                        { emailId: emailId, fairCode: fairCode, fiscalYear: fiscalYear })

                const queryResult = await queryObject.getMany()

                return queryResult ?? []
            } catch (error) {
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    queryFairRegByFairParticipantRegId = async (participanyRegId: number): Promise<FairRegistration | undefined> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryFairRegByFairParticipantRegId', async (subsegment) => {
            try {
                const queryResult = await this.FairRegistrationRepository.findOne({
                    relations: [
                        "fairParticipant",
                        "fairParticipantType",
                        "c2mParticipantStatus",
                        "fairRegistrationStatus",
                        "fairRegistrationType",
                        "fairRegistrationProductInterests",
                        "fairRegistrationProductStrategies"
                    ],
                    where: [
                        {
                            id: participanyRegId,
                        }
                    ]
                });
                return queryResult
            } catch (error) {
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    queryFairRegByFairParticipantRegIds = async (participanyRegIds: number[]): Promise<FairRegistration[] | undefined> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryFairRegByFairParticipantRegIds', async (subsegment) => {
            try {
                const queryResult = await this.FairRegistrationRepository.findByIds(participanyRegIds, {
                    relations: [
                        "fairParticipant",
                        "fairParticipantType",
                        "c2mParticipantStatus",
                        "fairRegistrationStatus",
                        "fairRegistrationType",
                        "fairRegistrationProductInterests",
                        "fairRegistrationProductStrategies"
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

    private convertToProductInterestDao(fairReg: FairRegistration, productInterestList: StructureTagDataDto[]): FairRegistrationProductInterest[] {
        return productInterestList.map(
            (productStrategyObj) => {
                let productInterestRecord = new FairRegistrationProductInterest()
                productInterestRecord.fairRegistrationId = fairReg.id
                productInterestRecord.stId = productStrategyObj.stId
                productInterestRecord.iaId = productStrategyObj.iaId
                productInterestRecord.teCode = productStrategyObj.teCode
                productInterestRecord.createdBy = "VEP INIT"
                productInterestRecord.lastUpdatedBy = "VEP INIT"
                return productInterestRecord
            }
        )
    }

    private convertToC2MProductInterestDao(fairReg: FairRegistration, productInterestList: C2MProductInterestUpdateDto[]): FairRegistrationProductInterest[] {
        return productInterestList.map(
            (productStrategyObj) => {
                let productInterestRecord = new FairRegistrationProductInterest()
                productInterestRecord.fairRegistrationId = fairReg.id
                productInterestRecord.stId = productStrategyObj.stId
                productInterestRecord.iaId = productStrategyObj.iaId
                productInterestRecord.teCode = productStrategyObj.teCode
                productInterestRecord.createdBy = "VEP INIT"
                productInterestRecord.lastUpdatedBy = "VEP INIT"
                return productInterestRecord
            }
        )
    }

    private convertToProductStrategyDao(fairReg: FairRegistration, productStrategyList: string[]): FairRegistrationProductStrategy[] {
        return productStrategyList.map(
            (productStrategy) => {
                let productStrategyRecord = new FairRegistrationProductStrategy()
                productStrategyRecord.fairRegistrationId = fairReg.id
                productStrategyRecord.fairRegistrationProductStrategyCode = productStrategy
                productStrategyRecord.createdBy = "VEP INIT"
                productStrategyRecord.lastUpdatedBy = "VEP INIT"
                return productStrategyRecord
            }
        )
    }

    private convertToPreferredSuppCountryRegion(fairReg: FairRegistration, targetPreferredMarkets: string[]): FairRegistrationPreferredSuppCountryRegion[] {
        return targetPreferredMarkets.map(
            (targetPreferredMarket) => {
                let productStrategyRecord = new FairRegistrationPreferredSuppCountryRegion()
                productStrategyRecord.fairRegistrationId = fairReg.id
                productStrategyRecord.fairRegistrationPreferredSuppCountryRegionCode = targetPreferredMarket
                productStrategyRecord.createdBy = "VEP INIT"
                productStrategyRecord.lastUpdatedBy = "VEP INIT"
                return productStrategyRecord
            }
        )
    }

    private removeEmpty = (obj: any) => {
        let newObj: any = {};
        Object.keys(obj).forEach((key) => {
            if (obj[key] === Object(obj[key])) newObj[key] = this.removeEmpty(obj[key]);
            else if (obj[key] !== undefined) newObj[key] = obj[key];
        });
        return newObj;
    };

    updateC2MProfile = async (fairReg: FairRegistration, updateReq: UpdateC2MProfileReqDto): Promise<FairRegistration> => {
        return getManager().transaction(async transactionalEntityManager => {
            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-updateC2MProfile', async (subsegment) => {
                try {
                    if (updateReq.productInterest) {
                        if (fairReg.fairRegistrationProductInterests) {
                            await transactionalEntityManager.delete(FairRegistrationProductInterest, { fairRegistrationId: fairReg.id })
                                .catch((error) => { throw new VepError(VepErrorMsg.Database_Error, error.message) });
                        }

                        if (updateReq.productInterest.length > 0) {
                            fairReg.fairRegistrationProductInterests = await transactionalEntityManager.save(this.convertToC2MProductInterestDao(fairReg, updateReq.productInterest))
                        }
                    }

                    if (updateReq.productStrategy) {
                        if (fairReg.fairRegistrationProductStrategies) {
                            await transactionalEntityManager.delete(FairRegistrationProductStrategy, { fairRegistrationId: fairReg.id })
                                .catch((error) => { throw new VepError(VepErrorMsg.Database_Error, error.message) });
                        }

                        if (updateReq.productStrategy.length > 0) {
                            fairReg.fairRegistrationProductStrategies = await transactionalEntityManager.save(this.convertToProductStrategyDao(fairReg, updateReq.productStrategy))
                        }
                    }

                    if (updateReq.targetPreferredMarkets) {
                        if (fairReg.fairRegistrationPreferredSuppCountryRegions) {
                            await transactionalEntityManager.delete(FairRegistrationPreferredSuppCountryRegion, { fairRegistrationId: fairReg.id })
                                .catch((error) => { throw new VepError(VepErrorMsg.Database_Error, error.message) });
                        }

                        if (updateReq.targetPreferredMarkets.length > 0) {
                            fairReg.fairRegistrationPreferredSuppCountryRegions = await transactionalEntityManager.save(this.convertToPreferredSuppCountryRegion(fairReg, updateReq.targetPreferredMarkets))
                        }
                    }
                    const saveResult = await transactionalEntityManager.save(fairReg)
                    return saveResult
                } catch (error) {
                    this.logger.error(`Failed in update updateFairParticipantRegistrationRecord, err message: ${error.message}`)
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        });
    }

    updateFairParticipantRegistrationRecord = async (fairReg: FairRegistration, query: UpdateFairParticipantRegistrationRecordDto, productInterestList: StructureTagDataDto[]): Promise<FairRegistration> => {
        return getManager().transaction(async transactionalEntityManager => {

            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-updateFairParticipantRegistrationRecord', async (subsegment) => {

                try {
                    if (productInterestList) {
                        if (fairReg.fairRegistrationProductInterests) {
                            await transactionalEntityManager.delete(FairRegistrationProductInterest, { fairRegistrationId: fairReg.id })
                                .catch((error) => { throw new VepError(VepErrorMsg.Database_Error, error.message) });
                        }

                        fairReg.fairRegistrationProductInterests = await transactionalEntityManager.save(this.convertToProductInterestDao(fairReg, productInterestList))
                    }

                    if (query.productStrategy) {
                        if (fairReg.fairRegistrationProductStrategies) {
                            await transactionalEntityManager.delete(FairRegistrationProductStrategy, { fairRegistrationId: fairReg.id })
                                .catch((error) => { throw new VepError(VepErrorMsg.Database_Error, error.message) });
                        }

                        fairReg.fairRegistrationProductStrategies = await transactionalEntityManager.save(this.convertToProductStrategyDao(fairReg, query.productStrategy))
                    }

                    if (query.registrationType && fairReg.fairRegistrationType.fairRegistrationTypeCode != query.registrationType) {
                        const regType = await transactionalEntityManager.findOne(FairRegistrationType, { fairRegistrationTypeCode: query.registrationType })
                        if (!regType) {
                            throw new VepError(VepErrorMsg.Database_Error, `Failed to retrieve FairRegistrationType, registrationType: ${query.registrationType}`)
                        }
                        fairReg.fairRegistrationType = regType
                    }


                    if (query.registrationStatus && fairReg.fairRegistrationStatus.fairRegistrationStatusCode != query.registrationStatus) {
                        const regStatus = await transactionalEntityManager.findOne(FairRegistrationStatus, { fairRegistrationStatusCode: query.registrationStatus })
                        if (!regStatus) {
                            throw new VepError(VepErrorMsg.Database_Error, `Failed to retrieve FairRegistrationType, registrationStatus: ${query.registrationStatus}`)
                        }
                        fairReg.fairRegistrationStatus = regStatus
                    }

                    if (query.participantType && fairReg.fairParticipantType.fairParticipantTypeCode != query.participantType) {
                        const participantType = await transactionalEntityManager.findOne(FairParticipantType, { fairParticipantTypeCode: query.participantType })
                        if (!participantType) {
                            throw new VepError(VepErrorMsg.Database_Error, `Failed to retrieve FairParticipantType, participantType: ${query.participantType}`)
                        }
                        fairReg.fairParticipantType = participantType
                    }

                    if (query.click2MatchStatus && fairReg.c2mParticipantStatus.c2mParticipantStatusCode != query.click2MatchStatus) {
                        const c2mStatusType = await transactionalEntityManager.findOne(C2mParticipantStatus, { c2mParticipantStatusCode: query.click2MatchStatus })
                        if (!c2mStatusType) {
                            throw new VepError(VepErrorMsg.Database_Error, `Failed to retrieve C2mParticipantStatus, click2MatchStatus: ${query.click2MatchStatus}`)
                        }
                        fairReg.c2mParticipantStatus = c2mStatusType
                    }

                    const jsonObj = this.removeEmpty(JSON.parse(fairReg.formDataJson ?? "{}"))

                    fairReg.formDataJson = JSON.stringify({
                        ...jsonObj,
                        otherProductCategories: query.otherProductCategories,
                        targetPreferredMarkets: query.targetPreferredMarkets,
                        numberOfOutlets: query.numberOfOutlets,
                        hotel: query.hotel,
                        roomType: query.roomType,
                        sourcingBudget: query.sourcingBudget,
                        interestedIn: query.interestedIn,
                        pricePoint: query.pricePoint,
                        lowMOQ: query.lowMOQ,
                        companyLogo: query.companyLogo,
                        profilePicture: query.profilePicture,
                    })

                    const saveResult = await transactionalEntityManager.save(fairReg)
                    return saveResult
                } catch (error) {
                    this.logger.error(`Failed in update updateFairParticipantRegistrationRecord, err message: ${error.message}`)
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        });
    }

    updateFairParticipantRegistrationRecordStatusById = async (participantRegId: number, c2MParticipantStatusDto: C2MParticipantStatusDto): Promise<number | undefined> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-updateFairParticipantRegistrationRecordStatusById', async (subsegment) => {
            try {
                if (c2MParticipantStatusDto?.status && participantRegId) {
                    const updateResult = await this.FairRegistrationRepository.update(participantRegId, { c2mParticipantStatusId: c2MParticipantStatusDto.status.toString() })
                    return updateResult.affected;
                }
                this.logger.error('Failed in update updateFairParticipantRegistrationRecordStatusById. Cannot find the Fair Registration record by Id')
                throw new VepError(VepErrorMsg.Database_Error, "Cannot find the Fair Registration record by Id")
            } catch (error) {
                this.logger.error(`Failed in update updateFairParticipantRegistrationRecordStatusById, err message: ${error.message}`)
                throw error instanceof VepError ? error : new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }

    updateFairParticipantRegistrationRecordStatusListByIds = async (c2MParticipantStatusList: C2MParticipantStatusListItemDto[]): Promise<number> => {
        return getManager().transaction(async transactionalEntityManager => {
            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-updateFairParticipantRegistrationRecordStatusListByIds', async (subsegment) => {
                try {
                    let affectedRowCount: number = 0
                    await Promise.all(
                        c2MParticipantStatusList.map(async (c2MParticipantStatusListItem) => {
                            if (c2MParticipantStatusListItem?.registrationRecordId && c2MParticipantStatusListItem?.status) {
                                let updateResult = await transactionalEntityManager
                                    .update(FairRegistration, c2MParticipantStatusListItem.registrationRecordId, { c2mParticipantStatusId: c2MParticipantStatusListItem.status.toString() })
                                    .catch((error) => { throw new VepError(VepErrorMsg.Database_Error, error.message) })
                                affectedRowCount += updateResult.affected ?? 0
                            }
                        })
                    )
                    return affectedRowCount;
                } catch (error) {
                    this.logger.error(`Failed in update updateFairParticipantRegistrationRecordStatusListByIds, err message: ${error.message}`)
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        })
    }

    updateFairRegRemarkById = async (registrationRecordId: number, fairRegistrationRemarkReqDto: FairRegistrationRemarkReqDto): Promise<UpdateResult> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-updateFairRegRemarkById', async (subsegment) => {
            try {
                if (registrationRecordId) {
                    // make sure we only update the 3 remark fields: cbmRemark, vpRemark and generalBuyerRemark in FairRegistration table
                    let updateDto: FairRegistrationRemarkReqDto = new FairRegistrationRemarkReqDto(
                        fairRegistrationRemarkReqDto.cbmRemark,
                        fairRegistrationRemarkReqDto.vpRemark,
                        fairRegistrationRemarkReqDto.generalBuyerRemark
                    )
                    return await this.FairRegistrationRepository.update(registrationRecordId, updateDto)
                }
                this.logger.error('Failed in update updateFairRegById. Cannot find the Fair Registration record by Id')
                throw new VepError(VepErrorMsg.Database_Error, "Failed in update updateFairRegById. Cannot find the Fair Registration record by Id'")
            } catch (error) {
                this.logger.error(`Failed in update updateFairRegById, err message: ${error.message}`)
                throw error instanceof VepError ? error : new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }

    queryFairParticipantRegistrations = async (ssoUid: string): Promise<FairRegistration[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryFairParticipantRegistrations', async (subsegment) => {
            try {
                const queryResult = await this.FairRegistrationRepository.find({
                    relations: [
                        "fairParticipant",
                        "fairParticipantType",
                        "c2mParticipantStatus",
                        "fairRegistrationType",
                        "fairRegistrationStatus",
                        "formTemplate",
                        "fairRegistrationTypesOfTargetSuppliers",
                        "fairRegistrationProductInterests"
                    ],
                    where: [
                        {
                            fairParticipant: { ssoUid: ssoUid }
                        }
                    ]
                });
                return queryResult;
            } catch (error) {
                // throw new VepError(VepErrorMsg.Database_Error, error.message)
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    queryActiveFairRegistrationsBySsoUid = async (ssoUid: string, query: FairParticipantInflencingReqDto, fairCodeList: string[]): Promise<FairRegistration[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryActiveFairRegistrationsBySsoUid', async (subsegment) => {
            try {
                const queryResult = await this.FairRegistrationRepository.find({
                    relations: [
                        "fairParticipant",
                        "fairParticipantType",
                        "c2mParticipantStatus",
                        "fairRegistrationType",
                        "fairRegistrationStatus",
                        "formTemplate",
                        "fairRegistrationTypesOfTargetSuppliers",
                        "fairRegistrationProductInterests",
                        "fairRegistrationNobs",
                        "fairRegistrationProductStrategies",
                        "fairRegistrationPreferredSuppCountryRegions"
                    ],
                    where: {
                        fairParticipant: {
                            ssoUid: ssoUid
                        },
                        fairCode: In(fairCodeList),
                        fiscalYear: query.fiscalYear
                    }
                });
                return queryResult ?? [];
            } catch (error) {
                // throw new VepError(VepErrorMsg.Database_Error, error.message)
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    queryActiveFairParticipantRegistrations = async (query: QueryActiveFairParticipantRegistrationsQuery[]): Promise<FairRegistration[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryActiveFairParticipantRegistrations', async (subsegment) => {
            let whereClauses = query.map((q: QueryActiveFairParticipantRegistrationsQuery) => {
                return {
                    fairParticipant: {
                        ssoUid: q.ssoUid
                    },
                    fairCode: q.fairCode,
                    fiscalYear: q.fiscalYear
                }
            })
            try {
                return await Promise.all(
                    [
                        this.FairRegistrationRepository.find({
                            relations: [
                                "fairParticipant",
                                "fairParticipantType",
                                "c2mParticipantStatus",
                                "fairRegistrationType",
                                "fairRegistrationStatus",
                                "formTemplate",
                                "fairRegistrationTypesOfTargetSuppliers",
                                "fairRegistrationNobs",
                                "fairRegistrationProductStrategies",
                                "fairRegistrationPreferredSuppCountryRegions"
                            ],
                            where: whereClauses
                        }),
                        this.FairRegistrationRepository.find({
                            relations: [
                                "fairParticipant",
                                "fairRegistrationProductInterests"
                            ],
                            where: whereClauses
                        }),
                        this.FairRegistrationRepository.find({
                            relations: [
                                "fairParticipant",
                                "fairRegistrationDynamicBms"
                            ],
                            where: whereClauses
                        })
                    ]
                ).then((promiseResults) => {
                    const queryResult = promiseResults[0]
                    const productInterestQueryResult = promiseResults[1]
                    const dynamicBmsQueryResult = promiseResults[2]

                    for (let queryResultItem of queryResult) {
                        queryResultItem.fairRegistrationProductInterests = productInterestQueryResult.find(x => x.id == queryResultItem.id)?.fairRegistrationProductInterests ?? []
                        queryResultItem.fairRegistrationDynamicBms = dynamicBmsQueryResult.find(x => x.id == queryResultItem.id)?.fairRegistrationDynamicBms ?? []
                    }

                    return queryResult ?? [];
                })
            } catch (error) {
                // throw new VepError(VepErrorMsg.Database_Error, error.message)
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    queryShortActiveFairParticipantRegistrations = async (query: QueryActiveFairParticipantRegistrationsQuery[]): Promise<FairRegistration[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryShortActiveFairParticipantRegistrations', async (subsegment) => {
            let whereClauses = query.map((q: QueryActiveFairParticipantRegistrationsQuery) => {
                return {
                    fairParticipant: {
                        ssoUid: q.ssoUid
                    },
                    fairCode: q.fairCode,
                    fiscalYear: q.fiscalYear
                }
            })
            try {
                const queryResult = await this.FairRegistrationRepository.find({
                    relations: [
                        "fairParticipant",
                    ],
                    where: whereClauses
                })
                return queryResult ?? []
            } catch (error) {
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    queryFairRegStatusByRegStatusIds = async (statusIds: number[]): Promise<FairRegistrationStatus[] | undefined> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryFairRegStatusByRegStatusIds', async (subsegment) => {
            try {
                const queryResult = await this.FairRegistrationStatusRepository.findByIds(statusIds);
                return queryResult ?? []
            } catch (error) {
                this.logger.debug(error);
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    updateRegistrationStatusByRegId = async (regIdStatusList: { registrationRecordId: string, status: string, c2m: string }[]): Promise<any> => {
        this.logger.log("updateRegistrationStatusByRegId: start");
        var beforeUpdate = await this.queryFairRegByFairParticipantRegIds(regIdStatusList.map(reg => <number><any>reg.registrationRecordId));
        await getManager().transaction(async transactionalEntityManager => {
            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-updateRegistrationStatusByRegId', async (subsegment) => {
                try {
                    let statusUpdateObj: {
                        [key: string]: {
                            status: string,
                            c2m: string,
                            regIds: Array<string>
                        }
                    } = {};
                    regIdStatusList.forEach(regIdStatus => {
                        let { registrationRecordId, status, c2m } = regIdStatus;
                        let _key = `${status},${c2m}`;
                        statusUpdateObj[_key] = statusUpdateObj[_key] ? statusUpdateObj[_key] : { status, c2m, regIds: [] };
                        statusUpdateObj[_key].regIds.push(registrationRecordId);
                    })

                    this.logger.log("updateRegistrationStatusByRegId: start");
                    this.logger.log(`updateRegistrationStatusByRegId: ${JSON.stringify(statusUpdateObj)}`);
                    await Promise.all(Object.keys(statusUpdateObj).map(async (key): Promise<any> => {
                        let { status, c2m, regIds } = statusUpdateObj[key];
                        if (regIds.length > 0) {
                            return transactionalEntityManager.createQueryBuilder().update(FairRegistration).set({ fairRegistrationStatusId: status, c2mParticipantStatusId: c2m }).where({ id: In(regIds) }).execute();
                        }
                        return true;
                    })).catch(err => {
                        throw err;
                    });


                } catch (error) {
                    this.logger.log(error);
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        })
        var afterUpdate = await this.queryFairRegByFairParticipantRegIds(regIdStatusList.map(reg => <number><any>reg.registrationRecordId));
        return {
            isSuccess: true,
            "user-activity": beforeUpdate?.map(before => {
                let after = afterUpdate?.find(after => after.id == before.id);
                return {
                    registrationNo: after ? `${after.serialNumber}${after.projectYear?.substring(after.projectYear.length - 2)}${after.sourceTypeCode}${after.visitorTypeCode}${after.projectNumber}` : null,
                    beforeUpdate: before,
                    afterUpdate: after
                }
            })
        };
    }

    queryC2mExcludedParticipants = async (searchByFairListObj: SearchC2mExcludedParticipantByFairListObj): Promise<FairRegistration[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryC2mExcludedParticipants', async (subsegment) => {
            try {
                const queryResult = await this.FairRegistrationRepository.find({
                    relations: [
                        "fairParticipant"
                    ],
                    where: {
                        fairCode: In(searchByFairListObj.fairCodeList),
                        fiscalYear: searchByFairListObj.fiscalYear,
                        c2mParticipantStatusId: In([3, 4])
                    }
                });
                return queryResult ?? [];
            }
            catch (error) {
                this.logger.log(error);
                throw new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }

    constructCombinedFairQuery = (filterParticipatingFair: string[], fairDatas: Record<string, any>[]): string => {
        if (fairDatas.length > 0) {
            let anySingleFairFromCombinedFair = fairDatas.flatMap(fairRecord => fairRecord.relatedFair.map((relatedFair: any) => {
                return {
                    fairCode: relatedFair.fair_code,
                    fiscalYear: relatedFair.fiscal_year
                }
            }))

            if (filterParticipatingFair && filterParticipatingFair?.length) {
                anySingleFairFromCombinedFair = anySingleFairFromCombinedFair.filter(x => filterParticipatingFair.includes(x.fairCode))
            }

            let combinedFairQuery = '';
            anySingleFairFromCombinedFair.forEach((combinedFair, index) => {
                if (index === 0) {
                    combinedFairQuery = `(fairRegistration.fairCode = '${combinedFair.fairCode}' AND fairRegistration.fiscalYear = '${combinedFair.fiscalYear}')`;
                } else {
                    combinedFairQuery += ` OR (fairRegistration.fairCode = '${combinedFair.fairCode}' AND fairRegistration.fiscalYear = '${combinedFair.fiscalYear}')`;
                }

            })
            if (anySingleFairFromCombinedFair.length) {
                return `(${combinedFairQuery})`
            } else {
                // if no fair exists, then no user should be selected
                return `1 = 0`
            }
        }

        return ""
    }

    contructSearchFairParticipantsProductCategoryList = async (fairDatas: Record<string, any>[]): Promise<string[]> => {
        const combinedFairQuery = this.constructCombinedFairQuery([], fairDatas)

        const result = await this.FairRegistrationRepository
            .createQueryBuilder("fairRegistration")
            .leftJoin("fairRegistration.fairRegistrationProductInterests", "fairRegistrationProductInterests")
            .andWhere(`(${combinedFairQuery})`)
            .groupBy("fairRegistrationProductInterests.stId")
            .select("fairRegistrationProductInterests.stId", "stId").getRawMany()

        return result.map(x => x["stId"]) ?? []
    }

    contructSearchFairParticipantsQB = (
        // { mySsoUid, keyword, lang,  fairCodes, filterCountry, filterNob, filterProductCategory, alphabet}: SearchFairParticipantsInterface,
        { keyword, from, size, filterParticipatingFair, filterCountry, filterNob, filterProductCategory, alphabet, ssoUidList }: SearchFairParticipantsInterface,
        // combinedFair: Record<string, any>[],
        hiddenTargetList: string[],
        fairDatas: Record<string, any>[],
        teCodeList: string[]
    ): SelectQueryBuilder<FairRegistration> => {
        let result = this.FairRegistrationRepository
            .createQueryBuilder("fairRegistration")
            .leftJoin("fairRegistration.fairParticipant", "fairParticipant")

        const teCodeCondition = (teCodeList && teCodeList.length ? 'OR fairRegistrationProductInterests.teCode IN (:...teCodeList)' : '')

        if (filterNob && filterNob.length) {
            result = result.leftJoin("fairRegistration.fairRegistrationNobs", "fairRegistrationNobs")
        }

        if ((filterProductCategory && filterProductCategory.length) || teCodeCondition.length > 0) {
            result = result.leftJoin("fairRegistration.fairRegistrationProductInterests", "fairRegistrationProductInterests")
        }

        if (keyword && keyword.length) {
            // TO-DO: can't support sourcing preference on table query level
            if (!keyword.includes("SOURCING:")) {
                result.andWhere(`(fairRegistration.companyName Like :keyword OR fairRegistration.displayName Like :keyword ${teCodeCondition})`, { keyword: `%${keyword}%`, teCodeList });
            }
        }
            
        if (hiddenTargetList.length > 0) {
            hiddenTargetList.length && result.andWhere('fairParticipant.ssoUid NOT IN (:...hiddenTargetList)', { hiddenTargetList });
        }

        if (alphabet && alphabet.length) {
            result.andWhere('fairRegistration.displayName Like :alphabet', { alphabet: `${alphabet}%` });
        }

        const combinedFairQuery = this.constructCombinedFairQuery(filterParticipatingFair, fairDatas)
        if (combinedFairQuery) {
            result.andWhere(`(${combinedFairQuery})`);
        }
    
        if (filterCountry && filterCountry.length) {
            result.andWhere('fairRegistration.addressCountryCode IN (:...filterCountry)', { filterCountry });
        }

        if (filterNob && filterNob.length) {
            result.andWhere('fairRegistrationNobs.fairRegistrationNobCode IN (:...filterNob)', { filterNob });
        }

        if (filterProductCategory && filterProductCategory.length) {
            result.andWhere('fairRegistrationProductInterests.stId IN (:...filterProductCategory)', { filterProductCategory });
        }
        result.andWhere('fairParticipant.ssoUid IS NOT NULL');
        result.andWhere('fairRegistration.fairRegistrationStatusId = 1');
        result.andWhere('fairRegistration.c2mParticipantStatusId = 1');

        // if ssoUidList is set, skip paging logic
        if (ssoUidList && ssoUidList.length) {
            result.andWhere('fairParticipant.ssoUid IN (:...ssoUidList)', { ssoUidList });
        } else {
            result
                .take(size)
                .skip(from)
        }

        return result
    }

    getHiddenRecordList = async (
        ssoUidList: string[],
        combinedFair: Record<string, any>[],
        mySsoUid: string | undefined,
    ) => {
        // hide record only if it is come from prospect for you
        // i.e. ssoUID shall be given
        if (ssoUidList && ssoUidList.length) {
            const hiddenRecords = await combinedFair.flatMap((fair: any) => (fair.relatedFair as Record<string, any>[]).flatMap(async relatedFair => {
                return await this.C2MService.getC2MHiddenRecord({ mySsoUid, fairCode: relatedFair.fair_code, fairYear: relatedFair.fiscal_year, hiddenType: 0 })
            }))

            return await Promise.all([...hiddenRecords]).then(promiseResult => {
                return promiseResult.flatMap(res => res.data.data).map(hiddenRecord => hiddenRecord.hiddenTarget);
            })
        }
        return []
    }

    async searchFairParticipantsFilterOptionDbQuery(qb: SelectQueryBuilder<FairRegistration>, selection: string, selectionAliasName: string, searchQuery: SearchFairParticipantsInterface, subsegment: Subsegment | undefined): Promise<string[]> {
        const filterOptionSubsegment = subsegment?.addNewSubsegment(`DbSubsegment-vep-fair-FairDbService-searchFairParticipantsFilterOptionDbQuery-${selectionAliasName}`)
        switch (selectionAliasName){
            case "fairRegistrationNobCode": 
                if (searchQuery.filterNob?.length == 0){
                    qb = qb.leftJoin("fairRegistration.fairRegistrationNobs", "fairRegistrationNobs")
                }
                break
            case "stId":
                if (searchQuery.filterProductCategory?.length == 0){
                    qb = qb.leftJoin("fairRegistration.fairRegistrationProductInterests", "fairRegistrationProductInterests")
                }
                break
            case "fairCode": 
            case "addressCountryCode": 
                break
        }
        const queryResult = await qb.groupBy(selection).select(selection, selectionAliasName).getRawMany()
        filterOptionSubsegment?.close()
        return queryResult.map(x => x[selectionAliasName])
    }

    async searchFairParticipantsDbQuery(searchQuery: SearchFairParticipantsInterface, hiddenRecordList: string[], fairDatas: Record<string, any>[], teCodeList: string[], subsegment: Subsegment | undefined)
        : Promise<{
            count: number,
            userList: FairRegistration[],
            fairCodeList: string[],
            countryCodeList: string[],
            nobList: string[],
            productInterestList: string[],
        }> {
        let userList: FairRegistration[] = []
        let fairCodeList: string[] = []
        let countryCodeList: string[] = []
        let nobList: string[] = []
        let productInterestList: string[] = []

        const qb = this.contructSearchFairParticipantsQB(searchQuery, hiddenRecordList, fairDatas, teCodeList)
        const result = qb.select(["fairRegistration", "fairParticipant"])

        const getCountSubsegment = subsegment?.addNewSubsegment("DbSubsegment-vep-fair-FairDbService-searchFairParticipantsDbQuery-getCount")
        const count = await result.getCount();
        getCountSubsegment ? getCountSubsegment.close() : null

        if (count > 0) {
            const getManySubsegment = subsegment?.addNewSubsegment("DbSubsegment-vep-fair-FairDbService-searchFairParticipantsDbQuery-getMany")
            userList = await result.getMany()
            getManySubsegment ? getManySubsegment.close() : null

            await Promise.all([
                this.searchFairParticipantsFilterOptionDbQuery(qb, "fairRegistration.fairCode", "fairCode", searchQuery, subsegment),
                this.searchFairParticipantsFilterOptionDbQuery(qb, "fairRegistration.addressCountryCode", "addressCountryCode", searchQuery, subsegment),
                this.searchFairParticipantsFilterOptionDbQuery(qb, "fairRegistrationNobs.fairRegistrationNobCode", "fairRegistrationNobCode", searchQuery, subsegment),
                this.searchFairParticipantsFilterOptionDbQuery(qb, "fairRegistrationProductInterests.stId", "stId", searchQuery, subsegment)
            ]).then((promiseResult) => {
                fairCodeList = promiseResult[0]
                countryCodeList = promiseResult[1]
                nobList = promiseResult[2]
                productInterestList = promiseResult[3]
            })
        }

        return {
            count,
            userList,
            fairCodeList,
            countryCodeList,
            nobList,
            productInterestList,
        }
    }

    searchFairParticipants = async (searchQuery: SearchFairParticipantsInterface): Promise<any> => {
        this.logger.log("searchFairParticipants: start");
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-searchFairParticipants', async (subsegment) => {
            try {
                const { lang, from, size, fairCodes, ssoUidList } = searchQuery
                let mappedFairCodeList: Record<string, any>[] = [];
                let fairDatas: Record<string, any>[] = [];
                let allFairCodeList: string[] = []
                let allFiscalYearList: string[] = []

                const hiddenRecordList: string[] = [];

                if (fairCodes && fairCodes.length) {
                    fairDatas = await this.FairService.getMultipleFairDatas(fairCodes);
                    allFairCodeList = fairDatas.flatMap(fairRecord => fairRecord.relatedFair.map(
                        (relatedFair: any) => {
                            return relatedFair.fair_code
                        }
                    ))
                    allFiscalYearList = fairDatas.flatMap(fairRecord => fairRecord.relatedFair.map(
                        (relatedFair: any) => {
                            return relatedFair.fiscal_year
                        }
                    ))
                }

                const structureTagDataListByTeCode: StructureTagDataDto[] = await this.ContentService.getStructureTagByKeyword(
                    searchQuery.keyword,
                    allFairCodeList.join(','),
                    allFiscalYearList.join(',')
                );
                const teCodeList: string[] = structureTagDataListByTeCode.map(data => data.teCode)

                const dbQueryResults = await this.searchFairParticipantsDbQuery(searchQuery, hiddenRecordList, fairDatas, teCodeList, subsegment)
                let { userList } = dbQueryResults
                const { count, fairCodeList, countryCodeList, nobList, productInterestList } = dbQueryResults

                // if ssoUidList is set, use the ordering from ssouid
                if (ssoUidList && ssoUidList.length) {
                    // * order
                    // for each ssouid, find in userList and add to orderedList
                    let deduplicateSet = new Set()
                    let orderedList: FairRegistration[] = []
                    ssoUidList.forEach(ssouid => {
                        //Should return
                        if (!deduplicateSet.has(ssouid)) {
                            orderedList = orderedList.concat(userList.filter(x => x.fairParticipant.ssoUid == ssouid) ?? [])
                            deduplicateSet.add(ssouid)
                        }
                    })

                    // * paging 
                    // apply paging on total result
                    // applied paging on userList
                    // splice from size
                    userList = orderedList.slice(from, from + size)
                }

                // -------------------- Get product interest value --------------------
                let mappedProductInterestList: Promise<void | Record<string, number | string>[]> = Promise.resolve();
                if (productInterestList && productInterestList.length) {
                    mappedProductInterestList = this.ContentService.retrieveStructureTagDataByFairCode(fairCodeList ?? [])
                        .then(result => {
                            const aggProductInterestResult = Object.keys(result).reduce(
                                (aggResult: any, productInterestByFair: any) => {
                                    return {
                                        ...aggResult,
                                        ...result[productInterestByFair],
                                    }
                                }, {})

                            return productInterestList.reduce((aggResult: Record<string, number | string>[], stId: string) => {
                                if (aggProductInterestResult[stId]) {
                                    aggResult.push(
                                        {
                                            status: 200,
                                            id: aggProductInterestResult[stId].stId,
                                            label: aggProductInterestResult[stId][`st${lang[0].toUpperCase()}${lang[1].toLowerCase()}`] ?? ""
                                        }
                                    )
                                }
                                return aggResult
                            }, [])
                        })
                        .catch(error => {
                            this.logger.error(`Failed in searchFairParticipants -> get product interest value, err message: ${error.message}`);
                            return [];
                        })
                }

                // ------------------------------- End -------------------------------

                // -------------------------- Get NoB value --------------------------
                let mappedNobList: Promise<void | Record<string, number | string>[]> = Promise.resolve();
                if (nobList && nobList.length) {
                    mappedNobList = this.ContentService.retrieveCouncilwiseDataBy<CouncilwiseDataDto>(GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.nob, [Array.from(nobList)].join(","))
                        .then(result => {
                            return Object.entries(result).map(([key, value]) => {
                                return {
                                    status: 200,
                                    id: value.code,
                                    label: value[`${lang.toLowerCase()}`] ?? ""
                                }
                            })
                        })
                        .catch(error => {
                            this.logger.error(`Failed in searchFairParticipants -> get NoB value, err message: ${error.message}`);
                            return [];
                        })
                }

                // ------------------------------- End -------------------------------

                // ------------------------ Get country value ------------------------
                let mappedCountryList: Promise<void | Record<string, any>[]> = Promise.resolve();
                if (countryCodeList && countryCodeList.length) {
                    mappedCountryList = this.ContentService.retrieveCouncilwiseDataBy<CouncilwiseDataDto>(GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.country, [Array.from(countryCodeList)].join(","))
                        .then(result => {
                            return Object.entries(result).map(([key, value]) => {
                                return {
                                    status: 200,
                                    id: value.code,
                                    label: value[`${lang.toLowerCase()}`] ?? ""
                                }
                            })
                        })
                        .catch(error => {
                            this.logger.error(`Failed in searchFairParticipants -> get country value, err message: ${error.message}`);
                            return [];
                        })
                }
                // ------------------------------- End -------------------------------

                // ----------------------- Get fair code list -----------------------
                fairDatas = (await this.FairService.getMultipleFairDatas(fairCodeList));
                mappedFairCodeList = fairDatas.flatMap(fair => (fair.relatedFair as Record<string, any>[])
                    .flatMap(relatedFair => {
                        return {
                            status: 200,
                            id: relatedFair.fair_code,
                            label: relatedFair.fair_short_name[lang]
                        }
                    }))
                if (fairCodeList && fairCodeList.length) {
                    mappedFairCodeList = mappedFairCodeList.filter(x => fairCodeList.includes(x.id))
                }
                // ------------------------------- End -------------------------------

                return Promise.all([Promise.resolve(userList), mappedProductInterestList, mappedNobList, mappedCountryList, Promise.resolve(mappedFairCodeList)])
                    .then(result => {
                        // remap the country value for every user 
                        const mappedUserListWithCountry: Array<Record<string, string>> = [];
                        const filteredHiddenRecords: Array<number> = [];
                        result[0] && result[0].forEach((user: any) => {
                            const targetCountry = result[3] && result[3].filter((country: any) => country.id === user.addressCountryCode);
                            if (targetCountry && targetCountry.length) {
                                user.country = targetCountry[0].label
                            }
                            mappedUserListWithCountry.push({
                                fairParticipantId: user.fairParticipantId ?? "",
                                firstName: user.firstName ?? "",
                                lastName: user.lastName ?? "",
                                initial: NameHelper.GenerateInitial(user.firstName, user.lastName),
                                displayName: user.displayName ?? "",
                                position: user.position ?? "",
                                companyName: user.companyName ?? "",
                                country: user.country ?? "",
                                countryCode: user.addressCountryCode ?? "",
                                ssoUid: user.fairParticipant.ssoUid ?? "",
                                emailId: user.fairParticipant.emailId ?? "",
                                fairCode: user.fairCode ?? "",
                                fiscalYear: user.fiscalYear ?? ""
                            })
                        })

                        return {
                            userList: mappedUserListWithCountry ?? [],
                            productInterestList: result[1] ?? [],
                            nobList: result[2] ?? [],
                            countryList: result[3] ?? [],
                            fairCodeList: result[4] ?? [],
                            totalSize: count - filteredHiddenRecords.length
                        }
                    })
            } catch (error) {
                this.logger.log(error);
                throw new VepError(VepErrorMsg.Database_Error, error.message);
            } finally {
                subsegment?.close();
            }
        })
    }

    linkFairParticipantSsoUidByEmailId = async (ssoUid: string, emailId: string): Promise<number | undefined> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-linkFairParticipantSsoUidByEmailId', async (subsegment) => {
            try {

                let rowAffected = 0;

                const queryResult = await this.queryFairParticipantByEmailId(emailId);

                if (queryResult && queryResult.ssoUid == null) {
                    const updateResult = await this.FairParticipantRepository.update(
                        {
                            emailId: emailId,
                        },
                        {
                            ssoUid: ssoUid
                        })
                    
                    rowAffected = updateResult.affected ? updateResult.affected : 0;
                }

                return rowAffected;
            } catch (error) {
                this.logger.error(`Failed in update linkFairParticipantSsoUidByEmailId, err message: ${error.message}`)
                throw error instanceof VepError ? error : new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }

    retrieveVisitorTypeByVisitorTypeCode(visitorTypeCode: string) {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-retrieveVisitorTypeByVisitorTypeCode', async (subsegment) => {
            try {
                return getManager().getRepository(VisitorType).find({ where: { visitorTypeCode: visitorTypeCode } })
            } catch (error) {
                this.logger.error(`Failed in update linkFairParticipantSsoUidByEmailId, err message: ${error.message}`)
                throw error instanceof VepError ? error : new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }

    retrieveVisitorTypeCodeList() {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-retrieveVisitorTypeCodeList', async (subsegment) => {
            try {
                return getManager()
                    .getRepository(VisitorType)
                    .createQueryBuilder("r")
                    .select(['r.visitorTypeCode as visitorTypeCode'])
                    .getRawMany()
            } catch (error) {
                this.logger.error(`Failed in retrieveVisitorTypeCodeList, err message: ${error.message}`)
                throw error instanceof VepError ? error : new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }

    updateC2MParticipantStatusForBuyer = async ({ ssoUid, c2mParticipantStatus, fairCode, fiscalYear }: C2MParticipantStatusInterface): Promise<any> => {
        this.logger.log("updateC2MParticipantStatusForBuyer: start");
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-updateC2MParticipantStatusForBuyer', async (subsegment) => {
            try {
                const buyerRecord = await this.FairParticipantRepository
                    .createQueryBuilder("fairParticipant")
                    .where("ssoUid = :ssoUid", { ssoUid })
                    .getOneOrFail();
                const beforeUpdate = await this.FairRegistrationRepository.find({
                    where: {
                        fairParticipant: buyerRecord.id,
                        fairCode,
                        fiscalYear
                    },
                    relations: ["c2mParticipantStatus"]
                });
                const updateResult = await this.FairRegistrationRepository
                    .createQueryBuilder("fairRegistration")
                    .update({
                        c2mParticipantStatusId: c2mParticipantStatus
                    })
                    .where("fairParticipantId = :fairParticipantId", { fairParticipantId: buyerRecord.id })
                    .andWhere("fairCode = :fairCode", { fairCode })
                    .andWhere("fiscalYear = :fiscalYear", { fiscalYear })
                    .execute();
                const afterUpdate = await this.FairRegistrationRepository.find({
                    where: {
                        fairParticipant: buyerRecord.id,
                        fairCode,
                        fiscalYear
                    },
                    relations: ["c2mParticipantStatus"]
                });
                return {
                    status: 200,
                    affectedRecords: updateResult.affected,
                    "user-activity": beforeUpdate?.map(before => {
                        let after = afterUpdate?.find(after => after.id == before.id);
                        return {
                            registrationNo: after ? `${after.serialNumber}${after.projectYear?.substring(after.projectYear.length - 2)}${after.sourceTypeCode}${after.visitorTypeCode}${after.projectNumber}` : null,
                            beforeUpdate: before,
                            afterUpdate: after
                        }
                    })
                }
            } catch (error) {
                this.logger.error(`Failed in update updateC2MParticipantStatusForBuyer, err message: ${error.message}`)
                throw error instanceof VepError ? error : new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }

    invalidateFairRegistration = async (regIdStatusList: { registrationRecordId: string, status: string }[]): Promise<boolean> => {
        return getManager().transaction(async transactionalEntityManager => {
            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-invalidateFairRegistration', async (subsegment) => {
                try {
                    let isSuccess = false
                    await Promise.all(regIdStatusList.map(
                        async (regIdStatus): Promise<any> => {
                            let { registrationRecordId, status } = regIdStatus;

                            return transactionalEntityManager.createQueryBuilder().update(FairRegistration).set(
                                {
                                    fairRegistrationStatusId: status
                                }
                            ).where({ id: registrationRecordId }).execute();
                        })).then((results) => {
                            isSuccess = true;
                        })
                        .catch(err => {
                            throw err;
                        });
                    return isSuccess
                } catch (error) {
                    this.logger.log(error);
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        })
    }

    // Check Registration Record by ssoUid (or emailId), fiscalYear, fairCode
    checkRegistrationExistence = async (fairCode: string, fiscalYear: string, emailId: string, isLoggedIn: boolean, ssoUid: string): Promise<FairRegistration[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-checkRegistrationExistence', async (subsegment) => {
            try {
                return await this.FairRegistrationRepository.find({
                    relations: ['fairParticipant', 'fairRegistrationStatus', 'fairParticipantType'],
                    where: [
                        {
                            fairParticipant: isLoggedIn ? { ssoUid } : { emailId },
                            fiscalYear,
                            fairCode,
                        },
                    ],
                }).catch((error) => {
                    throw new VepError(VepErrorMsg.Database_Error, error.message);
                });
            } catch (error) {
                if (error.name === 'VepError') {
                    throw new VepError(error.vepErrorMsg, error.errorDetail);
                }
                throw new VepError(VepErrorMsg.Check_Registration_Record_Error, error.message);
            } finally {
                subsegment?.close()
            }
        })
    };

    getSSOAutoHandlingField = async (ssoUid: string, fairCode: string, fiscalYear: string): Promise<FairRegistration | null> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-getSSOAutoHandlingField', async (subsegment) => {
            const whereClauses = {
                fairParticipant: {
                    ssoUid
                },
                fairCode,
                fiscalYear
            }

            try {
                return await Promise.all(
                    [
                        this.FairRegistrationRepository.find({
                            relations: [
                                "fairParticipant",
                                "fairRegistrationProductStrategies",
                                "fairRegistrationPreferredSuppCountryRegions"
                            ],
                            where: whereClauses
                        }),
                        this.FairRegistrationRepository.find({
                            relations: [
                                "fairParticipant",
                                "fairRegistrationNobs"
                            ],
                            where: whereClauses
                        })
                    ]
                ).then((promiseResults) => {
                    const queryResult = promiseResults[0]

                    if (queryResult.length == 0) {
                        return null
                    }
                    const fairReg = queryResult[0]
                    const nobQueryResult = promiseResults[1]
                    fairReg.fairRegistrationNobs = nobQueryResult.find(x => x.id == fairReg.id)?.fairRegistrationNobs ?? []
                    return fairReg;
                })
            } catch (error) {
                throw new VepError(VepErrorMsg.Database_Error, error?.message ?? JSON.stringify(error))
            } finally {
                subsegment?.close()
            }
        })
    }

    generateRegistrationNo = async (fairRegistrationPregeneration: FairRegistrationPregeneration): Promise<RegNoPreGenObjectLiteral> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-generateRegistrationNo', async (subsegment) => {
            try {
                const insertResult = await this.fairRegistrationPregenerationRepository.insert(fairRegistrationPregeneration)
                return insertResult.identifiers[0] as RegNoPreGenObjectLiteral
            } catch (error) {
                this.logger.error(`Failed in update generateRegistrationNo, err message: ${error.message}`)
                throw new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }

    getFairParticipantsProfileWithCombinedFair = async ({ ssoUid, fairCode, language, timezone }: Record<string, any>): Promise<any> => {
        this.logger.log("getFairParticipantsProfileWithCombinedFair: start");
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-getFairParticipantsProfileWithCombinedFair', async (subsegment) => {
            return this.FairService.getFairData(fairCode)
                .then(fairRecord => {
                    if (fairRecord.status === 400) {
                        throw ('Cant find the fair record');
                    }
                    let combinedFairQuery = '';
                    fairRecord.relatedFair.forEach((fairRecord: Record<string, any>, index: number) => {
                        if (index === 0) {
                            combinedFairQuery = `(fairRegistration.fairCode = '${fairRecord.fair_code}' AND fairRegistration.fiscalYear = '${fairRecord.fiscal_year}')`;
                        } else {
                            combinedFairQuery += ` OR (fairRegistration.fairCode = '${fairRecord.fair_code}' AND fairRegistration.fiscalYear = '${fairRecord.fiscal_year}')`;
                        }
                    })
                    return Promise.all([
                        // get users participanted fair records
                        this.FairRegistrationRepository
                            .createQueryBuilder("fairRegistration")
                            .leftJoinAndSelect("fairRegistration.fairParticipant", "fairParticipant")
                            .leftJoinAndSelect("fairRegistration.fairRegistrationNobs", "fairRegistrationNobs")
                            .leftJoinAndSelect("fairRegistration.fairRegistrationProductInterests", "fairRegistrationProductInterests")
                            .leftJoinAndSelect("fairRegistration.c2mParticipantStatus", "c2mParticipantStatus")
                            .leftJoinAndSelect("fairRegistration.fairRegistrationProductStrategies", "fairRegistrationProductStrategies")
                            .leftJoinAndSelect("fairRegistration.fairRegistrationPreferredSuppCountryRegions", "fairRegistrationPreferredSuppCountryRegions")
                            .where("fairParticipant.ssoUid = :ssoUid", { ssoUid })
                            .andWhere(`(${combinedFairQuery})`)
                            .getMany()
                        ,
                        // all combined fair records
                        Promise.resolve(fairRecord.relatedFair)
                    ])
                })
                .then(([fairParticipantRecord, combinedFairRecord]) => {
                    let profile: Record<string, any> = {};
                    let userFairRecords: Record<string, any>[] = [];
                    fairParticipantRecord && fairParticipantRecord.forEach((userRecord: any) => {
                        // return the user info based on selected fair
                        if (userRecord.fairCode === fairCode) {
                            profile = {
                                profileCard: {
                                    position: userRecord.position,
                                    companyName: userRecord.companyName,
                                    firstName: userRecord.firstName,
                                    lastName: userRecord.lastName,
                                    title: userRecord.title,
                                    // TO-DO - Jack
                                    avatar: ""
                                },
                                profileDetail: {
                                    companyName: userRecord.companyName,
                                    country: userRecord.addressCountryCode,
                                    email: userRecord.fairParticipant.emailId,
                                    phoneNumber: `${userRecord.companyPhoneCountryCode} - ${userRecord.companyPhonePhoneNumber}`,
                                    companyWebsite: userRecord.companyWebsite,
                                    companyBackground: userRecord.companyBackground,
                                    natureOfBussiness: userRecord.fairRegistrationNobs
                                }
                            }
                        }

                        // map the user-fair record
                        combinedFairRecord.forEach((fairRecord: any) => {
                            if (fairRecord.fair_code === userRecord.fairCode) {
                                userFairRecords.push(
                                    Object.assign(
                                        {
                                            ...userRecord
                                        },
                                        {
                                            fairJoined: true,
                                            fairName: fairRecord.fair_display_name[language],
                                            fairCode: fairRecord.fair_code,
                                            fiscalYear: fairRecord.fiscal_year,
                                            productInterest: userRecord.fairRegistrationProductInterests,
                                            productStrategy: userRecord.fairRegistrationProductStrategies,
                                            preferredMarket: userRecord.fairRegistrationPreferredSuppCountryRegions,
                                            hybridFairStartDatetime: fairRecord.hybrid_fair_start_datetime,
                                            hybridFairEndDatetime: fairRecord.hybrid_fair_end_datetime,
                                        }
                                    )
                                )
                            }
                        })
                    })

                    combinedFairRecord.forEach((fairRecord: any) => {
                        if (!userFairRecords.find(fair => fair.fairCode === fairRecord.fair_code)) {
                            userFairRecords.push({
                                fairJoined: false,
                                fairName: fairRecord.fair_display_name[language],
                                fairCode: fairRecord.fair_code,
                                fiscalYear: fairRecord.fiscal_year,
                                hybridFairStartDatetime: fairRecord.hybrid_fair_start_datetime,
                                hybridFairEndDatetime: fairRecord.hybrid_fair_end_datetime,
                            })
                        }
                    })


                    return {
                        profile,
                        userFairRecords
                    };
                })
                .then(profileResult => {
                    let getCountryValue: Promise<any> = Promise.resolve();
                    if (profileResult?.profile?.profileDetail?.country) {
                        getCountryValue = this.ContentService.retrieveCouncilwiseDataBy<CouncilwiseDataDto>(GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.country, [profileResult.profile.profileDetail.country].join(","))
                            .then(countryResult => {
                                return Object.entries(countryResult).map(([key, value]) => {
                                    return value[`${language.toLowerCase()}`] ?? "";
                                })
                            })
                            .catch(error => {
                                this.logger.error(`Failed in getFairParticipantsProfileWithCombinedFair -> get country value, err message: ${error.message}`);
                                return "";
                            })
                    }

                    let mappedNobList: Promise<any> = Promise.resolve();
                    if (profileResult?.profile?.profileDetail?.natureOfBussiness && profileResult?.profile?.profileDetail?.natureOfBussiness.length) {
                        mappedNobList = this.ContentService.retrieveCouncilwiseDataBy<CouncilwiseDataDto>(GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.nob, [profileResult?.profile?.profileDetail?.natureOfBussiness.map((nob: any) => nob.fairRegistrationNobCode)].join(","))
                            .then(nobResult => {
                                return Object.entries(nobResult).map(([key, value]) => {
                                    return value[`${language.toLowerCase()}`] ?? "";
                                })
                            })
                            .catch(error => {
                                this.logger.error(`Failed in getFairParticipantsProfileWithCombinedFair -> get NoB value, err message: ${error.message}`);
                                return [];
                            })
                    }

                    let mappedProductInterestList: Promise<any>[] = [];

                    // todo - jack - belows item did not have related api
                    let mappedProductStrategyList: Promise<any>[] = [];
                    let mappedPreferredMarketList: Promise<any>[] = [];
                    profileResult?.userFairRecords && profileResult?.userFairRecords.forEach((fair, fairIndex) => {
                        if (fair?.productInterest && fair?.productInterest.length) {
                            mappedProductInterestList[fairIndex] = this.ContentService.retrieveStructureTagDataById([fair?.productInterest.map((product: any) => product.stId)].join(","))
                                .then(result => {
                                    return Object.entries(result).map(([key, value]) => {
                                        return value[`st${language[0].toUpperCase()}${language[1].toLowerCase()}`] ?? ""
                                    })
                                })
                                .catch(error => {
                                    this.logger.error(`Failed in getFairParticipantsProfileWithCombinedFair -> get product interest value, err message: ${error.message}`);
                                    return [];
                                })
                        } else {
                            mappedProductInterestList[fairIndex] = Promise.resolve([]);
                        }

                        if (fair?.productStrategy && fair?.productStrategy.length) {
                            mappedProductStrategyList[fairIndex] = fair?.productStrategy.map((strategy: any) => strategy.fairRegistrationProductStrategyCode);
                        } else {
                            mappedProductStrategyList[fairIndex] = Promise.resolve([]);
                        }


                        if (fair?.preferredMarket && fair?.preferredMarket.length) {
                            mappedPreferredMarketList[fairIndex] = fair?.preferredMarket.map((market: any) => market.fairRegistrationPreferredSuppCountryRegionCode);
                        } else {
                            mappedPreferredMarketList[fairIndex] = Promise.resolve([]);
                        }
                    })
                    return Promise.all([Promise.resolve(profileResult), getCountryValue, mappedNobList, Promise.all(mappedProductInterestList), Promise.all(mappedProductStrategyList), Promise.all(mappedPreferredMarketList)]);
                })
                .then(([profileResult, countryResult, nobResult, productInterestResult, productStrategyResult, preferredMarketResult]) => {
                    if (profileResult?.profile?.profileDetail?.country) {
                        profileResult!.profile!.profileDetail!.country = countryResult[0];
                    }
                    if (profileResult?.profile?.profileDetail?.natureOfBussiness) {
                        profileResult!.profile!.profileDetail!.natureOfBussiness = nobResult || [];
                    }

                    // map the real value instead of the code
                    profileResult?.userFairRecords.forEach((fair, fairIndex) => {
                        fair.productInterest = productInterestResult[fairIndex];
                        fair.productStrategy = productStrategyResult[fairIndex];
                        fair.preferredMarket = preferredMarketResult[fairIndex];
                    })

                    // re-order the seq based on requirement
                    profileResult?.userFairRecords.sort((firstFair: Record<string, any>, secondFair: Record<string, any>): number => {
                        return (new Date(firstFair.hybridFairStartDatetime) as any) - (new Date(secondFair.hybridFairStartDatetime) as any);
                    });

                    // move the selecting fair to the front
                    profileResult?.userFairRecords.forEach((fair, fairIndex) => {
                        if (fair.fairCode === fairCode) {
                            profileResult?.userFairRecords.unshift(fair);
                            profileResult?.userFairRecords.splice(fairIndex + 1, 1);
                        }
                    })

                    // re-order the seq based on fair end date by desc
                    const fairRecordSortByFairEndDatetimeDesc = [...profileResult?.userFairRecords].sort((firstFair: Record<string, any>, secondFair: Record<string, any>): number => {
                        return (new Date(secondFair.hybridFairEndDatetime) as any) - (new Date(firstFair.hybridFairEndDatetime) as any);
                    });

                    // compare the time between now and the longest end date
                    let buttonEnable = false;
                    if (fairRecordSortByFairEndDatetimeDesc && fairRecordSortByFairEndDatetimeDesc.length) {
                        buttonEnable = moment().isBefore(moment(fairRecordSortByFairEndDatetimeDesc[0]?.hybridFairEndDatetime).tz(timezone));
                    }

                    profileResult.profile.profileDetail.buttonEnable = buttonEnable;

                    return {
                        status: 200,
                        ...profileResult
                    };
                })
                .catch((fairServiceError: Error) => {
                    this.logger.error(`Failed in getFairParticipantsProfileWithCombinedFair, err message: ${fairServiceError.message}`);
                    return {
                        status: 400,
                        message: JSON.stringify(fairServiceError)
                    }
                })
                .finally(() => {
                    subsegment?.close();
                })
        })
    }


    public getFairParticipantProfile(ssoUid: string, fairCode: string, fiscalYear: string) {
        return this.FairRegistrationRepository
            .createQueryBuilder("fairRegistration")
            .leftJoinAndSelect("fairRegistration.fairParticipant", "fairParticipant")
            .leftJoinAndSelect("fairRegistration.c2mParticipantStatus", "c2mParticipantStatus")
            .where("fairParticipant.ssoUid = :ssoUid", { ssoUid })
            .andWhere("fairRegistration.fairCode = :fairCode", { fairCode })
            .andWhere("fairRegistration.fiscalYear = :fiscalYear", { fiscalYear })
            .getOne()
            .then(result => {
                if (!result || !result.fairParticipant) {
                    return Promise.reject("Could not found any data");
                }
                if (result.c2mParticipantStatus.c2mParticipantStatusCode !== "ACTIVE") {
                    return Promise.reject(`User current status is ${result.c2mParticipantStatus.c2mParticipantStatusCode}`);
                }
                return {
                    status: 200,
                    data: result
                }
            })
            .catch(error => {
                return {
                    status: 400,
                    message: error?.message ?? error
                }
            })
    }

    public getFairParticipantStatus(ssoUid: string, fairCode: string) {
        return this.FairRegistrationRepository
            .createQueryBuilder("fairRegistration")
            .leftJoinAndSelect("fairRegistration.fairParticipant", "fairParticipant")
            .leftJoinAndSelect("fairRegistration.c2mParticipantStatus", "c2mParticipantStatus")
            .where("fairParticipant.ssoUid = :ssoUid", { ssoUid })
            .andWhere("fairRegistration.fairCode = :fairCode", { fairCode })
            .getOne()
            .then(result => {
                if (!result || !result.fairParticipant) {
                    return Promise.reject("Could not found any buyer data");
                }
                return {
                    status: 200,
                    data: {
                        ParticipantStatus: result.c2mParticipantStatus.c2mParticipantStatusCode
                    }
                }
            })
            .catch(error => {
                return {
                    status: 400,
                    message: error?.message ?? error
                }
            })
    }

    public getAndSetC2MLoginStatus(ssoUid: string, fairCode: string, fiscalYear: string) {
        return this.FairService.getMultipleFairDatas([fairCode])
            .then(result => {
                if (!result?.length) {
                    return Promise.reject("Could not found any fair data");
                }

                // c2m_start_datetime & c2m_end_datetime is in hong kong timezone
                const now = moment().tz('Asia/Hong_Kong').format('YYYY-MM-DD HH:mm');
                let c2mStartDatetime = result?.[0].relatedFair?.[0]?.wins_event_start_datetime;
                let c2mEndDatetime = result?.[0].relatedFair?.[0]?.c2m_end_datetime;
                if (result[0].fairType === "combined") {
                    result[0].relatedFair.forEach((fair: any) => {
                        if (moment(c2mStartDatetime).isAfter(fair.wins_event_start_datetime)) {
                            c2mStartDatetime = fair.wins_event_start_datetime;
                        }
                        if (moment(c2mEndDatetime).isBefore(fair.c2m_end_datetime)) {
                            c2mEndDatetime = fair.c2m_end_datetime;
                        }
                    })
                }

                return this.FairRegistrationRepository
                    .createQueryBuilder("fairRegistration")
                    .leftJoinAndSelect("fairRegistration.fairParticipant", "fairParticipant")
                    .where("fairParticipant.ssoUid = :ssoUid", { ssoUid })
                    .andWhere("fairRegistration.fairCode = :fairCode", { fairCode })
                    .andWhere("fairRegistration.fiscalYear = :fiscalYear", { fiscalYear })
                    .getOne()
                    .then((result: FairRegistration | undefined): Promise<any> => {
                        if (!result?.fairParticipant) {
                            return Promise.reject("Could not found any profile data");
                        }

                        const pendingPromise: Promise<any>[] = [
                            this.FairRegistrationRepository.find({ fairParticipantId: result.fairParticipantId, fairCode, fiscalYear }),
                            !result.c2mLogin ? this.FairRegistrationRepository.update({ fairParticipantId: result.fairParticipantId, fairCode, fiscalYear }, { c2mLogin: "Y" }) : Promise.resolve({ affected: 0 }),
                            moment(now).isBetween(c2mStartDatetime, c2mEndDatetime) ? this.FairRegistrationRepository.update({ fairParticipantId: result.fairParticipantId, fairCode, fiscalYear }, { c2mLogin: "Y", c2mMeetingLogin: "Y" }) : Promise.resolve({ affected: 0 }),
                            this.FairRegistrationRepository.find({ fairParticipantId: result.fairParticipantId, fairCode, fiscalYear }),
                        ];

                        return Promise.all(pendingPromise);
                    })
            })
            .then(async ([beforeUpdate, c2mLoginResponse, c2mDateTimeResponse, afterUpdate]) => {
                let isReachedAvailabilityPage = true;
                if (c2mLoginResponse?.affected >= 1) {
                    isReachedAvailabilityPage = false;
                }

                var activityinfo: any[] = beforeUpdate?.map((item: FairRegistration) => {
                    let after: FairRegistration = afterUpdate?.find((_item: FairRegistration) => _item.id == item.id);
                    return {
                        registrationNo: `${after.serialNumber}${after.projectYear?.substring(after.projectYear.length - 2)}${after.sourceTypeCode}${after.visitorTypeCode}${after.projectNumber}`,
                        beforeUpdate: item,
                        afterUpdate: after
                    }
                }) || [];

                return {
                    status: 200,
                    isReachedAvailabilityPage,
                    "user-activity": activityinfo
                }
            })
            .catch(error => {
                return {
                    status: 400,
                    message: error?.message ?? error
                }
            })
    }

    public getFairParticipantByEmailId(emailId: string) {
        return (
            this.FairRegistrationRepository.createQueryBuilder('fairRegistration')
                .leftJoin('fairRegistration.fairParticipant', 'fairParticipant')
                .leftJoinAndSelect("fairRegistration.c2mParticipantStatus", "c2mParticipantStatus")
                .select(['fairRegistration.fairCode', 'fairRegistration.fiscalYear', 'fairParticipant.ssoUid', 'fairParticipant.emailId'])
                .where('fairParticipant.emailId = :emailId', { emailId })
                .getMany()
        );
    }

    public async insertParticipantIfEmailNotExist(emailId: string) {
        const queryResult = await this.FairParticipantRepository.findOne({
            where: [
                {
                    emailId: emailId,
                }
            ]
        })
        if (!queryResult) {
            await this.FairParticipantRepository.insert({
                ssoUid: null,
                emailId: emailId,
                createdBy: 'fair-service',
                lastUpdatedBy: 'fair-service'
            })
            return true;
        }
        return false
    }

    queryFairParticipantByEmailId = async (emailId: string): Promise<FairParticipant | undefined> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-FairDbService-queryFairParticipantByEmailId', async (subsegment) => {
            try {
                const queryObject = await this.FairParticipantRepository.findOne({
                    where: [
                        {
                            emailId: emailId,
                        }
                    ]
                })

                return queryObject;

            } catch (error) {
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }
}