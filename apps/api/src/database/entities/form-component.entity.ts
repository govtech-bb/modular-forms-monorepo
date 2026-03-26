import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from "typeorm";

@Entity({ name: "form_components" })
@Unique(["key", "version"])
export class FormComponentEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 100 })
  key!: string;

  @Column({ type: "varchar", length: 20 })
  version!: string;

  @Column({ type: "jsonb" })
  schema!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamp", default: () => "NOW()" })
  createdAt!: Date;
}
