import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Index('fairCode_projectYear', ['fairCode', 'fiscalYear'])
@Entity("fairCustomQuestion", { schema: "vepFairDb" })
export class FairCustomQuestion extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("varchar", { name: "fairCode", nullable: true, length: 50 })
  fairCode: string | null;

  @Column("varchar", { name: "fiscalYear", nullable: true, length: 9 })
  fiscalYear: string | null;

  @Column("varchar", { name: "projectYear", nullable: true, length: 20 })
  projectYear: string | null;

  @Column("tinyint", { name: "questionNum", nullable: true, unsigned: true, width: 5 })
  questionNum: number | null;

  @Column("varchar", { name: "categoryCode", nullable: true, length: 50 })
  categoryCode: string | null;

  @Column("varchar", { name: "valueEn", nullable: true, length: 500 })
  valueEn: string | null;

  @Column("varchar", { name: "valueTc", nullable: true, length: 500 })
  valueTc: string | null;

  @Column("varchar", { name: "valueSc", nullable: true, length: 500 })
  valueSc: string | null;

  @Column("varchar", { name: "parentCategoryCode", nullable: true, length: 50 })
  parentCategoryCode: string | null;

  @Column("smallint", { name: "sequence", nullable: true, width: 5 })
  sequence: number | null;
}