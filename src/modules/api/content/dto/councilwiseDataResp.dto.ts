export class CouncilwiseDataResponseDto{
    [key: string]: CouncilwiseDataDto
}

export class CouncilwiseDataDto {
    code: string;
    en: string;
    tc: string;
    sc: string;
    sid: string;
    [key: string]: any;
}

export class CouncilwiseAddressRegionResponseDto{
    [key: string]: CouncilwiseddressRegionDto
}

export class CouncilwiseddressRegionDto {
    code: string;
    region_code: string;
    region_en_desc: string;
    en: string;
    tc: string;
    sc: string;
}