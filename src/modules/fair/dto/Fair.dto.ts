
class GetActiveFairsDto {
    Fairs: FairDetail[];
}

class FairDetail {
    fair_code: string
    vms_project_year: string
    vms_project_no: string
    fair_short_name: FairShortName
    fiscal_year: string
    fair_type: string
    eoa_fair_id: string
    online_event_start_datetime: string
    online_event_end_datetime: string
    wins_event_start_datetime: string
    wins_event_end_datetime: string
    c2m_start_datetime: string
    c2m_end_datetime: string
    hybrid_fair_start_datetime: string
    hybrid_fair_end_datetime: string
    seminar_year: string

    constructor() {
        this.fair_code = ""
        this.fair_short_name = { en: "", tc: "", sc: "" }
        this.vms_project_year = ""
        this.vms_project_no = ""
        this.fiscal_year = ""
        this.fair_type = ""
        this.eoa_fair_id = ""
        this.online_event_start_datetime = ""
        this.online_event_end_datetime = ""
        this.wins_event_start_datetime = ""
        this.wins_event_end_datetime = ""
        this.c2m_start_datetime = ""
        this.c2m_end_datetime = ""
        this.hybrid_fair_start_datetime = ""
        this.hybrid_fair_end_datetime = ""
        this.seminar_year = ""
    }
}
class FairListingData {
    fairCode: string
    fairShortName: string
    vmsProjectNo: string
    fairYear?: string
    fiscalYear?: string
    type?: string
}

interface FairShortName {
    en: string
    sc: string
    tc: string
}
class GetFairListingRespDto {
    total_size: number
    data: FairListingData[]
}

class GetFairListingRequestDto {
    withYears?: boolean
    withoutAor?: boolean
}

export {
    GetActiveFairsDto,
    FairDetail,
    GetFairListingRespDto,
    FairListingData,
    GetFairListingRequestDto
}