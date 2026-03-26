import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum FormSubmissionStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  PROCESSING = "processing",
  COMPLETE = "complete",
  ERROR = "error",
}

@Entity({ name: "form_submissions" })
export class FormSubmissionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "form_id", type: "varchar", length: 100 })
  formId!: string;

  @Column({ name: "form_version", type: "varchar", length: 20 })
  formVersion!: string;

  @Column({
    type: "enum",
    enum: FormSubmissionStatus,
    enumName: "form_submissions_status_enum",
  })
  status!: FormSubmissionStatus;

  @Column({ type: "jsonb" })
  values!: Record<string, unknown>;

  @Column({ type: "jsonb", nullable: true })
  meta!: Record<string, unknown> | null;

  @Column({ name: "submitted_at", type: "timestamp", nullable: true })
  submittedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp", default: () => "NOW()" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp", default: () => "NOW()" })
  updatedAt!: Date;
}
