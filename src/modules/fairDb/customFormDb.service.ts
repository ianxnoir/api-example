import { Injectable } from '@nestjs/common';
import * as AWSXRay from 'aws-xray-sdk';
import { getManager } from 'typeorm';
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
import { Logger } from '../../core/utils';
import { CustomFormSubmission } from '../../dao/CustomFormSubmission';

@Injectable()
export class CustomFormDbService {

    constructor(
        private logger: Logger,
    ) {
        this.logger.setContext(CustomFormDbService.name)
    }

    public async saveCustomFormSubmission(customFormSubmission: CustomFormSubmission): Promise<boolean> {
        return getManager().transaction(async transactionalEntityManager => {
            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-CustomFormDbService-saveCustomFormSubmission', async (subsegment) => {
                try {
                    const result = await transactionalEntityManager.save(customFormSubmission)
                    const fieldList = customFormSubmission.customFormSubmissionFields.map(
                        (field) => {
                            field.customFormSubmissionId = result.id
                            return field
                        }
                    )
                    await transactionalEntityManager.save(fieldList)

                    return true
                } catch (error) {
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        });
    }
}