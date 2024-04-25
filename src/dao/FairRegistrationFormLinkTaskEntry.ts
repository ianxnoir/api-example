import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { FairRegistrationFormLinkTask } from "./FairRegistrationFormLinkTask";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Index("fairRegistrationFormLinkTaskId", ["fairRegistrationFormLinkTaskId"], {})
@Index("regLinkId", ["regLinkId"], {})
@Entity("fairRegistrationFormLinkTaskEntry", { schema: "vepFairDb" })
export class FairRegistrationFormLinkTaskEntry extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("bigint", { name: "fairRegistrationFormLinkTaskId", unsigned: true })
  fairRegistrationFormLinkTaskId: string;

  @Column("varchar", { name: "visitorType", nullable: true, length: 255 })
  visitorType: string | null;

  @Column("varchar", { name: "refOverseasOffice", nullable: true, length: 255 })
  refOverseasOffice: string | null;

  @Column("text", { name: "refCode", nullable: true })
  refCode: string | null;

  @Column("varchar", { name: "regLinkId", nullable: true, length: 255 })
  regLinkId: string | null;

  @ManyToOne(() => FairRegistrationFormLinkTask, (fairRegistrationFormLinkTask) => fairRegistrationFormLinkTask.fairRegistrationFormLinkTaskEntries, {
    onDelete: "RESTRICT",
    onUpdate: "RESTRICT",
  })
  @JoinColumn([{ name: "fairRegistrationFormLinkTaskId", referencedColumnName: "id" }])
  fairRegistrationFormLinkTask: FairRegistrationFormLinkTask;
}
