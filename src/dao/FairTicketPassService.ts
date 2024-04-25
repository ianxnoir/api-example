import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { FairTicketPass } from "./FairTicketPass";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Index("fairTicketPassService_ibfk_1", ["fairTicketPassId"])
@Entity("fairTicketPassService", { schema: "vepFairDb" })
export class FairTicketPassService extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("bigint", { name: "fairTicketPassId", nullable: true })
  fairTicketPassId: number | null;

  @Column("varchar", { name: "ticketPassServiceCode", nullable: true, length: 255 })
  ticketPassServiceCode: string | null;

  @Column("timestamp", { name: "effectiveStartTime", nullable: true })
  effectiveStartTime: string | null;

  @Column("timestamp", { name: "effectiveEndTime", nullable: true })
  effectiveEndTime: string | null;

  @ManyToOne(
    () => FairTicketPass,
    (fairTicketPass) => fairTicketPass.fairTicketPassServices
  )
  @JoinColumn([{ name: "fairTicketPassId", referencedColumnName: "id" }])
  fairTicketPass: FairTicketPass;

}
