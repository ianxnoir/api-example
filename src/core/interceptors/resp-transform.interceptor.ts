import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiProperty } from '@nestjs/swagger';
import { WrappedData } from './es-resp-transform.interceptor';
import { IntcpExcludePath } from '../../config/intcp-exclude-path';

export interface Response<WrappedData> {
  timestamp: number;
  status: number;
  data: WrappedData
}

// export type ResultType<T = any> = new (...args: any[]) => T;

export class GeneralESResponse implements Response<WrappedData>{
  @ApiProperty({
    description: "timestamp",
    example: 1628489710134,
  })
  timestamp: number;

  @ApiProperty({
    description: "Response Code",
    example: 200,
  })
  status: number;

  @ApiProperty({
    description: "Result",
    example: {},
  })
  data: WrappedData

}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<WrappedData, Response<WrappedData>> {
  httpServer: any;
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<WrappedData>> {
    if( !excludeIntercetorRequired(context.switchToHttp().getRequest()?.url) ){
      return next.handle().pipe( 
        map((data) => {
          let finalData: any
          if (typeof(data) === 'object') {
            finalData  = (!('data' in data)) ? {data} : data
          }
          else {
            finalData = {"data" : data}
          }
          return (
            { 
                timestamp: new Date().getTime(),
                status: 200,
                ...finalData
            }
            )}
        )
      );
    }else{
      return next.handle().pipe( map((data) => (data)));
    }
  }
}

function excludeIntercetorRequired(url: any){
  return IntcpExcludePath.Response_Interceptor.findIndex( (path) => { return url.startsWith(path) }) !== -1 ? true : false;
}