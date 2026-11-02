import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { BookmarksService } from './bookmarks.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

@Controller()
export class BookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {}

  @Post('articles/:id/bookmark')
  @HttpCode(HttpStatus.OK)
  async toggleBookmark(
    @Param('id') articleId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookmarksService.toggleBookmark(articleId, userId);
  }

  @Delete('articles/:id/bookmark')
  @HttpCode(HttpStatus.OK)
  async removeBookmark(
    @Param('id') articleId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.bookmarksService.removeBookmark(articleId, userId);
  }

  @Get('users/me/bookmarks')
  async getUserBookmarks(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bookmarksService.getUserBookmarks(userId, page, limit);
  }
}
