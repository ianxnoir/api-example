import { IsEnum, IsOptional } from "class-validator";
import { FormFileAcceptedExt } from "../../../core/utils/enum/formFileContentType.enum";

export class GetUploadFilePresignedUrlReqDto {
    @IsEnum(FormFileAcceptedExt)
    fileType: string

    @IsOptional()
    formSubmissionKey?: string
}