import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiProperty } from '@nestjs/swagger';

export type WrappedData = {
  data: { hits: any, aggregations: any}
  from: number;
  size: number;
  total_size: number;
  keyword: String
  didYouMean: [String]
  sensitiveKeyword: Boolean
}

export type ESResultType<T = any> = new (...args: any[]) => T;

export class GeneralESResponse implements WrappedData{
  @ApiProperty({
    description: "ES Result",
    example: {"hits": [], "aggregations": {}},
  })
  data: { 
    hits: ESResultType, 
    aggregations: ESResultType 
  };

  @ApiProperty({
    description: "Starting index",
    example: 0,
  })
  from: number;

  @ApiProperty({
    description: "Current size of records",
    example: 10,
  })
  size: number;

  @ApiProperty({
    description: "Total size of records",
    example: 11,
  }) 
  total_size: number;

  @ApiProperty({
    description: "Searching Keyword",
    example: "Diamond",
  }) 
  keyword: String

  @ApiProperty({
    description: "did you mean suggestions",
    example: ["Diamond 8K", "Diamond 12K", "Diamond 24K"],
  }) 
  didYouMean: [String]

  @ApiProperty({
    description: "Boolean for sensitive key word",
    example: false,
  }) 
  sensitiveKeyword: Boolean
}

// response mapping interceptor to transform ES Response object returning the _source in the nested hits and aggregations
@Injectable()
export class ESResponseInterceptor<T> implements NestInterceptor<T, WrappedData> {
  httpServer: any;
  intercept(context: ExecutionContext, next: CallHandler): Observable<WrappedData> {
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
            },
            from: Number(req.from) || 0,
            size: Number(req.size) || 10,
            total_size: data?.hits?.total?.value,
            keyword: req.keyword,
            didYouMean: data?.didYouMean ,
            sensitiveKeyword: data?.sensitiveKeyword 
          }
        ) as WrappedData
      )
    );
  }
}
