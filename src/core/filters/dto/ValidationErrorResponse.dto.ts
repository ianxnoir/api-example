import { ApiProperty } from "@nestjs/swagger"

export class ValidationErrorDto {
    @ApiProperty({
        description: "error code",
        example: "E0300100400"
    })
    code: string
    @ApiProperty({
        description: "error message",
        example: "Validation Error"
    })
    message: string
    @ApiProperty({
        description: "array of validation error",
        example: ["content should not be empty"]
    })
    details: string[]
    @ApiProperty({
        description: "timestamp",
        example: "2021-08-11T09:12:41.735Z"
    })
    timestamp: string
}

export class ValidationErrorResponseDto {
    @ApiProperty({
        description: "Validation Error",
        type: ValidationErrorDto
    })
    error: ValidationErrorDto
}
