import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiProperty } from '@nestjs/swagger';

export type ParticipantsWrappedData = {
  data: { hits: any, aggregations: any, from: number, size: number, total_size: number, keyword: String, didYouMean: [String], sensitiveKeyword: Boolean}
}

export type ESResultType<T = any> = new (...args: any[]) => T;

export class GeneralESResponse {
  @ApiProperty({
    description: "ES Result",
    example: {"hits": [], "aggregations": {}},
  })
  data: { 
    hits: ESResultType, 
    aggregations: ESResultType 
    from: number
    size: number;
    total_size: number;
    keyword: String;
    didYouMean: [String];
    sensitiveKeyword: Boolean;
  };
}

// response mapping interceptor to transform ES Response object returning the _source in the nested hits and aggregations (For SearchParticipantsV2 Only)
@Injectable()
export class ESParticipantResponseInterceptor<T> implements NestInterceptor<T, ParticipantsWrappedData> {
  httpServer: any;
  intercept(context: ExecutionContext, next: CallHandler): Observable<ParticipantsWrappedData> {
    const request = context.switchToHttp().getRequest()
    let req = request.query 
    if(request.method == "POST") {
      req = request.body 
    }   
    return next.handle().pipe( 
      map((data) => (
          { 
            data: { 
              hits:data?.hits?.hits.map((x:any)=>x._source), 
              aggregations: data?.aggregations,
              from: Number(req.from) || 0,
              size: Number(req.size) || 10,
              total_size: data?.hits?.total?.value,
              keyword: req.keyword,
              didYouMean: data?.didYouMean ,
              sensitiveKeyword: data?.sensitiveKeyword 
            },
          }
        ) as ParticipantsWrappedData
      )
    );
  }
}
