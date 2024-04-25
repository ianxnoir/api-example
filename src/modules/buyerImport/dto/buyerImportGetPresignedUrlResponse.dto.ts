import { ApiPropertyOptional } from "@nestjs/swagger"

export class BuyerImportGetPresignedUrlResponseDto {

    presignedUrl: string;

    @ApiPropertyOptional({
        description: "taskId",
        example: "1",
    })
    taskId: string;
}