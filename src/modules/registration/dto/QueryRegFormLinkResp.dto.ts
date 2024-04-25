import { ApiProperty } from "@nestjs/swagger"
import { IsOptional, IsString } from "class-validator"

export class QueryRegFormLinkRespDto {
    @IsString()
    @ApiProperty({
        description: "Task Id",
        example: "1",
        required: true
    })
    id: string

    @IsString()
    @ApiProperty({
        description: "Fair Code",
        example: "hkjewellery",
        required: true
    })
    fairCode: string

    @IsString()
    @ApiProperty({
        description: "Slug",
        example: "organic-buyer-registration-form",
        required: true
    })
    slug: string

    @IsString()
    @ApiProperty({
        description: "visitorType code",
        example: "00;01",
        required: true
    })
    visitorType: string

    @IsOptional()
    @ApiProperty({
        description: "china or non_china or empty",
        example: "non_china",
        required: false
    })
    country?: string

    @IsOptional()
    @ApiProperty({
        description: "Reference Oversea Office ",
        example: "AY;BJ",
        required: false
    })
    refOverseasOffice?: string

    @IsOptional()
    @ApiProperty({
        description: "Reference Code (User Input)",
        example: "abc;bce;dfg123",
        required: false
    })
    refCode?: string

    @IsString()
    @ApiProperty({
        description: "Vms Project Year",
        example: "2122",
        required: true
    })
    projectYear: string

    @IsString()
    @ApiProperty({
        description: "Form Type : FormJson (xxxx.json) > data.form_data.form_type",
        example: "Organic",
        required: true
    })
    formType: string

    @IsString()
    @ApiProperty({
        description: "Form Name : FormJson (xxxx.json) > data.title.rendered",
        example: "Organic Buyer Registration Form",
        required: true
    })
    formName: string

    @IsString()
    @ApiProperty({
        description: "Reg Form Link, Generated From Admin Portal Input",
        example: "https://www.hktdc.com/event/{faircode}/{lang}/form/{slug}?visitor_type={visitor_type_code}&country={country}&ref_office={ref_office_code}&ref_code={ref_code}",
        required: true
    })
    generatedRegFormLinkList: string[]

    @IsString()
    @ApiProperty({
        description: "Record Created Time",
        example: "2022-04-22T04:47:26.924Z",
        required: true
    })
    recordCreatedTime: Date
}