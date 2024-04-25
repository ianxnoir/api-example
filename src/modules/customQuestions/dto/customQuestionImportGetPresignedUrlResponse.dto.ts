import { ApiPropertyOptional } from "@nestjs/swagger"

export class CustomQuestionImportGetPresignedUrlResponseDto {

    presignedUrl: string;

    @ApiPropertyOptional({
        description: "taskId",
        example: "1",
    })
    taskId: string;
}