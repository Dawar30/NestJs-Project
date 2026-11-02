export class ArticlePublishedEvent {
  constructor(
    public readonly articleId: string,
    public readonly authorId: string,
    public readonly title: string,
    public readonly slug: string,
  ) {}
}

export class ArticleLikedEvent {
  constructor(
    public readonly articleId: string,
    public readonly userId: string,
  ) {}
}
