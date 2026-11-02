import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service.js';
import { NotificationsGateway } from './notifications.gateway.js';
import { Notification, NotificationType } from '../../database/entities/index.js';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let notificationRepository: {
    create: any;
    save: any;
    findAndCount: any;
    findOne: any;
    update: any;
    count: any;
  };
  let gateway: {
    sendNotificationToUser: any;
  };

  const mockNotification = {
    id: 'notif-1',
    recipientId: 'user-1',
    actorId: 'user-2',
    type: NotificationType.COMMENT,
    title: 'New Comment',
    message: 'User commented on your post',
    data: null,
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(async () => {
    notificationRepository = {
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation(async (entity) => ({ ...mockNotification, ...entity })),
      findAndCount: vi.fn().mockResolvedValue([[mockNotification], 1]),
      findOne: vi.fn().mockResolvedValue({ ...mockNotification }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
      count: vi.fn().mockResolvedValue(1),
    };

    gateway = {
      sendNotificationToUser: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        {
          provide: getRepositoryToken(Notification),
          useValue: notificationRepository,
        },
        {
          provide: NotificationsGateway,
          useValue: gateway,
        },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  describe('create', () => {
    it('should save notification and send real-time websocket message', async () => {
      const result = await service.create({
        recipientId: 'user-1',
        actorId: 'user-2',
        type: NotificationType.COMMENT,
        title: 'New Comment',
        message: 'User commented on your post',
      });

      expect(notificationRepository.save).toHaveBeenCalled();
      expect(gateway.sendNotificationToUser).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          title: 'New Comment',
        }),
      );
      expect(result.id).toBe('notif-1');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const result = await service.markAsRead('notif-1', 'user-1');
      expect(notificationRepository.save).toHaveBeenCalled();
      expect(result.isRead).toBe(true);
    });

    it('should throw NotFoundException if notification does not exist', async () => {
      notificationRepository.findOne.mockResolvedValue(null);

      await expect(service.markAsRead('notif-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      const result = await service.getUnreadCount('user-1');
      expect(result.unreadCount).toBe(1);
    });
  });
});
