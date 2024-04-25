import bodybuilder from "bodybuilder";
import { ConvertedFairParticipantSearchDto } from "../fair/dto/SearchFairParticipants.dto";
import { esHelperUtil } from "./es.util";
import { aggregateNestedOpenSearchFieldsDto, filterOpenSearchFieldsDto } from "./esResult.dto";

export class CustomEsBuilder {
    private bodyBuilder: bodybuilder.Bodybuilder;
    constructor() {
        this.bodyBuilder = bodybuilder()
    }

    buildOpenSearchBuyerQuery(convertSearchObj: ConvertedFairParticipantSearchDto){
        let esQuery = this.bodyBuilder.from(convertSearchObj.from)
        
        // set convertSearchObj.size to 10000 if there is ssouid
        if (convertSearchObj.ssoUidList && convertSearchObj.ssoUidList.length > 0){
            convertSearchObj.size = 10000
        } 

        esQuery.size(convertSearchObj.size)
        
        // filter fairCode and fiscalYear
        if (convertSearchObj.filterFair.length > 0) {
           esQuery.andQuery('bool', b => {
            for (let fair of convertSearchObj.filterFair) {
                b.orQuery('bool', c => {
                    c.andQuery('term', 'fairCode', fair.fairCode)
                    c.andQuery('term', 'fiscalYear', fair.fiscalYear)
                    return c
                })
            }
            return b
           }) 
        }

        // exclude ssoUid in hidden record list
        if (convertSearchObj.hiddenRecordList && convertSearchObj.hiddenRecordList.length > 0){
            esQuery.notQuery('terms', 'ssoUid', convertSearchObj.hiddenRecordList)
        }

        // include selected ccdid
        if (convertSearchObj.ccdid){
            esQuery.andQuery("term", "companyCcdid", convertSearchObj.ccdid)
        }

        // filter OpenSearch Fields
        let filterNestedOpenSearchFields = new Map<keyof filterOpenSearchFieldsDto, string>([
            ["filterNob", "nob.code"],
            ["filterCountry", "addressCountryCode.code"],
            ["filterProductCategory", "productInterest.stId"]
        ])
        
        for (const [key, fieldName] of filterNestedOpenSearchFields) {
            const filterOpenSearchValues = (convertSearchObj[key] as Array<string>)?.filter((field: string) => field.toString().trim() != "")
            if (filterOpenSearchValues && filterOpenSearchValues.length > 0 ){
                let nestedPath = fieldName.split('.')
                nestedPath.pop()
                esQuery.andQuery('nested', 'path', nestedPath.join('.'), b => { 
                    b.orQuery('terms', fieldName, filterOpenSearchValues) 
                    return b
                })
            }
        }

        // alphabet: Company Name or Display Name Start With (only allow one character)
        if (convertSearchObj.alphabet && convertSearchObj.alphabet.length == 1 ){
            const regex = new RegExp('^[a-zA-Z]');
            if (regex.test(convertSearchObj.alphabet)){
                const wildcard = convertSearchObj.alphabet + "*"
                esQuery.andQuery('bool', b => {
                    b.orQuery('wildcard', 'displayName.rawlowercase', {'value': wildcard})
                    b.orQuery('wildcard', 'companyName.rawlowercase', {'value': wildcard})
                    return b
                })
            }
        }

        // keyword search
        if (convertSearchObj.keyword && convertSearchObj.keyword.length > 0){
            const keywordOpenSearchField: string[] = [
                'displayName',
                'displayName.rawlowercase',
                'companyName',
                'companyName.rawlowercase'
            ]

        // nested keyword search
            const keywordNestedOpenSearchField: string[] = [
                'productInterest.stEn', 
                'productInterest.stTc', 
                'productInterest.stSc', 
            ]

            esQuery.andQuery('bool', b => {
                // keyword search
                b.orQuery('multi_match',{'query': convertSearchObj.keyword, 'fields': keywordOpenSearchField, 'operator': 'or'})
                
                // nested keyword search
                b.orQuery('nested', 'path', 'productInterest', c => {
                    c.query('multi_match',{'query': convertSearchObj.keyword, 'fields': keywordNestedOpenSearchField, 'operator': 'or'})
                    return c
                })
                return b
            })
        }

        // sorting by custom sequence for ssouid
        if (convertSearchObj.ssoUidList && convertSearchObj.ssoUidList.length > 0) {
            esQuery.filter('terms', 'ssoUid', convertSearchObj.ssoUidList)
            esQuery.sort([
                {
                    "_script": {
                        "type": "number",
                        "script": {
                            "lang": "painless",
                            "inline": `if(params.scores.containsKey(doc["ssoUid"].value)) { return params.scores[doc["ssoUid"].value];} return 100000;`,
                            "params": {
                                "scores": this.prepareSsoUidCustomSortSequence(convertSearchObj.ssoUidList)
                            }
                        },
                        "order": "asc"
                    }
                }
            ])
        }

        return this
    }

    // build OpenSearch aggregations
    buildOpenSearchBuyerAggregations() {
        this.bodyBuilder.aggregation('terms', 'fairCode', 'participatingFair', { "size": 10000 })

        let aggregationNestedFields = new Map<keyof aggregateNestedOpenSearchFieldsDto, string>([
            ['countrySymbol', 'addressCountryCode.code'],
            ['natureofBusinessSymbols', 'nob.code'],
            ['productCategoryList', 'productInterest.stId']
        ])

        for (const [key, value] of aggregationNestedFields) {
            let tmpValue = value.split(".")
            tmpValue.pop()
            this.bodyBuilder.aggregation(
                'nested',
                { path: tmpValue.join('.') },
                key,
                subAgg => subAgg.agg('terms', value, value, { "size": 10000 })
            )
        }

        return this
    }

    // display selected ES Fields Only
    displaySelectedESFields(){
        const displayESFields = esHelperUtil.prepareESFieldsForDisplay()
        this.bodyBuilder.rawOption('_source', displayESFields)
        return this
    }

    build() {
        return this.bodyBuilder.build()
    }

    // prepare ssoUid custom sort sequence
    prepareSsoUidCustomSortSequence(ssoUidList: string[]) {
        const ssoUidListSequence = ssoUidList.reduce((acc, ssoUid, index) => {
            return { ...acc, [ssoUid]: index }
        }, {});
        return ssoUidListSequence
    }
}

