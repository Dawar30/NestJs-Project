import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsGateway } from './notifications.gateway.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationListener } from './notification.listener.js';
import { NotificationsController } from './notifications.controller.js';
import {
  Notification,
  Follow,
  Article,
  Comment,
  User,
} from '../../database/entities/index.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification, Follow, Article, Comment, User]),
    JwtModule.register({}),
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationsService,
    NotificationListener,
  ],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
