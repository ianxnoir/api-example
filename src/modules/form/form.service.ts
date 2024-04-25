import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { VepErrorMsg } from "../../config/exception-constant";
import { XTraceDto } from "../../core/decorator/xTraceId.decorator";
import { ElasticacheService } from "../../core/elasticache/elasticache.service";
import { VepError } from "../../core/exception/exception";
import { Logger, S3Service } from "../../core/utils";
import { FairSettingKeyEnum } from "../api/content/content.enum";
import { ContentService } from "../api/content/content.service";
import { ContentUtil } from "../api/content/content.util";
import { FORM_SUBMISSION_KEY_EXPIRATION_TIME_IN_MINUTE } from "../registration/dto/SubmitForm.enum";
import { FormSubmissionValueDto } from "./dto/formSubmissionValue.dto";
import { GetFormSubmissionKeyReqDto } from "./dto/getFormSubmissionKeyReq.dto";
import { GetUploadFilePresignedUrlReqDto } from "./dto/getUploadFilePresignedUrlReq.dto";
import { GetUploadFilePresignedUrlRespDto } from "./dto/getUploadFilePresignedUrlResp.dto";
import { FormTypeEnum } from "./enum/formType.enum";
import { FormUtil } from "./form.util";
@Injectable()
export class FormService {
    uploadFileBucket: string;

    constructor(
        private logger: Logger,
        private configService: ConfigService,
        private contentService: ContentService,
        private elasicacheService: ElasticacheService,
        private s3Service: S3Service,
    ) {
        this.logger.setContext(FormService.name)
        this.uploadFileBucket = this.configService.get<any>('form.uploadFileBucket');
    }

    public async getUploadFilePresignedUrl(query: GetUploadFilePresignedUrlReqDto): Promise<GetUploadFilePresignedUrlRespDto> {
        let keyPrefix = ''

        // check whether on form submission key is valid
        const elastiCacheValue = await this.elasicacheService.getElastiCacheKeyValue(query.formSubmissionKey)
        if (!elastiCacheValue){
            throw new VepError(VepErrorMsg.Submission_Key_Not_Found, `Invalid form submission key, key: ${query.formSubmissionKey}`)
        }

        switch (query.formType) {
            case FormTypeEnum.registration:
                keyPrefix = 'fr-content/temp'
                break;
            case FormTypeEnum.enquiry:
                keyPrefix = 'ef-content/temp'
                break;
            case FormTypeEnum.custom:
            default:
                keyPrefix = 'cf-content/temp'
                break;
        }

        const s3FileKey = `${keyPrefix}/${query.formSubmissionKey}/${query.fieldId}`
        const s3FullPath = `s3://${this.uploadFileBucket}/${s3FileKey}`
        const fileNameToBeStored = `${query.formSubmissionKey}.${query.fieldId}.${query.fileExt}`
        return {
            s3FileKey,
            s3FullPath,
            presignedUrl: await this.s3Service.getPresignedPutObjectUrlWithFileName(this.uploadFileBucket, s3FileKey, fileNameToBeStored)
        }
    }

    public async getFormSubmissionKey(query: GetFormSubmissionKeyReqDto, xTrace: XTraceDto): Promise<{ formSubmissionKey: string }> {
        const formSubmissionKey = FormUtil.createFormSubmissionKey();

        const { fairCode } = query
        const fairSetting = await this.contentService.retrieveFairSetting(fairCode);
        const fiscal_year = ContentUtil.retieveFairSettingByKey<string>(fairCode, fairSetting, FairSettingKeyEnum.fiscalYear)
        const formSubmissionValue: FormSubmissionValueDto = {
            fair_code: fairCode,
            fiscal_year,
            form_id: query.slug,
            file_upload_s3: this.uploadFileBucket
        }

        this.logger.XTRACE_INFO(xTrace, "", this.getFormSubmissionKey.name, { formSubmissionValue, formSubmissionKey })

        // insert form submission key into redis
        await this.elasicacheService.setElastiCacheKeyValue(formSubmissionKey, JSON.stringify(formSubmissionValue), FORM_SUBMISSION_KEY_EXPIRATION_TIME_IN_MINUTE * 60)

        return {
            formSubmissionKey
        }
    }
}