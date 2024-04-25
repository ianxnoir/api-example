import { IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
export class SbeEndpointRequestDto {
  @ApiProperty({
    description: 'vmsProjectCode',
    example: '007',
    type: 'string',
  })
  @IsNotEmpty()
  @ApiProperty()
  public vmsProjectCode!: string;

  @ApiProperty({
    description: 'vmsProjectYear',
    example: '2122',
    type: 'string',
  })
  @IsNotEmpty()
  @ApiProperty()
  public vmsProjectYear!: string;

  @ApiProperty({
    description: 'systemCode',
    example: 'VEP',
    type: 'string',
  })
  @IsNotEmpty()
  @ApiProperty()
  public systemCode!: string;

  @ApiPropertyOptional({
    description: 'language',
    example: 'en / sc / tc',
    type: 'string',
  })
  @IsOptional()
  @ApiProperty()
  public language: string = 'en';

  @ApiPropertyOptional({
    description: 'email',
    example: 'xxx@xxx.com',
    type: 'string',
  })
  @IsOptional()
  public email: string;
}
