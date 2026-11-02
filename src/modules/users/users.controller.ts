import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser('id') userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  @Patch('me')
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    const updated = await this.usersService.updateProfile(userId, dto);
    const { passwordHash: _, ...safeUser } = updated;
    return safeUser;
  }

  @Public()
  @Get(':username')
  async getPublicProfile(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new NotFoundException(`User @${username} not found`);
    }

    return {
      id: user.id,
      username: user.username,
      profile: user.profile,
      roles: user.roles?.map((r) => r.name) || [],
      createdAt: user.createdAt,
    };
  }
}
