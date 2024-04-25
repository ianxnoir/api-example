import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FairRegistration } from "./FairRegistration";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Index("fairRegistrationId", ["fairRegistrationId"], {})
@Entity("fairRegistrationTicketPass", { schema: "vepFairDb" })
export class FairRegistrationTicketPass extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("bigint", { name: "fairRegistrationId", unsigned: true })
  fairRegistrationId: string;

  @Column("varchar", { name: "ticketPassCode", nullable: true, length: 50 })
  ticketPassCode: string | null;

  @ManyToOne(
    () => FairRegistration,
    (fairRegistration) =>
      fairRegistration.fairRegistrationTicketPasses,
    { onDelete: "RESTRICT", onUpdate: "RESTRICT" }
  )
  @JoinColumn([{ name: "fairRegistrationId", referencedColumnName: "id" }])
  fairRegistration: FairRegistration;
}
