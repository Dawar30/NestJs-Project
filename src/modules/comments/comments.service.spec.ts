import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommentsService } from './comments.service.js';
import { Comment, Article, RoleType } from '../../database/entities/index.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('CommentsService', () => {
  let service: CommentsService;
  let commentRepository: {
    findOne: any;
    findOneOrFail: any;
    find: any;
    create: any;
    save: any;
    softDelete: any;
  };
  let articleRepository: {
    findOne: any;
  };

  const mockComment = {
    id: 'comment-1',
    content: 'Great article!',
    articleId: 'article-1',
    authorId: 'author-1',
    parentId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    author: {
      id: 'author-1',
      username: 'johndoe',
      profile: null,
    },
    replies: [],
  };

  beforeEach(async () => {
    commentRepository = {
      findOne: vi.fn(),
      findOneOrFail: vi.fn().mockResolvedValue(mockComment),
      find: vi.fn().mockResolvedValue([mockComment]),
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation(async (entity) => ({ ...mockComment, ...entity })),
      softDelete: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    articleRepository = {
      findOne: vi.fn().mockResolvedValue({ id: 'article-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentsService,
        {
          provide: getRepositoryToken(Comment),
          useValue: commentRepository,
        },
        {
          provide: getRepositoryToken(Article),
          useValue: articleRepository,
        },
      ],
    }).compile();

    service = module.get<CommentsService>(CommentsService);
  });

  describe('create', () => {
    it('should create a comment if article exists', async () => {
      const result = await service.create('article-1', 'author-1', {
        content: 'Great article!',
      });

      expect(articleRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'article-1' },
      });
      expect(commentRepository.save).toHaveBeenCalled();
      expect(result.content).toBe('Great article!');
    });

    it('should throw NotFoundException if article is missing', async () => {
      articleRepository.findOne.mockResolvedValue(null);

      await expect(
        service.create('article-999', 'author-1', { content: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if user is not the comment author', async () => {
      commentRepository.findOne.mockResolvedValue(mockComment);

      await expect(
        service.update('comment-1', 'other-user', [RoleType.USER], {
          content: 'Updated content',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow author to update their comment', async () => {
      commentRepository.findOne.mockResolvedValue({ ...mockComment });

      const result = await service.update(
        'comment-1',
        'author-1',
        [RoleType.USER],
        {
          content: 'Updated content',
        },
      );

      expect(commentRepository.save).toHaveBeenCalled();
      expect(result.content).toBe('Updated content');
    });
  });

  describe('remove', () => {
    it('should soft delete comment if user is author or admin', async () => {
      commentRepository.findOne.mockResolvedValue(mockComment);

      const result = await service.remove('comment-1', 'author-1', [
        RoleType.USER,
      ]);
      expect(commentRepository.softDelete).toHaveBeenCalledWith('comment-1');
      expect(result.message).toBe('Comment deleted successfully');
    });
  });
});
