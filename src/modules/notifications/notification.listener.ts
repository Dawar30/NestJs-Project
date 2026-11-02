import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ArticlePublishedEvent,
  ArticleLikedEvent,
  CommentCreatedEvent,
  UserFollowedEvent,
} from '../../events/index.js';
import {
  Follow,
  Article,
  Comment,
  User,
  NotificationType,
} from '../../database/entities/index.js';
import { NotificationsService } from './notifications.service.js';

@Injectable()
export class NotificationListener {
  private readonly logger = new Logger(NotificationListener.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(Follow)
    private readonly followRepository: Repository<Follow>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @OnEvent('article.published', { async: true })
  async handleArticlePublished(event: ArticlePublishedEvent) {
    this.logger.log(`Handling article.published event: ${event.title}`);

    // Fan-out to author's followers
    const followers = await this.followRepository.find({
      where: { followingId: event.authorId },
      relations: { following: true },
    });

    const author = await this.userRepository.findOne({
      where: { id: event.authorId },
    });
    const authorName = author?.username || 'An author you follow';

    for (const f of followers) {
      await this.notificationsService.create({
        recipientId: f.followerId,
        actorId: event.authorId,
        type: NotificationType.ARTICLE_PUBLISHED,
        title: 'New Story Published',
        message: `@${authorName} just published "${event.title}"`,
        data: {
          articleId: event.articleId,
          slug: event.slug,
        },
      });
    }
  }

  @OnEvent('comment.created', { async: true })
  async handleCommentCreated(event: CommentCreatedEvent) {
    this.logger.log(`Handling comment.created event on article: ${event.articleId}`);

    const [article, commenter] = await Promise.all([
      this.articleRepository.findOne({ where: { id: event.articleId } }),
      this.userRepository.findOne({ where: { id: event.authorId } }),
    ]);

    if (!article || !commenter) return;

    // 1. Notify article author if commenter is not author
    if (article.authorId !== event.authorId) {
      await this.notificationsService.create({
        recipientId: article.authorId,
        actorId: event.authorId,
        type: NotificationType.COMMENT,
        title: 'New Comment on Your Article',
        message: `@${commenter.username} commented on "${article.title}"`,
        data: {
          articleId: event.articleId,
          commentId: event.commentId,
        },
      });
    }

    // 2. If it's a reply, notify parent comment author
    if (event.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: event.parentId },
      });

      if (
        parentComment &&
        parentComment.authorId !== event.authorId &&
        parentComment.authorId !== article.authorId
      ) {
        await this.notificationsService.create({
          recipientId: parentComment.authorId,
          actorId: event.authorId,
          type: NotificationType.COMMENT,
          title: 'Reply to Your Comment',
          message: `@${commenter.username} replied to your comment on "${article.title}"`,
          data: {
            articleId: event.articleId,
            commentId: event.commentId,
          },
        });
      }
    }
  }

  @OnEvent('article.liked', { async: true })
  async handleArticleLiked(event: ArticleLikedEvent) {
    this.logger.log(`Handling article.liked event on article: ${event.articleId}`);

    const [article, liker] = await Promise.all([
      this.articleRepository.findOne({ where: { id: event.articleId } }),
      this.userRepository.findOne({ where: { id: event.userId } }),
    ]);

    if (!article || !liker) return;

    // Do not notify if user liked their own post
    if (article.authorId === event.userId) return;

    await this.notificationsService.create({
      recipientId: article.authorId,
      actorId: event.userId,
      type: NotificationType.LIKE,
      title: 'New Reaction',
      message: `@${liker.username} liked your story "${article.title}"`,
      data: {
        articleId: event.articleId,
      },
    });
  }

  @OnEvent('user.followed', { async: true })
  async handleUserFollowed(event: UserFollowedEvent) {
    this.logger.log(`Handling user.followed event: ${event.followerId} -> ${event.followingId}`);

    const follower = await this.userRepository.findOne({
      where: { id: event.followerId },
    });
    if (!follower) return;

    await this.notificationsService.create({
      recipientId: event.followingId,
      actorId: event.followerId,
      type: NotificationType.FOLLOW,
      title: 'New Follower',
      message: `@${follower.username} started following you`,
      data: {
        followerId: event.followerId,
      },
    });
  }
}
