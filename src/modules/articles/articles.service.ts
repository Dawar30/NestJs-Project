import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TagsService } from '../tags/tags.service.js';
import { CreateArticleDto } from './dto/create-article.dto.js';
import { UpdateArticleDto } from './dto/update-article.dto.js';
import { QueryArticleDto } from './dto/query-article.dto.js';
import { Article, ArticleStatus, RoleType } from '../../database/entities/index.js';
import { randomBytes } from 'node:crypto';

@Injectable()
export class ArticlesService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly tagsService: TagsService,
  ) {}

  private slugify(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  private calculateReadingTime(content: string): number {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const wordsPerMinute = 200;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    const baseSlug = this.slugify(title);
    const existing = await this.articleRepository.findOne({
      where: { slug: baseSlug },
    });

    if (!existing) {
      return baseSlug;
    }

    const randomSuffix = randomBytes(3).toString('hex');
    return `${baseSlug}-${randomSuffix}`;
  }

  async create(authorId: string, dto: CreateArticleDto): Promise<Article> {
    const slug = await this.generateUniqueSlug(dto.title);
    const readingTimeMinutes = this.calculateReadingTime(dto.content);

    let tags: any[] = [];
    if (dto.tags && dto.tags.length > 0) {
      tags = await this.tagsService.findOrCreateMany(dto.tags);
    }

    const status = dto.status || ArticleStatus.DRAFT;
    const publishedAt = status === ArticleStatus.PUBLISHED ? new Date() : null;

    const article = this.articleRepository.create({
      title: dto.title,
      slug,
      excerpt: dto.excerpt,
      content: dto.content,
      coverImage: dto.coverImage,
      status,
      readingTimeMinutes,
      publishedAt,
      authorId,
      categoryId: dto.categoryId,
      tags,
    });

    return this.articleRepository.save(article);
  }

  async findAll(query: QueryArticleDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const qb = this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoinAndSelect('article.likes', 'likes')
      .leftJoinAndSelect('article.comments', 'comments')
      .leftJoinAndSelect('article.bookmarks', 'bookmarks')
      .where('article.deletedAt IS NULL');

    if (query.status) {
      qb.andWhere('article.status = :status', { status: query.status });
    } else {
      qb.andWhere('article.status = :status', {
        status: ArticleStatus.PUBLISHED,
      });
    }

    if (query.search) {
      qb.andWhere(
        '(LOWER(article.title) LIKE :search OR LOWER(article.content) LIKE :search OR LOWER(article.excerpt) LIKE :search)',
        { search: `%${query.search.toLowerCase()}%` },
      );
    }

    if (query.category) {
      qb.andWhere('category.slug = :categorySlug', {
        categorySlug: query.category,
      });
    }

    if (query.tag) {
      qb.andWhere('tags.slug = :tagSlug', { tagSlug: query.tag });
    }

    if (query.author) {
      qb.andWhere('author.username = :authorUsername', {
        authorUsername: query.author,
      });
    }

    const sortColumn =
      query.orderBy === 'publishedAt'
        ? 'article.publishedAt'
        : query.orderBy === 'title'
          ? 'article.title'
          : 'article.createdAt';

    qb.orderBy(sortColumn, query.order === 'asc' ? 'ASC' : 'DESC');
    qb.skip(skip).take(limit);

    const [articles, total] = await qb.getManyAndCount();

    const formattedArticles = articles.map((art: Article) => {
      if (art.author) {
        delete (art.author as any).passwordHash;
      }
      return {
        ...art,
        likesCount: art.likes?.length || 0,
        commentsCount: art.comments?.length || 0,
        bookmarksCount: art.bookmarks?.length || 0,
      };
    });

    return {
      data: formattedArticles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string): Promise<any> {
    const article = await this.articleRepository
      .createQueryBuilder('article')
      .leftJoinAndSelect('article.author', 'author')
      .leftJoinAndSelect('author.profile', 'profile')
      .leftJoinAndSelect('article.category', 'category')
      .leftJoinAndSelect('article.tags', 'tags')
      .leftJoinAndSelect('article.likes', 'likes')
      .leftJoinAndSelect('article.comments', 'comments')
      .leftJoinAndSelect('article.bookmarks', 'bookmarks')
      .where('article.slug = :slug', { slug })
      .andWhere('article.deletedAt IS NULL')
      .getOne();

    if (!article) {
      throw new NotFoundException(`Article '${slug}' not found`);
    }

    if (article.author) {
      delete (article.author as any).passwordHash;
    }

    return {
      ...article,
      likesCount: article.likes?.length || 0,
      commentsCount: article.comments?.length || 0,
      bookmarksCount: article.bookmarks?.length || 0,
    };
  }

  async update(
    id: string,
    userId: string,
    userRoles: string[],
    dto: UpdateArticleDto,
  ): Promise<Article> {
    const article = await this.articleRepository.findOne({
      where: { id },
      relations: { tags: true },
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const isAuthor = article.authorId === userId;
    const isAdmin =
      userRoles.includes(RoleType.ADMIN) ||
      userRoles.includes(RoleType.MODERATOR);

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to edit this article',
      );
    }

    if (dto.title && dto.title !== article.title) {
      article.slug = await this.generateUniqueSlug(dto.title);
      article.title = dto.title;
    }

    if (dto.content) {
      article.content = dto.content;
      article.readingTimeMinutes = this.calculateReadingTime(dto.content);
    }

    if (dto.excerpt !== undefined) article.excerpt = dto.excerpt;
    if (dto.coverImage !== undefined) article.coverImage = dto.coverImage;
    if (dto.categoryId !== undefined) article.categoryId = dto.categoryId;

    if (dto.status) {
      article.status = dto.status;
      if (dto.status === ArticleStatus.PUBLISHED && !article.publishedAt) {
        article.publishedAt = new Date();
      }
    }

    if (dto.tags) {
      article.tags = await this.tagsService.findOrCreateMany(dto.tags);
    }

    return this.articleRepository.save(article);
  }

  async publish(
    id: string,
    userId: string,
    userRoles: string[],
  ): Promise<Article> {
    return this.update(id, userId, userRoles, {
      status: ArticleStatus.PUBLISHED,
    });
  }

  async remove(
    id: string,
    userId: string,
    userRoles: string[],
  ): Promise<{ message: string }> {
    const article = await this.articleRepository.findOne({ where: { id } });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const isAuthor = article.authorId === userId;
    const isAdmin =
      userRoles.includes(RoleType.ADMIN) ||
      userRoles.includes(RoleType.MODERATOR);

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this article',
      );
    }

    await this.articleRepository.remove(article);
    return { message: 'Article deleted successfully' };
  }
}
