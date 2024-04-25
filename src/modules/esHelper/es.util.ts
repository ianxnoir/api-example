import { aggregateNestedOpenSearchFieldsDto } from "./esResult.dto"

export class esHelperUtil {
    public static replaceHitesResultWithInnerHit(esResult: any, lang: string) {
        let newInnerHits = esResult.hits.hits.map((data: any) => {
            return {
                ...data,
                _source: {
                    ...(data._source as Object),
                    country: data._source?.addressCountryCode?.[lang],
                    countryCode: data._source?.addressCountryCode?.code 
                }
            }
        })

        return {
            ...esResult,
            hits: {
                ...esResult.hits,
                hits: newInnerHits,
            },
            total: {
                ...esResult.hits.total
            }
        }
    }

    // prepare nested aggregation result
    public static replaceNestedAggregationResult(esResult: any, lang: string) {
        const aggregationWithoutNestedFields: string[] = ["participatingFair"]

        const aggregationNestedFields: Record<keyof aggregateNestedOpenSearchFieldsDto, string> = {
            "countrySymbol": "addressCountryCode.code",
            "natureofBusinessSymbols": "nob.code",
            "productCategoryList": "productInterest.stId"
        }
        
        // aggregate non-nested fields
        aggregationWithoutNestedFields.forEach((field: string) => {
            console.log(field)
            if ( esResult.aggregations?.[field].buckets.length > 0 ){
                esResult.aggregations[field] = (esResult.aggregations)?.[field]?.["buckets"].map((aggregationField: any) => {
                    return { 
                        status: 200,
                        id: aggregationField.key 
                    }
                }) ?? null
            }
        })

        // aggregate nested fields
        for (let [key, innerField] of Object.entries(aggregationNestedFields)) {
            esResult.aggregations![key] = (esResult.aggregations)?.[key][innerField]?.["buckets"].map((aggregationField: any) => {
                 return { 
                    status: 200,
                    id: aggregationField.key 
                } 
            }) ?? null
        }

        return esResult
    }

    // select fields to be displayed from ES
    public static prepareESFieldsForDisplay(): string[] {
        return [
            'id',
            'fairParticipantId',
            'fairCode',
            'fiscalYear',
            'serialNumber',
            'projectYear',
            'visitorTypeCode',
            'sourceTypeCode',
            'projectNumber',
            'registrationNoChecksum',
            'fairRegistrationTypeId',
            'fairRegistrationStatusId',
            'fairParticipantTypeId',
            'c2mParticipantStatusId',
            'title',
            'firstName',
            'lastName',
            'displayName',
            'position',
            'companyName',
            'addressLine1',
            'addressLine2',
            'addressLine3',
            'addressLine4',
            'addressCountryCode',
            'postalCode',
            'stateOrProvinceCode',
            'cityCode',
            'companyPhoneCountryCode',
            'companyPhoneAreaCode',
            'companyPhonePhoneNumber',
            'companyPhoneExtension',
            'mobilePhoneNumber',
            'mobilePhoneCountryCode',
            'companyWebsite',
            'companyBackground',
            'overseasBranchOffice',
            'overseasBranchOfficer',
            'referenceCode',
            'referenceOverseasOffice',
            'cbmRemark',
            'vpRemark',
            'generalBuyerRemark',
            'companyCcdid',
            'individualCcdid',
            'correspondenceEmail',
            'promotionCode',
            'euConsentStatus',
            'badgeConsent',
            'c2mConsent',
            'registrationDetailConsent',
            'c2mLogin',
            'c2mMeetingLogin',
            'tier',
            'formTemplateId',
            'formSubmissionKey',
            'formDataJson',
            'blacklisted',
            'createdBy',
            'creationTime',
            'lastUpdatedBy',
            'lastUpdatedTime',
            'deletionTime',
            'slug',
            'registrationUrl',
            'formType',
            'ssoUid',
            'emailId',
            'nob',
            'productInterest'
        ]
    }
}


