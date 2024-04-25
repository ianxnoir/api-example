import { Controller, Get, Query } from '@nestjs/common';
import { SbeEndpointRequestDto } from '../../dto/sbeEndpointRequest.dto';
import { StarSpeakerService } from './starSpeaker.service';

@Controller('starSpeakers')
export class StarSpeakerController {
  constructor(private readonly starSpeakerService: StarSpeakerService) {}

  @Get()
  public async getAllStarSpeakers(@Query() sbeParams: SbeEndpointRequestDto): Promise<Record<string, any>> {
    return {
      data: (await this.starSpeakerService.getAll(sbeParams)).starSpeakersData,
    };
  }
}
