import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like, Article } from '../../database/entities/index.js';

@Injectable()
export class LikesService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async toggleLike(
    articleId: string,
    userId: string,
  ): Promise<{ liked: boolean; totalLikes: number }> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    const existing = await this.likeRepository.findOne({
      where: { articleId, userId },
    });

    if (existing) {
      await this.likeRepository.remove(existing);
      const totalLikes = await this.likeRepository.count({
        where: { articleId },
      });
      return { liked: false, totalLikes };
    }

    const like = this.likeRepository.create({ articleId, userId });
    await this.likeRepository.save(like);

    const totalLikes = await this.likeRepository.count({
      where: { articleId },
    });
    return { liked: true, totalLikes };
  }

  async getArticleLikes(articleId: string) {
    const [likes, total] = await this.likeRepository.findAndCount({
      where: { articleId },
      relations: {
        user: { profile: true },
      },
    });

    const users = likes.map((l) => ({
      id: l.user.id,
      username: l.user.username,
      displayName: l.user.profile?.displayName,
      avatarUrl: l.user.profile?.avatarUrl,
    }));

    return {
      total,
      users,
    };
  }

  async hasUserLiked(articleId: string, userId: string): Promise<boolean> {
    const count = await this.likeRepository.count({
      where: { articleId, userId },
    });
    return count > 0;
  }
}
