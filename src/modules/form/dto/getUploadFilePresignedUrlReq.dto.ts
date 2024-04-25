import { IsEnum, IsString } from "class-validator";
import { FormFileAcceptedExt } from "../../../core/utils/enum/formFileContentType.enum";
import { FormTypeEnum } from "../enum/formType.enum";

export class GetUploadFilePresignedUrlReqDto {
    @IsEnum(FormTypeEnum)
    formType: string

    @IsString()
    fieldId: string
    
    @IsEnum(FormFileAcceptedExt)
    fileExt: string

    @IsString()
    formSubmissionKey: string
}
