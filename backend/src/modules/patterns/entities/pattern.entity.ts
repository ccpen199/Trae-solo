import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { PatternStatus } from '../../../common/enums/pattern-status.enum';
import { Style } from '../../styles/entities/style.entity';
import { User } from '../../users/entities/user.entity';
import { Bom } from '../../boms/entities/bom.entity';

@Entity('patterns')
export class Pattern extends BaseEntity {
  @Column({ name: 'pattern_number', unique: true })
  patternNumber: string;

  @Column({ name: 'style_id', type: 'uuid' })
  styleId: string;

  @ManyToOne(() => Style, (style) => style.patterns)
  @JoinColumn({ name: 'style_id' })
  style: Style;

  @Column({ name: 'pattern_maker_id', type: 'uuid', nullable: true })
  patternMakerId: string;

  @ManyToOne(() => User, (user) => user.patterns)
  @JoinColumn({ name: 'pattern_maker_id' })
  patternMaker: User;

  @Column({
    type: 'enum',
    enum: PatternStatus,
    default: PatternStatus.PENDING,
  })
  status: PatternStatus;

  @Column({ name: 'version', type: 'int', default: 1 })
  version: number;

  @Column({ name: 'is_latest', default: true })
  isLatest: boolean;

  @Column({ name: 'parent_pattern_id', type: 'uuid', nullable: true })
  parentPatternId: string;

  @Column({ name: 'pattern_file_urls', type: 'jsonb', nullable: true })
  patternFileUrls: string[];

  @Column({ name: 'measurement_table_url', nullable: true })
  measurementTableUrl: string;

  @Column({ name: 'measurements', type: 'jsonb', nullable: true })
  measurements: Measurement[];

  @Column({ name: 'process_spec_url', nullable: true })
  processSpecUrl: string;

  @Column({ name: 'process_specs', type: 'jsonb', nullable: true })
  processSpecs: ProcessSpec[];

  @Column({ name: 'pattern_pieces', type: 'jsonb', nullable: true })
  patternPieces: PatternPiece[];

  @Column({ name: 'grading_rules', type: 'jsonb', nullable: true })
  gradingRules: GradingRule[];

  @Column({ name: 'sizes_available', type: 'jsonb', nullable: true })
  sizesAvailable: string[];

  @Column({ name: 'base_size', nullable: true })
  baseSize: string;

  @Column({ name: 'fabric_width', type: 'decimal', precision: 10, scale: 2, nullable: true })
  fabricWidth: number;

  @Column({ name: 'fabric_consumption', type: 'decimal', precision: 10, scale: 2, nullable: true })
  fabricConsumption: number;

  @Column({ name: 'lining_consumption', type: 'decimal', precision: 10, scale: 2, nullable: true })
  liningConsumption: number;

  @Column({ name: 'interfacing_consumption', type: 'decimal', precision: 10, scale: 2, nullable: true })
  interfacingConsumption: number;

  @Column({ name: 'estimated_materials', type: 'jsonb', nullable: true })
  estimatedMaterials: EstimatedMaterial[];

  @Column({ name: 'sewing_difficulty', type: 'int', default: 1 })
  sewingDifficulty: number;

  @Column({ name: 'estimated_sewing_time', type: 'int', nullable: true })
  estimatedSewingTime: number;

  @Column({ name: 'special_equipment', type: 'jsonb', nullable: true })
  specialEquipment: string[];

  @Column({ name: 'quality_requirements', type: 'text', nullable: true })
  qualityRequirements: string;

  @Column({ name: 'pattern_notes', type: 'text', nullable: true })
  patternNotes: string;

  @Column({ name: 'submitted_at', type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ name: 'confirmed_at', type: 'timestamp', nullable: true })
  confirmedAt: Date;

  @Column({ name: 'confirmed_by', type: 'uuid', nullable: true })
  confirmedBy: string;

  @Column({ name: 'revision_notes', type: 'text', nullable: true })
  revisionNotes: string;

  @Column({ name: 'rejection_reason', type: 'text', nullable: true })
  rejectionReason: string;

  @OneToMany(() => Bom, (bom) => bom.pattern)
  boms: Bom[];
}

interface Measurement {
  name: string;
  code: string;
  baseSizeValue: number;
  unit: string;
  tolerance: number;
  description?: string;
}

interface ProcessSpec {
  step: number;
  operation: string;
  equipment?: string;
  stitchType?: string;
  stitchCount?: number;
  seamAllowance?: number;
  notes?: string;
}

interface PatternPiece {
  name: string;
  code: string;
  quantity: number;
  toBeCut: string;
  hasNotches: boolean;
  grainLine: string;
  mirrorImage: boolean;
  notes?: string;
}

interface GradingRule {
  measurementCode: string;
  sizeDifferences: { [size: string]: number };
}

interface EstimatedMaterial {
  category: string;
  type: string;
  consumption: number;
  unit: string;
  notes?: string;
}
