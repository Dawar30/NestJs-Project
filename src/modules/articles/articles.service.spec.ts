import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ArticlesService } from './articles.service.js';
import { TagsService } from '../tags/tags.service.js';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Article, ArticleStatus, RoleType } from '../../database/entities/index.js';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('ArticlesService', () => {
  let service: ArticlesService;
  let articleRepository: {
    findOne: any;
    create: any;
    save: any;
    remove: any;
    createQueryBuilder: any;
  };
  let tagsService: {
    findOrCreateMany: any;
  };
  let eventEmitter: {
    emit: any;
  };

  const mockArticle: Partial<Article> = {
    id: 'article-1',
    title: 'Getting Started with NestJS',
    slug: 'getting-started-with-nestjs',
    excerpt: 'An introductory guide',
    content:
      'NestJS is a progressive Node.js framework for building efficient, reliable and scalable server-side applications.',
    coverImage: undefined,
    status: ArticleStatus.PUBLISHED,
    readingTimeMinutes: 1,
    publishedAt: new Date(),
    authorId: 'author-1',
    categoryId: 'cat-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    tags: [],
    author: {
      id: 'author-1',
      username: 'john_doe',
      profile: null as any,
    } as any,
    category: null,
  };

  beforeEach(async () => {
    articleRepository = {
      findOne: vi.fn(),
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockImplementation(async (entity) => ({
        ...mockArticle,
        ...entity,
      })),
      remove: vi.fn().mockResolvedValue(mockArticle),
      createQueryBuilder: vi.fn(),
    };

    tagsService = {
      findOrCreateMany: vi
        .fn()
        .mockResolvedValue([{ id: 'tag-1', name: 'NestJS', slug: 'nestjs' }]),
    };

    eventEmitter = {
      emit: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticlesService,
        {
          provide: getRepositoryToken(Article),
          useValue: articleRepository,
        },
        { provide: TagsService, useValue: tagsService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<ArticlesService>(ArticlesService);
  });

  describe('create', () => {
    it('should calculate reading time, connect tags, and create article', async () => {
      articleRepository.findOne.mockResolvedValue(null);

      const result = await service.create('author-1', {
        title: 'Getting Started with NestJS',
        content:
          'NestJS is a progressive Node.js framework for building efficient, reliable and scalable server-side applications.',
        tags: ['NestJS'],
      });

      expect(tagsService.findOrCreateMany).toHaveBeenCalledWith(['NestJS']);
      expect(articleRepository.create).toHaveBeenCalled();
      expect(articleRepository.save).toHaveBeenCalled();
      expect(result.slug).toBe('getting-started-with-nestjs');
    });
  });

  describe('findBySlug', () => {
    it('should return article if found via query builder', async () => {
      const qbMock = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(mockArticle),
      };
      articleRepository.createQueryBuilder.mockReturnValue(qbMock);

      const result = await service.findBySlug('getting-started-with-nestjs');
      expect(result.id).toBe('article-1');
      expect(result.title).toBe('Getting Started with NestJS');
    });

    it('should throw NotFoundException if article does not exist', async () => {
      const qbMock = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getOne: vi.fn().mockResolvedValue(null),
      };
      articleRepository.createQueryBuilder.mockReturnValue(qbMock);

      await expect(service.findBySlug('unknown-slug')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should throw ForbiddenException if user is not author and not admin', async () => {
      articleRepository.findOne.mockResolvedValue(mockArticle);

      await expect(
        service.update('article-1', 'other-user', [RoleType.USER], {
          title: 'New Title',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow author to update their own article', async () => {
      articleRepository.findOne.mockResolvedValue({ ...mockArticle });

      const result = await service.update(
        'article-1',
        'author-1',
        [RoleType.AUTHOR],
        {
          title: 'Updated Title',
        },
      );

      expect(result.title).toBe('Updated Title');
    });

    it('should allow admin to update any article', async () => {
      articleRepository.findOne.mockResolvedValue({ ...mockArticle });

      const result = await service.update(
        'article-1',
        'admin-id',
        [RoleType.ADMIN],
        {
          title: 'Admin Edited',
        },
      );

      expect(result.title).toBe('Admin Edited');
    });
  });
});
