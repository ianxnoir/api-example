import { Column, Entity, Index, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { FairRegistrationFormLinkTaskEntry } from "./FairRegistrationFormLinkTaskEntry";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Index("fairCode", ["fairCode"], {})
@Index("slug", ["slug"], {})
@Entity("fairRegistrationFormLinkTask", { schema: "vepFairDb" })
export class FairRegistrationFormLinkTask extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("varchar", { name: "fairCode", nullable: true, length: 50 })
  fairCode: string | null;

  @Column("varchar", { name: "projectYear", nullable: true, length: 9 })
  projectYear: string | null;

  @Column("varchar", { name: "formType", nullable: true, length: 255 })
  formType: string | null;

  @Column("varchar", { name: "formName", nullable: true, length: 255 })
  formName: string | null;

  @Column("varchar", { name: "slug", nullable: true, length: 255 })
  slug: string | null;

  @Column("varchar", { name: "country", nullable: true, length: 50 })
  country: string | null;

  @OneToMany(() => FairRegistrationFormLinkTaskEntry, (fairRegistrationFormLinkTaskEntry) => fairRegistrationFormLinkTaskEntry.fairRegistrationFormLinkTask)
  fairRegistrationFormLinkTaskEntries: FairRegistrationFormLinkTaskEntry[];
}
