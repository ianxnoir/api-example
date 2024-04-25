import { IsEnum, IsString } from "class-validator"
import { FormTypeEnum } from "../enum/formType.enum"

export class GetFormSubmissionKeyReqDto {
    @IsString()
    fairCode: string

    @IsString()
    slug: string

    @IsEnum(FormTypeEnum)
    formType: string
}