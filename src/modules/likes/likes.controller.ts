import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { LikesService } from './likes.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';

@Controller('articles/:id/like')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async toggleLike(
    @Param('id') articleId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.likesService.toggleLike(articleId, userId);
  }

  @Public()
  @Get('users')
  async getLikes(@Param('id') articleId: string) {
    return this.likesService.getArticleLikes(articleId);
  }
}
