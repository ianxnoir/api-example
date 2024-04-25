import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
export class ORSParticipantImportV2RequestDto {

    @ApiProperty({
        description: "Registration Status",
        example: "INCOMPLETE"
    })
    registrationStatus: "CONFIRMED" | "INCOMPLETE" | "CANCELLED";

    @ApiProperty({
        description: "Registration Number len: 15",
        example: ""
    })
    registrationNo: string;

    @ApiProperty({
        description: "VMS Project Number",
        example: "007"
    })
    projectNum: string;

    @ApiProperty({
        description: "Project Year",
        example: "2022"
    })
    projectYear: string;

    @ApiProperty({
        description: "SSO Uid",
        example: ""
    })
    ssoUid: string;

    @ApiProperty({
        description: "Display Name",
        example: ""
    })
    displayName: string;

    @ApiProperty({
        description: "title",
        example: "Mr"
    })
    title: string;

    @ApiProperty({
        description: "Contact email for SSO login",
        example: ""
    })
    email: string;

    @ApiPropertyOptional({
        description: "Correspondence Email",
        example: ""
    })
    correspondenceEmail: string;

    @ApiProperty({
        description: "User first name",
        example: "Alex"
    })
    firstName: string;

    @ApiProperty({
        description: "User last name",
        example: "Chan"
    })
    lastName: string;

    @ApiPropertyOptional({
        description: "User job position",
        example: ""
    })
    position: string;

    @ApiPropertyOptional({
        description: "User company name",
        example: ""
    })
    companyName: string;

    @ApiProperty({
        description: "Country Code according to Council-Master-List",
        example: "HKG"
    })
    countryCode: string;

    @ApiPropertyOptional({
        description: "General Participant Remark",
        example: ""
    })
    generalParticipantRemark: string;

    @ApiProperty({
        description: "Pre-defined ticket pass code in Conference",
        example: ""
    })
    ticketPassCode: string;

    @ApiPropertyOptional({
        description: "Pre-defined promotion code in Conference",
        example: ""
    })
    promotionCode: string;

    // @ApiProperty({
    //     description: "Notification Language",
    //     example: "en"
    // })
    // notificationLang: "en" | "tc" | "sc";

    @ApiProperty({
        description: "Shown in Participant List flag when registration status is 'CONFIRMED'",
        example: "Y"
    })
    shownInPartiList: "Y" | "N";

    @ApiPropertyOptional({
        description: "List of custom question answer",
        example: [{
            "questionNum": "1",
            "questionAns": "201"
        }]
    })
    customQuestionList: CustomQuestionV2[];
}

export class CustomQuestionAnswerV2 {
    @ApiProperty({
        description: "Category Code",
        example: "201"
    })
    categoryCode: string;

    @ApiProperty({
        description: "Option Text",
        example: "text"
    })
    text: string;
}
export class CustomQuestionV2 {
    @ApiProperty({
        description: "Question Number",
        example: "1"
    })
    questionNum: string;

    @ApiProperty({
        description: "Question Answer Code",
        example: "201"
    })
    questionAns: CustomQuestionAnswerV2[];
}