import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark, Article } from '../../database/entities/index.js';

@Injectable()
export class BookmarksService {
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async toggleBookmark(
    articleId: string,
    userId: string,
  ): Promise<{ bookmarked: boolean }> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const existing = await this.bookmarkRepository.findOne({
      where: { articleId, userId },
    });

    if (existing) {
      await this.bookmarkRepository.remove(existing);
      return { bookmarked: false };
    }

    const bookmark = this.bookmarkRepository.create({ articleId, userId });
    await this.bookmarkRepository.save(bookmark);
    return { bookmarked: true };
  }

  async removeBookmark(
    articleId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const existing = await this.bookmarkRepository.findOne({
      where: { articleId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Bookmark not found');
    }

    await this.bookmarkRepository.remove(existing);
    return { message: 'Bookmark removed successfully' };
  }

  async getUserBookmarks(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await this.bookmarkRepository.findAndCount({
      where: { userId },
      relations: {
        article: {
          author: { profile: true },
          category: true,
          tags: true,
        },
      },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const articles = bookmarks.map((b) => {
      const art = b.article;
      if (art && art.author) {
        delete (art.author as any).passwordHash;
      }
      return {
        ...art,
        bookmarkedAt: b.createdAt,
      };
    });

    return {
      data: articles,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
