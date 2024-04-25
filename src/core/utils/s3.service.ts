import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import S3 from 'aws-sdk/clients/s3';
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { VepErrorMsg } from '../../config/exception-constant';
import { VepError } from '../exception/exception';
@Injectable()
export class S3Service {
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;

  constructor(private configService: ConfigService) {
    this.bucket = this.configService.get<any>('s3.bucket');
    this.accessKeyId = this.configService.get<any>('s3.accessKeyId');
    this.secretAccessKey = this.configService.get<any>('s3.secretAccessKey');
    this.region = this.configService.get<any>('s3.region');
  }

  public async getFile(path: string, bucket?: string) {
    try {
      const params = { Bucket: bucket || this.bucket, Key: path }
      return (await (this.getS3Bucket().getObject(params).promise())).Body?.toString('utf-8')
      // return data;
    } catch (err) {
      console.log(err);
      throw new VepError(VepErrorMsg.S3_File_Missing, err)
    }
  }

  public async retrieveUploadFileHeadData(bucket: string, path: string): Promise<any> {
    try {
      const params = { Bucket: bucket, Key: path };
      const headS3FileResp = await this.getS3Bucket().headObject(params).promise();
      return headS3FileResp ?? null
    } catch (err) {
      console.log(`fail to find upload file, bucket: ${bucket}, path: ${path}, err: ${err}`);
      return null
    }
  }

  public async copyFile(bucket: string, path: string, sourceKeyName: string): Promise<any> {
    const fileInfo = await this.retrieveUploadFileHeadData(bucket, sourceKeyName)
    if (!fileInfo) {
      throw new VepError(VepErrorMsg.S3_File_Missing, `S3 file not found, bucket: ${bucket}, key: sourceKeyName`)
    }
    try {
      const params = { Bucket: bucket, Key: path, CopySource: `${bucket}/${sourceKeyName}` };
      const copyS3FileResp = await this.getS3Bucket().copyObject(params).promise();
      return copyS3FileResp 
    } catch (err) {
      throw new VepError(VepErrorMsg.S3_File_Copy_Fail, err)
    }
  }

  private getS3Bucket(): any {
    return new S3({
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey,
      region: this.region,
    });
  }

  public async getPresignedPutObjectUrl(bucket: string, key: string, contentType: string): Promise<any> {
    const s3Cli = new S3Client({
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      },
      region: this.region
    })

    const commandParams: PutObjectCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType
    })

    const url = await getSignedUrl(s3Cli, commandParams, { expiresIn: 120 });

    return url;
  }

  public async getPresignedPutObjectUrlWithFileName(bucket: string, key: string, fileName: string): Promise<any> {
    const s3Cli = new S3Client({
      region: this.region
    })

    const commandParams: PutObjectCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Metadata: {
        ["filename"]: fileName,
      }
    })

    const url = await getSignedUrl(s3Cli, commandParams, { expiresIn: 120 });

    return url;
  }

  public async getPresignedGetObjectUrl(bucket: string, key: string): Promise<any> {
    const s3Cli = new S3Client({
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      },
      region: this.region
    })

    const commandParams: GetObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    })

    const url = await getSignedUrl(s3Cli, commandParams, { expiresIn: 120 });

    return url;
  }

  public async putObject(bucket: string, key: string, data: string): Promise<any> {
    const s3Cli = new S3Client({
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey
      },
      region: this.region
    })

    const commandParams: PutObjectCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: data
    });

    const response = await s3Cli.send(commandParams);

    return response;

  }


}
