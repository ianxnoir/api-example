import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as AWSXRay from 'aws-xray-sdk';
import { getManager, In, Repository } from 'typeorm';
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../../core/exception/exception';
import { Logger } from '../../core/utils';
import { FairRegistrationFormLinkTask } from '../../dao/FairRegistrationFormLinkTask';
import { FairRegistrationFormLinkTaskEntry } from '../../dao/FairRegistrationFormLinkTaskEntry';
import { GenerateRegFormLinkReqDto } from '../registration/dto/GenerateRegFormLinkReq.dto';
import { RegFormLinkTask, RegFormLinkTaskEntry } from '../registration/dto/GenerateRegFormLinkResp.dto';
import { QueryRegFormLinkReqDto } from '../registration/dto/QueryRegFormLinkReq.dto';
import { RegFormLinkTaskEntrySummaryDto } from '../registration/dto/RegFormLinkTaskEntrySummaryDto.dto';
import { constant } from '../../config/constant';


@Injectable()
export class RegFormLinkDbService {

    constructor(
        private logger: Logger,
        @InjectRepository(FairRegistrationFormLinkTask) private FairRegistrationFormLinkTaskRepository: Repository<FairRegistrationFormLinkTask>,
    ) {
        this.logger.setContext(RegFormLinkDbService.name)
    }

    public async retrieveRegLink(fairCode: string, regLinkId: string): Promise<FairRegistrationFormLinkTask | undefined> {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-RegFormLinkDbService-retrieveRegLink', async (subsegment) => {
            try {
                return await this.FairRegistrationFormLinkTaskRepository
                    .createQueryBuilder("link")
                    .leftJoinAndSelect("link.fairRegistrationFormLinkTaskEntries", "entry")
                    .where(`(link.fairCode = :fairCode AND entry.regLinkId = :regLinkId)`,
                        { fairCode, regLinkId })
                    .getOne()
            } catch (error) {
                throw new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }

    public async insertRegLink(query: GenerateRegFormLinkReqDto, contents : RegFormLinkTaskEntrySummaryDto[], emailAddress : string): Promise<RegFormLinkTask> {
        const currentUser = emailAddress || constant.defaultUserName.SYSTEM

        const task = new FairRegistrationFormLinkTask()
        task.fairCode = query.fairCode,
        task.projectYear = query.projectYear,
        task.formName = query.formName,
        task.formType = query.formType,
        task.slug = query.slug,
        task.country = query?.country ?? '',
        task.createdBy = currentUser
        task.lastUpdatedBy = currentUser

        let taskEntriesInserted : FairRegistrationFormLinkTaskEntry[] = []

        await getManager().transaction(async transactionalEntityManager => {
            return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-RegFormLinkDbService-insertRegLink', async (subsegment) => {
                try {
                    const taskInserted = await transactionalEntityManager.save(task);
                    if (taskInserted) {
                        return await Promise.all(contents.map(async (content): Promise<any> => {
                            
                            const taskEntry = new FairRegistrationFormLinkTaskEntry()
                            taskEntry.fairRegistrationFormLinkTaskId = taskInserted.id
                            taskEntry.visitorType = content.visitorType ?? ''                            
                            taskEntry.refOverseasOffice = content.refOverseasOffice ?? ''
                            taskEntry.refCode = content.refCode ?? ''
                            taskEntry.regLinkId = content.regLinkId ?? ''
                            taskEntry.createdBy = currentUser
                            taskEntry.lastUpdatedBy = currentUser
                            const taskEntryInserted = await transactionalEntityManager.save(taskEntry);
                            taskEntriesInserted.push(taskEntryInserted)
                            if (!taskEntryInserted) {
                                throw new VepError(VepErrorMsg.Insert_Reg_Form_Link_Error, `Failed to insert taskEntry: ${taskEntryInserted}`)
                            }
                        }))
                    } else {
                        throw new VepError(VepErrorMsg.Insert_Reg_Form_Link_Error, `Failed to insert task: ${taskInserted}`)
                    }
                } catch (error) {
                    if (error.name === 'VepError') {
                        throw new VepError(error.vepErrorMsg, error.message);
                    }
                    throw new VepError(VepErrorMsg.Database_Error, error.message)
                } finally {
                    subsegment?.close()
                }
            })
        });

