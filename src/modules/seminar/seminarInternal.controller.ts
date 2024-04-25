import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

import { VEPSeminarRegistrationDto } from '../../dto/seminarRegistration.dto';

import { SeminarService } from './seminar.service';

@Controller(['seminars/internal'])
export class SeminarInternalController {
  constructor(private seminarService: SeminarService) {}

  @ApiOperation({ summary: 'Seminar Event Registration in VEP DB' })
  @ApiResponse({
    status: 200,
    description: 'Seminar Event Registration Success in VEP DB',
    schema: {
      example: {
        status: 200,
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Fail to register the event in VEP DB',
  })
  @ApiResponse({
    status: 500,
    description: 'System error',
  })
  @Post('/saveSeminarRegistrationRecord')
  public async saveSeminarRegistrationRecord(@Body('data') body: VEPSeminarRegistrationDto[]): Promise<Record<string, any>> {
    return this.seminarService.postSeminarRegistrationRecord(body);
  }
}
