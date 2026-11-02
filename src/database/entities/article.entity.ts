import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ArticleStatus } from './enums.js';
import { User } from './user.entity.js';
import { Category } from './category.entity.js';
import { Tag } from './tag.entity.js';
import { Comment } from './comment.entity.js';
import { Like } from './like.entity.js';
import { Bookmark } from './bookmark.entity.js';
import { Report } from './report.entity.js';

@Entity('articles')
export class Article {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Index({ unique: true })
  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  excerpt?: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'cover_image', nullable: true })
  coverImage?: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ArticleStatus,
    default: ArticleStatus.DRAFT,
  })
  status: ArticleStatus;

  @Column({ name: 'reading_time_minutes', default: 1 })
  readingTimeMinutes: number;

  @Column({ name: 'published_at', type: 'timestamp', nullable: true })
  publishedAt?: Date | null;

  @Index()
  @Column({ name: 'author_id' })
  authorId: string;

  @Index()
  @Column({ name: 'category_id', nullable: true })
  categoryId?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt?: Date | null;

  @ManyToOne(() => User, (user) => user.articles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @ManyToOne(() => Category, (category) => category.articles, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'category_id' })
  category?: Category | null;

  @ManyToMany(() => Tag, (tag) => tag.articles, { cascade: true, eager: true })
  @JoinTable({
    name: 'article_tags',
    joinColumn: { name: 'article_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tag_id', referencedColumnName: 'id' },
  })
  tags: Tag[];

  @OneToMany(() => Comment, (comment) => comment.article)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.article)
  likes: Like[];

  @OneToMany(() => Bookmark, (bookmark) => bookmark.article)
  bookmarks: Bookmark[];

  @OneToMany(() => Report, (report) => report.article)
  reports: Report[];
}
