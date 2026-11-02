import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { FollowsService } from './follows.service.js';
import { Follow, User, Article } from '../../database/entities/index.js';
import { BadRequestException, ConflictException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FollowsService', () => {
  let service: FollowsService;
  let followRepository: {
    findOne: any;
    create: any;
    save: any;
    remove: any;
    findAndCount: any;
    find: any;
  };
  let userRepository: {
    findOne: any;
  };
  let articleRepository: {
    findAndCount: any;
  };

  beforeEach(async () => {
    followRepository = {
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockResolvedValue({ id: 'follow-1' }),
      remove: vi.fn().mockResolvedValue(true),
      findAndCount: vi.fn().mockResolvedValue([[], 0]),
      find: vi.fn().mockResolvedValue([]),
    };

    userRepository = {
      findOne: vi.fn().mockResolvedValue({ id: 'target-user', username: 'author1' }),
    };

    articleRepository = {
      findAndCount: vi.fn().mockResolvedValue([[], 0]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FollowsService,
        {
          provide: getRepositoryToken(Follow),
          useValue: followRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: userRepository,
        },
        {
          provide: getRepositoryToken(Article),
          useValue: articleRepository,
        },
      ],
    }).compile();

    service = module.get<FollowsService>(FollowsService);
  });

  describe('follow', () => {
    it('should prevent user from following themselves', async () => {
      await expect(service.follow('user-1', 'user-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ConflictException if already following', async () => {
      followRepository.findOne.mockResolvedValue({ id: 'follow-1' });

      await expect(service.follow('user-1', 'user-2')).rejects.toThrow(
        ConflictException,
      );
    });

    it('should follow target user successfully', async () => {
      followRepository.findOne.mockResolvedValue(null);

      const result = await service.follow('user-1', 'user-2');
      expect(followRepository.save).toHaveBeenCalled();
      expect(result.message).toContain('You are now following');
    });
  });
});
