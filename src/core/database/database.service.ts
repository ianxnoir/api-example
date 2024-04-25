import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import * as AWSXRay from 'aws-xray-sdk';


@Injectable()
export class DatabaseService {
  constructor() { }

  public async findOne<T>(repo: Repository<T>, query: any, subsegmentName: string): Promise<T | undefined> {
    return AWSXRay.captureAsyncFunc(subsegmentName, async (subsegment) => {
      try {
        const queryResult = await repo.findOne(query);

        return queryResult;
      } catch (error) {
        throw error
      } finally {
        subsegment?.close();
      }
    });
  }

  
}