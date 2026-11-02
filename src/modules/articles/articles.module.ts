import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ArticlesService } from './articles.service.js';
import { ArticlesController } from './articles.controller.js';
import { TagsModule } from '../tags/tags.module.js';
import { Article } from '../../database/entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Article]), TagsModule],
  controllers: [ArticlesController],
  providers: [ArticlesService],
  exports: [ArticlesService],
})
export class ArticlesModule {}
