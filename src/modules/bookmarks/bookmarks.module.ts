import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookmarksService } from './bookmarks.service.js';
import { BookmarksController } from './bookmarks.controller.js';
import { Bookmark, Article } from '../../database/entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, Article])],
  controllers: [BookmarksController],
  providers: [BookmarksService],
  exports: [BookmarksService],
})
export class BookmarksModule {}
