export class EnquiryFormEmailDto {
    from: string
    to: string| string[]
    replyTo: string
    emailSubject: string
    emailContent: string
}

export class EnquiryFormContentItem {
    label: string
    value: string
}