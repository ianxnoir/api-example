export class ProfileInternalDto {
    ssoUid: string;
    title: string;
    firstName: string;
    lastName: string;
    emailId: string;
    companyName: string;
    companyCountry: string;
    preferredChannels: ("EMAIL" | "APP_PUSH" | "WECHAT" | "SMS" | "WHATSAPP")[];
    preferredLanguage:  "en" | "tc" | "sc";
    userTimezone: string;
}