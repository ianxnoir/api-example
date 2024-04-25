import { Controller, UseInterceptors, Body, Post, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { Logger } from '../../core/utils';
import { ORSParticipantImportRequestDto } from './dto/participantImportRequest.dto';
import { ORSParticipantImportV2RequestDto } from './dto/participantImportV2Request.dto';
import { ORSParticipantImportResponseDto } from './dto/participantImportResponse.dto';
import { ParticipantImportService } from './participantImport.service';

@ApiTags('Participant Upload Service API')
@Controller(['participant'])
export class ParticipantImportController {
  constructor(private logger: Logger, private participantImportService: ParticipantImportService) {
    this.logger.setContext(ParticipantImportController.name);
  }

  @Get()
  public participantIndex(): Record<string, any> {
    return {
      data: 'Participant Service is Ready',
    };
  }

  @Post('/v1/import-ors')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'Participant Import for ORS' })
  @ApiResponse({
    status: 200,
    description: "Successful Response: Return success message",
    type: ORSParticipantImportResponseDto,
    schema: { example: ORSParticipantImportResponseDto }
  })
  public async createParticipantImportTask(@Body() requestBody: ORSParticipantImportRequestDto) {
    return await this.participantImportService.importORSParticipant(requestBody)
  }

  @Post('/v2/import-ors')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'Participant Import for ORS' })
  @ApiResponse({
    status: 200,
    description: "Successful Response: Return success message",
    type: ORSParticipantImportResponseDto,
    schema: { example: ORSParticipantImportResponseDto }
  })
  public async createParticipantImportTaskR1AB2(@Body() requestBody: ORSParticipantImportV2RequestDto) {
    return await this.participantImportService.importORSParticipantR1AB2(requestBody)
  }

}
