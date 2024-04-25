import { VepErrorMsg } from "../../config/exception-constant";
import { VepError } from "../../core/exception/exception";
import { FairRegistrationFormLinkTask } from "../../dao/FairRegistrationFormLinkTask";
import { RegFormLinkValidationErrMsg } from "../formValidation/enum/regFormLinkUtil.enum";
import { GenerateHashDto } from "./dto/GenerateHashDto.dto";
import { GenerateRegFormLinkReqDto } from "./dto/GenerateRegFormLinkReq.dto";
import { RegFormLinkValidationErrorDto } from "./dto/GenerateRegFormLinkResp.dto";
import { QueryRegFormLinkRespDto } from "./dto/QueryRegFormLinkResp.dto";
import { RegFormLinkTaskEntrySummaryDto } from "./dto/RegFormLinkTaskEntrySummaryDto.dto";
import { LANG } from "./dto/SubmitForm.enum";
const crypto = require('crypto');


export class RegFormLinkUtil {

    // Validation
    public static validateRegFormLinkReqDto(query: GenerateRegFormLinkReqDto, visitorTypeList : string[]) : RegFormLinkValidationErrorDto[] {
        let errList : RegFormLinkValidationErrorDto[] = []

        if (query.formType.includes('\/')) errList.push({
            fieldId : 'formType',
            regFormLinkValidationErrorMessage : RegFormLinkValidationErrMsg.DATA_NOT_MATCH_REGEXP
        })

        if (query.formName.includes('\/')) errList.push({
            fieldId : 'formName',
            regFormLinkValidationErrorMessage : RegFormLinkValidationErrMsg.DATA_NOT_MATCH_REGEXP
        })

        if (query.slug.includes('\/')) errList.push({
            fieldId : 'slug',
            regFormLinkValidationErrorMessage : RegFormLinkValidationErrMsg.DATA_NOT_MATCH_REGEXP
        })

        if (!query.projectYear.match(/^\d+$/)) errList.push({
            fieldId : 'projectYear',
            regFormLinkValidationErrorMessage : RegFormLinkValidationErrMsg.DATA_NOT_MATCH_REGEXP
        })

        if (query?.country && !(query?.country == 'china' || query?.country == 'non_china')) errList.push({
            fieldId : 'country',
            regFormLinkValidationErrorMessage : RegFormLinkValidationErrMsg.DATA_NOT_MATCH_REGEXP
        })

        if (query.visitorType.split(';').filter((each)=>(!each) ).length > 0) errList.push({
            fieldId : 'visitorType',
            regFormLinkValidationErrorMessage : RegFormLinkValidationErrMsg.DATA_LENGTH_INVALID
        })

        if (query.visitorType.split(';').filter((each)=>(visitorTypeList.indexOf(each) == -1) ).length > 0) errList.push({
            fieldId : 'visitorType',
            regFormLinkValidationErrorMessage : RegFormLinkValidationErrMsg.INVALID_VISITOR_TYPE_CODE
        })

        if (query?.refOverseasOffice && (query?.refOverseasOffice ?? '').split(';').filter((each)=>(!each)).length > 0) errList.push({
            fieldId : 'refOverseasOffice',
            regFormLinkValidationErrorMessage : RegFormLinkValidationErrMsg.DATA_LENGTH_INVALID
        })

        if (query?.refCode && (query?.refCode ?? '').split(';').filter((each)=>(!each || each.length > 300)).length > 0) errList.push({
            fieldId : 'refCode',
            regFormLinkValidationErrorMessage : RegFormLinkValidationErrMsg.DATA_LENGTH_INVALID
        })


        return errList;
    }


