import { Entity, Column, PrimaryGeneratedColumn, Index, PrimaryColumn } from 'typeorm';

@Entity({
  name: 'vepFairSeminarRating',
})
export class Rating {
  @PrimaryGeneratedColumn()
  public id!: number;

  @Index({ unique: true })
  @PrimaryColumn()
  public sbeSeminarId!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public creationTime!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public lastUpdatedAt!: Date;

  @Column({ nullable: true })
  public lastUpdatedBy!: string;

  @Column()
  public rate!: number;
}
