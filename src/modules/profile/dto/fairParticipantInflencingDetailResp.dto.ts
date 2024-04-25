export class FairParticipantInflencingDetailRespDto {
    targetPreferredMarkets: string[]
    nob: string[]
    productStrategy: string[]
    productInterest: FairParticipantInflencingProductInterestRespDto[]
    addressRegion: string
}

export class FairParticipantInflencingProductInterestRespDto {
    iaId: string
    stId: string
}