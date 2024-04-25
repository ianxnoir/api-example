import { Entity, Column, PrimaryGeneratedColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Seminar as SeminarEntity } from './seminar.entity';

@Entity({
  name: 'vepFairSeminarConnection',
})
export class Connection {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Index({ unique: true })
  @Column()
  public connectionId!: string;

  @Column()
  public seminarId!: number;

  @Column()
  public ssoUid!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public creationTime!: Date;

  @Column({ type: 'timestamp', default: () => null, nullable: true })
  public disconnectedAt!: Date | null;

  @Index()
  @ManyToOne(() => SeminarEntity, (seminar: SeminarEntity) => seminar.connections)
  @JoinColumn({ name: 'seminarId' })
  public seminar!: SeminarEntity;
}
