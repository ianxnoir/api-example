import { DedicateDataFieldEnum } from "../../formValidation/enum/dedicateDataField.enum";

export const RegistrationDataSqsJsonFilteredField = [
    'x-forwarded-for', 
    DedicateDataFieldEnum.br_password,
    DedicateDataFieldEnum.br_confirm_password
]

export const RegistationExplicitInsertBMField = [
    DedicateDataFieldEnum.br_bm_prefer_timeslot
]