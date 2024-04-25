import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Index(
  "fairCode_fiscalYear_status_emailId",
  ["fairCode", "fiscalYear", "status", "emailId"],
  {}
)
@Index("status", ["status"], {})
@Entity("fairRegistrationFormSubmission", { schema: "vepFairDb" })
export class FairRegistrationFormSubmission extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("varchar", { name: "ssoUid", nullable: true, length: 50 })
  ssoUid: string | null;

  @Column("varchar", { name: "emailId", nullable: true, length: 255 })
  emailId: string | null;

  @Column("varchar", { name: "fairCode", nullable: true, length: 50 })
  fairCode: string | null;

  @Column("varchar", { name: "fiscalYear", nullable: true, length: 50 })
  fiscalYear: string | null;

  @Column("mediumtext", { name: "sqsMessage", nullable: true })
  sqsMessage: string | null;

  @Column("varchar", { name: "status", nullable: true, length: 15 })
  status: string | null;

  @Column("varchar", { name: "formSubmissionKey", nullable: true, length: 255 })
  formSubmissionKey: string | null;

  @Column("varchar", { name: "log", nullable: true, length: 1500 })
  log: string | null;

  @Column("tinyint", {
    name: "maxRetry",
    nullable: true,
    unsigned: true,
    default: () => "'0'",
  })
  maxRetry: number | null;

  @Column("tinyint", {
    name: "retryCount",
    nullable: true,
    unsigned: true,
    default: () => "'0'",
  })
  retryCount: number | null;

  @Column("smallint", {
    name: "retryIntervalSec",
    nullable: true,
    unsigned: true,
    default: () => "'30'",
  })
  retryIntervalSec: number | null;

}
