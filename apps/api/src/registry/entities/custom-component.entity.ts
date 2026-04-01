import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('custom_components')
export class CustomComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  namespace: string;

  @Column()
  type: string;

  @Column({ type: 'jsonb' })
  definition: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
