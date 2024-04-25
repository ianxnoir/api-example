import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ElasticacheClusterService } from "../../core/elasticachecluster/elasticachecluster.service";

@Injectable()
export class ConferenceElasticacheService extends ElasticacheClusterService {
  constructor(configService: ConfigService) {
    super(configService)
    this.setClient('conference')
  }
}