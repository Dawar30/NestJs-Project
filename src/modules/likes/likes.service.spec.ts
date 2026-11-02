import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LikesService } from './likes.service.js';
import { Like, Article } from '../../database/entities/index.js';
import { NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LikesService', () => {
  let service: LikesService;
  let likeRepository: {
    findOne: any;
    create: any;
    save: any;
    remove: any;
    count: any;
    findAndCount: any;
  };
  let articleRepository: {
    findOne: any;
  };

  beforeEach(async () => {
    likeRepository = {
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockResolvedValue({ id: 'like-1' }),
      remove: vi.fn().mockResolvedValue(true),
      count: vi.fn().mockResolvedValue(1),
      findAndCount: vi.fn().mockResolvedValue([[], 0]),
    };

    articleRepository = {
      findOne: vi.fn().mockResolvedValue({ id: 'article-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LikesService,
        {
          provide: getRepositoryToken(Like),
          useValue: likeRepository,
        },
        {
          provide: getRepositoryToken(Article),
          useValue: articleRepository,
        },
      ],
    }).compile();

    service = module.get<LikesService>(LikesService);
  });

  describe('toggleLike', () => {
    it('should create like if not currently liked', async () => {
      likeRepository.findOne.mockResolvedValue(null);
      likeRepository.count.mockResolvedValue(1);

      const result = await service.toggleLike('article-1', 'user-1');
      expect(result.liked).toBe(true);
      expect(result.totalLikes).toBe(1);
      expect(likeRepository.save).toHaveBeenCalled();
    });

    it('should remove like if already liked', async () => {
      likeRepository.findOne.mockResolvedValue({ id: 'like-1' });
      likeRepository.count.mockResolvedValue(0);

      const result = await service.toggleLike('article-1', 'user-1');
      expect(result.liked).toBe(false);
      expect(result.totalLikes).toBe(0);
      expect(likeRepository.remove).toHaveBeenCalled();
    });

    it('should throw NotFoundException if article does not exist', async () => {
      articleRepository.findOne.mockResolvedValue(null);

      await expect(service.toggleLike('article-999', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
