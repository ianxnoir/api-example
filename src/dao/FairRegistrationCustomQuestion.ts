import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FairRegistration } from "./FairRegistration";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Index("fairRegistrationId", ["fairRegistrationId"], {})
@Entity("fairRegistrationCustomQuestion", { schema: "vepFairDb" })
export class FairRegistrationCustomQuestion extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("bigint", { name: "fairRegistrationId", unsigned: true })
  fairRegistrationId: string;

  @Column("varchar", { name: "questionNum", nullable: true, length: 50 })
  questionNum: string | null;

  @Column("varchar", { name: "categoryCode", nullable: true, length: 50 })
  categoryCode: string | null;

  @Column("varchar", { name: "optionText", nullable: true, length: 500 })
  optionText: string | null;

  @ManyToOne(
    () => FairRegistration,
    (fairRegistration) =>
      fairRegistration.fairRegistrationCustomQuestions,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "fairRegistrationId", referencedColumnName: "id" }])
  fairRegistration: FairRegistration;
}
