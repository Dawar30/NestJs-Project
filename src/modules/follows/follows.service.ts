import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Follow, User, Article, ArticleStatus } from '../../database/entities/index.js';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
  ) {}

  async follow(
    followerId: string,
    followingId: string,
  ): Promise<{ message: string }> {
    if (followerId === followingId) {
      throw new BadRequestException('You cannot follow yourself');
    }

    const targetUser = await this.userRepository.findOne({
      where: { id: followingId },
    });
    if (!targetUser) {
      throw new NotFoundException('User to follow not found');
    }

    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });
    if (existing) {
      throw new ConflictException('You are already following this user');
    }

    const followRecord = this.followRepository.create({
      followerId,
      followingId,
    });
    await this.followRepository.save(followRecord);

    return { message: `You are now following @${targetUser.username}` };
  }

  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<{ message: string }> {
    const existing = await this.followRepository.findOne({
      where: { followerId, followingId },
    });
    if (!existing) {
      throw new NotFoundException('You are not following this user');
    }

    await this.followRepository.remove(existing);
    return { message: 'Unfollowed successfully' };
  }

  async getFollowers(userId: string) {
    const [follows, total] = await this.followRepository.findAndCount({
      where: { followingId: userId },
      relations: {
        follower: { profile: true },
      },
    });

    const followers = follows.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      profile: f.follower.profile,
      followedAt: f.createdAt,
    }));

    return { total, followers };
  }

  async getFollowing(userId: string) {
    const [follows, total] = await this.followRepository.findAndCount({
      where: { followerId: userId },
      relations: {
        following: { profile: true },
      },
    });

    const following = follows.map((f) => ({
      id: f.following.id,
      username: f.following.username,
      profile: f.following.profile,
      followedAt: f.createdAt,
    }));

    return { total, following };
  }

  async getPersonalizedFeed(userId: string, page = 1, limit = 10) {
    const following = await this.followRepository.find({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    const skip = (page - 1) * limit;

    const [articles, total] = await this.articleRepository.findAndCount({
      where: {
        authorId: In(followingIds),
        status: ArticleStatus.PUBLISHED,
      },
      relations: {
        author: { profile: true },
        category: true,
        tags: true,
        likes: true,
        comments: true,
        bookmarks: true,
      },
      order: {
        publishedAt: 'DESC',
      },
      skip,
      take: limit,
    });

    const formattedArticles = articles.map((art) => {
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
}
