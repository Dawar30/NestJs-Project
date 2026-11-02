import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
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
  @Column({ name: 'reporter_id' })
  reporterId: string;

  @Index()
  @Column({
    name: 'target_type',
    type: 'enum',
    enum: ReportTargetType,
  })
  targetType: ReportTargetType;

  @Index()
  @Column({ name: 'target_id' })
  targetId: string;

  @Column()
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
  @Column({ name: 'article_id', nullable: true })
  articleId?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.reportsFiled, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @ManyToOne(() => Article, (article) => article.reports, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'article_id' })
  article?: Article | null;
}
