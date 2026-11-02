export class CommentCreatedEvent {
  constructor(
    public readonly commentId: string,
    public readonly articleId: string,
    public readonly authorId: string,
    public readonly parentId?: string | null,
  ) {}
}
