import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Entity("fairCustomQuestionImportTask", { schema: "vepFairDb" })
export class FairCustomQuestionImportTask extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("varchar", { name: "taskId", nullable: true, length: 36 })
  taskId: string | null;

  @Column("varchar", { name: "originalFileName", nullable: true, length: 150 })
  originalFileName: string | null;

  @Column("varchar", { name: "uploadFileS3ObjectRefId", nullable: true, length: 500 })
  uploadFileS3ObjectRefId: string | null;

  @Column("varchar", { name: "failureReportS3ObjectRefId", nullable: true, length: 500 })
  failureReportS3ObjectRefId: string | null;

  @Column("varchar", { name: "fairCode", nullable: true, length: 50 })
  fairCode: string | null;

  @Column("varchar", { name: "fiscalYear", nullable: true, length: 9 })
  fiscalYear: string | null;

  @Column("varchar", { name: "projectYear", nullable: true, length: 9 })
  projectYear: string | null;

  @Column("varchar", { name: "status", nullable: true, length: 20 })
  status: string | null;
}
