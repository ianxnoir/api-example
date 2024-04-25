import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const XTraceIdDecorator = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): XTraceDto => {
        const request = ctx.switchToHttp().getRequest();
        const xTraceId = request.headers['x-amzn-trace-id'] ? findRootTraceId(request.headers['x-amzn-trace-id']) : ""
        const xRequestId = request.headers['x-request-id'] ?? ""
        return {
            xTraceId,
            xRequestId,
        }
    },
);

export class XTraceDto {
    xTraceId: string;
    xRequestId: string;
}

function findRootTraceId(str: string) : string {
    let pairSet : any = {};
    str.split(';').forEach((item)=>{
        const pair = item.split('=')
        pairSet[pair[0]] = pair[1]
    })
    return pairSet['Root'];
}