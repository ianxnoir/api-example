import { ApiPropertyOptional } from "@nestjs/swagger"

export class CustomQuestionsGetPresignedUrlResponseDto {

    presignedUrl: string;

    @ApiPropertyOptional({
        description: "taskId",
        example: "1",
    })
    taskId: string;
}