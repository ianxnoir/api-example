import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Index("id", ["id"], { unique: true })
@Entity("vepFairSeminarRegistration", { schema: "vepFairDb" })
export class FairSeminarRegistration {
  @PrimaryGeneratedColumn({ type: "bigint", name: "id", unsigned: true })
  id: number;

  @Column("varchar", { name: "fairCode", nullable: true, length: 50 })
  fairCode: string | null;

  @Column("varchar", { name: "fiscalYear", nullable: false, length: 9 })
  fiscalYear: string | null;

  @Column("varchar", { name: "seminarRegistrationType", nullable: false, length: 45 })
  seminarRegistrationType: string | null;

  @Column("varchar", { name: "eventId", nullable: false, length: 45 })
  eventId: string | null;

  @Column("varchar", { name: "seminarId", nullable: false, length: 255 })
  seminarId: string | null;

  @Column("varchar", { name: "eventId", nullable: false, length: 50 })
  userRole: string | null;

  @Column("varchar", { name: "userId", nullable: false, length: 50 })
  userId: string | null;

  @Column("varchar", { name: "systemCode", nullable: false, length: 255 })
  systemCode: string | null;

  @Column("varchar", { name: "paymentSession", nullable: true, length: 255 })
  paymentSession: string | null;

  @Column("varchar", { name: "isCheckedOption1", nullable: true, length: 255 })
  isCheckedOption1: string | null;

  @Column("varchar", { name: "isCheckedOption2", nullable: true, length: 255 })
  isCheckedOption2: string | null;

  @Column("varchar", { name: "isCheckedOption3", nullable: true, length: 255 })
  isCheckedOption3: string | null;

  @Column("varchar", { name: "option1Question", nullable: true, length: 255 })
  option1Question: string | null;

  @Column("varchar", { name: "option2Question", nullable: true, length: 255 })
  option2Question: string | null;

  @Column("varchar", { name: "option3Question", nullable: true, length: 255 })
  option3Question: string | null;

  @Column("varchar", { name: "option1Ans", nullable: true, length: 255 })
  option1Ans: string | null;

  @Column("varchar", { name: "option2Ans", nullable: true, length: 255 })
  option2Ans: string | null;

  @Column("varchar", { name: "option3Ans", nullable: true, length: 255 })
  option3Ans: string | null;

  @Column("varchar", { name: "seminarRegStatus", nullable: false, length: 255 })
  seminarRegStatus: string | null;

  @Column("varchar", { name: "shouldSendConfirmationEmail", nullable: false, length: 255 })
  shouldSendConfirmationEmail: string | null;

  @Column("tinyint", { name: "snsStatus", nullable: true })
  snsStatus: number | null;

  @Column("tinyint", { name: "retrySnsCount", nullable: true })
  retrySnsCount: number | null;

  @Column("tinyint", { name: "emailNotiStatus", nullable: true })
  emailNotiStatus: number | null;

  @Column("tinyint", { name: "webNotiStatus", nullable: true })
  webNotiStatus: number | null;

  @Column("tinyint", { name: "watchNowStatus", nullable: true })
  watchNowStatus: number | null;

  @Column("tinyint", { name: "playBackStatus", nullable: true })
  playBackStatus: number | null;

  @Column("varchar", { name: "source", nullable: false, length: 255 })
  source: string | null;
}