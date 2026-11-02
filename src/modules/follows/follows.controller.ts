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
import { FollowsService } from './follows.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';

@Controller()
export class FollowsController {
  constructor(private readonly followsService: FollowsService) {}

  @Post('users/:id/follow')
  @HttpCode(HttpStatus.OK)
  async follow(
    @CurrentUser('id') followerId: string,
    @Param('id') followingId: string,
  ) {
    return this.followsService.follow(followerId, followingId);
  }

  @Delete('users/:id/follow')
  @HttpCode(HttpStatus.OK)
  async unfollow(
    @CurrentUser('id') followerId: string,
    @Param('id') followingId: string,
  ) {
    return this.followsService.unfollow(followerId, followingId);
  }

  @Public()
  @Get('users/:id/followers')
  async getFollowers(@Param('id') userId: string) {
    return this.followsService.getFollowers(userId);
  }

  @Public()
  @Get('users/:id/following')
  async getFollowing(@Param('id') userId: string) {
    return this.followsService.getFollowing(userId);
  }

  @Get('feed')
  async getPersonalizedFeed(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.followsService.getPersonalizedFeed(userId, page, limit);
  }
}
