export class StructureTagDataResponseDto{
    [key: string]: StructureTagDataDto
}


export class StructureTagDataDto {
    fairCode: string;
    stId: string;
    stEn: string;
    stTc: string;
    stSc: string;
    iaId: string;
    iaEn: string;
    iaTc: string;
    iaSc: string;
    teCode: string;
    [key: string]: string;
}