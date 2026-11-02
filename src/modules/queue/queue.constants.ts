export const BLOG_QUEUE = 'blog-queue';

export enum JobType {
  SEND_WELCOME_EMAIL = 'send-welcome-email',
  SEND_NOTIFICATION_EMAIL = 'send-notification-email',
  PROCESS_ARTICLE_METRICS = 'process-article-metrics',
}
