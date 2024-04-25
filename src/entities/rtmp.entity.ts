import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { RtmpDetail } from '../modules/seminar/seminar.type';
import { Seminar as SeminarEntity } from './seminar.entity';
import { Video as VideoEntity } from './video.entity';

@Entity({
  name: 'vepFairSeminarRtmp',
})
export class Rtmp {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  public seminarId!: number;

  @Index()
  @ManyToOne(() => SeminarEntity, (seminar: SeminarEntity) => seminar.rtmps)
  @JoinColumn({ name: 'seminarId' })
  public seminar!: SeminarEntity;

  @Column()
  public language!: string;

  @Column({ type: 'boolean', default: false })
  public defaultLanguage!: boolean;

  @Column()
  public link!: string;

  @Column()
  public key!: string;

  @Column({ type: 'text', nullable: true })
  public liveUrl: string | null;

  @Column({ type: 'text', nullable: true })
  public vodFileDetail: string | null;

  @Column({ type: 'integer', nullable: true })
  public playbackVideoId!: number | null;

  @Column({ type: 'integer', nullable: false, default: 0 })
  public rtmpProcessStatus!: number;

  @Index()
  @OneToOne(() => VideoEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'playbackVideoId' })
  public playbackVideo!: VideoEntity;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public expiredAt!: Date;

  @Column({ nullable: true })
  public lastUpdatedBy!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public lastUpdatedAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public creationTime!: Date;

  public convert(): RtmpDetail {
    return {
      id: this.id,
      language: this.language,
      defaultLanguage: this.defaultLanguage,
      link: this.link,
      key: this.key,
      liveUrl: this.liveUrl,
      playbackVideo: this.playbackVideo?.convert() || null,
      expiredAt: this.expiredAt,
      lastUpdatedBy: this.lastUpdatedBy,
      lastUpdatedAt: this.lastUpdatedAt,
      creationTime: this.creationTime,
    };
  }
}
