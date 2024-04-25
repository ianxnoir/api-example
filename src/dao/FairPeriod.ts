import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn
} from 'typeorm';
import { VepItem } from './VepItem';

export enum MeetingType {
  ONLINE = 0,
  F2F = 1,
  CIP = 2
}

@Index('id', ['id'], { unique: true })
@Entity('vepFairPeriod', { schema: 'vepFairDb' })
export class FairPeriod extends VepItem {
  @PrimaryGeneratedColumn({ type: 'int', name: 'id', unsigned: true })
  public id: string;

  @Column('varchar', { name: 'fairCode', nullable: false, length: 50 })
  public fairCode: string;

  @Column('varchar', { name: 'fairYear', nullable: false, length: 50 })
  public fairYear: string;

  @Column({ type: 'timestamp', nullable: false })
  public startTime!: string;

  @Column({ type: 'timestamp', nullable: false })
  public endTime!: string;

  @Column({ type: 'tinyint', nullable: false })
  public type!: MeetingType;
}
