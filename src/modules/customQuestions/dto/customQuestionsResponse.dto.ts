import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger"
export class CustomQuestionImportResponseDto {
    @ApiProperty({
        description: "id",
        example: 1,
    })
    id: number

    @ApiPropertyOptional({
        description: "taskId",
        example: "001",
    })
    taskId: string

    @ApiPropertyOptional({
        description: "originalFileName",
        example: "023-02-01 Full Data Export_Visitor_Records_sample.xlsx",
    })
    originalFileName: string

    @ApiPropertyOptional({
        description: "fairCode",
        example: "hkjewellery",
    })
    fairCode: string

    @ApiPropertyOptional({
        description: "projectYear",
        example: "2021",
    })
    projectYear: string

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
        description: "lastUpdatedTime",
        example: "2021-11-02T22:00:19.000Z",
    })
    lastUpdatedTime: any

    @ApiPropertyOptional({
        description: "deletionTime",
        example: "2021-11-02T22:00:19.000Z",
    })
    deletionTime: any

    @ApiPropertyOptional({
        description: "failureReportS3ObjectRefId",
        example: "76038231-6df3-4cea-afce-38f04edea459",
    })
    failureReportS3ObjectRefId: string

    @ApiPropertyOptional({
        description: "uploadFileS3ObjectRefId",
        example: "2ce2e235-e316-4e1a-b9c7-b431d9f1a2bd",
    })
    uploadFileS3ObjectRefId: string
}

export class CustomQuestionResponseDto {
    @ApiProperty({
        description: "id",
        example: 1,
    })
    id: number

    @ApiPropertyOptional({
        description: "fairCode",
        example: "hkjewellery",
    })
    fairCode: string

    @ApiPropertyOptional({
        description: "projectYear",
        example: "2021",
    })
    projectYear: string

    @ApiPropertyOptional({
        description: "questionNum",
        example: "2",
    })
    questionNum: number

    @ApiPropertyOptional({
        description: "parentCategoryCode",
        example: "103",
    })
    parentCategoryCode: string

    @ApiPropertyOptional({
        description: "categoryCode",
        example: "103",
    })
    categoryCode: string

    @ApiPropertyOptional({
        description: "valueEn",
        example: "test",
    })
    valueEn: string

    @ApiPropertyOptional({
        description: "valueTc",
        example: "測驗",
    })
    valueTc: string

    @ApiPropertyOptional({
        description: "valueSc",
        example: "测验",
    })
    valueSc: string

    @ApiPropertyOptional({
        description: "sequence",
        example: 3,
    })
    sequence: number

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
        description: "lastUpdatedTime",
        example: "2021-11-02T22:00:19.000Z",
    })
    lastUpdatedTime: any

    @ApiPropertyOptional({
        description: "deletionTime",
        example: "2021-11-02T22:00:19.000Z",
    })
    deletionTime: any
}

export class GetCustomQuestionsFilterLabelDetail {
    @ApiProperty()
    id: number;
    @ApiProperty()
    filterNum: string;
    @ApiProperty()
    questionNum: string;
    @ApiProperty()
    filterNameEn: string;
    @ApiProperty()
    filterNameTc: string;
    @ApiProperty()
    filterNameSc: string;
}

export class GetCustomQuestionDetail {
    @ApiProperty()
    id: number;
    @ApiProperty()
    filterNum: string;
    @ApiProperty()
    questionNum: string;
    @ApiProperty()
    valueEn: string;
    @ApiProperty()
    valueTc: string;
    @ApiProperty()
    valueSc: string;
    @ApiProperty()
    categoryCode: string;
    @ApiProperty()
    parentCategoryCode: string;
}

export class GetCustomQuestionListResult {
    @ApiProperty({ type: GetCustomQuestionDetail })
    questions: GetCustomQuestionDetail[];
    @ApiProperty({ type: GetCustomQuestionsFilterLabelDetail })
    filterLabel: GetCustomQuestionsFilterLabelDetail[]
}

export class CustomQuestionFilterResponseDto {
    @ApiProperty({
        description: "custom questions filter label returned",
        type: () => GetCustomQuestionListResult,
    })
    data: GetCustomQuestionListResult
}