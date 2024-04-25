import { Logger } from "@nestjs/common";
import * as AWSXRay from "aws-xray-sdk";
import moment from "moment";

export function wrapAwsXray<T>(classname: string, funcname: string, logger: Logger, callback: () => T | Promise<T>) {
  return AWSXRay.captureAsyncFunc(`DbSubsegment-vep-fair-${classname}-${funcname}`, async (subsegment) => {
    const start = moment()
    try {
      const result = await callback()
      const end = moment()
      logger.log(`${classname}-${funcname}: elasped ${end.diff(start, 'milliseconds')}ms`)
      return result
    }
    catch (e) {
      logger.error(`${classname}-${funcname}: error`)
      logger.error(e)
      throw e
    }
    finally {
      subsegment?.close()
    }
  })
}