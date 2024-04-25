import { IsEnum } from "class-validator";

export class FairParticipantInflencingReqDto {
    fairCode: string;
    fiscalYear: string;
    @IsEnum(['c2mpreferences', 'full'])
    profileType: 'c2mpreferences' | 'full';
}