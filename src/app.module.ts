import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { validateEnvironment } from './config/env.validation.js';
import { DatabaseModule } from './database/database.module.js';
import { CommonModule } from './common/common.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { TagsModule } from './modules/tags/tags.module.js';
import { ArticlesModule } from './modules/articles/articles.module.js';
import { CommentsModule } from './modules/comments/comments.module.js';
import { LikesModule } from './modules/likes/likes.module.js';
import { BookmarksModule } from './modules/bookmarks/bookmarks.module.js';
import { FollowsModule } from './modules/follows/follows.module.js';
import { NotificationsModule } from './modules/notifications/notifications.module.js';
import { QueueModule } from './modules/queue/queue.module.js';
import { AdminController, AppController, CatsController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 20,
    }),
    DatabaseModule,
    CommonModule,
    QueueModule,
    UsersModule,
    AuthModule,
    CategoriesModule,
    TagsModule,
    ArticlesModule,
    CommentsModule,
    LikesModule,
    BookmarksModule,
    FollowsModule,
    NotificationsModule,
  ],
  controllers: [AppController, CatsController, AdminController],
  providers: [AppService],
})
export class AppModule {}
