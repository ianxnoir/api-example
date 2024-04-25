import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("vepFairSeminarRegistrationReport", { schema: "vepFairDb" })
export class SeminarRegistrationReport {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: string;

  @Column()
  fairCode: string;

  @Column()
  fiscalYear: string;

  @Column()
  seminarName: string;

  @Column()
  eventId: string;

  @Column()
  sbeSeminarId: string;

  @Column()
  fileName: string;

  @Column()
  newFileName: string;

  @Column()
  status: string;

  @Column()
  creationTime: Date;

  @Column()
  lastUpdatedTime: Date;

  @Column()
  deletionTime: Date;
}
