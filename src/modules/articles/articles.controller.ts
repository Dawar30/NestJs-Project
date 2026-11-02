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
  Query,
} from '@nestjs/common';
import { ArticlesService } from './articles.service.js';
import { CreateArticleDto } from './dto/create-article.dto.js';
import { UpdateArticleDto } from './dto/update-article.dto.js';
import { QueryArticleDto } from './dto/query-article.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { RoleType } from '../../database/entities/enums.js';
import { ParseSlugPipe } from '../../common/pipes/parse-slug.pipe.js';

@Controller('articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}

  @Roles(RoleType.AUTHOR, RoleType.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser('id') authorId: string,
    @Body() dto: CreateArticleDto,
  ) {
    return this.articlesService.create(authorId, dto);
  }

  @Public()
  @Get()
  async findAll(@Query() query: QueryArticleDto) {
    return this.articlesService.findAll(query);
  }

  @Public()
  @Get(':slug')
  async findBySlug(@Param('slug', ParseSlugPipe) slug: string) {
    return this.articlesService.findBySlug(slug);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roles') roles: string[],
    @Body() dto: UpdateArticleDto,
  ) {
    return this.articlesService.update(id, userId, roles, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  async publish(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    return this.articlesService.publish(id, userId, roles);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('roles') roles: string[],
  ) {
    return this.articlesService.remove(id, userId, roles);
  }
}
