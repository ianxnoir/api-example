export class ParticipantTypeByFairDto {
    fairCode: string;
    participantType: string;
    tier: string;
    companyCcdId: string;
    suppierUrn: string;
    exhibitorType: string;
    c2mStatus: string;
    registrationStatus: string;
}

export class ParticipantTypeByFairListDto {
    roleByFair: ParticipantTypeByFairDto[];

    constructor(){
        this.roleByFair = []
    }
}