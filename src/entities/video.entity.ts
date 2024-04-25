import { Entity, Column, PrimaryGeneratedColumn, Index } from 'typeorm';
import { TranscodeStatus, VideoStatus, VideoDetail } from '../modules/video/video.type';

@Entity({
  name: 'vepFairSeminarVideo',
})
export class Video {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Index({ unique: true })
  @Column()
  public taskId!: string;

  @Column('enum', { enum: TranscodeStatus, nullable: true, default: null })
  public transcodeStatus!: TranscodeStatus;

  @Column('enum', { enum: VideoStatus, nullable: true, default: null })
  public videoStatus!: VideoStatus;

  @Column({ type: 'text', nullable: true })
  public fileId: string;

  @Column({ type: 'text', nullable: true })
  public fileName: string | null;

  @Column({ type: 'text', nullable: true })
  public fileUrl: string | null;

  @Column({ nullable: true })
  public lastUpdatedBy!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public lastUpdatedAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public creationTime!: Date;

  public convert(): VideoDetail {
    return {
      id: this.id,
      taskId: this.taskId,
      transcodeStatus: this.transcodeStatus,
      videoStatus: this.videoStatus,
      fileName: this.fileName,
      fileUrl: this.fileUrl,
      lastUpdatedBy: this.lastUpdatedBy,
      lastUpdatedAt: this.lastUpdatedAt,
      creationTime: this.creationTime,
    };
  }
}