        if (taskEntriesInserted.length !== contents.length) {
            throw new VepError(VepErrorMsg.Insert_Reg_Form_Link_Error, 'Length of expected and actual insert records differs')
        }

        if (task.id === undefined) {
            throw new VepError(VepErrorMsg.Insert_Reg_Form_Link_Error, `Task not executed`)
        }

        this.logger.debug(`Inserted reg form link task: ${JSON.stringify(task)}`, this.insertRegLink.name)
        this.logger.debug(`Inserted reg form link task entrys: ${JSON.stringify(taskEntriesInserted)}`, this.insertRegLink.name)
        
        const taskEntryResp : RegFormLinkTaskEntry[] = taskEntriesInserted.map((each)=>({id: each.id, reLinkId: each.regLinkId ?? ''}))
        const taskResp : RegFormLinkTask = {
            id: task.id,
            regFormLinkTaskEntries: taskEntryResp
        }

        return taskResp;
    }

    public async countRegLink() : Promise<number> {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-RegFormLinkDbService-countRegLink', async (subsegment) => {
            try {
                const countTask : FairRegistrationFormLinkTask[] | undefined = await this.FairRegistrationFormLinkTaskRepository
                .createQueryBuilder("task")
                .select(['task.id'])
                .getMany();
                if (countTask.length > 0) {
                    return countTask.length
                } else {
                    throw new VepError(VepErrorMsg.RegFormLink_Task_List_Not_Found_Error);
                }
            } catch (error) {
                if (error.name === 'VepError') {
                    throw new VepError(error.vepErrorMsg, error.message);
                }
                throw new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }

    public async queryRegLink(query: QueryRegFormLinkReqDto): Promise<FairRegistrationFormLinkTask[] | undefined> {
        return AWSXRay.captureAsyncFunc('DbSubsegment-vep-fair-RegFormLinkDbService-queryRegLink', async (subsegment) => {
            try {

                // 1st qry for get segment
                const taskSegment : FairRegistrationFormLinkTask[] | undefined = await this.FairRegistrationFormLinkTaskRepository
                .createQueryBuilder("task")
                .select(['task.id'])
                .limit(query.size)
                .offset((query.pageNum - 1) * query.size)
                .orderBy('task.creationTime', 'DESC')
                .addOrderBy('task.id', 'DESC')
                .getMany();

                let taskSegmentIdList
                if (taskSegment && (taskSegmentIdList = taskSegment.map(task => task.id))) {

                    // 2nd join 1st res wt entries
                    const taskSegmentJoinEntry : FairRegistrationFormLinkTask[] | undefined = await this.FairRegistrationFormLinkTaskRepository
                    .createQueryBuilder("task")
                    .leftJoinAndSelect("task.fairRegistrationFormLinkTaskEntries", "entry")
                    .where({id: In([...taskSegmentIdList])})
                    .orderBy('task.creationTime', 'DESC')
                    .addOrderBy('task.id', 'DESC')
                    .getMany();

                    this.logger.debug(`relatedEntries: ${JSON.stringify(taskSegmentJoinEntry)}`, this.queryRegLink.name)
                    return taskSegmentJoinEntry
                } else {
                    throw new VepError(VepErrorMsg.Insert_Reg_Form_Link_Error)
                }
            } catch (error) {
                if (error.name === 'VepError') {
                    throw new VepError(error.vepErrorMsg, error.message);
                }
                throw new VepError(VepErrorMsg.Database_Error, error.message)
            } finally {
                subsegment?.close()
            }
        })
    }
}
