import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    const now = performance.now();

    return next.handle().pipe(
      tap(() => {
        const elapsed = (performance.now() - now).toFixed(2);
        this.logger.debug(
          `[Execution] ${controller}#${handler} executed in +${elapsed}ms for ${req.method} ${req.url}`,
        );
      }),
    );
  }
}
