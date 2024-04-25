import { EditFormValidationErrorDto } from "../../formValidation/dto/editFormValidation.dto";

export class UpdateProfileFrontendRespDto {
    isSuccess: boolean
    editFormValidationErrors: EditFormValidationErrorDto[]
    ["user-activity"]?: any
}