import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: "form_definitions" })
export class FormDefinitionEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "form_id", type: "varchar", length: 100 })
  formId!: string;

  @Column({ type: "varchar", length: 20 })
  version!: string;

  @Column({ type: "jsonb" })
  schema!: Record<string, unknown>;

  @Column({ name: "published_at", type: "timestamp", nullable: true })
  publishedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamp", default: () => "NOW()" })
  createdAt!: Date;
}
