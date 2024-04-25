export class SubmitFormUserActivityDto {
    formSubmissionKey: string
    xRequestId: string
    slug: string
    formType: string
    registrationList: SubmitFormActivity[]
}

export class SubmitFormActivity {
    fairCode: string
    registrationNo: string
}