    // Format Data: prepare for insert db
    public static prepareFormLinkTaskEntry(query: GenerateRegFormLinkReqDto, saltKeyForRegFormLink: string) : RegFormLinkTaskEntrySummaryDto[] {

        // Start from one record with empty property value
        let records : RegFormLinkTaskEntrySummaryDto[] = [{
            visitorType: '',
            refOverseasOffice: '',
            refCode: '',
            regLinkId: '',
        }]

        // [!] Expanding each record with visitorType
        const visitorTypeList = query.visitorType.split(';')
        if (visitorTypeList && visitorTypeList.length > 0 ) {
            records = this.expandEntryListWithInputList(records, visitorTypeList , (record, input) => ({
                ...record,
                visitorType: input
            }))
        } else {
            throw new VepError(VepErrorMsg.Invalid_Reg_Form_Link_Req, 'Invalid value on visitorType');
        }

        // [?] Expanding each record with refOverseasOffice
        const refOverseasOfficeList = query?.refOverseasOffice?.split(';') ?? ''
        if (refOverseasOfficeList && refOverseasOfficeList.length > 0) {
            records = this.expandEntryListWithInputList(records, refOverseasOfficeList, (record, input) => ({
                ...record,
                refOverseasOffice: input
            }))
        }
        
        // [?] Expanding each record with refCode
        const refCodeList = query ? query?.refCode?.split(';') ?? '' : ''
        if (refCodeList && refCodeList.length > 0) {
            records = this.expandEntryListWithInputList(records, refCodeList, (record, input) => ({ 
                ...record,
                refCode: input
            }) )
        }

        // [?] Fill regLinkId with hash(hashKey, saltKey)
        return records.map((records)=> {
            return {
                ...records,
                regLinkId: this.generateHash({
                    fairCode: query.fairCode,
                    slug: query.slug,
                    visitorType: records.visitorType ?? '',
                    country: query.country,
                    refOverseasOffice: records.refOverseasOffice ?? '',
                    refCode: decodeURIComponent(records.refCode ?? ''),
                    saltKey: saltKeyForRegFormLink
                })
            }
        })
    }

    // GenerateHash
    public static generateHash(dto: GenerateHashDto) : string {
        const hashKey = `${dto.fairCode}|${dto.slug}|visitor_type=${dto.visitorType}|country=${dto.country}|ref_office=${dto.refOverseasOffice}|ref_code=${dto.refCode}`;
        return this.hash(hashKey, dto.saltKey)
    }

    // Using map reduce instead of for loop to enhance performance
    public static expandEntryListWithInputList(resList: RegFormLinkTaskEntrySummaryDto[], inputListElement: string[], relation: (res: RegFormLinkTaskEntrySummaryDto, input: string) => (RegFormLinkTaskEntrySummaryDto) ) : RegFormLinkTaskEntrySummaryDto[] {
        return resList.map( (resElement) => inputListElement.map( (input) => relation(resElement, input) ) ) .reduce( (sum, editedRes) => [...sum, ...editedRes], []);
    }

    public static hash(input : string, salt : string) : string {
        let hash = crypto.createHmac('sha256', salt);
        hash.update(input);
        return hash.digest('hex').toString('base64')
    }

    // Each task generate one set of url
    public static generateRegFormLinkOnOneTask(task : FairRegistrationFormLinkTask, host : string) : QueryRegFormLinkRespDto {

        const generatedRegFormLinkList = task.fairRegistrationFormLinkTaskEntries.map( entry => 
            Object.values(LANG).map(lang => 
                `https://${host}/event/${task.fairCode}/${lang}/form/${task.slug}?visitor_type=${entry.visitorType}&country=${task.country}&ref_office=${entry.refOverseasOffice}&ref_code=${entry.refCode}&reg_link_id=${entry.regLinkId}`
            )
        ).reduce( (sum, editedRes) => [ ...sum, ...editedRes], [])

        const respVisitorType = task.fairRegistrationFormLinkTaskEntries.reduce((sum, entry) => (sum.add(entry.visitorType)), new Set())
        const respRefOverseasOffice = task.fairRegistrationFormLinkTaskEntries.reduce((sum, entry) => (sum.add(entry.refOverseasOffice)), new Set())
        const respRefCode = task.fairRegistrationFormLinkTaskEntries.reduce((sum, entry) => (sum.add(entry.refCode)), new Set())

        if (task.id && task.fairCode && task.slug && task.projectYear && task.formType && task.formName && task.formType && task.formType) {
            return {
                id: task.id,
                fairCode: task.fairCode,
                slug: task.slug,
                visitorType: Array.from(respVisitorType).join(';'),
                country: task.country ?? '',
                refOverseasOffice: Array.from(respRefOverseasOffice).join(';').toUpperCase(),
                refCode: Array.from(respRefCode).join(';'),
                projectYear: task.projectYear,
                formType: task.formType,
                formName: task.formName,
                generatedRegFormLinkList,
                recordCreatedTime: task.creationTime
            }
        } else {
            throw new VepError(VepErrorMsg.Query_Reg_Form_Link_Error, 'Invalid field of sql query result found');
        }
        
    }

    public static parseRefCode(refCode : string) {
        return refCode.split(';').map((each)=>(encodeURIComponent(each))).join(';')
    }

}