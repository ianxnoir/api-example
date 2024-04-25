export class FormSubmitMetaData {
    isLoggedin: boolean
    stepToSubmit: number // start from 1
    stepIdToSubmit: string
    totalStep: number
    isValidateStepOnly: boolean
    xForwardedForStr: string
}