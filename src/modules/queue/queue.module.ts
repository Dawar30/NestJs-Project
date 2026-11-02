import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BLOG_QUEUE } from './queue.constants.js';
import { BlogProcessor } from './blog.processor.js';
import { QueueService } from './queue.service.js';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('REDIS_HOST') || 'localhost',
          port: config.get<number>('REDIS_PORT') || 6379,
        },
      }),
    }),
    BullModule.registerQueue({
      name: BLOG_QUEUE,
    }),
  ],
  providers: [BlogProcessor, QueueService],
  exports: [BullModule, QueueService],
})
export class QueueModule {}
