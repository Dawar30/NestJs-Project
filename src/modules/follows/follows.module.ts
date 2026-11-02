import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FollowsService } from './follows.service.js';
import { FollowsController } from './follows.controller.js';
import { Follow, User, Article } from '../../database/entities/index.js';

@Module({
  imports: [TypeOrmModule.forFeature([Follow, User, Article])],
  controllers: [FollowsController],
  providers: [FollowsService],
  exports: [FollowsService],
})
export class FollowsModule {}
