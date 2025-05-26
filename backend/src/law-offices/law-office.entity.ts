// src/law-offices/law-office.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  Index,
} from 'typeorm';

@Entity()
@Index(['city', 'specialization', 'title'])
export class LawOffice {
  /* meta */
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn() created_at!: Date;
  @UpdateDateColumn() updated_at!: Date;

  /* klucze logiki */
  @Column() city!: string;
  @Column() specialization!: string;

  /* podstawowe */
  @Column('int', { default: 0 }) position!: number;
  @Column('text', { default: '' }) title!: string;

  /* identyfikatory */
  @Column('text', { default: '' }) place_id!: string;
  @Column('text', { default: '' }) data_id!: string;
  @Column('text', { default: '' }) data_cid!: string;

  /* rating / reviews – mogą być puste  */
  @Column('numeric', { precision: 3, scale: 1, default: 0, nullable: true })
  rating!: number | null;

  @Column('int', { default: 0, nullable: true })
  reviews!: number | null;

  /* kontakty */
  @Column('text', { default: '' }) address!: string;
  @Column('text', { default: '', nullable: true }) phone?: string;
  @Column('text', { default: '', nullable: true }) website?: string;

  /* typy */
  @Column('text', { default: '', nullable: true }) type_id?: string;
  @Column('text', { array: true, default: '{}' }) types!: string[];
  @Column('text', { array: true, default: '{}' }) type_ids!: string[];

  /* grafika */
  @Column('text', { default: '', nullable: true }) thumbnail?: string;
  @Column('text', { default: '', nullable: true }) serpapi_thumbnail?: string;

  /* dane strukturalne */
  @Column('jsonb', { default: {}, nullable: true })
  gps_coordinates?: { latitude: number; longitude: number };

  @Column('jsonb', { default: {}, nullable: true })
  operating_hours?: Record<string, string>;

  @Column('jsonb', { default: [], nullable: true }) extensions?: any;
  @Column('jsonb', { default: [], nullable: true })
  unsupported_extensions?: any;
  @Column('jsonb', { default: {}, nullable: true }) service_options?: any;

  /* linki */
  @Column('text', { default: '' }) reviews_link!: string;
  @Column('text', { default: '' }) photos_link!: string;
  @Column('text', { default: '' }) place_id_search!: string;

  /* status godzin */
  @Column('text', { default: '', nullable: true }) open_state?: string;
  @Column('text', { default: '', nullable: true }) hours?: string;
}
