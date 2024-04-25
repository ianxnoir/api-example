import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";
import { VepItem } from "./VepItem";

@Index("formSubmissionKey", ["formSubmissionKey"], { unique: true })
@Entity("fairRegistrationPregeneration", { schema: "vepFairDb" })
export class FairRegistrationPregeneration extends VepItem{
  @Column("varchar", { name: "formSubmissionKey", unique: true, length: 100 })
  formSubmissionKey: string;

  @Column("varchar", { primary: true, name: "projectYear", length: 9 })
  projectYear: string;

  @Column("varchar", { primary: true, name: "sourceTypeCode", length: 20 })
  sourceTypeCode: string;

  @Column("varchar", { primary: true, name: "visitorTypeCode", length: 20 })
  visitorTypeCode: string;

  @Column("varchar", { primary: true, name: "projectNumber", length: 20 })
  projectNumber: string;

  @PrimaryGeneratedColumn({
    type: "mediumint",
    name: "serialNumber",
    unsigned: true,
  })
  serialNumber: number;
}
