import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinTable,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  type Relation,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity.js';
import { Role } from './role.entity.js';
import { Article } from './article.entity.js';
import { Comment } from './comment.entity.js';
import { Like } from './like.entity.js';
import { Bookmark } from './bookmark.entity.js';
import { RefreshToken } from './refresh-token.entity.js';
import { Follow } from './follow.entity.js';
import { Notification } from './notification.entity.js';
import { Report } from './report.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  email: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', unique: true })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar' })
  passwordHash: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date | null;

  @OneToOne(() => Profile, (profile) => profile.user, {
    cascade: true,
    eager: true,
  })
  profile?: Relation<Profile>;

  @ManyToMany(() => Role, (role) => role.users, { eager: true, cascade: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Relation<Role[]>;

  @OneToMany(() => Article, (article) => article.author)
  articles: Relation<Article[]>;

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Relation<Comment[]>;

  @OneToMany(() => Like, (like) => like.user)
  likes: Relation<Like[]>;

  @OneToMany(() => Bookmark, (bookmark) => bookmark.user)
  bookmarks: Relation<Bookmark[]>;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: Relation<RefreshToken[]>;

  @OneToMany(() => Follow, (follow) => follow.follower)
  following: Relation<Follow[]>;

  @OneToMany(() => Follow, (follow) => follow.following)
  followers: Relation<Follow[]>;

  @OneToMany(() => Notification, (notification) => notification.recipient)
  notificationsReceived: Relation<Notification[]>;

  @OneToMany(() => Notification, (notification) => notification.actor)
  notificationsTriggered: Relation<Notification[]>;

  @OneToMany(() => Report, (report) => report.reporter)
  reportsFiled: Relation<Report[]>;
}
