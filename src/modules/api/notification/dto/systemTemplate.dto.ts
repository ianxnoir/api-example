export class SystemTemplate {
    content: SystemTemplateContent
    status: string
    message: string
}

export class SystemTemplateContent {
    notificationChannels: string[]
    critical: boolean
    template: { templateName: string }
    fairs: SystemTemplateContentPerFair[]
    placeholder: SystemTemplatePlaceholder
}

export class SystemTemplateContentPerFair {
    content: {
        email: SystemTemplateContentEmail
        website: SystemTemplateContentWebsite
    }
    fairName: { vmsProjectNo: string, fairName: string }
    fairCode: string
}

export class SystemTemplatePlaceholder {
    email: string[]
    website: string[]
}

export class SystemTemplateContentEmail {
    emailSubjectEn?: string | null
    emailContentEn?: string | null
    emailSubjectTc?: string | null
    emailContentTc?: string | null
    emailSubjectSc?: string | null
    emailContentSc?: string | null
}

export class SystemTemplateContentWebsite {
    websiteContentEn?: string | null
    websiteContentSc?: string | null
    websiteContentTc?: string | null
}
