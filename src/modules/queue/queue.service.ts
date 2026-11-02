import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BLOG_QUEUE, JobType } from './queue.constants.js';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(BLOG_QUEUE)
    private readonly blogQueue: Queue,
  ) {}

  async addWelcomeEmailJob(data: { email: string; username: string }) {
    this.logger.log(`Enqueuing welcome email job for ${data.email}`);
    return this.blogQueue.add(JobType.SEND_WELCOME_EMAIL, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: true,
    });
  }

  async addNotificationEmailJob(data: {
    email: string;
    title: string;
    message: string;
  }) {
    return this.blogQueue.add(JobType.SEND_NOTIFICATION_EMAIL, data, {
      attempts: 3,
      backoff: 3000,
      removeOnComplete: true,
    });
  }

  async addArticleMetricsJob(data: { articleId: string }) {
    return this.blogQueue.add(JobType.PROCESS_ARTICLE_METRICS, data, {
      removeOnComplete: true,
    });
  }
}
