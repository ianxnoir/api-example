import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CustomFormSubmission } from "./CustomFormSubmission";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Index("customFormSubmissionId", ["customFormSubmissionId"], {})
@Entity("customFormSubmissionFields", { schema: "vepFairDb" })
export class CustomFormSubmissionFields extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("bigint", { name: "customFormSubmissionId", unsigned: true })
  customFormSubmissionId: string;

  @Column("varchar", { name: "formFieldId", nullable: true, length: 255 })
  formFieldId: string | null;

  @Column("varchar", { name: "labelEn", nullable: true, length: 255 })
  labelEn: string | null;

  @Column("varchar", { name: "labelTc", nullable: true, length: 255 })
  labelTc: string | null;

  @Column("varchar", { name: "labelSc", nullable: true, length: 255 })
  labelSc: string | null;

  @Column("varchar", { name: "value", nullable: true, length: 255 })
  value: string | null;

  @Column("mediumtext", { name: "valueEn", nullable: true })
  valueEn: string | null;

  @Column("mediumtext", { name: "valueTc", nullable: true })
  valueTc: string | null;

  @Column("mediumtext", { name: "valueSc", nullable: true })
  valueSc: string | null;

  @ManyToOne(
    () => CustomFormSubmission,
    (customFormSubmission) => customFormSubmission.customFormSubmissionFields,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "customFormSubmissionId", referencedColumnName: "id" }])
  customFormSubmission: CustomFormSubmission;
}
