import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";
import { FairTicketPassService } from "./FairTicketPassService";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Entity("fairTicketPass", { schema: "vepFairDb" })
export class FairTicketPass extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("varchar", { name: "fairCode", nullable: true, length: 50 })
  fairCode: string | null;

  @Column("varchar", { name: "fiscalYear", nullable: true, length: 9 })
  fiscalYear: string | null;

  @Column("varchar", { name: "projectYear", nullable: true, length: 9 })
  projectYear: string | null;

  @Column("varchar", { name: "ticketPassCode", nullable: true, length: 50 })
  ticketPassCode: string | null;

  @Column("varchar", { name: "ticketPassNameEn", nullable: true, length: 255 })
  ticketPassNameEn: string | null;

  @Column("varchar", { name: "ticketPassTypeCode", nullable: true, length: 255 })
  ticketPassTypeCode: string | null;
  
  @OneToMany(
    () => FairTicketPassService,
    (fairTicketPassService) => fairTicketPassService.fairTicketPass
  )
  fairTicketPassServices: FairTicketPassService[];
}
