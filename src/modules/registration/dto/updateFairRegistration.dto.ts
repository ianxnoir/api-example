import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, MaxLength } from "class-validator";

export class FairRegistrationRemarkReqDto {
    @ApiProperty({
        description: "CBM Remark",
        example: "CBM Remark",
        maxLength: 30000,
        required: false
    })
    @MaxLength(30000)
    @IsOptional()
    cbmRemark?: string

    @ApiProperty({
        description: "VP Remark",
        example: "VP Remark",
        maxLength: 30000,
        required: false
    })
    @MaxLength(30000)
    @IsOptional()
    vpRemark?: string

    @ApiProperty({
        description: "General Buyer Remark",
        example: "General Buyer Remark",
        maxLength: 30000,
        required: false
    })
    @MaxLength(30000)
    @IsOptional()
    generalBuyerRemark?: string
     
    constructor(cbmRemark: string | null | undefined, vpRemark: string | null | undefined, generalBuyerRemark: string | null | undefined) {
        // cbmRemark, vpRemark and generalBuyerRemark can be updated as "" but not null or undfined
        if (cbmRemark != null ){ this.cbmRemark = cbmRemark}
        if (vpRemark != null ){ this.vpRemark = vpRemark}
        if (generalBuyerRemark != null ){ this.generalBuyerRemark = generalBuyerRemark;}
    }

}