import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../../database/entities/index.js';
import { NotificationsGateway } from './notifications.gateway.js';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly gateway: NotificationsGateway,
  ) {}

  async create(data: {
    recipientId: string;
    actorId?: string | null;
    type: NotificationType;
    title: string;
    message: string;
    data?: Record<string, any>;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      recipientId: data.recipientId,
      actorId: data.actorId,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data,
    });

    const saved = await this.notificationRepository.save(notification);

    // Push real-time event via WebSocket
    this.gateway.sendNotificationToUser(data.recipientId, {
      id: saved.id,
      type: saved.type,
      title: saved.title,
      message: saved.message,
      data: saved.data,
      createdAt: saved.createdAt,
    });

    return saved;
  }

  async findAllForUser(
    userId: string,
    unreadOnly = false,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;

    const where: any = { recipientId: userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const [notifications, total] =
      await this.notificationRepository.findAndCount({
        where,
        relations: {
          actor: { profile: true },
        },
        order: { createdAt: 'DESC' },
        skip,
        take: limit,
      });

    const formatted = notifications.map((n) => {
      if (n.actor) {
        delete (n.actor as any).passwordHash;
      }
      return n;
    });

    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id, recipientId: userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<{ affected: number }> {
    const result = await this.notificationRepository.update(
      { recipientId: userId, isRead: false },
      { isRead: true },
    );

    return { affected: result.affected || 0 };
  }

  async getUnreadCount(userId: string): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationRepository.count({
      where: { recipientId: userId, isRead: false },
    });

    return { unreadCount };
  }
}
