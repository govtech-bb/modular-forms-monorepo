import { Column, Entity } from "typeorm";
import { TimestampedEntity } from "./entity-base";

@Entity({ name: "form_definitions" })
export class FormDefinitionEntity extends TimestampedEntity {
  @Column({ name: "form_id", type: "varchar", length: 100 })
  formId!: string;

  @Column({ type: "varchar", length: 20 })
  version!: string;

  @Column({ type: "jsonb" })
  schema!: Record<string, unknown>;

  @Column({ name: "published_at", type: "timestamp", nullable: true })
  publishedAt!: Date | null;
}
