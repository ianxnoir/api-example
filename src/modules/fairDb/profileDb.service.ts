import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import * as AWSXRay from 'aws-xray-sdk';
import { getManager, In, Repository } from "typeorm";
import { QueryDeepPartialEntity } from "typeorm/query-builder/QueryPartialEntity";
import { VepErrorMsg } from "../../config/exception-constant";
import { VepError } from "../../core/exception/exception";
import { Logger } from '../../core/utils';
import { FairParticipant } from "../../dao/FairParticipant";
import { FairRegistration } from "../../dao/FairRegistration";
import { FairRegistrationDynamicBm } from "../../dao/FairRegistrationDynamicBm";
import { FairRegistrationDynamicOthers } from "../../dao/FairRegistrationDynamicOthers";
import { FairRegistrationPreferredSuppCountryRegion } from "../../dao/FairRegistrationPreferredSuppCountryRegion";
import { FairRegistrationProductInterest } from "../../dao/FairRegistrationProductInterest";
import { FairRegistrationProductStrategy } from "../../dao/FairRegistrationProductStrategy";
import { ProductInterestOtherFieldId } from "../formValidation/enum/dedicateDataField.enum";
import { EditResultDto, ProfileEditDto } from "./dto/fairDb.service.dto";
import { ProfileDbUtil } from "./profileDb.util";

@Injectable()
export class ProfileDbService {

    constructor(
        private logger: Logger,
        @InjectRepository(FairRegistration) private FairRegistrationRepository: Repository<FairRegistration>,
    ) {
        this.logger.setContext(ProfileDbService.name)
    }

