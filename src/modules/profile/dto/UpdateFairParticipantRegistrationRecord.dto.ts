import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
import { Click2MatchStatus, ParticipantType, RegistrationStatus, RegistrationType } from "./fairRegistration.enum"

export class UpdateFairParticipantRegistrationRecordDto {
    @ApiProperty({
        description: "fairCode",
        example: "fairCode",    
    })
    fairCode: string

    @ApiPropertyOptional({
        description: "array of string for product interest in st_id",
        example: ["f10e8717df0311ea906c0a10104e3bf6"],
    })
    productInterest?: string[]

    @ApiPropertyOptional({
        description: "otherProductCategories",
        example: "Rings,Jewellery,Diamond",
    })
    otherProductCategories?: string

    @ApiPropertyOptional({
        description: "productStrategy",
        example: [
            "OEM"
        ],
    })
    productStrategy?: string[]

    @ApiPropertyOptional({
        description: "targetPreferredMarkets in councilwise code",
        example: ["THA"],
    })
    targetPreferredMarkets?: string[]

    @ApiPropertyOptional({
        description: "numberOfOutlets",
        example: "1",
    })
    numberOfOutlets?: string

    @ApiPropertyOptional({
        description: "hotel",
        example: "The Peninsula",
    })
    hotel?: string

    @ApiPropertyOptional({
        description: "roomType",
        example: "XX",
    })
    roomType?: string

    @ApiPropertyOptional({
        description: "sourcingBudget",
        example: "1000-50000",
    })
    sourcingBudget?: string

    @ApiPropertyOptional({
        description: "interestedIn",
        example: "Y",
    })
    interestedIn?: string

    @ApiPropertyOptional({
        description: "pricePoint",
        example: "Mass market,Middle market",
    })
    pricePoint?: string

    @ApiPropertyOptional({
        description: "lowMOQ",
        example: "Y",
    })
    lowMOQ?: string

    // # Fair Domain
    @ApiPropertyOptional({
        description: "companyLogo",
        example: "TBC",
    })
    companyLogo?: string

    @ApiPropertyOptional({
        description: "profilePicture",
        example: "TBC",
    })
    profilePicture?: string

    @ApiPropertyOptional({
        description: "registrationType",
        example: "E_REG_FORM",
    })
    registrationType?: RegistrationType

    @ApiPropertyOptional({
        description: "registrationStatus",
        example: "CONFIRMED",
    })
    registrationStatus?: RegistrationStatus

    @ApiPropertyOptional({
        description: "participantType",
        example: "ORGANIC",
    })
    participantType?: ParticipantType

    @ApiPropertyOptional({
        description: "click2MatchStatus",
        example: "ACTIVE",
    })
    click2MatchStatus?: Click2MatchStatus
}