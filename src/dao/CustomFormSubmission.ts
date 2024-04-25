import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { CustomFormSubmissionFields } from "./CustomFormSubmissionFields";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Index("fairCode", ["fairCode"], {})
@Index("slug", ["slug"], {})
@Entity("customFormSubmission", { schema: "vepFairDb" })
export class CustomFormSubmission extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("varchar", { name: "fairCode", nullable: true, length: 255 })
  fairCode: string | null;

  @Column("varchar", { name: "projectYear", nullable: true, length: 255 })
  projectYear: string | null;

  @Column("varchar", { name: "formType", nullable: true, length: 255 })
  formType: string | null;

  @Column("varchar", { name: "lang", nullable: true, length: 10 })
  lang: string | null;

  @Column("varchar", { name: "slug", nullable: true, length: 255 })
  slug: string | null;

  @OneToMany(
    () => CustomFormSubmissionFields,
    (customFormSubmissionFields) =>
      customFormSubmissionFields.customFormSubmission
  )
  customFormSubmissionFields: CustomFormSubmissionFields[];
}
