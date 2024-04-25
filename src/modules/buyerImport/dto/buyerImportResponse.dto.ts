import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"

export class BuyerImportRegistrationResponseDto {
    @ApiProperty({
        description: "id",
        example: 1,
    })
    id: number

    @ApiPropertyOptional({
        description: "taskId",
        example: "1",
    })
    taskId: string

    @ApiPropertyOptional({
        description: "originalFileName",
        example: "023-02-01 Full Data Export_Visitor_Records_sample.xlsx",
    })
    originalFileName: string

    @ApiPropertyOptional({
        description: "uploadFileS3ObjectRefId",
        example: "2ce2e235-e316-4e1a-b9c7-b431d9f1a2bd",
    })
    uploadFileS3ObjectRefId: string

    @ApiPropertyOptional({
        description: "failureReportS3ObjectRefId",
        example: "76038231-6df3-4cea-afce-38f04edea459",
    })
    failureReportS3ObjectRefId: string

    @ApiPropertyOptional({
        description: "fairCode",
        example: "hkjewellery",
    })
    fairCode: string

    @ApiPropertyOptional({
        description: "fiscalYear",
        example: "2023",
    })
    fiscalYear: string
    
    @ApiPropertyOptional({
        description: "projectYear",
        example: "2021",
    })
    projectYear: string

    @ApiPropertyOptional({
        description: "actionType",
        example: "INSERT_PAST_BUYER",
    })
    actionType: string

    @ApiPropertyOptional({
        description: "sourceType",
        example: "08",
    })
    sourceType: string

    @ApiPropertyOptional({
        description: "visitorType",
        example: "01",
    })
    visitorType: string

    @ApiPropertyOptional({
        description: "participantTypeId",
        example: 1
    })
    participantTypeId: number

    @ApiPropertyOptional({
        description: "tier",
        example: "GENERAL",
    })
    tier: string

    @ApiPropertyOptional({
        description: "serialNumberStart",
        example: 1,
    })
    serialNumberStart: number

    @ApiPropertyOptional({
        description: "numberOfRow",
        example: 200000,
    })
    numberOfRow: number

    @ApiPropertyOptional({
        description: "status",
        example: "PENDING",
    })
    status: string

    @ApiPropertyOptional({
        description: "createdBy",
        example: "SYSTEM",
    })
    createdBy: string

    @ApiPropertyOptional({
        description: "creationTime",
        example: "2021-11-02T22:00:19.000Z",
    })
    creationTime: any

    @ApiPropertyOptional({
        description: "lastUpdatedBy",
        example: "SYSTEM",
    })
    lastUpdatedBy: string

    @ApiPropertyOptional({
        description: "creationTime",
        example: "2021-11-02T22:00:19.000Z",
    })
    lastUpdatedTime: any

    @ApiPropertyOptional({
        description: "deletionTime",
        example: "2021-11-02T22:00:19.000Z",
    })
    deletionTime: any
}



