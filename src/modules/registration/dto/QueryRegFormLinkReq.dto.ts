import { IsNumber } from "class-validator"
import { Type } from "class-transformer"

export class QueryRegFormLinkReqDto {
    @IsNumber()
    @Type(() => Number)
    pageNum: number = 1

    @IsNumber()
    @Type(() => Number)
    size: number = 10
}

