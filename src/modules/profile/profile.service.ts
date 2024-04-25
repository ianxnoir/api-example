import { BadRequestException, HttpService, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';
import moment from 'moment';
import { VepErrorMsg } from '../../config/exception-constant';
import { SSOUserHeadersDto } from '../../core/decorator/ssoUser.decorator';
import { VepError } from '../../core/exception/exception';
import { Logger, S3Service } from '../../core/utils';
import { FairRegistration } from '../../dao/FairRegistration';
import { FairRegistrationDynamicBm } from '../../dao/FairRegistrationDynamicBm';
import { NameHelper } from '../../helper/nameHelper';
import { BuyerService } from '../api/buyer/buyer.service';
import { CouncilwiseDataType, FairSettingKeyEnum, GeneralDefinitionDataRequestDTOType } from '../api/content/content.enum';
import { ContentService } from '../api/content/content.service';
import { CouncilwiseAddressRegionResponseDto, CouncilwiseDataDto, CouncilwiseDataResponseDto } from '../api/content/dto/councilwiseDataResp.dto';
import { StructureTagDataDto, StructureTagDataResponseDto } from '../api/content/dto/StructureTagData.dto';
import { FairDetail } from '../fair/dto/Fair.dto';
import { FairService } from '../fair/fair.service';
import { ProfileEditDto, QueryActiveFairParticipantRegistrationsQuery } from '../fairDb/dto/fairDb.service.dto';
import { FairDbService } from '../fairDb/fairDb.service';
import { FairParticipantInflencingDetailRespDto } from './dto/fairParticipantInflencingDetailResp.dto';
import { FairParticipantInflencingReqDto } from './dto/fairParticipantInflencingReq.dto';
import { ParticipantRegistrationBySsouidsDto } from './dto/ParticipantRegistrationBySsouids.dto';
import { FairParticipantRegistrationNestedObject, FairParticipantRegistrationProductInterest, ParticipantRegistrationDetail } from './dto/ParticipantRegistrationDetail.dto';
import { ParticipantTypeByFairListDto } from './dto/ParticipantTypeByFair.dto';
import { ParticipantTypeByFairDetailSearchDto } from './dto/participantTypeByFairDetailSearch.dto';
import { ParticipantTypeSearchDto } from './dto/ParticipantTypeSearch.dto';
import { SearchC2mExcludedParticipantByFairListObj, SearchC2mExcludedParticipantDto, SearchC2mExcludedParticipantObj } from './dto/searchC2mExcludedParticipant.dto';
import { UpdateC2MProfileReqDto } from './dto/updateC2MProfileReq.dto';
import { UpdateFairParticipantRegistrationRecordDto } from './dto/UpdateFairParticipantRegistrationRecord.dto';
import { FairNameDto, GetCombinedFairListRespDto, MultiLangNameDto } from './dto/getCombineFairListResp.dto';
import { ProfileForBackendEditRespDto, ProfileForEditRespDto } from './dto/profileForEditResp.dto';
import { ProfileForEditReqByFairCodeDto } from './dto/profileForEditReqByFairCode.dto';
import { FormCommonUtil } from '../formValidation/formCommon.util';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { LANG } from '../registration/dto/SubmitForm.enum';
import { UpdateProductInterestPerFairReqDto } from './dto/updateProductInterestPerFairReq.dto';
import { DedicateDataFieldEnum, SsoRelatedFieldIdList, DedicateDataFieldListForProductInterest, DedicateDataFieldListForProductInterestOther, ProductInterestFieldId, ProductInterestOtherFieldId, HardcodedDynamicBMFieldId } from '../formValidation/enum/dedicateDataField.enum';
import { FairRegistrationProductInterest } from '../../dao/FairRegistrationProductInterest';
import { FairRegistrationDynamicOthers } from '../../dao/FairRegistrationDynamicOthers';
import { ContentUtil } from '../api/content/content.util';
import { CombinedFairFormDataRespDto, FormDataPerFair } from './dto/combinedFairFormDataResp.dto';
import { GetC2MProductInterestRespDto, GetC2MQuestionInputRespDto } from './dto/getC2mQuestionInputResp.dto';
import { ProfileUtil } from './profile.util';
import { BuyerDetailEntryDto, BuyerDetailEntryMappedValueDto, ShowInProfileDto } from '../formValidation/dto/buyerDetailEntry.dto';
import { FormTemplateDto, MuiltiLangFormTemplate } from '../api/content/dto/formTemplate.dto';
import { ValidationUtil } from '../formValidation/validation.util';
import { UpdateProfileBackendReqDto } from './dto/updateProfileBackendReq.dto';
import { WordpressFormValidationService } from '../formValidation/wordpressFormValidation.service';
import { EditFormDataDto } from '../formValidation/dto/editFormData.dto';
import { AdminEditProfileResp } from './dto/adminEditProfileResp.dto';
import { UpdateProfileFrontendReqDto } from './dto/updateProfileFrontendReq.dto';
import { UpdateProfileFrontendRespDto } from './dto/updateProfileFrontendResp.dto';
import { AdminGetPresignedUrlPerUserReqDto, GetPresignedUrlPerUserReqDto } from './dto/getPresignedUrlPerUserReq.dto';
import { v4 as uuidv4 } from 'uuid';
import { GetUploadFilePresignedUrlRespDto } from '../form/dto/getUploadFilePresignedUrlResp.dto';
import { FIELD_TYPE } from '../formValidation/enum/fieldType.enum';
import { ProfileDbUtil } from '../fairDb/profileDb.util';
import { GetBuyerDetailsForExhbrReqDto } from './dto/getBuyerDetailsForExhbrReq.dto';
import { GetBuyerDetailsForExhbrRespDto } from './dto/getBuyerDetailsForExhbrResp.dto';
import { ProfileDbService } from '../fairDb/profileDb.service';
import { MultiLangTemplateHandler } from '../registration/MultiLangHandler';
import { ShortRegistrationDto } from './dto/ShortRegistration.dto';

import { ContentCacheService } from '../api/content/content-cache.service';

@Injectable()
export class ProfileService {
    uploadFileBucket: string

    constructor(
        private logger: Logger,
        private fairService: FairService,
        private contentService: ContentService,
        private fairDbService: FairDbService,
        private profileDbService: ProfileDbService,
        private httpService: HttpService,
        private configService: ConfigService,
        private wordpressFormValidationService: WordpressFormValidationService,
        private s3Service: S3Service,
        private buyerService: BuyerService,
        private contentCacheService: ContentCacheService,
    ) {
        this.logger.setContext(ProfileService.name)
        this.uploadFileBucket = this.configService.get<any>('form.uploadFileBucket');
    }

    public async searchParticipantType(query: ParticipantTypeSearchDto): Promise<ParticipantTypeByFairListDto> {
        let participantTypeByFairList: ParticipantTypeByFairListDto = new ParticipantTypeByFairListDto()

        let fairDetailList: { fairCode: string, fairSettingFairCode: string, fiscalYear: string }[] = 
            await this.contentCacheService.getSiblingFairList(query.fairCodes);

        if (fairDetailList.length > 0) {
            participantTypeByFairList.roleByFair = await this.retieveParticipantTypeByFairList(query.ssoUid, query.emailId, fairDetailList)
        }

        return participantTypeByFairList
    }

    public async searchParticipantTypeByFairDetails(query: ParticipantTypeByFairDetailSearchDto): Promise<ParticipantTypeByFairListDto> {
        let participantTypeByFairList: ParticipantTypeByFairListDto = new ParticipantTypeByFairListDto()

        if (query.fairDetailList.length > 0) {
            participantTypeByFairList.roleByFair = await this.retieveParticipantTypeByFairList(query.ssoUid, query.emailId, query.fairDetailList)
        }
        return participantTypeByFairList
    }

    private async retieveParticipantTypeByFairList(ssoUid: string, emailId: string, fairDetailList: { fairCode: string, fairSettingFairCode: string, fiscalYear: string }[]) {
        const queryResults = await this.fairDbService.queryShortFairRegByFairCodeSsoUid(ssoUid, emailId,
            fairDetailList.map(x => {
                return {
                    fairCode: x.fairSettingFairCode,
                    fiscalYear: x.fiscalYear
                }
            })
        )

        return queryResults.map(q => {
            return {
                fairCode: fairDetailList.find(x => x.fairSettingFairCode == q.fairCode)!.fairCode,
                participantType: q.fairParticipantType?.fairParticipantTypeCode ?? "",
                tier: q.tier ?? "",
                companyCcdId: "",
                suppierUrn: "",
                exhibitorType: "",
                eoaFairId: "",
                c2mStatus: q.c2mParticipantStatus?.c2mParticipantStatusCode ?? "",
                registrationStatus: q.fairRegistrationStatus?.fairRegistrationStatusCode ?? "",
            }
        })
    }

    public async updateC2MProfile(ssoUser: SSOUserHeadersDto, fairCode: string, updateReq: UpdateC2MProfileReqDto): Promise<any> {
        this.logger.debug(`c2mUpdate, ssouid: ${ssoUser.ssoUid}, fairCode: ${fairCode}, updateReq: ${JSON.stringify(updateReq)}`)

        // get fiscal year by fair code
        const { data } = await this.fairService.getWordpressSettings(fairCode);
        const fairSettingFairCode = data.data.fair_code as string;
        const fairSettingFiscalYear = data.data.fiscal_year as string;

        let masterDataPromiseList: Promise<{ type: string, data: CouncilwiseDataResponseDto | StructureTagDataResponseDto }>[] = []

        if (updateReq.targetPreferredMarkets && updateReq.targetPreferredMarkets.length > 0) {
            masterDataPromiseList.push(
                this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataDto>(GeneralDefinitionDataRequestDTOType.code,
                    CouncilwiseDataType['target-marketV2'],
                    updateReq.targetPreferredMarkets.join(",")
                ).then((result) => {
                    return {
                        type: "targetPreferredMarkets",
                        data: result
                    }
                })
            )
        }

        if (updateReq.productStrategy && updateReq.productStrategy.length > 0) {
            masterDataPromiseList.push(
                this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataDto>(GeneralDefinitionDataRequestDTOType.code,
                    CouncilwiseDataType['product-stragetyV2'],
                    updateReq.productStrategy.join(",")
                ).then((result) => {
                    return {
                        type: "productStrategy",
                        data: result
                    }
                })
            )
        }

        if (updateReq.productInterest && updateReq.productInterest.length > 0) {
            masterDataPromiseList.push(
                this.contentService.retrieveStructureTagDataByTeCode(
                    updateReq.productInterest.map(x => x.teCode).join(",")
                ).then((result) => {
                    return {
                        type: "productInterest",
                        data: result
                    }
                })
            )
        }

        let masterDataQueryResult: { [key: string]: CouncilwiseDataResponseDto | StructureTagDataResponseDto }
            = await Promise.all(masterDataPromiseList).then((results) => {
                return results.reduce((aggResult: { [key: string]: CouncilwiseDataResponseDto | StructureTagDataResponseDto },
                    result: { type: string, data: CouncilwiseDataResponseDto | StructureTagDataResponseDto }) => {
                    aggResult[result.type] = result.data
                    return aggResult;
                }, {})
            })

        // verify input
        if (updateReq.targetPreferredMarkets) {
            const targetPreferredMarketList = masterDataQueryResult["targetPreferredMarkets"]
            updateReq.targetPreferredMarkets.forEach(marketInput => {
                if (!targetPreferredMarketList[marketInput]) {
                    throw new VepError(VepErrorMsg.Profile_C2M_Invalid_Input, `updateC2MProfile input invalid, marketInput: ${marketInput}`)
                }
            })
        }
        if (updateReq.productStrategy) {
            const productStrategyList = masterDataQueryResult["productStrategy"]
            updateReq.productStrategy.forEach(productStrategyInput => {
                if (!productStrategyList[productStrategyInput]) {
                    throw new VepError(VepErrorMsg.Profile_C2M_Invalid_Input, `updateC2MProfile input invalid, productStrategyInput: ${productStrategyInput}`)
                }
            })
        }
        if (updateReq.productInterest) {
            const productInterestList = masterDataQueryResult["productInterest"]
            updateReq.productInterest.forEach(productInterestInput => {
                const productInterestMasterData = productInterestList[productInterestInput.teCode]
                if (!productInterestMasterData) {
                    throw new VepError(VepErrorMsg.Profile_C2M_Invalid_Input, `updateC2MProfile input invalid, productInterestInput: ${JSON.stringify(productInterestInput)}`)
                } else {
                    if (productInterestMasterData.fairCode != fairCode
                        || productInterestMasterData.stId != productInterestInput.stId
                        || productInterestMasterData.iaId != productInterestInput.iaId) {
                        throw new VepError(VepErrorMsg.Profile_C2M_Invalid_Input, `updateC2MProfile input invalid, productInterestInput: ${JSON.stringify(productInterestInput)}`)
                    }
                }
            })
        }

        // get registration
        const queryResults = await this.fairDbService.queryFairRegByFairCodeSsoUid(ssoUser.ssoUid, ssoUser.emailId, [{
            fairCode: fairSettingFairCode,
            fiscalYear: fairSettingFiscalYear
        }])
        const beforeUpdate = JSON.parse(JSON.stringify(queryResults));
        if (queryResults.length > 0) {
            const updateResult = await this.fairDbService.updateC2MProfile(queryResults[0], updateReq)
            if (updateResult) {
                let picode = [
                    ...queryResults[0].fairRegistrationProductInterests.map(data=>data.teCode),
                    ...updateResult.fairRegistrationProductInterests.map(data=>data.teCode)
                ].filter((val,index,arr)=>arr.indexOf(val)==index).join(",");
                let pscode = [
                    ...queryResults[0].fairRegistrationProductStrategies.map(data=>data.fairRegistrationProductStrategyCode),
                    ...updateResult.fairRegistrationProductStrategies.map(data=>data.fairRegistrationProductStrategyCode)
                ].filter((val,index,arr)=>arr.indexOf(val)==index).join(",");
                let tpm = [
                    ...queryResults[0].fairRegistrationPreferredSuppCountryRegions.map(data=>data.fairRegistrationPreferredSuppCountryRegionCode),
                    ...updateResult.fairRegistrationPreferredSuppCountryRegions.map(data=>data.fairRegistrationPreferredSuppCountryRegionCode),
                ].filter((val,index,arr)=>arr.indexOf(val)==index).join(",");

                let productInterests = await this.contentService.retrieveStructureTagDataByTeCode(picode).catch(err=>console.log(err));
                let productStrategies = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataDto>(GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType['product-stragetyV2'], pscode).catch(err=>console.log(err));;
                let targetMarkets = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataDto>(GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType['target-marketV2'], tpm).catch(err=>console.log(err));;
                return {
                    isSuccess: true,
                    "user-activity": {
                        registrationNo: `${updateResult.serialNumber}${updateResult.projectYear?.substring(updateResult.projectYear.length - 2)}${updateResult.sourceTypeCode}${updateResult.visitorTypeCode}${updateResult.projectNumber}`,
                        actionType: "Update C2M Profile",
                        beforeUpdate: beforeUpdate[0],
                        afterUpdate: updateResult,
                        reference: {
                            productInterests,
                            productStrategies,
                            targetMarkets
                        }
                    }
                };
            }
        } else {
            this.logger.error(`Fail to retrieve fair registartion, ssouid: ${ssoUser.ssoUid}, fairCode: ${fairCode}`)
            return {
                isSuccess: false
            };
        }
    }

    public async updateFairParticipantRegistrationRecord(ssoUser: SSOUserHeadersDto, query: UpdateFairParticipantRegistrationRecordDto): Promise<any> {
        this.logger.debug(`updateFairParticipantRegistrationRecord, ssouid: ${ssoUser.ssoUid}, query: ${JSON.stringify(query)}`)

        const { data } = await this.fairService.getWordpressSettings(query.fairCode);
        const fairSettingFairCode = data.data.fair_code as string;
        const fairSettingFiscalYear = data.data.fiscal_year as string;

        const queryResults = await this.fairDbService.queryFairRegByFairCodeSsoUid(ssoUser.ssoUid, ssoUser.emailId, [{
            fairCode: fairSettingFairCode,
            fiscalYear: fairSettingFiscalYear
        }])

        if (queryResults.length > 0) {
            const productInterestDefinitionResp = await this.contentService.retrieveStructureTagDataById(query.productInterest?.join(',') ?? "")
            const productInterestDefinitionList = Object.keys(productInterestDefinitionResp)
                .map(function (key) {
                    return productInterestDefinitionResp[key];
                });

            const updateResult = await this.fairDbService.updateFairParticipantRegistrationRecord(queryResults[0], query, productInterestDefinitionList)
            if (updateResult) {
                return {
                    isSuccess: true,
                    "user-activity": {
                        registrationNo: `${updateResult.serialNumber}${updateResult.projectYear?.substring(updateResult.projectYear.length - 2)}${updateResult.sourceTypeCode}${updateResult.visitorTypeCode}${updateResult.projectNumber}`,
                        beforeUpdate: queryResults[0],
                        afterUpdate: updateResult
                    }
                };
            }
        } else {
            this.logger.error(`Fail to retrieve fair registartion, ssouid: ${ssoUser.ssoUid}, fairCode: ${query.fairCode}`)
            return {
                isSuccess: false
            };
        }
    }

    public async getParticipantRegistrationDetails(query: ParticipantRegistrationBySsouidsDto): Promise<any> {
        const { openFairs, combinedFairByFairDict } = await this.contentCacheService.retrieveOpenFairCombination()

        let currentTime = moment(new Date());
        let output: { ssoUid: string, records: ParticipantRegistrationDetail[] }[] = [];

        await Promise.all(
            query.ssoUids.map(ssoUid => {
                return new Promise<{ ssoUid: string, records: ParticipantRegistrationDetail[], userTimezone: string }>(async (resolve, reject) => {
                    try {

                        const queryConditions: QueryActiveFairParticipantRegistrationsQuery[] = openFairs.map((fair: FairDetail) => {
                            return {
                                ssoUid: ssoUid,
                                fairCode: fair.fair_code,
                                fiscalYear: fair.fiscal_year
                            }
                        });

                        const results: FairRegistration[] = await this.fairDbService.queryActiveFairParticipantRegistrations(queryConditions);

                        let participantRegistrationDetails: ParticipantRegistrationDetail[] = [];
                        if (results !== undefined && results.length > 0) {

                            for (const fairRegistration of results) {
                                // for each db result, retrieve hybrid endpoint from openFairs
                                // check exist combined fair, if yes, override hybrid end date if 
                                // a. sibling fair reg exist, and 
                                // b. sibling fair's has later hybrid date
                                // check isValid (current date < hybrid end date), if yes, push to result array
                                let hybridEndDate = moment.parseZone(`${openFairs.find(x => x.fair_code == fairRegistration.fairCode)!.hybrid_fair_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ');

                                if (combinedFairByFairDict[fairRegistration.fairCode!].length > 1) {
                                    for (let siblingfairCode of combinedFairByFairDict[fairRegistration.fairCode!].filter(x => x != fairRegistration.fairCode)) {
                                        const siblingFairEndDate = moment.parseZone(`${openFairs.find(x => x.fair_code == siblingfairCode)!.hybrid_fair_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ')
                                        if (siblingFairEndDate.isSameOrAfter(hybridEndDate)) {
                                            hybridEndDate = siblingFairEndDate
                                        }
                                    }
                                }
                                if (hybridEndDate.isSameOrAfter(currentTime)) {
                                    await this.convertParticipantRegData(fairRegistration, participantRegistrationDetails);
                                }
                            }
                        }
                        const userRawProfile = await this.buyerService.getBuyerUserRawProfile({ ssoUid });
                        resolve({
                            ssoUid: ssoUid,
                            userTimezone: userRawProfile?.data?.data?.result?.userTimezone || '',
                            records: participantRegistrationDetails
                        });
                    } catch (ex) {
                        reject(ex)
                    }
                })
            })
        ).then((results) => {
            output = results;
        }).catch((ex) => {
            throw new BadRequestException('Failed to retrieve fair registrations');
        })

        return output;
    }

    public async getShortRegistration(query: ParticipantRegistrationBySsouidsDto): Promise<any> {
        const { openFairs, combinedFairByFairDict } = await this.contentCacheService.retrieveOpenFairCombination()

        let currentTime = moment(new Date());
        let output: { ssoUid: string, records: ShortRegistrationDto[] }[] = [];

        await Promise.all(
            query.ssoUids.map(ssoUid => {
                return new Promise<{ ssoUid: string, records: ShortRegistrationDto[] }>(async (resolve, reject) => {
                    try {

                        const queryConditions: QueryActiveFairParticipantRegistrationsQuery[] = openFairs.map((fair: FairDetail) => {
                            return {
                                ssoUid: ssoUid,
                                fairCode: fair.fair_code,
                                fiscalYear: fair.fiscal_year
                            }
                        });

                        const results: FairRegistration[] = await this.fairDbService.queryShortActiveFairParticipantRegistrations(queryConditions);

                        let shortRegList: ShortRegistrationDto[] = [];
                        if (results !== undefined && results.length > 0) {

                            for (const fairRegistration of results) {
                                // for each db result, retrieve hybrid endpoint from openFairs
                                // check exist combined fair, if yes, override hybrid end date if 
                                // a. sibling fair reg exist, and 
                                // b. sibling fair's has later hybrid date
                                // check isValid (current date < hybrid end date), if yes, push to result array
                                let hybridEndDate = moment.parseZone(`${openFairs.find(x => x.fair_code == fairRegistration.fairCode)!.hybrid_fair_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ');

                                if (combinedFairByFairDict[fairRegistration.fairCode!].length > 1) {
                                    for (let siblingfairCode of combinedFairByFairDict[fairRegistration.fairCode!].filter(x => x != fairRegistration.fairCode)) {
                                        const siblingFairEndDate = moment.parseZone(`${openFairs.find(x => x.fair_code == siblingfairCode)!.hybrid_fair_end_datetime} +08:00`, 'YYYY-MM-DD HH:mm ZZ')
                                        if (siblingFairEndDate.isSameOrAfter(hybridEndDate)) {
                                            hybridEndDate = siblingFairEndDate
                                        }
                                    }
                                }
                                if (hybridEndDate.isSameOrAfter(currentTime)) {
                                    await this.convertShortRegData(fairRegistration, shortRegList);
                                }
                            }
                        }
                        resolve({
                            ssoUid: ssoUid,
                            records: shortRegList,
                        });
                    } catch (ex) {
                        reject(ex)
                    }
                })
            })
        ).then((results) => {
            output = results;
        }).catch((ex) => {
            throw new BadRequestException('Failed to retrieve fair registrations');
        })

        return output;
    }

    // public async getParticipantRegistrationDetail(ssoUid: string): Promise<any> {
    //     const results: FairRegistration[] = await this.fairDbService.queryFairParticipantRegistrations(ssoUid);

    //     const test = this.fairDbService.queryFairParticipantRegistrations(ssoUid);
    //     //test.toPro


    //     let participantRegistrationDetails: ParticipantRegistrationDetail[] = [];

    //     if( results !== undefined && results.length > 0 ){
    //         results.forEach(function (fairRegistration) {
    //             convertParticipantRegData(fairRegistration, participantRegistrationDetails);
    //         });
    //     }

    //     return participantRegistrationDetails;
    // }

    public async resolveCouncilCountry(code: string): Promise<AxiosResponse> {
        const baseUri = this.configService.get<string>('api.CONTENT_SERVICE_URI') || '';
        const request = this.httpService.get(`${baseUri}/definition/council/country?type=code&id=${code}`);

        return request.toPromise();
    }

    public async resolveCouncilStateOrProvince(code: string): Promise<AxiosResponse> {
        const baseUri = this.configService.get<string>('api.CONTENT_SERVICE_URI') || '';
        const request = this.httpService.get(`${baseUri}/definition/council/province?type=code&id=${code}`);

        return request.toPromise();
    }

    private async convertParticipantRegData(fairRegistration: FairRegistration, details: ParticipantRegistrationDetail[]) {
        try {
            let councilwiseDataPromiseList: Promise<{ type: string, data: { [key: string]: CouncilwiseDataDto } }>[] = []

            const participantCompanyCountry = fairRegistration.addressCountryCode;
            const participantCompanyStateProvince = fairRegistration.stateOrProvinceCode;
            const participantCompanyCity = fairRegistration.cityCode;

            if (participantCompanyCountry) {
                councilwiseDataPromiseList.push(
                    this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(GeneralDefinitionDataRequestDTOType.code,
                        CouncilwiseDataType.country, participantCompanyCountry
                    ).then((result) => {
                        return {
                            type: "country",
                            data: result
                        }
                    })
                )

                if (participantCompanyStateProvince) {
                    councilwiseDataPromiseList.push(
                        this.contentService.retrieveCouncilwiseProvinceBy(GeneralDefinitionDataRequestDTOType.code,
                            participantCompanyCountry,
                            participantCompanyStateProvince
                        ).then((result) => {
                            return {
                                type: "stateProvince",
                                data: result
                            }
                        })
                    )
                    if (participantCompanyCity) {
                        councilwiseDataPromiseList.push(
                            this.contentService.retrieveCouncilwiseCityBy(GeneralDefinitionDataRequestDTOType.code,
                                participantCompanyCountry,
                                participantCompanyStateProvince,
                                participantCompanyCity
                            ).then((result) => {
                                return {
                                    type: "city",
                                    data: result
                                }
                            })
                        )
                    }
                }
            }

            if (fairRegistration.fairRegistrationNobs && fairRegistration.fairRegistrationNobs.length) {
                const nobQueryIdStr = fairRegistration.fairRegistrationNobs.map(x => x.fairRegistrationNobCode).join(',')
                councilwiseDataPromiseList.push(
                    this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
                        GeneralDefinitionDataRequestDTOType.code,
                        CouncilwiseDataType.nob,
                        nobQueryIdStr
                    ).then((result) => {
                        return {
                            type: 'nob',
                            data: result
                        }
                    })
                )
            }

            if (fairRegistration.fairRegistrationPreferredSuppCountryRegions && fairRegistration.fairRegistrationPreferredSuppCountryRegions.length) {
                const targetMarketQueryIdStr = fairRegistration.fairRegistrationPreferredSuppCountryRegions.map(x => x.fairRegistrationPreferredSuppCountryRegionCode).join(',')
                councilwiseDataPromiseList.push(
                    this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
                        GeneralDefinitionDataRequestDTOType.code,
                        CouncilwiseDataType['target-marketV2'],
                        targetMarketQueryIdStr
                    ).then((result) => {
                        return {
                            type: 'targetMarket',
                            data: result
                        }
                    })
                )
            }

            let councilwiseDataQueryResult: { [key: string]: CouncilwiseDataResponseDto } = {}
            await Promise.all(councilwiseDataPromiseList).then((results) => {
                councilwiseDataQueryResult = results.reduce((aggResult: { [key: string]: CouncilwiseDataResponseDto }, result: { type: string, data: CouncilwiseDataResponseDto }) => {
                    aggResult[result.type] = result.data
                    return aggResult;
                }, {})
            })

            const stIdQueryIdStr = fairRegistration.fairRegistrationProductInterests.map(x => x.stId).join(',')
            const stIdQueryResult = await this.contentService.retrieveStructureTagDataById(stIdQueryIdStr)

            const registrationNo = `${fairRegistration.serialNumber}${fairRegistration.projectYear?.substring(fairRegistration.projectYear.length - 2)}${fairRegistration.sourceTypeCode}${fairRegistration.visitorTypeCode}${fairRegistration.projectNumber}`

            let detail: ParticipantRegistrationDetail = new ParticipantRegistrationDetail();
            detail.ssoUid = fairRegistration.fairParticipant?.ssoUid;
            detail.fairCode = fairRegistration.fairCode;
            detail.fiscalYear = fairRegistration.fiscalYear;
            detail.emailId = fairRegistration.fairParticipant?.emailId;
            detail.registrationNo = registrationNo
            detail.title = fairRegistration.title;
            detail.firstName = fairRegistration.firstName;
            detail.lastName = fairRegistration.lastName;
            detail.displayName = fairRegistration.displayName;
            detail.initial = NameHelper.GenerateInitial(fairRegistration.firstName, fairRegistration.lastName);
            detail.position = fairRegistration.position;
            detail.companyName = fairRegistration.companyName;
            if (participantCompanyCountry) {
                detail.addressCountryCode =
                    councilwiseDataQueryResult["country"] && councilwiseDataQueryResult["country"][participantCompanyCountry]
                        ? convertNestedObject(councilwiseDataQueryResult["country"][participantCompanyCountry].code, councilwiseDataQueryResult["country"][participantCompanyCountry].en, councilwiseDataQueryResult["country"][participantCompanyCountry].sc, councilwiseDataQueryResult["country"][participantCompanyCountry].tc)
                        : null
            }
            detail.addressLine1 = fairRegistration.addressLine1;
            detail.addressLine2 = fairRegistration.addressLine2;
            detail.addressLine3 = fairRegistration.addressLine3;
            detail.addressLine4 = fairRegistration.addressLine4;
            detail.postalCode = fairRegistration.postalCode;
            if (participantCompanyStateProvince) {
                detail.stateOrProvinceCode =
                    councilwiseDataQueryResult["stateProvince"] && councilwiseDataQueryResult["stateProvince"][participantCompanyStateProvince]
                        ? convertNestedObject(councilwiseDataQueryResult["stateProvince"][participantCompanyStateProvince].code, councilwiseDataQueryResult["stateProvince"][participantCompanyStateProvince].en, councilwiseDataQueryResult["stateProvince"][participantCompanyStateProvince].sc, councilwiseDataQueryResult["stateProvince"][participantCompanyStateProvince].tc)
                        : null
            }
            if (participantCompanyCity) {
                detail.cityCode =
                    councilwiseDataQueryResult["city"] && councilwiseDataQueryResult["city"][participantCompanyCity]
                        ? convertNestedObject(councilwiseDataQueryResult["city"][participantCompanyCity].code, councilwiseDataQueryResult["city"][participantCompanyCity].en, councilwiseDataQueryResult["city"][participantCompanyCity].sc, councilwiseDataQueryResult["city"][participantCompanyCity].tc)
                        : null
            }
            detail.companyPhoneCountryCode = fairRegistration.companyPhoneCountryCode;
            detail.companyPhonePhoneNumber = fairRegistration.companyPhonePhoneNumber;
            detail.companyWebsite = fairRegistration.companyWebsite;
            detail.companyBackground = fairRegistration.companyBackground;

            detail.mobilePhoneCountryCode = fairRegistration.mobilePhoneCountryCode
            detail.mobilePhoneNumber = fairRegistration.mobilePhoneNumber

            detail.nob = []
            fairRegistration.fairRegistrationNobs?.forEach(function (nob) {
                const nobResult = councilwiseDataQueryResult['nob'][nob.fairRegistrationNobCode]
                if (nobResult) {
                    let result = convertNestedObject(nobResult.code, nobResult.en, nobResult.sc, nobResult.tc)
                    detail.nob.push(result);
                }
            });

            detail.productInterest = [];
            fairRegistration.fairRegistrationProductInterests?.forEach(function (interest) {
                const sTTagResult = stIdQueryResult[interest.stId]
                if (sTTagResult) {
                    let result = convertProductInterest(sTTagResult);
                    const existIA = detail.productInterest.find(x => x.ia_id == result.ia_id)
                    if (existIA) {
                        existIA.st.push(result.st[0])
                    } else {
                        detail.productInterest.push(result);
                    }
                }
            });

            detail.otherProductCategories = [];

            detail.productStrategy = [];
            fairRegistration.fairRegistrationProductStrategies?.forEach(function (strategies) {
                detail.productStrategy.push(strategies.fairRegistrationProductStrategyCode);
            });

            detail.targetPreferredMarkets = []
            fairRegistration.fairRegistrationPreferredSuppCountryRegions?.forEach(function (preferredSuppCountryRegion) {
                const targetMarketResult = councilwiseDataQueryResult['targetMarket'][preferredSuppCountryRegion.fairRegistrationPreferredSuppCountryRegionCode]
                if (targetMarketResult) {
                    let result = convertNestedObject(targetMarketResult.code, targetMarketResult.en, targetMarketResult.sc, targetMarketResult.tc)
                    detail.targetPreferredMarkets.push(result);
                }
            });

            detail.companyLogo = "" // br_company_logo, TBC

            detail.numberOfOutlets = this.BMListToNestedObjectList(fairRegistration.fairRegistrationDynamicBms, "br_outlets_no")
            detail.hotel = this.BMListToNestedObjectList(fairRegistration.fairRegistrationDynamicBms, "br_hotel_list")
            detail.roomType = this.BMListToNestedObjectList(fairRegistration.fairRegistrationDynamicBms, "br_room_type")
            detail.sourcingBudget = this.BMListToNestedObjectList(fairRegistration.fairRegistrationDynamicBms, "br_bm_sourcing_budget")
            detail.interestedIn = this.BMListToNestedObjectList(fairRegistration.fairRegistrationDynamicBms, "br_bm_interested_in")
            detail.pricePoint = this.BMListToNestedObjectList(fairRegistration.fairRegistrationDynamicBms, "br_bm_price_point")
            detail.lowMOQ = this.BMListToNestedObjectList(fairRegistration.fairRegistrationDynamicBms, "br_bm_low_moq")
            detail.prescreeningByHKTDC = this.BMListToNestedObjectList(fairRegistration.fairRegistrationDynamicBms, "br_bm_pre_screening")
            detail.fairVisit = this.BMListToNestedObjectList(fairRegistration.fairRegistrationDynamicBms, "br_bm_fair_visit")
            detail.preferredTimeslot = this.BMListToNestedObjectList(fairRegistration.fairRegistrationDynamicBms, "br_bm_prefer_timeslot")

            detail.registrationType = fairRegistration.fairRegistrationType?.fairRegistrationTypeCode;
            detail.registrationStatus = fairRegistration.fairRegistrationStatus?.fairRegistrationStatusCode;
            detail.participantType = fairRegistration.fairParticipantType?.fairParticipantTypeCode;
            detail.click2MatchStatus = fairRegistration.c2mParticipantStatus?.c2mParticipantStatusCode;

            detail.overseasBranchOffice = fairRegistration.overseasBranchOffice;

            details.push(detail);
        } catch (error) {
            if (error.name === 'VepError') {
                throw new VepError(error.vepErrorMsg, error.errorDetail);
            }
            throw new VepError(VepErrorMsg.Profile_Data_Convert_Error, error.message)
        }
    }

    private async convertShortRegData(fairRegistration: FairRegistration, shortRegList: ShortRegistrationDto[]) {
        try {
            let councilwiseDataPromiseList: Promise<{ type: string, data: { [key: string]: CouncilwiseDataDto } }>[] = []

            const participantCompanyCountry = fairRegistration.addressCountryCode;
            if (participantCompanyCountry) {
                councilwiseDataPromiseList.push(
                    this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(GeneralDefinitionDataRequestDTOType.code,
                        CouncilwiseDataType.country, participantCompanyCountry
                    ).then((result) => {
                        return {
                            type: "country",
                            data: result
                        }
                    })
                )
            }
            let councilwiseDataQueryResult: { [key: string]: CouncilwiseDataResponseDto } = {}
            await Promise.all(councilwiseDataPromiseList).then((results) => {
                councilwiseDataQueryResult = results.reduce((aggResult: { [key: string]: CouncilwiseDataResponseDto }, result: { type: string, data: CouncilwiseDataResponseDto }) => {
                    aggResult[result.type] = result.data
                    return aggResult;
                }, {})
            })

            let shortReg: ShortRegistrationDto = new ShortRegistrationDto();
            shortReg.ssoUid = fairRegistration.fairParticipant?.ssoUid;
            shortReg.fairCode = fairRegistration.fairCode;
            shortReg.fiscalYear = fairRegistration.fiscalYear;
            shortReg.emailId = fairRegistration.fairParticipant?.emailId;
            shortReg.registrationNo = `${fairRegistration.serialNumber}${fairRegistration.projectYear?.substring(fairRegistration.projectYear.length - 2)}${fairRegistration.sourceTypeCode}${fairRegistration.visitorTypeCode}${fairRegistration.projectNumber}`
            shortReg.title = fairRegistration.title;
            shortReg.firstName = fairRegistration.firstName;
            shortReg.lastName = fairRegistration.lastName;
            shortReg.displayName = fairRegistration.displayName;
            shortReg.initial = NameHelper.GenerateInitial(fairRegistration.firstName, fairRegistration.lastName);
            shortReg.position = fairRegistration.position;
            shortReg.companyName = fairRegistration.companyName;
            if (participantCompanyCountry) {
                shortReg.addressCountryCode =
                    councilwiseDataQueryResult["country"] && councilwiseDataQueryResult["country"][participantCompanyCountry]
                        ? convertNestedObject(councilwiseDataQueryResult["country"][participantCompanyCountry].code, councilwiseDataQueryResult["country"][participantCompanyCountry].en, councilwiseDataQueryResult["country"][participantCompanyCountry].sc, councilwiseDataQueryResult["country"][participantCompanyCountry].tc)
                        : null
            }

            shortReg.overseasBranchOffice = fairRegistration.overseasBranchOffice;

            shortRegList.push(shortReg);
        } catch (error) {
            if (error.name === 'VepError') {
                throw new VepError(error.vepErrorMsg, error.errorDetail);
            }
            throw new VepError(VepErrorMsg.Profile_Data_Convert_Error, error.message)
        }
    }

    private BMListToNestedObjectList(fairRegistrationDynamicBmList: FairRegistrationDynamicBm[], formFieldId: string): FairParticipantRegistrationNestedObject[] {
        const BMList = fairRegistrationDynamicBmList?.filter(x => x.formFieldId == formFieldId) ?? []

        return BMList.map(x => {
            return {
                code: x.value ?? "",
                en: x.valueEn ?? "",
                tc: x.valueTc ?? "",
                sc: x.valueSc ?? "",
            }
        }) ?? []
    }

    public async getFairParticipantInflencingDetail(ssoUid: string, query: FairParticipantInflencingReqDto): Promise<FairParticipantInflencingDetailRespDto> {
        let siblingFairCodes: string[] = []

        await this.fairService.getAdminCombinedFairSettings(query.fairCode, query.fiscalYear)
            .then(combineFairSettingResp => {
                siblingFairCodes = combineFairSettingResp.data.data
            }).catch((ex) => {
                console.log(ex)
                siblingFairCodes = [query.fairCode]
            });

        const fairRegList = await this.fairDbService.queryActiveFairRegistrationsBySsoUid(ssoUid, query, siblingFairCodes)
        if (fairRegList.length > 0) {

            let addressRegion: string = ""
            if (fairRegList[0].addressCountryCode) {
                const regionCountry = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseAddressRegionResponseDto>(
                    GeneralDefinitionDataRequestDTOType.code,
                    CouncilwiseDataType['region-country'],
                    fairRegList[0].addressCountryCode)
                addressRegion = regionCountry[fairRegList[0].addressCountryCode]?.region_code ?? ""
            }

            let result: FairParticipantInflencingDetailRespDto = {
                targetPreferredMarkets: [],
                nob: [],
                productStrategy: [],
                productInterest: [],
                addressRegion,
            }

            return fairRegList.reduce((aggResult: FairParticipantInflencingDetailRespDto, fairReg) => {
                const processedFairReg = {
                    targetPreferredMarkets: fairReg.fairRegistrationPreferredSuppCountryRegions?.map(x => x.fairRegistrationPreferredSuppCountryRegionCode) ?? [],
                    nob: fairReg.fairRegistrationNobs?.map(x => x.fairRegistrationNobCode) ?? [],
                    productStrategy: fairReg.fairRegistrationProductStrategies?.map(x => x.fairRegistrationProductStrategyCode) ?? [],
                    productInterest: fairReg.fairRegistrationProductInterests?.map(x => {
                        return {
                            stId: x.stId,
                            iaId: x.iaId,
                        }
                    }) ?? [],
                    addressRegion,
                }
                processedFairReg.targetPreferredMarkets.forEach((item) => {
                    if (!aggResult.targetPreferredMarkets.find(x => x == item)) {
                        aggResult.targetPreferredMarkets.push(item)
                    }
                })
                processedFairReg.nob.forEach((item) => {
                    if (!aggResult.nob.find(x => x == item)) {
                        aggResult.nob.push(item)
                    }
                })
                processedFairReg.productStrategy.forEach((item) => {
                    if (!aggResult.productStrategy.find(x => x == item)) {
                        aggResult.productStrategy.push(item)
                    }
                })
                processedFairReg.productInterest.forEach((item) => {
                    if (!aggResult.productInterest.find(x => x.stId == item.stId)) {
                        aggResult.productInterest.push(item)
                    }
                })
                return aggResult
            }, result)
        } else {
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Fail to retrieve profile, ssoUid: ${ssoUid}, fairCode: ${query.fairCode}, fiscalYear: ${query.fiscalYear}`)
        }
    }

    public async searchC2mExcludedParticipants(query: SearchC2mExcludedParticipantDto) {
        let searchObj: SearchC2mExcludedParticipantObj
        try {
            searchObj = JSON.parse(Buffer.from(query.fairs, 'base64').toString())
        } catch {
            throw new VepError(VepErrorMsg.Profile_Fairs_Invalid, `Failed to retieve fairs from query, query.fairs: ${query.fairs}`)
        }

        let siblingFairCodes: string[] = []

        await this.fairService.getAdminCombinedFairSettings(searchObj.fairCode, searchObj.fiscalYear)
            .then(combineFairSettingResp => {
                siblingFairCodes = combineFairSettingResp.data.data
            }).catch((ex) => {
                console.log(ex)
                siblingFairCodes = [searchObj.fairCode]
            });

        const searchByFairListObj: SearchC2mExcludedParticipantByFairListObj = {
            fairCodeList: siblingFairCodes,
            fiscalYear: searchObj.fiscalYear
        }
        const c2mExcludedParticipants: FairRegistration[] = await this.fairDbService.queryC2mExcludedParticipants(searchByFairListObj)

        const ssoUidList = c2mExcludedParticipants.filter(x => x.fairParticipant.ssoUid).map((fairReg: FairRegistration) => {
            return {
                ssoUid: fairReg.fairParticipant.ssoUid,
                fairCode: searchObj.fairCode,
                fiscalYear: searchObj.fiscalYear
            }
        })

        let formattedData: any = {
        };

        ssoUidList.forEach(row => {
            formattedData['fairs'] = formattedData['fairs'] ?? {}
            formattedData['fairs'][row.fairCode] = formattedData['fairs'][row.fairCode] ?? {}
            formattedData['fairs'][row.fairCode][row.fiscalYear] = [...(formattedData['fairs'][row.fairCode][row.fiscalYear] ?? []), row.ssoUid]
        })

        return formattedData
    }

    public async getCombinedFairList(ssoUser: SSOUserHeadersDto): Promise<GetCombinedFairListRespDto[]> {
        const { ssoUid } = ssoUser

        // for all registered fair, get fair code list
        const fairCodeList = await this.profileDbService.queryRegisteredFairCodeList(ssoUid)

        // for each fair code, get combined fair
        const combinedFairList = await Promise.all(
            fairCodeList.map(fairCode => {
                return new Promise<GetCombinedFairListRespDto>(async (resolve, reject) => {
                    try {
                        const { data } = await this.fairService.getWordpressCombinedFairSettings(fairCode);
                        const combinedFairDataObj = JSON.parse(data.data)

                        let combinedFair: GetCombinedFairListRespDto = {
                            combinationName: combinedFairDataObj.data["combination_name"],
                            fairList: combinedFairDataObj.data["combined-fair"].map(
                                (x: { url: string }) => {
                                    return new FairNameDto(x.url)
                                }
                            )
                        }
                        resolve(combinedFair)
                    } catch (ex) {
                        let combinedFair: GetCombinedFairListRespDto = {
                            combinationName: fairCode,
                            fairList: [new FairNameDto(fairCode)]
                        }
                        resolve(combinedFair)
                    }
                })
            })
        ).then((results) => {
            let deduplicatedArray: GetCombinedFairListRespDto[] =
                results.reduce((aggResult: GetCombinedFairListRespDto[], result: GetCombinedFairListRespDto) => {
                    if (!aggResult.find(x => x.combinationName == result.combinationName)) {
                        aggResult.push(result)
                    }
                    return aggResult;
                }, [])
            return deduplicatedArray
        })

        const deduplicatedFairCodeList = combinedFairList.flatMap(x => x.fairList).map(x => x.fairCode)

        // for each child fair code, retrieve fair display name
        const fairDisplayNameList = await Promise.all(
            deduplicatedFairCodeList.map((fairCode) => {
                return new Promise<FairNameDto>(async (resolve, reject) => {
                    try {
                        const fairSetting = await this.fairService.getWordpressSettings(fairCode);
                        resolve(new FairNameDto(fairCode, fairSetting.data.data["fair_display_name"]))
                    } catch (ex) {
                        throw new VepError(VepErrorMsg.Profile_FailToRetrieveFairSetting, `Fail to retrieve fair setting, fairCode ${fairCode}`)
                    }
                })
            })
        )

        combinedFairList.forEach( combinedFair => {
            combinedFair.fairList.forEach(fair => {
                const fairSettingDisplayName = fairDisplayNameList.find(x => x.fairCode == fair.fairCode)
                if(fairSettingDisplayName){
                    fair.fairDisplayName = fairSettingDisplayName.fairDisplayName
                }
            });
        })

        return combinedFairList
    }

    private retrieveFairParticipantTypeId(fairReg: FairRegistration): number {
        try {
            if (fairReg.fairParticipantTypeId) {
                return parseInt(fairReg.fairParticipantTypeId)
            } else {
                throw new VepError(VepErrorMsg.Profile_Invalid_Data, `fairParticipantTypeId is empty`)
            }
        }
        catch (ex) {
            throw new VepError(VepErrorMsg.Profile_Invalid_Data, `Could not convert fairParticipantTypeId, fairReg id ${fairReg.id}, fairCode: ${fairReg.fairCode}, fiscalYear: ${fairReg.fiscalYear}, fairParticipantId: ${fairReg.fairParticipantId}, ex ${ex}`)
        }
    }

    public async retrieveCombinedFairData(ssoUid: string, request: ProfileForEditReqByFairCodeDto): Promise<CombinedFairFormDataRespDto> {
        const { fairCode, lang } = request

        // get combined fair
        const combinedFairList = (await this.fairService.getCombinedFairByFairDict([fairCode]))[fairCode]

        const fairSettingHandlerList = await Promise.all(
            combinedFairList.map(combinedFairCodeItem => this.contentService.retrieveFairSettingHandlder(combinedFairCodeItem))
        )

        const fairTuples: { fairCode: string, fiscalYear: string }[] = fairSettingHandlerList.map(settingHandler => {
            return {
                fairCode: settingHandler.fairCode,
                fiscalYear: settingHandler.retieveFairSettingStrByKey(FairSettingKeyEnum.fiscalYear).returnNonNullValue() ,
            }
        })

        const fairRegList = await this.profileDbService.queryFairRegProfileForEditByQueryBuilder(ssoUid, fairTuples)

        let formDataPerFair: FormDataPerFair[] = await Promise.all(
            fairSettingHandlerList.map(settingHandler => {
                return new Promise<FormDataPerFair>(async (resolve, reject) => {
                    try {
                        const { fairCode } = settingHandler
                        const registeredFairReg = fairRegList.find(fairReg => fairReg.fairCode == fairCode)
                        let isRegistered = false, formSlug = "", showInProfileDataList: ShowInProfileDto[] = [], errorMessage = ""
                        if (registeredFairReg) {
                            isRegistered = true
            
                            const fairParticipantTypeId = this.retrieveFairParticipantTypeId(registeredFairReg)
                            const shortSlug = settingHandler.retrieveShortSlugForProfileEdit(fairParticipantTypeId).returnValue()

                            if (shortSlug) {
                                formSlug = ContentUtil.convertToFullPathSlug(fairCode, lang, shortSlug)
                                try {
                                    const multiLangTemplate =  await this.contentService.returnMultiLangTemplate(fairCode, lang, shortSlug)
                                    showInProfileDataList = await this.convertFairRegToShowInProfileDataList(registeredFairReg, lang, multiLangTemplate)
                                } catch (ex){
                                    errorMessage = ex.errorDetail ?? ex.message
                                    this.logger.FATAL('', '', errorMessage, this.retrieveCombinedFairData.name, { fairCode, formSlug})
                                }
                            }
                        } else {
                            const shortSlug = settingHandler.retrieveShortSlugForProfileEdit(1).returnValue()
                            if (shortSlug) {
                                formSlug = ContentUtil.convertToFullPathSlug(fairCode, lang, shortSlug)
                            }
                        }
                        resolve({
                            fairCode,
                            fiscalYear: settingHandler.retieveFairSettingStrByKey(FairSettingKeyEnum.fiscalYear).returnNonNullValue(),
                            fairDisplayName: settingHandler.retieveFairSettingObjByKey<MultiLangNameDto>(FairSettingKeyEnum.fairDisplayName).returnNonNullValue(),
                            fairRegistrationToggle: settingHandler.retieveFairSettingBooleanByKey(FairSettingKeyEnum.fairRegistrationToggle).returnValue(),
                            fairRegistrationStartDatetime: settingHandler.retieveFairSettingStrByKey(FairSettingKeyEnum.fairRegistrationStartDatetime).returnValue() ?? "",
                            fairRegistrationEndDatetime: settingHandler.retieveFairSettingStrByKey(FairSettingKeyEnum.fairRegistrationEndDatetime).returnValue() ?? "",
                            vmsProjectCode:  settingHandler.retieveFairSettingStrByKey(FairSettingKeyEnum.vmsProjectCode).returnValue() ?? "",
                            vmsProjectYear: settingHandler.retieveFairSettingStrByKey(FairSettingKeyEnum.vmsProjectYear).returnValue() ?? "",
                            isRegistered,
                            formSlug,
                            showInProfileDataList,
                            errorMessage,
                        })
                    } catch (ex) {
                        reject(ex)
                    }
                })
            })
        )

        const ssoProfile = await this.buyerService.getSsoProfile(ssoUid)

        const participantCompanyCountry = ssoProfile.countryCode ?? ""
        let addressCountryCode = { code: participantCompanyCountry, en: participantCompanyCountry, tc: participantCompanyCountry, sc: participantCompanyCountry }

        if (participantCompanyCountry) {
            const countryDef = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
                GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.country, participantCompanyCountry)
            if (countryDef[participantCompanyCountry]){
                addressCountryCode = countryDef[participantCompanyCountry]
            }
        }

        const nobRawJson = await this.contentCacheService.retrieveRawJson('NOB')

        const nob = ssoProfile.natureOfBusiness.map(nob => {
            const nobDef = nobRawJson["code"][nob]
            return nobDef ? nobDef : { code: nob, en: "", tc: "", sc: "", }
        }) ?? []

        let mobilePhoneCountryCode = ssoProfile.mobilePhoneCountryCode
        if (ssoProfile.mobilePhoneCountryCode){
            const iddCountryDef = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
                GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType['idd-country'], ssoProfile.mobilePhoneCountryCode)
            if (iddCountryDef[ssoProfile.mobilePhoneCountryCode]){
                mobilePhoneCountryCode = iddCountryDef[ssoProfile.mobilePhoneCountryCode].code
            }
        }

        return {
            companyName: ssoProfile.companyName,
            addressCountryCode,
            emailId: ssoProfile.email,
            mobilePhoneCountryCode,
            mobilePhoneNumber: ssoProfile.mobilePhoneNumber,
            companyWebsite: ssoProfile.companyWebsite,
            companyBackground: ssoProfile.companyBackground,
            nob,
            title: ssoProfile.title,
            firstName: ssoProfile.firstName,
            lastName: ssoProfile.lastName,
            initial: NameHelper.GenerateInitial(ssoProfile.firstName, ssoProfile.lastName),
            displayName: NameHelper.GenerateDisplayName(ssoProfile.firstName, ssoProfile.lastName),
            position: ssoProfile.position,
            formDataPerFair,
        }
    }

    private convertFairRegToShowInProfileDataList(fairReg: FairRegistration, lang: "en" | "tc" | "sc", multiLangFormTemplate: MuiltiLangFormTemplate): ShowInProfileDto[] {
        let showInProfileDataList: ShowInProfileDto[] = []

        const fairRegDynamicBmsFieldId = fairReg.fairRegistrationDynamicBms.map(x => x.formFieldId)
        const fairRegDynamicOthersFieldId = fairReg.fairRegistrationDynamicOthers.map(x => x.formFieldId)

        const multiLangTemplateHandler = new MultiLangTemplateHandler(multiLangFormTemplate, lang)
        const formTemplateDict = multiLangTemplateHandler.getFormDataDictByAnchor()
        
        for (let fieldId of Object.keys(formTemplateDict)) {
            const formFieldTemplate = formTemplateDict[fieldId]
            if (formFieldTemplate.show_in_profile === true) {
                const onlyVisibleToYou = formFieldTemplate.show_to_exhibitor !== true
                const fieldType = formFieldTemplate.field_type
                // case 1 : special handling for product interest
                if (Object.keys(ProductInterestFieldId).includes(fieldId)){
                    showInProfileDataList.push(...this.retrieveProductInterestBuyerDetailEntryDto(fairReg, fieldId, fieldType, lang, multiLangTemplateHandler).map(dto => {
                        return {
                            onlyVisibleToYou,
                            ...dto
                        }
                    }))
                }
                // case 2: converted from db records if stored in DynamicBms/ DynamicOthers
                else if (fairRegDynamicBmsFieldId.includes(fieldId)){
                    let dynamicBMValueList = fairReg.fairRegistrationDynamicBms.filter(x => x.value && x.formFieldId == fieldId).map(x => x.value!)
                    if (dynamicBMValueList.length == 0) {
                        dynamicBMValueList.push("")
                    } 

                    const mappedBMValueList = dynamicBMValueList.map(dynamicBMValue => {
                        return multiLangTemplateHandler.getFieldDetailByLang(fieldId, dynamicBMValue, lang)
                    }) 
                    let label = mappedBMValueList[0].label
                    let fieldType = mappedBMValueList[0].fieldType

                    showInProfileDataList.push({
                        fieldId,
                        label,
                        fieldType,
                        onlyVisibleToYou,
                        values: mappedBMValueList.map(mappedBMValue => {
                            return new BuyerDetailEntryMappedValueDto(mappedBMValue.formFieldValue, mappedBMValue.value)
                        })
                    })
                } else if (fairRegDynamicOthersFieldId.includes(fieldId)){
                    let dynamicOthersValueList = fairReg.fairRegistrationDynamicOthers.filter(x => x.value && x.formFieldId == fieldId).map(x => x.value!)
                    if (dynamicOthersValueList.length == 0) {
                        dynamicOthersValueList.push("")
                    } 

                    const mappedOthersValueList = dynamicOthersValueList.map(dynamicOthersValue => {
                        return multiLangTemplateHandler.getFieldDetailByLang(fieldId, dynamicOthersValue, lang)
                    }) 
                    let label = mappedOthersValueList[0].label
                    let fieldType = mappedOthersValueList[0].fieldType

                    showInProfileDataList.push({
                        fieldId,
                        label,
                        fieldType,
                        onlyVisibleToYou,
                        values: mappedOthersValueList.map(mappedOthersValue => {
                            return new BuyerDetailEntryMappedValueDto(mappedOthersValue.formFieldValue, mappedOthersValue.value)
                        })
                    })
                } else {
                    // case 3: output from field value/ mapped from form template
                    const retrievedValueList = FormCommonUtil.convertFairRegToDedicatedFieldDataStrArray(fairReg, fieldId, formFieldTemplate)
                    if (retrievedValueList.length == 0) {
                        retrievedValueList.push("")
                    }

                    const mappedValueList = retrievedValueList.map(value => {
                        return multiLangTemplateHandler.getFieldDetailByLang(fieldId, value, lang)
                    }) 

                    let label = mappedValueList[0].label
                    let fieldType = mappedValueList[0].fieldType

                    showInProfileDataList.push({
                        fieldId,
                        label,
                        fieldType,
                        onlyVisibleToYou,
                        values: mappedValueList.map(mappedValue => {
                            return {
                                fieldValue: mappedValue.formFieldValue,
                                mappedValue: mappedValue.value
                            }
                        })
                    })
                }
            }
        }

        return showInProfileDataList
    }

    private retrieveProductInterestBuyerDetailEntryDto(fairReg: FairRegistration, fieldId: string, fieldType: string, lang: "en" | "tc" | "sc", multiLangTemplateHandler: MultiLangTemplateHandler): BuyerDetailEntryDto[] {
        let productInterestShowInProfileDataList: BuyerDetailEntryDto[] = []
        const teCodeList = fairReg.fairRegistrationProductInterests.map(x => x.teCode)
        
        const aggProductInterest = multiLangTemplateHandler.getProductInterestAggDetails(teCodeList, "", fieldId)
        const productInterestOtherFieldId = aggProductInterest.productInterestOther.formFieldId
        const productInterestOtherValue = fairReg.fairRegistrationDynamicOthers.find(x => x.formFieldId == productInterestOtherFieldId && x.value)?.value ?? ""
        aggProductInterest.productInterestOther.formFieldValue = productInterestOtherValue
        aggProductInterest.productInterestOther.valueEn = productInterestOtherValue
        aggProductInterest.productInterestOther.valueTc = productInterestOtherValue
        aggProductInterest.productInterestOther.valueSc = productInterestOtherValue

        let label = ""
        switch (lang){
            case "en":
                label = aggProductInterest.labelEn
                break
            case "tc":
                label = aggProductInterest.labelTc
                break
            case "sc":
                label = aggProductInterest.labelSc
                break
        }
        productInterestShowInProfileDataList.push({
            fieldId,
            label,
            fieldType,
            values: aggProductInterest.productInterestList.map( groupedPI => {
                let mappedValue = ""
                switch (lang){
                    case "en":
                        mappedValue = `${groupedPI.ia_en} - ${groupedPI.st.map(x => x.st_en).join(', ')}`
                        break
                    case "tc":
                        mappedValue = `${groupedPI.ia_tc} - ${groupedPI.st.map(x => x.st_tc).join(', ')}`
                        break
                    case "sc":
                        mappedValue = `${groupedPI.ia_sc} - ${groupedPI.st.map(x => x.st_tc).join(', ')}`
                        break
                }
                return new BuyerDetailEntryMappedValueDto(
                    groupedPI.st.map(x => x.te_code).join(','),
                    mappedValue
                )
            })
        })
        if (aggProductInterest.productInterestOther.formFieldValue) {
            productInterestShowInProfileDataList.push({
                fieldId: aggProductInterest.productInterestOther.formFieldId ?? "",
                label: aggProductInterest.productInterestOther.labelEn ?? "",
                fieldType: aggProductInterest.productInterestOther.fieldType,
                values: [
                    new BuyerDetailEntryMappedValueDto(aggProductInterest.productInterestOther.valueEn, 
                        aggProductInterest.productInterestOther.valueEn)
                ]
            })
        }
        return productInterestShowInProfileDataList
    }

    public async retrieveProfileForFrontEnd(ssoUid: string, request: ProfileForEditReqByFairCodeDto): Promise<ProfileForEditRespDto> {
        const { fairCode, lang } = request

        const fairSetting = await this.contentService.retrieveFairSetting(fairCode);
        const fiscalYear = ContentUtil.retieveFairSettingByKey<string>(fairCode, fairSetting, FairSettingKeyEnum.fiscalYear)

        //retrieve fair reg by fairCode, fiscalYear and ssouid
        const fairReg = await this.profileDbService.queryFairRegProfileForEdit('frontend', 0, ssoUid, fairCode, fiscalYear)

        if (fairReg == null) {
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Could not find fair registration by ssoUid: ${ssoUid}, fairCode: ${fairCode}, fiscalYear: ${fiscalYear}`)
        }

        const fairParticipantTypeId = this.retrieveFairParticipantTypeId(fairReg)

        const formSlug = ContentUtil.retrieveFormSlugForProfileEdit(fairCode, fairSetting, fairParticipantTypeId, lang)

        const formTemplate = await this.contentService.retrieveFormTemplate(fairCode, formSlug, lang)

        const formDataPerSlug = FormCommonUtil.convertFairRegToFormDataJson(fairReg, formTemplate)

        return new ProfileForEditRespDto(formDataPerSlug, formSlug, fairCode)
    }

    public async updateProfileByFormData(ssoUid: string, updateReq: UpdateProfileFrontendReqDto): Promise<UpdateProfileFrontendRespDto> {
        const { fairCode, lang } = updateReq

        const fairSetting = await this.contentService.retrieveFairSetting(fairCode);
        const fiscalYear = ContentUtil.retieveFairSettingByKey<string>(fairCode, fairSetting, FairSettingKeyEnum.fiscalYear)

        //retrieve fair reg by fairCode, fiscalYear and ssouid
        const fairReg = await this.profileDbService.queryFairRegProfileForEdit('frontend', 0, ssoUid, fairCode, fiscalYear)

        if (fairReg == null) {
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Could not find fair registration by ssoUid: ${ssoUid}, fairCode: ${fairCode}, fiscalYear: ${fiscalYear}`)
        }

        const fairParticipantTypeId = this.retrieveFairParticipantTypeId(fairReg)

        const formSlug = ContentUtil.retrieveFormSlugForProfileEdit(fairCode, fairSetting, fairParticipantTypeId, lang)

        const formTemplate = await this.contentService.retrieveFormTemplate(fairCode, formSlug, lang)

        // validate with edit form logic
        // strip sso field and field with edit_in_profile != true
        const editFormData: EditFormDataDto = {
            data: this.wordpressFormValidationService.stripDataForEditFormValidation(formTemplate, updateReq.formDataJson)
        }

        const editFormValidationErrors = await this.wordpressFormValidationService.editFormValidation(formTemplate, editFormData)

        if (editFormValidationErrors.length > 0) {
            return {
                isSuccess: false,
                editFormValidationErrors, 
            }
        }

        const profileEditDto: ProfileEditDto = await this.constructProfileEditDto(fairReg!, editFormData, formTemplate, fairReg.fairParticipant.emailId!)
        
        // within transaction, for each update operation, update retrieved fairReg
        await this.profileDbService.updateFairRegistrationByProfileEditDto(fairReg!, profileEditDto)

        const beforeUpdate = fairReg
        const afterUpdate = await this.profileDbService.queryFairRegProfileForEdit('frontend', 0, ssoUid, fairCode, fiscalYear)

        let picode = [
            ...beforeUpdate.fairRegistrationProductInterests.map(data=>data.teCode),
            ...afterUpdate?.fairRegistrationProductInterests.map(data=>data.teCode)||[]
        ].filter((val,index,arr)=>arr.indexOf(val)==index).join(",");
        let pscode = [
            ...beforeUpdate.fairRegistrationProductStrategies.map(data=>data.fairRegistrationProductStrategyCode),
            ...afterUpdate?.fairRegistrationProductStrategies.map(data=>data.fairRegistrationProductStrategyCode)||[]
        ].filter((val,index,arr)=>arr.indexOf(val)==index).join(",");
        let tpm = [
            ...beforeUpdate.fairRegistrationPreferredSuppCountryRegions.map(data=>data.fairRegistrationPreferredSuppCountryRegionCode),
            ...afterUpdate?.fairRegistrationPreferredSuppCountryRegions.map(data=>data.fairRegistrationPreferredSuppCountryRegionCode)||[]
        ].filter((val,index,arr)=>arr.indexOf(val)==index).join(",");

        let productInterests = await this.contentService.retrieveStructureTagDataByTeCode(picode).catch(err=>console.log(err));
        let productStrategies = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataDto>(GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType['product-stragetyV2'], pscode).catch(err=>console.log(err));;
        let targetMarkets = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataDto>(GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType['target-marketV2'], tpm).catch(err=>console.log(err));;

        return {
            isSuccess: true,
            editFormValidationErrors, 
            "user-activity": {
                beforeUpdate,
                afterUpdate,
                reference: {
                    productInterests,
                    productStrategies,
                    targetMarkets
                }
            }
        }
    }

    public async getPresignedUrlPerUser(ssoUid: string, request: GetPresignedUrlPerUserReqDto): Promise<GetUploadFilePresignedUrlRespDto> {
        const { fairCode, lang, fieldId, fileExt} = request

        //retrieve fair reg by fairCode, fiscalYear and ssouid
        const fairSetting = await this.contentService.retrieveFairSetting(fairCode);
        const fiscalYear = ContentUtil.retieveFairSettingByKey<string>(fairCode, fairSetting, FairSettingKeyEnum.fiscalYear)
        let fairReg = await this.profileDbService.queryFairRegProfileForEdit('frontend', 0, ssoUid, fairCode, fiscalYear)
        if (fairReg == null) {
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Could not find fair registration by ssoUid: ${ssoUid}, fairCode: ${fairCode}, fiscalYear: ${fiscalYear}`)
        }

        // check field id is valid
        const fairParticipantTypeId = this.retrieveFairParticipantTypeId(fairReg)
        const formSlug = ContentUtil.retrieveFormSlugForProfileEdit(fairCode, fairSetting, fairParticipantTypeId, lang)
        const formTemplate = await this.contentService.retrieveFormTemplate(fairCode, formSlug, lang)
        const formTemplateDict = ValidationUtil.convertFormTemplateToTemplateDictionary(formTemplate)
        const fileField = formTemplateDict[fieldId]
        if (!fileField || fileField?.field_type != FIELD_TYPE['hktdc-file-upload']){
            throw new VepError(VepErrorMsg.Profile_Invalid_Field_Id, `${fieldId} is not a valid file upload field id in form template ${formSlug}, fairReg id ${fairReg.id}`)
        }

        // retrieve or generate formSubmissionKey if needed
        let formSubmissionKey = fairReg.formSubmissionKey
        if (fairReg.formSubmissionKey == null) {
            formSubmissionKey = `form_submission_${uuidv4()}`;
            // generate formSubmissionKey and store to db
            fairReg = await this.profileDbService.updateFormSubmissionKey(fairReg, formSubmissionKey)
        }

        // generate s3 key and presigned url
        const keyPrefix = 'fr-content/temp'
        const s3FileKey = `${keyPrefix}/${formSubmissionKey}/${fieldId}`
        const s3FullPath = `s3://${this.uploadFileBucket}/${s3FileKey}`
        const fileNameToBeStored = `${formSubmissionKey}.${fieldId}.${fileExt}`
        return {
            s3FileKey,
            s3FullPath,
            presignedUrl: await this.s3Service.getPresignedPutObjectUrlWithFileName(this.uploadFileBucket, s3FileKey, fileNameToBeStored)
        }
    }

    public async getBuyerDetailsForExhibitor(exhibitorSsoUser: SSOUserHeadersDto, request: GetBuyerDetailsForExhbrReqDto): Promise<GetBuyerDetailsForExhbrRespDto> {
        const { lang, buyerFairCode, buyerFiscalYear, buyerSsoUid } = request
        const fairSettingHandler = await this.contentService.retrieveFairSettingHandlder(buyerFairCode);
        
        // retrieve sso user info by request.ssouid
        const ssoProfile = await this.buyerService.getSsoProfile(buyerSsoUid)

        // retrieve fairReg by request param
        const buyerFairReg = await this.profileDbService.queryFairRegProfileForEdit('frontend', 0, buyerSsoUid, buyerFairCode, buyerFiscalYear)
        if (buyerFairReg == null){
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Fail to retrieve profile by buyerSsoUid ${buyerSsoUid} buyerFairCode ${buyerFairCode} buyerFiscalYear ${buyerFiscalYear}`)
        }

        // map council addressCountryCode
        const participantCompanyCountry = ssoProfile.countryCode ?? ""
        let addressCountryCode = { code: participantCompanyCountry, en: participantCompanyCountry, tc: participantCompanyCountry, sc: participantCompanyCountry }
        if (participantCompanyCountry) {
            const countryDef = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
                GeneralDefinitionDataRequestDTOType.code, CouncilwiseDataType.country, participantCompanyCountry)
            if (countryDef[participantCompanyCountry]){
                addressCountryCode = countryDef[participantCompanyCountry]
            }
        }

        let errorMessage = "" // error message for data per fair generation, could be slug/ formTemplate missing or programming bug
        let dataPerFair: BuyerDetailEntryDto[] = []

        try {
            const fairParticipantTypeId = this.retrieveFairParticipantTypeId(buyerFairReg!)
            const shortSlug = fairSettingHandler.retrieveShortSlugForProfileEdit(fairParticipantTypeId).returnNonNullValue()
            const multiLangTemplateHandler = await this.contentService.returnMultiLangTemplate(buyerFairCode, lang, shortSlug) 
            dataPerFair = await this.convertFairRegToShowInProfileDataListExhibitorView(buyerFairReg, lang, multiLangTemplateHandler)
        } catch (ex){
            errorMessage = ex.errorDetail ?? ex.message
            this.logger.FATAL('', '', errorMessage, this.getBuyerDetailsForExhibitor.name, { buyerFairCode, buyerFiscalYear, buyerSsoUid })
        }

        return {
            title: ssoProfile.title,
            firstName: ssoProfile.firstName,
            lastName: ssoProfile.lastName,
            addressCountryCode,
            ssoUid: buyerSsoUid,
            emailId: ssoProfile.email,
            fairCode: buyerFairReg.fairCode!,
            fiscalYear: buyerFairReg.fiscalYear!,
            displayName: NameHelper.GenerateDisplayName(ssoProfile.firstName, ssoProfile.lastName),
            initial: NameHelper.GenerateInitial(ssoProfile.firstName, ssoProfile.lastName),
            position: ssoProfile.position,
            companyName: ssoProfile.companyName,
            dataPerFair,
            errorMessage,
        }
    }

    private async convertFairRegToShowInProfileDataListExhibitorView(fairReg: FairRegistration, lang: "en" | "tc" | "sc", multiLangFormTemplate: MuiltiLangFormTemplate): Promise<BuyerDetailEntryDto[]> {
        let buyerDetailEntryList: BuyerDetailEntryDto[] = []
        const fairRegDynamicBmsFieldId = fairReg.fairRegistrationDynamicBms.map(x => x.formFieldId)
        const fairRegDynamicOthersFieldId = fairReg.fairRegistrationDynamicOthers.map(x => x.formFieldId)

        const multiLangTemplateHandler = new MultiLangTemplateHandler(multiLangFormTemplate, lang)
        const formTemplateDict = multiLangTemplateHandler.getFormDataDictByAnchor()

        for (let fieldId of Object.keys(formTemplateDict)) {
            const formFieldTemplate = formTemplateDict[fieldId]
            if (formFieldTemplate.show_to_exhibitor === true) {
                const fieldType = formFieldTemplate.field_type
                // case 1 : special handling for product interest
                if (Object.keys(ProductInterestFieldId).includes(fieldId)){
                    buyerDetailEntryList.push(...this.retrieveProductInterestBuyerDetailEntryDto(fairReg, fieldId, fieldType, lang, multiLangTemplateHandler))
                }
                // case 2: converted from db records if stored in DynamicBms/ DynamicOthers
                else if (fairRegDynamicBmsFieldId.includes(fieldId)){
                    let dynamicBMValueList = fairReg.fairRegistrationDynamicBms.filter(x => x.value && x.formFieldId == fieldId).map(x => x.value!)
                    if (dynamicBMValueList.length == 0) {
                        dynamicBMValueList.push("")
                    } 

                    const mappedBMValueList = dynamicBMValueList.map(dynamicBMValue => {
                        return multiLangTemplateHandler.getFieldDetailByLang(fieldId, dynamicBMValue, lang)
                    }) 
                    let label = mappedBMValueList[0].label
                    let fieldType = mappedBMValueList[0].fieldType

                    buyerDetailEntryList.push({
                        fieldId,
                        label,
                        fieldType,
                        values: mappedBMValueList.map(mappedBMValue => {
                            return new BuyerDetailEntryMappedValueDto(mappedBMValue.formFieldValue, mappedBMValue.value)
                        })
                    })
                } else if (fairRegDynamicOthersFieldId.includes(fieldId)){
                    let dynamicOthersValueList = fairReg.fairRegistrationDynamicOthers.filter(x => x.value && x.formFieldId == fieldId).map(x => x.value!)
                    if (dynamicOthersValueList.length == 0) {
                        dynamicOthersValueList.push("")
                    } 

                    const mappedOthersValueList = dynamicOthersValueList.map(dynamicOthersValue => {
                        return multiLangTemplateHandler.getFieldDetailByLang(fieldId, dynamicOthersValue, lang)
                    }) 
                    let label = mappedOthersValueList[0].label
                    let fieldType = mappedOthersValueList[0].fieldType

                    buyerDetailEntryList.push({
                        fieldId,
                        label,
                        fieldType,
                        values: mappedOthersValueList.map(mappedOthersValue => {
                            return new BuyerDetailEntryMappedValueDto(mappedOthersValue.formFieldValue, mappedOthersValue.value)
                        })
                    })
                } else {
                    // case 3: output from field value/ mapped from form template
                    const retrievedValueList = FormCommonUtil.convertFairRegToDedicatedFieldDataStrArray(fairReg, fieldId, formFieldTemplate)
                    if (retrievedValueList.length == 0) {
                        retrievedValueList.push("")
                    }

                    const mappedValueList = retrievedValueList.map(value => {
                        return multiLangTemplateHandler.getFieldDetailByLang(fieldId, value, lang)
                    }) 

                    let label = mappedValueList[0].label
                    let fieldType = mappedValueList[0].fieldType

                    buyerDetailEntryList.push({
                        fieldId,
                        label,
                        fieldType,
                        values: mappedValueList.map(mappedValue => {
                            return new BuyerDetailEntryMappedValueDto(mappedValue.formFieldValue,  mappedValue.value)
                        })
                    })
                }
            }
        }
        return buyerDetailEntryList
    }

    private checkUserValidToUpdate(adminUser: AdminUserDto, fairReg: FairRegistration) {
        const isSuperUser = false

        if (!isSuperUser && !adminUser.fairAccessList.split(',').find(x => x == fairReg.fairCode)) {
            throw new VepError(VepErrorMsg.Invalid_Operation, `Could not update the fair registration, fairReg fairCode: ${fairReg.fairCode}, user is allowed to access fair ${adminUser.fairAccessList}`)
        }

        if (fairReg.overseasBranchOffice) {
            if (!isSuperUser && adminUser.branchOfficeUser == 1 && adminUser.branchOffice != fairReg.overseasBranchOffice) {
                throw new VepError(VepErrorMsg.Invalid_Operation, `Could not update the fair registration, fairReg branch office code: ${fairReg.overseasBranchOffice}, user is ${adminUser.branchOffice} branch office user`)
            }
        }
    }

    public async retrieveProfileForBackendEdit(adminUser: AdminUserDto, registrationRecordId: number): Promise<ProfileForBackendEditRespDto> {
        // retrieve fairReg
        const fairRegForChecking = await this.profileDbService.queryFairRegProfileForBackendEditCheckingByRecordId(registrationRecordId)

        // if profile not exist, return error
        if (fairRegForChecking == null){
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Could not find fair registration by id: ${registrationRecordId}`)
        }

        this.checkUserValidToUpdate(adminUser, fairRegForChecking)

        const fairCode = fairRegForChecking.fairCode ?? ""

        // retrieve published fair setting
        const fairSetting = await this.contentService.retrieveFairSetting(fairCode);

        // if project year not match, return error
        if (fairSetting["vms_project_year"] != fairRegForChecking.projectYear){
            throw new VepError(VepErrorMsg.Profile_Admin_Could_Not_Update, 
                `Could not view profile for backend update, registrationRecordId: ${registrationRecordId}, fairCode: ${fairCode}, fairSetting vms_project_year: ${fairSetting["vms_project_year"]}, fairReg Project Year ${fairRegForChecking.projectYear}`)
        }

        const fairParticipantTypeId = this.retrieveFairParticipantTypeId(fairRegForChecking)

        const fairReg = await this.profileDbService.queryFairRegProfileForEdit('backend', registrationRecordId)

        const formSlug = ContentUtil.retrieveFormSlugForProfileEdit(fairCode, fairSetting, fairParticipantTypeId, LANG.en)
        const formTemplate = await this.contentService.retrieveFormTemplate(fairCode, formSlug, LANG.en)

        const formDataPerSlug = FormCommonUtil.convertFairRegToFormDataJson(fairReg!, formTemplate)

        let referenceOverseasOffice = (fairReg?.referenceOverseasOffice ?? "").toLocaleUpperCase()
        if (referenceOverseasOffice){
            const officeQueryResult = await this.contentService.retrieveCouncilwiseDataBy<CouncilwiseDataResponseDto>(
                GeneralDefinitionDataRequestDTOType.code,
                CouncilwiseDataType.office, 
                referenceOverseasOffice
            )

            if (officeQueryResult[referenceOverseasOffice]){
                referenceOverseasOffice = [referenceOverseasOffice, officeQueryResult[referenceOverseasOffice].en].join(" - ")
            }
        }

        const ssoUid = fairReg!.fairParticipant.ssoUid
        const emailId = fairReg!.fairParticipant.emailId
        const userProfile = await this.buyerService.getProfileInternal(ssoUid, emailId)

        const showBuyerPreference = userProfile ? true : false

        if (userProfile){
            return new ProfileForBackendEditRespDto(formDataPerSlug, formSlug, fairCode, fairReg!, referenceOverseasOffice,
                showBuyerPreference, userProfile.preferredLanguage, userProfile.preferredChannels)
        }else{
            return new ProfileForBackendEditRespDto(formDataPerSlug, formSlug, fairCode, fairReg!, referenceOverseasOffice, showBuyerPreference)
        }
    }

    public async adminUpdateProfileByFormData(adminUser: AdminUserDto, registrationRecordId: number, updateReq: UpdateProfileBackendReqDto): Promise<AdminEditProfileResp>{
        // retrieve fairReg
        const fairRegForChecking = await this.profileDbService.queryFairRegProfileForBackendEditCheckingByRecordId(registrationRecordId)

        // if profile not exist, return error
        if (fairRegForChecking == null){
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Could not find fair registration by id: ${registrationRecordId}`)
        }

        this.checkUserValidToUpdate(adminUser, fairRegForChecking)

        const fairCode = fairRegForChecking.fairCode ?? ""

        // retrieve published fair setting
        const fairSetting = await this.contentService.retrieveFairSetting(fairCode);

        // if project year not match, return error
        if (fairSetting["vms_project_year"] != fairRegForChecking.projectYear){
            throw new VepError(VepErrorMsg.Profile_Admin_Could_Not_Update, 
                `Could not view profile for backend update, registrationRecordId: ${registrationRecordId}, fairCode: ${fairCode}, fairSetting vms_project_year: ${fairSetting["vms_project_year"]}, fairReg Project Year ${fairRegForChecking.projectYear}`)
        }

        const fairParticipantTypeId = this.retrieveFairParticipantTypeId(fairRegForChecking)
        const formSlug = ContentUtil.retrieveFormSlugForProfileEdit(fairCode, fairSetting, fairParticipantTypeId, LANG.en)
        const formTemplate = await this.contentService.retrieveFormTemplate(fairCode, formSlug, LANG.en)
        
        // validate with edit form logic
        // strip sso field and field with edit_in_profile != true
        const editFormData: EditFormDataDto = {
            data: await this.wordpressFormValidationService.stripDataForAdminEditFormValidation(formTemplate, updateReq.formDataJson)
        }

        const editFormValidationErrors = await this.wordpressFormValidationService.adminFormValidation(formTemplate, editFormData)

        if (editFormValidationErrors.length > 0) {
            return {
                isSuccess: false,
                editFormValidationErrors, 
            }
        }

        // if passed validate, update noti pref if needed
        const ssoUid = fairRegForChecking!.fairParticipant.ssoUid
        const emailId = fairRegForChecking!.fairParticipant.emailId
        const userProfile = await this.buyerService.getProfileInternal(ssoUid, emailId)

        const updateBuyerPref: boolean = userProfile ? true : false

        if (updateBuyerPref && (updateReq.preferredLanguage || updateReq.preferredChannels)){
            const updateNotiResp = await this.buyerService.adminUpdateNotiPref(ssoUid!, updateReq.preferredLanguage, updateReq.preferredChannels)
            console.log(JSON.stringify(updateNotiResp))
        }

        const fairReg = await this.profileDbService.queryFairRegProfileForEdit('backend', registrationRecordId)
        const profileEditDto: ProfileEditDto = await this.constructProfileEditDto(fairReg!, editFormData, formTemplate, adminUser.emailAddress, updateReq.overseasBranchOfficer)
        
        // within transaction, for each update operation, update retrieved fairReg
        await this.profileDbService.updateFairRegistrationByProfileEditDto(fairReg!, profileEditDto)

        const beforeUpdate = fairReg
        const afterUpdate = await this.profileDbService.queryFairRegProfileForEdit('backend', registrationRecordId)

        return {
            isSuccess: true,
            editFormValidationErrors, 
            "user-activity": {
                beforeUpdate,
                afterUpdate,
            }
        }
    }

    public async adminGetPresignedUrlPerUser(adminUser: AdminUserDto, registrationRecordId: number, request: AdminGetPresignedUrlPerUserReqDto): Promise<GetUploadFilePresignedUrlRespDto> {
        const { fieldId, fileExt } = request

        // retrieve fairReg
        let fairRegForChecking = await this.profileDbService.queryFairRegProfileForBackendEditCheckingByRecordId(registrationRecordId)

        // if profile not exist, return error
        if (fairRegForChecking == null) {
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Could not find fair registration by id: ${registrationRecordId}`)
        }

        this.checkUserValidToUpdate(adminUser, fairRegForChecking)

        const fairCode = fairRegForChecking.fairCode ?? ""

        // retrieve published fair setting
        const fairSetting = await this.contentService.retrieveFairSetting(fairCode);

        // if project year not match, return error
        if (fairSetting["vms_project_year"] != fairRegForChecking.projectYear) {
            throw new VepError(VepErrorMsg.Profile_Admin_Could_Not_Update, 
                `Could not view profile for backend update, registrationRecordId: ${registrationRecordId}, fairCode: ${fairCode}, fairSetting vms_project_year: ${fairSetting["vms_project_year"]}, fairReg Project Year ${fairRegForChecking.projectYear}`)
        }
        
        // check field id is valid
        const fairParticipantTypeId = this.retrieveFairParticipantTypeId(fairRegForChecking)
        const formSlug = ContentUtil.retrieveFormSlugForProfileEdit(fairCode, fairSetting, fairParticipantTypeId, LANG.en)
        const formTemplate = await this.contentService.retrieveFormTemplate(fairCode, formSlug, LANG.en)
        const formTemplateDict = ValidationUtil.convertFormTemplateToTemplateDictionary(formTemplate)
        const fileField = formTemplateDict[fieldId]
        if (!fileField || fileField?.field_type != FIELD_TYPE['hktdc-file-upload']) {
            throw new VepError(VepErrorMsg.Profile_Invalid_Field_Id, `${fieldId} is not a valid file upload field id in form template ${formSlug}, fairReg id ${fairRegForChecking.id}`)
        }

        // retrieve or generate formSubmissionKey if needed
        let formSubmissionKey = fairRegForChecking.formSubmissionKey
        if (fairRegForChecking.formSubmissionKey == null) {
            formSubmissionKey = `form_submission_${uuidv4()}`;
            // generate formSubmissionKey and store to db
            fairRegForChecking = await this.profileDbService.updateFormSubmissionKey(fairRegForChecking, formSubmissionKey)
        }

        // generate s3 key and presigned url
        const keyPrefix = 'fr-content/temp'
        const s3FileKey = `${keyPrefix}/${formSubmissionKey}/${fieldId}`
        const s3FullPath = `s3://${this.uploadFileBucket}/${s3FileKey}`
        const fileNameToBeStored = `${formSubmissionKey}.${fieldId}.${fileExt}`
        return {
            s3FileKey,
            s3FullPath,
            presignedUrl: await this.s3Service.getPresignedPutObjectUrlWithFileName(this.uploadFileBucket, s3FileKey, fileNameToBeStored)
        }
    }

    private async constructProfileEditDto(
        fairReg: FairRegistration,
        editFormData: EditFormDataDto,
        formTemplate: FormTemplateDto,
        lastUpdatedBy: string,
        overseasBranchOfficer: string | undefined = undefined)
        : Promise<ProfileEditDto> {
        const formDataDict = ValidationUtil.convertFormToDictionary(editFormData);
        const formTemplateDict = ValidationUtil.convertFormTemplateToTemplateDictionary(formTemplate)

        let profileEditDto: ProfileEditDto = new ProfileEditDto()
        profileEditDto.lastUpdatedBy = lastUpdatedBy
        profileEditDto.overseasBranchOfficer = overseasBranchOfficer

        // sso related field (field list refer to VT-1573) should not be edited
        // product interest other field edit handled in first if block, thus added in DedicateDataFieldIdListEditExcluded
        const DedicateDataFieldIdListEditExcluded = [...DedicateDataFieldListForProductInterestOther, ...SsoRelatedFieldIdList]

        // for each field in edit form logic, add to update entry data object
        for (let fieldId of Object.keys(formDataDict)) {
            // move file from temp to actual folder, if exists
            const formFieldTemplate = formTemplateDict[fieldId]
            if (formFieldTemplate?.field_type == "hktdc-file-upload"){
                const submittedFileS3Key = (formDataDict[fieldId]?.data as string )?? "";
                if (submittedFileS3Key && submittedFileS3Key.includes('/temp')) { //recognized new upload by s3 key pattern
                    const newFileName = submittedFileS3Key.replace('/temp','')
                    await this.s3Service.copyFile(this.uploadFileBucket, newFileName, submittedFileS3Key)
                    formDataDict[fieldId].data = newFileName
                }
            }

            if (DedicateDataFieldListForProductInterest.includes(fieldId)) {
                // let formTemplateFieldId = FormCommonUtil.convertFormDataJsonProductInterestFieldIdToFormTemplateFieldId(fieldId)
                // const productInterestFormFieldTemplate = formTemplateDict[formTemplateFieldId] 
                const productInterestOptionsForValidation = FormCommonUtil.retrieveProductInterestOptionsForValidation(formTemplate)
                const productInterestObjList = this.convertToProductInterestDao(fairReg, formDataDict[fieldId].data as string[], productInterestOptionsForValidation)
                profileEditDto.fairRegistrationProductInterests = (profileEditDto.fairRegistrationProductInterests ?? []).concat(...productInterestObjList)

                const productInterestFormDataOtherId = FormCommonUtil.convertProductInterestFormDataJsonFieldIdToOtherId(fieldId)
                const productInterestOtherValue = formDataDict[productInterestFormDataOtherId].data as string

                profileEditDto.dynamicOtherFieldIdToUpdate.push(ProductInterestOtherFieldId.br_bm_product_interest_other)
                profileEditDto.fairRegistrationDynamicOthers.push(this.convertToProductInterestOtherDao(fairReg, ProductInterestOtherFieldId.br_bm_product_interest_other, productInterestOtherValue))
            } else if (!DedicateDataFieldIdListEditExcluded.includes(fieldId)) {
                switch (fieldId) {
                    case (DedicateDataFieldEnum.br_bm_target_supplier): // Product Strategy
                        profileEditDto.fairRegistrationProductStrategies = ProfileDbUtil.convertToFairRegProductStrategyDao(fairReg, formDataDict[fieldId].data as string[], lastUpdatedBy)
                        break
                    case (DedicateDataFieldEnum.br_bm_prefer_supplier_country): // Target/ Preferred Market(s)
                        profileEditDto.fairRegistrationPreferredSuppCountryRegions = ProfileDbUtil.convertToFairRegPreferredSuppCountryRegion(fairReg, formDataDict[fieldId].data as string[], lastUpdatedBy)
                        break
                    case (DedicateDataFieldEnum.br_consent_registration_detail):
                        profileEditDto.registrationDetailConsent = formDataDict[fieldId].data as boolean === true ? 'Y' : 'N'
                        break
                    case (DedicateDataFieldEnum.br_concent_privacy_policy_statement):
                        profileEditDto.badgeConsent = formDataDict[fieldId].data as boolean === true ? 'Y' : 'N'
                        break
                    case (DedicateDataFieldEnum.br_concent_eu_eea_clause):
                        profileEditDto.euConsentStatus = formDataDict[fieldId].data as boolean === true ? 'Y' : 'N'
                        break
                    case (DedicateDataFieldEnum.br_concent_click2match):
                        profileEditDto.c2mConsent = formDataDict[fieldId].data as boolean === true ? 'Y' : 'N'
                        break
                    default:
                        const isBmField = HardcodedDynamicBMFieldId.includes(fieldId) || fieldId.startsWith('bm_')
                        if (isBmField) {
                            profileEditDto.dynamicBmFieldIdToUpdate.push(fieldId)
                            profileEditDto.fairRegistrationDynamicBms.push(...ProfileDbUtil.convertToFairRegBMList(fairReg, formFieldTemplate, formDataDict[fieldId], lastUpdatedBy))
                        } else {
                            profileEditDto.dynamicOtherFieldIdToUpdate.push(fieldId)
                            profileEditDto.fairRegistrationDynamicOthers.push(...ProfileDbUtil.convertToFairRegOtherList(fairReg, formFieldTemplate, formDataDict[fieldId], lastUpdatedBy))
                        }
                        break
                }
            }
        }
        console.log(JSON.stringify(profileEditDto))

        return profileEditDto
    }

    public async getC2MQuestionInput(ssoUid: string, query: ProfileForEditReqByFairCodeDto): Promise<GetC2MQuestionInputRespDto>{
        const { fairCode, lang } = query

        const fairSetting = await this.contentService.retrieveFairSetting(fairCode);
        const fiscalYear = ContentUtil.retieveFairSettingByKey<string>(fairCode, fairSetting, FairSettingKeyEnum.fiscalYear)

        // retrieve fair reg by fairCode, fiscalYear and ssouid
        const fairReg = await this.profileDbService.getProfileWithMandatoryBM(ssoUid, fairCode, fiscalYear)

        if (fairReg == null) {
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Could not find fair registration by ssoUid: ${ssoUid}, fairCode: ${fairCode}, fiscalYear: ${fiscalYear}`)
        }

        const fairParticipantTypeId = this.retrieveFairParticipantTypeId(fairReg)

        let formTemplate: FormTemplateDto | null = null
        let errorMessage = ''

        try {
            const formSlug = ContentUtil.retrieveFormSlugForProfileEdit(fairCode, fairSetting, fairParticipantTypeId, lang)
            formTemplate = await this.contentService.retrieveFormTemplate(fairCode, formSlug, lang)
        } catch (ex){
            errorMessage = ex.errorDetail ?? ex.message
            this.logger.FATAL('', '', errorMessage, this.getC2MQuestionInput.name, { fairCode, ssoUid })
        }
        const { productInterests, productInterestFieldIdList } = ProfileUtil.convertFairRegToProductInterestObject(fairReg, formTemplate)

        return {
            isProductInterestInputted: fairReg.fairRegistrationProductInterests.length > 0,
            productInterests,
            isProductDesignInputted: fairReg.fairRegistrationProductStrategies.length > 0,
            productStrategies: fairReg.fairRegistrationProductStrategies.map(x => x.fairRegistrationProductStrategyCode),
            isTargetPreferredMarketsInputted: fairReg.fairRegistrationPreferredSuppCountryRegions.length > 0,
            targetPreferredMarkets: fairReg.fairRegistrationPreferredSuppCountryRegions.map(x => x.fairRegistrationPreferredSuppCountryRegionCode),
            productInterestFieldIdList,
            errorMessage,
        }
    }

    public async getFormProductInterestOptions(ssoUid: string, query: ProfileForEditReqByFairCodeDto): Promise<GetC2MProductInterestRespDto> {
        const { fairCode, lang } = query

        const fairSetting = await this.contentService.retrieveFairSetting(fairCode);
        const fiscalYear = ContentUtil.retieveFairSettingByKey<string>(fairCode, fairSetting, FairSettingKeyEnum.fiscalYear)

        // retrieve fair reg by fairCode, fiscalYear and ssouid
        const fairReg = await this.profileDbService.getProfileWithMandatoryBM(ssoUid, fairCode, fiscalYear)

        if (fairReg == null) {
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Could not find fair registration by ssoUid: ${ssoUid}, fairCode: ${fairCode}, fiscalYear: ${fiscalYear}`)
        }

        const fairParticipantTypeId = this.retrieveFairParticipantTypeId(fairReg)

        let formTemplate: FormTemplateDto | null = null
        let errorMessage = ''
        try {
            const formSlug = ContentUtil.retrieveFormSlugForProfileEdit(fairCode, fairSetting, fairParticipantTypeId, lang)
            formTemplate = await this.contentService.retrieveFormTemplate(fairCode, formSlug, lang)
        } catch (ex){
            errorMessage = ex.errorDetail ?? ex.message
            this.logger.FATAL('', '', errorMessage, this.getFormProductInterestOptions.name, { fairCode, ssoUid })
        }

        return {
            ...ProfileUtil.convertFairRegToProductInterestObject(fairReg, formTemplate),
            errorMessage,
        }
    }

    public async updateProductInterestPerFair(ssoUid: string, body: UpdateProductInterestPerFairReqDto) {
        const { fairCode, lang } = body

        const fairSetting = await this.contentService.retrieveFairSetting(fairCode);
        const fiscalYear = ContentUtil.retieveFairSettingByKey<string>(fairCode, fairSetting, FairSettingKeyEnum.fiscalYear)

        // retrieve fair reg by fairCode, fiscalYear and ssouid
        const fairReg = await this.profileDbService.getProfileWithMandatoryBM(ssoUid, fairCode, fiscalYear)

        if (fairReg == null) {
            throw new VepError(VepErrorMsg.Profile_NotFound_Error, `Could not find fair registration by ssoUid: ${ssoUid}, fairCode: ${fairCode}, fiscalYear: ${fiscalYear}`)
        }

        const fairParticipantTypeId = this.retrieveFairParticipantTypeId(fairReg)

        const formSlug = ContentUtil.retrieveFormSlugForProfileEdit(fairCode, fairSetting, fairParticipantTypeId, lang)
        const formTemplate = await this.contentService.retrieveFormTemplate(fairCode, formSlug, lang)

        const productInterestFieldIdList = FormCommonUtil.retrieveFormProductInterestOptions(formTemplate).productInterestFieldIdList
        const productInterestOptionsForValidation = FormCommonUtil.retrieveProductInterestOptionsForValidation(formTemplate)

        // verify product Interest
        const validationErrorField: string[] = []
        if (body.productInterest.length == 0) {
            validationErrorField.push("productInterest")
        }
        body.productInterest.forEach(productInterestTeCode => {
            if (!productInterestOptionsForValidation[productInterestTeCode]) {
                validationErrorField.push("productInterest")
            }
        })

        if (productInterestFieldIdList.includes(ProductInterestFieldId.br_bm_product_interest_ip)) {
            if (!body.productInterestIP || (body.productInterestIP && body.productInterestIP.length == 0)) {
                validationErrorField.push("productInterestIP")
            } else {
                body.productInterestIP.forEach(productInterestIPTeCode => {
                    if (!productInterestOptionsForValidation[productInterestIPTeCode]) {
                        validationErrorField.push("productInterestIP")
                    }
                })
            }
        }

        if (productInterestFieldIdList.includes(ProductInterestFieldId.br_bm_product_interest_licensing)) {
            if (!body.productInterestLicensing || (body.productInterestLicensing && body.productInterestLicensing.length == 0)) {
                validationErrorField.push("productInterestLicensing")
            } else {
                body.productInterestLicensing.forEach(productInterestLicensingTeCode => {
                    if (!productInterestOptionsForValidation[productInterestLicensingTeCode]) {
                        validationErrorField.push("productInterestLicensing")
                    }
                })
            }
        }

        if (validationErrorField.length > 0) {
            return {
                isSuccess: false,
                validationErrorField
            }
        }

        try {
            const productInterestObjList =
                this.convertToProductInterestDao(fairReg,
                    [...body.productInterest,
                    ...body.productInterestIP ?? [],
                    ...body.productInterestLicensing ?? []], productInterestOptionsForValidation)

            let productInterestOtherList: FairRegistrationDynamicOthers[] = []
            if (body.productInterestOther) {
                productInterestOtherList.push(this.convertToProductInterestOtherDao(fairReg, ProductInterestOtherFieldId.br_bm_product_interest_other, body.productInterestOther))
            }
            if (productInterestFieldIdList.includes(ProductInterestFieldId.br_bm_product_interest_ip) && body.productInterestIPOther) {
                productInterestOtherList.push(this.convertToProductInterestOtherDao(fairReg, ProductInterestOtherFieldId.br_bm_product_interest_ip_other, body.productInterestIPOther))
            }
            if (productInterestFieldIdList.includes(ProductInterestFieldId.br_bm_product_interest_licensing) && body.productInterestLicensingOther) {
                productInterestOtherList.push(this.convertToProductInterestOtherDao(fairReg, ProductInterestOtherFieldId.br_bm_product_interest_licensing_other, body.productInterestLicensingOther))
            }

            const beforeUpdate = JSON.parse(JSON.stringify(fairReg));
            // save result to DB
            const updateResult = await this.profileDbService.updateProductInterestPerFair(fairReg, productInterestObjList, productInterestOtherList)

            let picode = [
                ...beforeUpdate.fairRegistrationProductInterests.map((data: { teCode: any; }) => data.teCode),
                ...updateResult.fairRegistrationProductInterests.map(data => data.teCode)
            ].filter((val, index, arr) => arr.indexOf(val) == index).join(",");
            let productInterests = await this.contentService.retrieveStructureTagDataByTeCode(picode).catch(err => console.log(err));

            return {
                isSuccess: true,
                "user-activity": {
                    registrationNo: `${updateResult.serialNumber}${updateResult.projectYear?.substring(updateResult.projectYear.length - 2)}${updateResult.sourceTypeCode}${updateResult.visitorTypeCode}${updateResult.projectNumber}`,
                    actionType: "Update Product Interest",
                    beforeUpdate,
                    afterUpdate: updateResult,
                    reference: {
                        productInterests
                    }
                }
            }
        } catch (ex) {
            throw new VepError(VepErrorMsg.Profile_Update_Product_Interest, `Failed in updateProductInterestPerFair, message: ${JSON.stringify(ex)}`)
        }
    }

    private convertToProductInterestDao(fairReg: FairRegistration, productInterestList: string[] | undefined, productInterestOptionsForValidation: any): FairRegistrationProductInterest[] {
        return (productInterestList ?? []).map(
            (productInterest) => {
                const productInterestObj = productInterestOptionsForValidation[productInterest][0]

                let productInterestRecord = new FairRegistrationProductInterest()
                productInterestRecord.fairRegistrationId = fairReg.id
                productInterestRecord.stId = productInterestObj.st_id
                productInterestRecord.iaId = productInterestObj.ia_id
                productInterestRecord.teCode = productInterestObj.te_code
                productInterestRecord.createdBy = "VEP INIT"
                productInterestRecord.lastUpdatedBy = "VEP INIT"
                return productInterestRecord
            }
        )
    }

    private convertToProductInterestOtherDao(fairReg: FairRegistration, fieldId: string, productInterestOtherStr: string): FairRegistrationDynamicOthers {
        let productInterestOtherRecord = new FairRegistrationDynamicOthers()
        productInterestOtherRecord.fairRegistrationId = fairReg.id

        productInterestOtherRecord.formFieldId = fieldId

        switch (fieldId) {
            case ProductInterestOtherFieldId.br_bm_product_interest_other:
                productInterestOtherRecord.labelEn = 'Other Product Categories'
                productInterestOtherRecord.labelTc = '其他產品種類'
                productInterestOtherRecord.labelSc = '其他产品种类'
                break;
            case ProductInterestOtherFieldId.br_bm_product_interest_ip_other:
                productInterestOtherRecord.labelEn = 'Other Product Categories'
                productInterestOtherRecord.labelTc = '其他產品種類'
                productInterestOtherRecord.labelSc = '其他产品种类'
                break;
            case ProductInterestOtherFieldId.br_bm_product_interest_licensing_other:
                productInterestOtherRecord.labelEn = 'Other Product Categories'
                productInterestOtherRecord.labelTc = '其他產品種類'
                productInterestOtherRecord.labelSc = '其他产品种类'
                break;
            default:
                productInterestOtherRecord.labelEn = ''
                productInterestOtherRecord.labelTc = ''
                productInterestOtherRecord.labelSc = ''
                break;
        }

        productInterestOtherRecord.value = productInterestOtherStr
        productInterestOtherRecord.valueEn = productInterestOtherStr
        productInterestOtherRecord.valueTc = productInterestOtherStr
        productInterestOtherRecord.valueSc = productInterestOtherStr

        productInterestOtherRecord.createdBy = "VEP INIT"
        productInterestOtherRecord.lastUpdatedBy = "VEP INIT"
        return productInterestOtherRecord
    }

    public async linkFairParticipantSsoUidByEmailId(ssoUid: string, emailId: string) {
        return this.fairDbService.linkFairParticipantSsoUidByEmailId(ssoUid, emailId);
    }
}

function convertNestedObject(code: string, en: string, sc: string, tc: string) {
    try {
        let nestedObject = new FairParticipantRegistrationNestedObject();
        nestedObject.code = code;
        nestedObject.en = en;
        nestedObject.sc = sc;
        nestedObject.tc = tc;

        return nestedObject;
    } catch (error) {
        throw new VepError(VepErrorMsg.Profile_Nested_Object_Error, error.message)
    }

}

function convertProductInterest(interest: StructureTagDataDto) {
    try {
        let productInterest = new FairParticipantRegistrationProductInterest();

        productInterest = {
            ia_id: interest.iaId,
            ia_en: interest.iaEn,
            ia_sc: interest.iaSc,
            ia_tc: interest.iaTc,
            st: [{
                st_id: interest.stId,
                st_en: interest.stEn,
                st_sc: interest.stSc,
                st_tc: interest.stTc,
                te_code: interest.teCode,
            }]
        }
        productInterest.ia_id = interest.iaId;

        return productInterest;
    } catch (error) {
        throw new VepError(VepErrorMsg.Profile_Product_Interest_Error, error.message)
    }
}