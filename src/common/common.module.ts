import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware.js';
import { RequestLoggerMiddleware } from './middleware/request-logger.middleware.js';
import { TransformInterceptor } from './interceptors/transform.interceptor.js';
import { LoggingInterceptor } from './interceptors/logging.interceptor.js';
import { TimeoutInterceptor } from './interceptors/timeout.interceptor.js';
import { GlobalHttpExceptionFilter } from './filters/http-exception.filter.js';
import { TypeOrmExceptionFilter } from './filters/typeorm-exception.filter.js';
import { ParseSlugPipe } from './pipes/parse-slug.pipe.js';
import { RequestContextService } from './providers/request-context.service.js';
import { TransientLoggerService } from './providers/transient-logger.service.js';

@Module({
  providers: [
    RequestContextService,
    TransientLoggerService,
    ParseSlugPipe,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: TypeOrmExceptionFilter,
    },
  ],
  exports: [
    RequestContextService,
    TransientLoggerService,
    ParseSlugPipe,
  ],
})
export class CommonModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(CorrelationIdMiddleware, RequestLoggerMiddleware)
      .forRoutes('*');
  }
}
