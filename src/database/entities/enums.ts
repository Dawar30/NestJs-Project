export enum RoleType {
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  AUTHOR = 'AUTHOR',
  USER = 'USER',
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum NotificationType {
  LIKE = 'LIKE',
  COMMENT = 'COMMENT',
  FOLLOW = 'FOLLOW',
  ARTICLE_PUBLISHED = 'ARTICLE_PUBLISHED',
  REPORT_UPDATE = 'REPORT_UPDATE',
  SYSTEM = 'SYSTEM',
}

export enum ReportTargetType {
  ARTICLE = 'ARTICLE',
  COMMENT = 'COMMENT',
  USER = 'USER',
}

export enum ReportStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}
