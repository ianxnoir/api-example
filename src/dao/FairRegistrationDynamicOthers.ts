import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FairRegistration } from "./FairRegistration";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Entity("fairRegistrationDynamicOthers", { schema: "vepFairDb" })
export class FairRegistrationDynamicOthers extends VepItem{
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("bigint", { name: "fairRegistrationId", unsigned: true })
  fairRegistrationId: string;

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

  @Column("varchar", { name: "valueEn", nullable: true, length: 255 })
  valueEn: string | null;

  @Column("varchar", { name: "valueTc", nullable: true, length: 255 })
  valueTc: string | null;

  @Column("varchar", { name: "valueSc", nullable: true, length: 255 })
  valueSc: string | null;

  @ManyToOne(
    () => FairRegistration,
    (fairRegistration) =>
      fairRegistration.fairRegistrationDynamicOthers,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "fairRegistrationId", referencedColumnName: "id" }])
  fairRegistration: FairRegistration;
}
