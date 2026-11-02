import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import { TagsService } from './tags.service.js';
import { CreateTagDto } from './dto/create-tag.dto.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RoleType } from '../../database/entities/enums.js';
import { ParseSlugPipe } from '../../common/pipes/parse-slug.pipe.js';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Roles(RoleType.AUTHOR, RoleType.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateTagDto) {
    return this.tagsService.create(dto);
  }

  @Public()
  @Get()
  async findAll() {
    return this.tagsService.findAll();
  }

  @Public()
  @Get(':slug')
  async findBySlug(@Param('slug', ParseSlugPipe) slug: string) {
    return this.tagsService.findBySlug(slug);
  }
}