    queryRegisteredFairCodeList = async (ssoUid: string): Promise<string[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-ProfileDbService-queryRegisteredFairCodeList', async (subsegment) => {
            try {
                const queryResult =
                    await this.FairRegistrationRepository.createQueryBuilder("fairRegistration")
                        .leftJoin("fairRegistration.fairParticipant", "fairParticipant")
                        .where("fairParticipant.ssoUid = :ssoUid", { ssoUid })
                        .select("DISTINCT fairRegistration.fairCode", "fairCode")
                        .getRawMany()
                return queryResult.map(x => x.fairCode as string);
            } catch (error) {
                throw new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
	}


    queryFairRegProfileForEditByQueryBuilder = async (ssoUid: string, fairTuples: { fairCode: string, fiscalYear: string }[]): Promise<FairRegistration[]> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-ProfileDbService-queryFairRegProfileForEditByQueryBuilder', async (subsegment) => {
            try {
                const fairRegQueryBuilder = this.FairRegistrationRepository
                    .createQueryBuilder("r")
                    .leftJoinAndSelect("r.fairParticipant", "fp")
                    .leftJoinAndSelect("r.fairParticipantType", "fpt")
                    .leftJoinAndSelect("r.c2mParticipantStatus", "c2mStatus")
                    .leftJoinAndSelect("r.fairRegistrationStatus", "regStatus")
                    .leftJoinAndSelect("r.fairRegistrationType", "regType")
                    .leftJoinAndSelect("r.fairRegistrationNobs", "nobs")
                    .leftJoinAndSelect("r.fairRegistrationProductStrategies", "productStrategies")
                    .leftJoinAndSelect("r.fairRegistrationPreferredSuppCountryRegions", "preferredSuppCountryRegions")
                ProfileDbUtil.whereSsoUidFairCodeFiscalYear(fairRegQueryBuilder, ssoUid, fairTuples)
                
                const fairRegProductInterestsQueryBuilder = this.FairRegistrationRepository
                    .createQueryBuilder("r")
                    .leftJoinAndSelect("r.fairParticipant", "fp")
                    .leftJoinAndSelect("r.fairRegistrationProductInterests", "productInterests")
                ProfileDbUtil.whereSsoUidFairCodeFiscalYear(fairRegProductInterestsQueryBuilder, ssoUid, fairTuples)

                const fairRegDynamicBmsQueryBuilder = this.FairRegistrationRepository
                    .createQueryBuilder("r")
                    .leftJoinAndSelect("r.fairParticipant", "fp")
                    .leftJoinAndSelect("r.fairRegistrationDynamicBms", "dynamicBms")
                ProfileDbUtil.whereSsoUidFairCodeFiscalYear(fairRegDynamicBmsQueryBuilder, ssoUid, fairTuples)

                const fairRegDynamicOthersQueryBuilder = this.FairRegistrationRepository
                    .createQueryBuilder("r")
                    .leftJoinAndSelect("r.fairParticipant", "fp")
                    .leftJoinAndSelect("r.fairRegistrationDynamicOthers", "dynamicOthers")
                ProfileDbUtil.whereSsoUidFairCodeFiscalYear(fairRegDynamicOthersQueryBuilder, ssoUid, fairTuples)

                return await Promise.all([
                    fairRegQueryBuilder.getMany(),
                    fairRegProductInterestsQueryBuilder.getMany(),
                    fairRegDynamicBmsQueryBuilder.getMany(),
                    fairRegDynamicOthersQueryBuilder.getMany()
                ]
                ).then((promiseResults) => {
                    const fairRegList = promiseResults[0]
                    const productInterestQueryResult = promiseResults[1]
                    const dynamicBmsQueryResult = promiseResults[2]
                    const dynamicOthersQueryResult = promiseResults[3]

                    if (fairRegList.length == 0) {
                        return []
                    }

                    return fairRegList.map(fairReg => {
                        fairReg.fairRegistrationProductInterests = productInterestQueryResult.find(x => x.id == fairReg.id)?.fairRegistrationProductInterests ?? []
                        fairReg.fairRegistrationDynamicBms = dynamicBmsQueryResult.find(x => x.id == fairReg.id)?.fairRegistrationDynamicBms ?? []
                        fairReg.fairRegistrationDynamicOthers = dynamicOthersQueryResult.find(x => x.id == fairReg.id)?.fairRegistrationDynamicOthers ?? []
    
                        return fairReg;
                    }) ?? []
                })
            } catch (error) {
                throw error
            } finally {
                subsegment?.close()
            }
        })
    }

    queryFairRegProfileForEdit = async (type: 'frontend' | 'backend', id: number, ssoUid: string = "", fairCode: string = "", fiscalYear: string = ""): Promise<FairRegistration | null> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-ProfileDbService-queryFairRegProfileForEdit', async (subsegment) => {
            let whereClauses: { id: number } | { fairParticipant: { ssoUid: string }, fairCode: string, fiscalYear: String } = {
                id
            }

            if (type == 'frontend') {
                whereClauses = {
                    fairParticipant: {
                        ssoUid
                    },
                    fairCode,
                    fiscalYear
                }
            }

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
                        }),
                        this.FairRegistrationRepository.find({
                            relations: [
                                "fairParticipant",
                                "fairRegistrationDynamicOthers"
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
                    const productInterestQueryResult = promiseResults[1]
                    const dynamicBmsQueryResult = promiseResults[2]
                    const dynamicOthersQueryResult = promiseResults[3]

                    fairReg.fairRegistrationProductInterests = productInterestQueryResult.find(x => x.id == fairReg.id)?.fairRegistrationProductInterests ?? []
                    fairReg.fairRegistrationDynamicBms = dynamicBmsQueryResult.find(x => x.id == fairReg.id)?.fairRegistrationDynamicBms ?? []
                    fairReg.fairRegistrationDynamicOthers = dynamicOthersQueryResult.find(x => x.id == fairReg.id)?.fairRegistrationDynamicOthers ?? []

                    return fairReg;
                })
            } catch (error) {
                throw new VepError(VepErrorMsg.Database_Error, error?.message ?? JSON.stringify(error))
            } finally {
                subsegment?.close()
            }
        })
    }

    // query with only relation fairParticipant, for checking only
    queryFairRegProfileForBackendEditCheckingByRecordId = async (id: number): Promise<FairRegistration | null> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-ProfileDbService-queryFairRegProfileForBackendEditCheckingByRecordId', async (subsegment) => {
            try {
                const queryResult = await this.FairRegistrationRepository.find({
                    relations: [
                        "fairParticipant"
                    ],
                    where: {
                        id,
                    }
                })

                if (queryResult.length == 0) {
                    return null
                }

                return queryResult[0]
            } catch (error) {
                throw new VepError(VepErrorMsg.Database_Error, error?.message ?? JSON.stringify(error))
            } finally {
                subsegment?.close()
            }
        })
    }

    updateFormSubmissionKey = async (fairReg: FairRegistration, formSubmissionKey: string): Promise<FairRegistration> => {
        return getManager().transaction(async transactionalEntityManager => {
        // return this.FairRegistrationRepository.manager.transaction(async transactionalEntityManager => {
            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-ProfileDbService-updateFormSubmissionKey', async (subsegment) => {
                try {
                    fairReg.formSubmissionKey = formSubmissionKey
                    const saveResult = await transactionalEntityManager.save(fairReg)
                    return saveResult
                } catch (error) {
                    this.logger.error(`Failed in update updateFormSubmissionKey, err message: ${error.message}`)
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        });
    }

    getProfileWithMandatoryBM = async (ssoUid: string, fairCode: string, fiscalYear: string): Promise<FairRegistration | null> => {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-ProfileDbService-getProfileWithMandatoryBM', async (subsegment) => {
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
                                "fairRegistrationProductInterests"
                            ],
                            where: whereClauses
                        }),
                        this.FairRegistrationRepository.createQueryBuilder("fairRegistration")
                        .leftJoin("fairRegistration.fairParticipant", "fairParticipant")
                        .leftJoinAndSelect("fairRegistration.fairRegistrationDynamicOthers", "fairRegistrationDynamicOthers")
                        .where("fairParticipant.ssoUid = :ssoUid", { ssoUid })
                        .andWhere("fairRegistration.fairCode = :fairCode", { fairCode })
                        .andWhere("fairRegistration.fiscalYear = :fiscalYear", { fiscalYear })
                        .andWhere("fairRegistrationDynamicOthers.formFieldId IN(:formFieldId)", {
                            formFieldId: [
                                ProductInterestOtherFieldId.br_bm_product_interest_other,
                                ProductInterestOtherFieldId.br_bm_product_interest_ip_other,
                                ProductInterestOtherFieldId.br_bm_product_interest_licensing_other
                            ]
                        })
                        .getMany()
                    ]
                ).then((promiseResults) => {
                    const queryResult = promiseResults[0]

                    if (queryResult.length == 0) {
                        return null
                    }

                    const fairReg = queryResult[0]
                    const productInterestQueryResult = promiseResults[1]
                    const productInterestOtherQueryResult = promiseResults[2]
                    fairReg.fairRegistrationProductInterests = productInterestQueryResult.find(x => x.id == fairReg.id)?.fairRegistrationProductInterests ?? []
                    fairReg.fairRegistrationDynamicOthers = productInterestOtherQueryResult.find(x => x.id == fairReg.id)?.fairRegistrationDynamicOthers ?? []
                    return fairReg;
                })
            } catch (error) {
                throw new VepError(VepErrorMsg.Database_Error, error?.message ?? JSON.stringify(error))
            } finally {
                subsegment?.close()
            }
        })
    }

    updateProductInterestPerFair = async (
        fairReg: FairRegistration, 
        productInterestObjList: FairRegistrationProductInterest[], 
        productInterestOtherList: FairRegistrationDynamicOthers[])
        : Promise<FairRegistration> => {
        return getManager().transaction(async transactionalEntityManager => {
            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-ProfileDbService-updateProductInterestPerFair', async (subsegment) => {
                try {
                    if (fairReg.fairRegistrationProductInterests) {
                        await transactionalEntityManager.delete(FairRegistrationProductInterest, { fairRegistrationId: fairReg.id })
                            .catch((error) => { throw new VepError(VepErrorMsg.Database_Error, error.message) });
                    }
                    fairReg.fairRegistrationProductInterests = await transactionalEntityManager.save(productInterestObjList)

                    if (fairReg.fairRegistrationDynamicOthers) {
                        await transactionalEntityManager.delete(FairRegistrationDynamicOthers, 
                            {
                                fairRegistrationId: fairReg.id,
                                formFieldId: In([
                                    ProductInterestOtherFieldId.br_bm_product_interest_other,
                                    ProductInterestOtherFieldId.br_bm_product_interest_ip_other,
                                    ProductInterestOtherFieldId.br_bm_product_interest_licensing_other,
                                ])
                            })
                            .catch((error) => { throw new VepError(VepErrorMsg.Database_Error, error.message) });
                    }
                    fairReg.fairRegistrationDynamicOthers = await transactionalEntityManager.save(productInterestOtherList)

                    // update fairParticipant lastUpdatedTime to trigger data sync
                    fairReg.fairParticipant.lastUpdatedTime = new Date()
                    fairReg.fairParticipant = await transactionalEntityManager.save(fairReg.fairParticipant)

                    return fairReg
                } catch (error) {
                    this.logger.error(`Failed in update updateProductInterestPerFair, err message: ${error.message}`)
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        });
    }

    updateFairRegistrationByProfileEditDto = async (
        fairReg: FairRegistration,
        profileEditDto: ProfileEditDto
    ): Promise<EditResultDto> => {
        return getManager().transaction(async transactionalEntityManager => {
            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-ProfileDbService-updateFairRegistrationByProfileEditDto', async (subsegment) => {
                try {
                    const partialEntity = this.constructPartialEntityFairRegistration(profileEditDto)

                    if (Object.keys(partialEntity).length > 0){
                        await transactionalEntityManager.update(FairRegistration, { id: fairReg.id }, partialEntity)
                    }

                    if (profileEditDto.fairRegistrationProductStrategies != undefined) {
                        // delete
                        await transactionalEntityManager.delete(FairRegistrationProductStrategy, { fairRegistrationId: fairReg.id })
                        // insert
                        if (profileEditDto.fairRegistrationProductStrategies.length > 0){
                            await transactionalEntityManager.save(profileEditDto.fairRegistrationProductStrategies)
                        }
                    }

                    if (profileEditDto.fairRegistrationPreferredSuppCountryRegions != undefined) {
                        // delete
                        await transactionalEntityManager.delete(FairRegistrationPreferredSuppCountryRegion, { fairRegistrationId: fairReg.id })
                        // insert
                        if (profileEditDto.fairRegistrationPreferredSuppCountryRegions.length > 0){
                            await transactionalEntityManager.save(profileEditDto.fairRegistrationPreferredSuppCountryRegions)
                        }
                    }

                    if (profileEditDto.fairRegistrationProductInterests != undefined) {
                        // delete
                        await transactionalEntityManager.delete(FairRegistrationProductInterest, { fairRegistrationId: fairReg.id })
                        // insert
                        if (profileEditDto.fairRegistrationProductInterests.length > 0){
                            await transactionalEntityManager.save(profileEditDto.fairRegistrationProductInterests)
                        }
                    }

                    for (const bmFieldId of profileEditDto.dynamicBmFieldIdToUpdate) {
                        // delete
                        await transactionalEntityManager.delete(FairRegistrationDynamicBm, { fairRegistrationId: fairReg.id, formFieldId: bmFieldId })
                        // insert
                        const relatedBmList = profileEditDto.fairRegistrationDynamicBms.filter(x => x.formFieldId == bmFieldId)
                        if (relatedBmList.length > 0){
                            await transactionalEntityManager.save(relatedBmList)
                        }
                    }

                    for (const otherFieldId of profileEditDto.dynamicOtherFieldIdToUpdate) {
                        // delete
                        await transactionalEntityManager.delete(FairRegistrationDynamicOthers, { fairRegistrationId: fairReg.id, formFieldId: otherFieldId })
                        // insert
                        const relatedOtherList = profileEditDto.fairRegistrationDynamicOthers.filter(x => x.formFieldId == otherFieldId)
                        if (relatedOtherList.length > 0){
                            await transactionalEntityManager.save(relatedOtherList)
                        }
                    }

                    await transactionalEntityManager.update(FairParticipant, { id: fairReg.fairParticipantId }, {
                        lastUpdatedTime: new Date()
                    })

                    return {
                        isSuccess: true
                    }

                } catch (error) {
                    this.logger.error(`Failed in update FairRegistration, err message: ${error.message}`)
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        });
    }

    constructPartialEntityFairRegistration = (profileEditDto: ProfileEditDto): QueryDeepPartialEntity<FairRegistration>=> {
        const partialEntity: QueryDeepPartialEntity<FairRegistration> = {}
        if (profileEditDto.overseasBranchOfficer != undefined) {
            partialEntity.overseasBranchOfficer = profileEditDto.overseasBranchOfficer
        }
        if (profileEditDto.euConsentStatus != undefined) {
            partialEntity.euConsentStatus = profileEditDto.euConsentStatus
        }
        if (profileEditDto.badgeConsent != undefined) {
            partialEntity.badgeConsent = profileEditDto.badgeConsent
        }
        if (profileEditDto.c2mConsent != undefined) {
            partialEntity.c2mConsent = profileEditDto.c2mConsent
        }
        if (profileEditDto.registrationDetailConsent != undefined) {
            partialEntity.registrationDetailConsent = profileEditDto.registrationDetailConsent
        }

        partialEntity.lastUpdatedBy = profileEditDto.lastUpdatedBy

        return partialEntity
    }
}