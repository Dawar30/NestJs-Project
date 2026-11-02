import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { BLOG_QUEUE, JobType } from './queue.constants.js';

@Processor(BLOG_QUEUE)
export class BlogProcessor extends WorkerHost {
  private readonly logger = new Logger(BlogProcessor.name);

  async process(job: Job<any, any, string>): Promise<any> {
    this.logger.log(`Processing background queue job ${job.id} of type ${job.name}`);

    switch (job.name) {
      case JobType.SEND_WELCOME_EMAIL: {
        const { email, username } = job.data;
        this.logger.log(`[Email Service] Simulating sending welcome email to ${username} (${email})`);
        return { delivered: true, recipient: email };
      }

      case JobType.SEND_NOTIFICATION_EMAIL: {
        const { email, title, message } = job.data;
        this.logger.log(`[Email Service] Sending notification email to ${email}: "${title}" - ${message}`);
        return { delivered: true, recipient: email };
      }

      case JobType.PROCESS_ARTICLE_METRICS: {
        const { articleId } = job.data;
        this.logger.log(`[Metrics Engine] Calculating trending score and reach for article: ${articleId}`);
        return { computed: true, articleId };
      }

      default: {
        this.logger.warn(`Unknown job type received: ${job.name}`);
        return null;
      }
    }
  }
}
