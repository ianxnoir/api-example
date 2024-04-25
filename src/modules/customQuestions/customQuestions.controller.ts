import { Controller, UseInterceptors, Get, Query, Post, Body, Param } from '@nestjs/common'
import { Logger } from '../../core/utils';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CustomQuestionsService } from './customQuestions.service';
import { ResponseInterceptor } from '../../core/interceptors/resp-transform.interceptor';
import { AdminJwtInterceptor } from '../../core/interceptors/adminJwt.interceptor';
import { AdminUserDecorator } from '../../core/decorator/adminUser.decorator';
import { AdminUserDto } from '../../core/adminUtil/jwt.util';
import { PostCustomQuestionImportReqDto } from './dto/postCustomeQuestionImportRequest.dto';
import { PostCustomQuestionImportResDto } from './dto/postCustomeQuestionImportResponse.dto';
import {
    GetCustomQuestionsImportReqDto,
    GetCustomQuestionsReqDto,
    GetCustomQuestionsFilterLabelReqDto,
    UpdateCustomQuestionsFilterLabelReqDto
} from './dto/customeQuestionsRequest.dto';
import {
    CustomQuestionImportResponseDto,
    CustomQuestionResponseDto,
    CustomQuestionFilterResponseDto
} from './dto/customQuestionsResponse.dto';

@ApiTags('Custom Questions Service API')
@Controller(['/admin/v1/fair/customQuestions'])

export class CustomQuestionsController {
    constructor(private logger: Logger, private customQuestionsService: CustomQuestionsService) {
        this.logger.setContext(CustomQuestionsController.name);
    }
    @Get('/import')
    @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
    @ApiOperation({ summary: 'Return the list of Custom Questions Import Task' })
    @ApiResponse({
        status: 200,
        description: 'Successful Response: Return the list of Custom Questions Import Task',
        type: CustomQuestionImportResponseDto,
        schema: { example: CustomQuestionImportResponseDto },
    })
    public async getCustomQuestionsImportTasks(@AdminUserDecorator() currentUser: AdminUserDto, @Query() query: GetCustomQuestionsImportReqDto) {
        return await this.customQuestionsService.getCustomQuestionsImportTasks(currentUser, query)
    }
    
    @Post('/import')
    @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
    @ApiOperation({ summary: 'Create a Custom Question Import Task in DB' })
    @ApiResponse({
        status: 200,
        description: 'Successful Response: Return the newly-added record',
        type: PostCustomQuestionImportResDto,
        schema: { example: PostCustomQuestionImportResDto },
    })
    public async postCustomQuestionsImportTask(@AdminUserDecorator() currentUser: AdminUserDto, @Body() query: PostCustomQuestionImportReqDto) {
        return await this.customQuestionsService.postCustomQuestionImportTasks(currentUser, query)
    }

    @Get('/:taskId/trigger')
    @UseInterceptors(ResponseInterceptor)
    @ApiOperation({ summary: 'Trigger SQS send import event' })
    @ApiResponse({
        status: 200,
        description: 'Successful Response: Return success message',
    })
    public async triggerSqsMessage(@Param('taskId') taskId: string) {
        return await this.customQuestionsService.triggerSqsMessage(taskId)
    }

    @Get('/customQuestionTemplateFileUrl')
    @UseInterceptors(ResponseInterceptor)
    public async getCustomQuestionTemplateDownloadUrl() {
      return await this.customQuestionsService.getCustomQuestionTemplateDownloadUrl();
    }

    @Get()
    @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
    @ApiOperation({ summary: 'Return the list of Custom Questions' })
    @ApiResponse({
        status: 200,
        description: 'Successful Response: Return the list of Custom Questions',
        type: CustomQuestionResponseDto,
        schema: { example: CustomQuestionResponseDto },
    })
    public async getCustomQuestionsByFilters(@AdminUserDecorator() currentUser: AdminUserDto, @Query() query: GetCustomQuestionsReqDto) {
        return await this.customQuestionsService.getCustomQuestionsByFilters(currentUser, query)
    }

    @Get('/filterLabelList')
    @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
    @ApiOperation({ summary: 'Return Custom Questions Filter Label List' })
    @ApiResponse({
        status: 200,
        description: 'Successful Response: Return Custom Questions Filter Label List',
        type: CustomQuestionFilterResponseDto,
        schema: { example: CustomQuestionFilterResponseDto },
    })
    public async getCustomQuestionsFilterLabelList(@AdminUserDecorator() currentUser: AdminUserDto, @Query() query: GetCustomQuestionsFilterLabelReqDto) {
        return await this.customQuestionsService.getCustomQuestionsFilterLabelList(currentUser, query)
    }

    @Get('/filterLabel')
    @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
    @ApiOperation({ summary: 'Return Custom Questions Filter' })
    @ApiResponse({
        status: 200,
        description: 'Successful Response: Return Custom Questions Label and Filter',
        type: CustomQuestionFilterResponseDto,
        schema: { example: CustomQuestionFilterResponseDto },
    })
    public async getCustomQuestionsFilterLabel(@AdminUserDecorator() currentUser: AdminUserDto, @Query() query: GetCustomQuestionsFilterLabelReqDto) {
        return await this.customQuestionsService.getCustomQuestionsFilterLabel(currentUser, query)
    }

    @Post('/filterLabel')
    @UseInterceptors(ResponseInterceptor, AdminJwtInterceptor)
    @ApiOperation({ summary: 'Update Custom Questions Filter Label' })
    @ApiResponse({
        status: 200,
        description: 'Successful Response: Updated Custom Questions Label and Filter',
    })
    public async updateCustomQuestionsFilterLabel(@AdminUserDecorator() currentUser: AdminUserDto, @Body() body: UpdateCustomQuestionsFilterLabelReqDto) {
        return await this.customQuestionsService.updateCustomQuestionsFilterLabel(currentUser, body)
    }

    @Get('/:taskId/failureReportUrl')
    @UseInterceptors(ResponseInterceptor)
    public async getFailureReportUrl(@Param('taskId') taskId: string) {
        return await this.customQuestionsService.getFailureReportDownloadUrl(taskId);
    }

    @Get('/:taskId/originalFileUrl')
    @UseInterceptors(ResponseInterceptor)
    public async getOriginalFilePresignedUrl(@Param('taskId') taskId: string) {
        return await this.customQuestionsService.getOriginalFilePresignedUrl(taskId);
    }
}