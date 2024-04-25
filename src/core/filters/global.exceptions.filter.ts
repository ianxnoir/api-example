import { ArgumentsHost, Catch } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { v4 as uuid } from 'uuid';
import { Logger } from '../utils';
import { VepError } from '../exception/exception';

@Catch()
export class GlobalExceptionsFilter extends BaseExceptionFilter {
  constructor(private readonly logger: Logger) {
    super();

    this.logger.setContext(GlobalExceptionsFilter.name);
  }

  public catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();

    let resStatus: number = 200;
    let resCode: string = '';
    let resMessage: string = '';
    let resDetail: string = '';

    let traceId = getTraceId(res) || uuid();

    if (exception instanceof Error) {
      let traces: string[] = exception.stack?.split('\n') || [];

      let metadata: any = {
        exception_raised: {
          function: traces[1] || '',
          file: traces[1] || '',
          stacktrace: exception.stack,
        },
      };

      this.logger.ERROR(traceId, 'exception_raised', 'Unhandled exception', 'catch', metadata);

      if (exception instanceof VepError) {
        resCode = exception.vepErrorMsg.code;
        resMessage = exception.vepErrorMsg.message;
        resDetail = exception.errorDetail;
        if (exception.vepErrorMsg.status) {
          resStatus = exception.vepErrorMsg.status;
        }
      } else {
        resStatus = 400;
        resCode = this.logger.codePrefix() + this.logger.getCode('exception_raised');
        resMessage = `Unknown Exception ${exception.name}: ${exception.message}`;
      }
    }

    res.status(resStatus).json({
      error: {
        code: resCode,
        message: resMessage,
        detail: resDetail,
        timestamp: new Date().toISOString(),
      },
    });
  }
}

function getTraceId(res: any) {
  let traceId = res.get('x-trace-id');

  if (traceId == undefined) {
    traceId = uuid();
  }
  return traceId;
}
