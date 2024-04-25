import { EditFormValidationErrorDto } from "../../formValidation/dto/editFormValidation.dto";

export class AdminEditProfileResp {
    isSuccess: boolean
    editFormValidationErrors: EditFormValidationErrorDto[]
    ["user-activity"]?: any
}