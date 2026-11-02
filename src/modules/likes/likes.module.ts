import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LikesService } from './likes.service.js';
import { LikesController } from './likes.controller.js';
import { Like, Article } from '../../database/entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Like, Article])],
  controllers: [LikesController],
  providers: [LikesService],
  exports: [LikesService],
})
export class LikesModule {}
