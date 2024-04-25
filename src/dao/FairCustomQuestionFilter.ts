import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { VepItem } from './VepItem';

@Index('id', ['id'], { unique: true })
@Index('fairCode_projectYear', ['fairCode', 'fiscalYear'])
@Entity('fairCustomQuestionFilter', { schema: 'vepFairDb' })
export class FairCustomQuestionFilter extends VepItem {
  @PrimaryGeneratedColumn({ type: 'bigint', name: 'id', unsigned: true })
  id: string;

  @Column('varchar', { name: 'fairCode', nullable: true, length: 50 })
  fairCode: string | null;

  @Column('varchar', { name: 'fiscalYear', nullable: true, length: 9 })
  fiscalYear: string | null;

  @Column('varchar', { name: 'projectYear', nullable: true, length: 20 })
  projectYear: string | null;

  @Column('tinyint', { name: 'filterNum', nullable: true, unsigned: true, width: 5 })
  filterNum: number | null;

  @Column('int', { name: 'questionNum', nullable: true, unsigned: true, width: 5 })
  questionNum: number | null;

  @Column('varchar', { name: 'filterNameEn', nullable: true, length: 500 })
  filterNameEn: string | null;

  @Column('varchar', { name: 'filterNameTc', nullable: true, length: 500 })
  filterNameTc: string | null;

  @Column('varchar', { name: 'filterNameSc', nullable: true, length: 500 })
  filterNameSc: string | null;
}