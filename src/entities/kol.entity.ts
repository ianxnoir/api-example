import { Entity, Column, PrimaryGeneratedColumn, JoinColumn, OneToOne } from 'typeorm';
import { PlatformType, KolDetail } from '../modules/seminar/seminar.type';
import { Seminar as SeminarEntity } from './seminar.entity';
import { Video as VideoEntity } from './video.entity';

@Entity({
  name: 'vepFairSeminarKol',
})
export class Kol {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Column()
  public seminarId!: number;

  @OneToOne(() => SeminarEntity, (seminar: SeminarEntity) => seminar.kol)
  @JoinColumn({ name: 'seminarId' })
  public seminar!: SeminarEntity;

  @Column('enum', { enum: PlatformType })
  public platformType!: PlatformType;

  @Column({ nullable: true })
  public platformId!: string;

  @Column({ nullable: true })
  public platformUrl!: string;

  @Column({ type: 'integer', nullable: true })
  public playbackVideoId!: number | null;

  @OneToOne(() => VideoEntity, { nullable: true, eager: true })
  @JoinColumn({ name: 'playbackVideoId' })
  public playbackVideo!: VideoEntity;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public creationTime!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public lastUpdatedAt!: Date;

  @Column({ nullable: true })
  public lastUpdatedBy!: string;

  public convert(): KolDetail {
    return {
      id: this.id,
      platformType: this.platformType,
      platformId: this.platformId,
      platformUrl: this.platformUrl,
      playbackVideo: this.playbackVideo?.convert() || null,
      creationTime: this.creationTime,
      lastUpdateAt: this.lastUpdatedAt,
      lastUpdateBy: this.lastUpdatedBy,
    };
  }
}
