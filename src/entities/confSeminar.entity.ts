// import { Entity, Column, PrimaryGeneratedColumn, Index, OneToMany, OneToOne } from 'typeorm';
import { Entity,  PrimaryGeneratedColumn,  } from 'typeorm';
// import { StreamingType, EventDetail } from '../modules/seminar/seminar.type';
// import { Connection as ConnectionEntity } from './connection.entity';
// import { Kol as KolEntity } from './kol.entity';
// import { Rtmp as RtmpEntity } from './rtmp.entity';
// import { Vod as VodEntity } from './vod.entity';

@Entity({
  name: 'TBC',
})
export class ConferenceSeminar {
  @PrimaryGeneratedColumn()
  public id!: number;

  /*@Index({ unique: true })
  @Column()
  public sbeSeminarId!: string;

   @Column('enum', { enum: StreamingType, nullable: true, default: null })
  public streamingType!: StreamingType;

  @Column({ type: 'text', nullable: true })
  public surveyLink!: string | null;

  @Column({ type: 'numeric', nullable: true })
  public pigeonholeSessionId!: number | null;

  @Column({ type: 'varchar', nullable: true })
  public pigeonholePasscode!: string | null;

  @OneToOne(() => KolEntity, (kol: KolEntity) => kol.seminar, { nullable: true, eager: true })
  public kol: KolEntity;

  @OneToMany(() => VodEntity, (vod: VodEntity) => vod.seminar, { nullable: true, eager: true })
  public vods: VodEntity[];

  @OneToMany(() => RtmpEntity, (rtmp: RtmpEntity) => rtmp.seminar, { nullable: true, eager: true })
  public rtmps: RtmpEntity[];

  @OneToMany(() => ConnectionEntity, (connection: ConnectionEntity) => connection.seminar, { nullable: true })
  public connections: ConnectionEntity[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public creationTime!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public lastUpdatedAt!: Date;

  @Column({ nullable: true })
  public lastUpdatedBy!: string;

  @Column({ type: 'timestamp', nullable: true, default: null })
  public endAt!: Date | null;

  public convert(): EventDetail {
    return {
      id: this.id,
      sbeSeminarId: this.sbeSeminarId,
      streamingType: this.streamingType,
      surveyLink: this.surveyLink || null,
      pigeonholeSessionId: this.pigeonholeSessionId || null,
      pigeonholePasscode: this.pigeonholePasscode || null,
      kol: this.kol?.convert() || null,
      vods: this.vods?.map((vod: VodEntity) => vod.convert()),
      rtmps: this.rtmps?.map((rtmp: RtmpEntity) => rtmp.convert()),
      lastUpdatedBy: this.lastUpdatedBy,
      lastUpdatedAt: this.lastUpdatedAt,
      creationTime: this.creationTime,
      isEnded: !!this.endAt,
    };
  } */
}
