import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Comment, Article, RoleType } from '../../database/entities/index.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { CommentCreatedEvent } from '../../events/index.js';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(
    articleId: string,
    authorId: string,
    dto: CreateCommentDto,
  ): Promise<Comment> {
    const article = await this.articleRepository.findOne({
      where: { id: articleId },
    });
    if (!article) {
      throw new NotFoundException('Article not found');
    }

    if (dto.parentId) {
      const parentComment = await this.commentRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parentComment) {
        throw new NotFoundException('Parent comment not found');
      }
      if (parentComment.articleId !== articleId) {
        throw new BadRequestException(
          'Parent comment does not belong to this article',
        );
      }
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      articleId,
      authorId,
      parentId: dto.parentId || null,
    });

    const saved = await this.commentRepository.save(comment);

    // Emit domain event
    this.eventEmitter.emit(
      'comment.created',
      new CommentCreatedEvent(
        saved.id,
        saved.articleId,
        saved.authorId,
        saved.parentId,
      ),
    );

    return this.commentRepository.findOneOrFail({
      where: { id: saved.id },
      relations: {
        author: { profile: true },
      },
    });
  }

  async findByArticle(articleId: string): Promise<Comment[]> {
    const comments = await this.commentRepository.find({
      where: {
        articleId,
        parentId: IsNull(),
        deletedAt: IsNull(),
      },
      relations: {
        author: { profile: true },
        replies: {
          author: { profile: true },
        },
      },
      order: {
        createdAt: 'DESC',
        replies: {
          createdAt: 'ASC',
        },
      },
    });

    comments.forEach((c) => {
      if (c.author) delete (c.author as any).passwordHash;
      c.replies?.forEach((r) => {
        if (r.author) delete (r.author as any).passwordHash;
      });
    });

    return comments;
  }

  async update(
    id: string,
    authorId: string,
    userRoles: string[],
    dto: UpdateCommentDto,
  ): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isAuthor = comment.authorId === authorId;
    const isAdmin =
      userRoles.includes(RoleType.ADMIN) ||
      userRoles.includes(RoleType.MODERATOR);

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to edit this comment',
      );
    }

    comment.content = dto.content;
    return this.commentRepository.save(comment);
  }

  async remove(
    id: string,
    authorId: string,
    userRoles: string[],
  ): Promise<{ message: string }> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    const isAuthor = comment.authorId === authorId;
    const isAdmin =
      userRoles.includes(RoleType.ADMIN) ||
      userRoles.includes(RoleType.MODERATOR);

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenException(
        'You do not have permission to delete this comment',
      );
    }

    await this.commentRepository.softDelete(id);
    return { message: 'Comment deleted successfully' };
  }
}
