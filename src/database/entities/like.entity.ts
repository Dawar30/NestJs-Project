import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity.js';
import { Article } from './article.entity.js';

@Entity('likes')
@Unique(['userId', 'articleId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ name: 'user_id' })
  userId: string;

  @Index()
  @Column({ name: 'article_id' })
  articleId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Article, (article) => article.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'article_id' })
  article: Article;
}
