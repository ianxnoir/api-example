import { IsEnum } from "class-validator"
import { FormFileAcceptedExt } from "../../../core/utils/enum/formFileContentType.enum"

export class GetPresignedUrlPerUserReqDto {
    fairCode: string
    @IsEnum(['en', 'tc', 'sc'])
    lang: 'en' | 'tc' | 'sc'
    fieldId: string
    @IsEnum(FormFileAcceptedExt)
    fileExt: string
}

export class AdminGetPresignedUrlPerUserReqDto {
    fieldId: string
    @IsEnum(FormFileAcceptedExt)
    fileExt: string
}