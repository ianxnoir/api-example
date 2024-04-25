import {  Controller, UseInterceptors, Headers, Get, Put, Param, Body, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { Logger } from '../../core/utils';
import { BuyerImportService } from './buyerImport.service';
import { BuyerImportUpdateRequestDto, GetFairRegistrationTaskReqDto } from './dto/buyerImportRequest.dto';
import { BuyerImportRegistrationResponseDto } from './dto/buyerImportResponse.dto';
import { BuyerImportCreateTaskRequestDto } from './dto/buyerImportCreateTaskRequest.dto';
import { AdminUserDecorator } from '../../core/decorator/adminUser.decorator';
import { AdminJwtInterceptor } from '../../core/interceptors/adminJwt.interceptor';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { GetNextSerialNumberResponseDto } from './dto/getNextSerialNumberResponse.dto';
import { GetNextSerialNumberReqDto } from './dto/getNextSerialNumberRequest.dto';

@ApiTags('Buyer Upload Service API')
@Controller(['/v1/buyerimport/task', '/admin/v1/fair/buyerimport/task'])
export class BuyerImportController {
  constructor(private logger: Logger, private buyerImportService: BuyerImportService) {
    this.logger.setContext(BuyerImportController.name);
  }

  @Put('/:taskId/status')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'Update the task status' })
  @ApiResponse({
    status: 200,
    description: "Successful Response: Returned status",
    type: BuyerImportRegistrationResponseDto,
    schema: { example: BuyerImportRegistrationResponseDto }
  })
  public async updateRegistrationTaskStatus(@Headers() headers: any, @Param('taskId') taskId: string, @Body() buyerImportUpdateRequestDto: BuyerImportUpdateRequestDto) {
    return await this.buyerImportService.updateRegistrationTaskStatus(headers, taskId, buyerImportUpdateRequestDto)
  }

  @Get()
  @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
  @ApiOperation({ summary: 'Return the list of Buyer Import Task' })
  @ApiResponse({
    status: 200,
    description: 'Successful Response: Return the list of Buyer Import Task',
    type: BuyerImportRegistrationResponseDto,
    schema: { example: BuyerImportRegistrationResponseDto },
  })  
  public async getBuyerImportTasks(@AdminUserDecorator() currentUser: AdminUserDto, @Query() query: GetFairRegistrationTaskReqDto) {
    return await this.buyerImportService.getBuyerImportTasks(currentUser, query);
  }

  @Get('/:taskId/failureReportUrl')
  @UseInterceptors(ResponseInterceptor)
  public async getFailureReportUrl(@Param('taskId') taskId: string) {
    return await this.buyerImportService.getFailureReportDownloadUrl(taskId);
  }

  @Get('/:taskId/originalFileUrl')
  @UseInterceptors(ResponseInterceptor)
  public async getOriginalFilePresignedUrl(@Param('taskId') taskId: string) {
    return await this.buyerImportService.getOriginalFilePresignedUrl(taskId);
  }

  @Get('/vepTemplateFileUrl')
  @UseInterceptors(ResponseInterceptor)
  public async getVepBuyerTemplateDownloadUrl(@Query('actionType') actionType?: string) {
    return await this.buyerImportService.getVepBuyerTemplateDownloadUrl(actionType ?? "");
  }
  
  @Post('')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'Create a Buyer Import task in DB' })
  @ApiResponse({
    status: 200,
    description: "Successful Response: Return the newly-added record",
    type: BuyerImportRegistrationResponseDto,
    schema: { example: BuyerImportRegistrationResponseDto }
  })
  @UseInterceptors(AdminJwtInterceptor)
  public async createBuyerImportTask (@AdminUserDecorator() currentUser: AdminUserDto,   @Body() requestBody: BuyerImportCreateTaskRequestDto) {
    return await this.buyerImportService.createBuyerImportTask(currentUser, requestBody)
  }

  @Get('/timeout')
  public async getTimedoutTasks () {
    return await this.buyerImportService.getTimedOutTasks();
  }

  @Get('/setTimeout')
  public async setTimeout() {
    return await this.buyerImportService.timeoutUploadingTasks();
  }

  @Get('/visitorToParticipantMapping')
  @UseInterceptors(ResponseInterceptor)
  @ApiResponse({
    status: 200,
    description: "Successful Response: Return the map for the relationship between Visitor Type and Participant Type",
    schema: { 
      example: {
        "00": { 
          "participantType": 1, 
          "formType": { "organic_buyer": "Organic", "aor": "AOR", "seminar_long": "Seminar Long Form" }, 
          "tier": "GENERAL", 
          "displayName": "Organic Buyer - General", "visitorDisplayName": 
          "00 - Onsite Registered Visitor" 
        }, 
        "21": { 
          "participantType": 2, 
          "formType": {"cip_buyer":"CIP"}, 
          "tier": "", 
          "displayName": "VIP - CIP Buyer", 
          "visitorDisplayName": "21 - VP - Sponsored Buyer" 
        },
        "24": { 
          "participantType": 3, 
          "formType": {"mission_buyer":"Mission"}, 
          "tier": "", 
          "displayName": "VIP - Mission Buyer", 
          "visitorDisplayName": "24 - Sponsorship - Hosted Guest (3 Nights)" 
        }
      }
    }
  })
  public async getVisitorTypeToParticipantTypeMapping() {
    return await this.buyerImportService.fetchVisitorTypeToParticipantTypeMapping();
  }

  @Get('/getNextSerialNumber')
  @UseInterceptors(ResponseInterceptor)
  @ApiOperation({ summary: 'Get next serial Number by fairCode, projectYear, sourceType and visitorType' })
  @ApiResponse({
    status: 200,
    description: "Successful Response: Returned status",
    type: GetNextSerialNumberResponseDto,
    schema: { example: GetNextSerialNumberResponseDto }
  })
  public async getNextSerialNumber(@Query()  query: GetNextSerialNumberReqDto) {
    return await this.buyerImportService.getNextSerialNumber(query);
  }
}
