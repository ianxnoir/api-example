import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { VodDetail } from '../modules/seminar/seminar.type';
import { Seminar as SeminarEntity } from './seminar.entity';
import { Video as VideoEntity } from './video.entity';

@Entity({
  name: 'vepFairSeminarVod',
})
export class Vod {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  public seminarId!: number;

  @ManyToOne(() => SeminarEntity, (seminar: SeminarEntity) => seminar.vods)
  @JoinColumn({ name: 'seminarId' })
  public seminar!: SeminarEntity;

  @Column({ nullable: true })
  public language!: string;

  @Column({ type: 'boolean', default: false })
  public defaultLanguage!: boolean;

  @Column({ nullable: true })
  public lastUpdatedBy!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public lastUpdatedAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public creationTime!: Date;

  @Column({ type: 'integer', nullable: true })
  public liveVideoId!: number | null;

  @OneToOne(() => VideoEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'liveVideoId' })
  public liveVideo!: VideoEntity;

  @Column({ type: 'integer', nullable: true })
  public playbackVideoId!: number | null;

  @OneToOne(() => VideoEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'playbackVideoId' })
  public playbackVideo!: VideoEntity;

  public convert(): VodDetail {
    return {
      id: this.id,
      language: this.language,
      defaultLanguage: this.defaultLanguage,
      liveVideo: this.liveVideo?.convert() || null,
      playbackVideo: this.playbackVideo?.convert() || null,
      lastUpdatedBy: this.lastUpdatedBy,
      lastUpdatedAt: this.lastUpdatedAt,
      creationTime: this.creationTime,
    };
  }
}
