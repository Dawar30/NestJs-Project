import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { ReportStatus, ReportTargetType } from './enums.js';
import { User } from './user.entity.js';
import { Article } from './article.entity.js';

export enum ReportReasonType {
  SPAM = 'SPAM',
  HARASSMENT = 'HARASSMENT',
  HATE_SPEECH = 'HATE_SPEECH',
  MISINFORMATION = 'MISINFORMATION',
  INAPPROPRIATE = 'INAPPROPRIATE',
  OTHER = 'OTHER',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'reporter_id', type: 'varchar' })
  reporterId: string;

  @Index()
  @Column({
    name: 'target_type',
    type: 'enum',
    enum: ReportTargetType,
  })
  targetType: ReportTargetType;

  @Index()
  @Column({ name: 'target_id', type: 'varchar' })
  targetId: string;

  @Column({ type: 'varchar' })
  reason: string;

  @Column({ type: 'text', nullable: true })
  details?: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.PENDING,
  })
  status: ReportStatus;

  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes?: string;

  @Index()
  @Column({ name: 'article_id', type: 'varchar', nullable: true })
  articleId?: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.reportsFiled, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: Relation<User>;

  @ManyToOne(() => Article, (article) => article.reports, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'article_id' })
  article?: Relation<Article> | null;
}
