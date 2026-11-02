import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CommentsService } from './comments.service.js';
import { CreateCommentDto } from './dto/create-comment.dto.js';
import { UpdateCommentDto } from './dto/update-comment.dto.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';

@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('articles/:id/comments')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('id') articleId: string,
    @CurrentUser('id') authorId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.create(articleId, authorId, dto);
  }

  @Public()
  @Get('articles/:id/comments')
  async findByArticle(@Param('id') articleId: string) {
    return this.commentsService.findByArticle(articleId);
  }

  @Patch('comments/:id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') authorId: string,
    @CurrentUser('roles') roles: string[],
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.update(id, authorId, roles, dto);
  }

  @Delete('comments/:id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') authorId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    return this.commentsService.remove(id, authorId, roles);
  }
}
