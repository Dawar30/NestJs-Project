import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommentsService } from './comments.service.js';
import { CommentsController } from './comments.controller.js';
import { Comment, Article } from '../../database/entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Comment, Article])],
  controllers: [CommentsController],
  providers: [CommentsService],
  exports: [CommentsService],
})
export class CommentsModule {}
