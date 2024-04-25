import {
  Column,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";
import { VepItem } from "./VepItem";

@Index("id", ["id"], { unique: true })
@Entity("fairParticipantTypeRoleMapping", { schema: "vepFairDb" })
export class FairParticipantTypeRoleMapping extends VepItem {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column("varchar", {
    name: "fairParticipantTypeCode",
    length: 255,
  })
  fairParticipantTypeCode: string;

  @Column("varchar", {
    name: "userRole",
    length: 50,
  })
  userRole: string;

}
