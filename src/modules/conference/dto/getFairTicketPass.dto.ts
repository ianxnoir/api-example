import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetFairTicketPassResDto {
  @ApiProperty({
    type: String,
    description: 'fair code',
    example: 'bnr'
  })
  @IsNotEmpty()
  @IsString()
  public fairCode: string;

  @ApiProperty({
    type: String,
    description: 'fiscal year of the fair',
    example: '2223'
  })
  @IsNotEmpty()
  @IsString()
  public fiscalYear: string;

  @ApiProperty({
    type: String,
    description: 'project year of the fair',
    example: '2022'
  })
  @IsNotEmpty()
  @IsString()
  public projectYear: string;

  @ApiProperty({
    type: String,
    description: 'ticketPassCode',
    example: 'ticketPassCode'
  })
  @IsNotEmpty()
  @IsString()
  public ticketPassCode: string;

  @ApiProperty({
    type: String,
    description: 'ticketPassNameEn',
    example: 'ticketPassNameEn'
  })
  @IsNotEmpty()
  @IsString()
  public ticketPassNameEn: string;

  @ApiProperty({
    type: String,
    description: 'ticketPassTypeCode',
    example: 'ticketPassTypeCode'
  })
  @IsNotEmpty()
  @IsString()
  public ticketPassTypeCode: string;

}
