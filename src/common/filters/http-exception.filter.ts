import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let error: string = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null) {
        // @ts-expect-error Extract possible payload message/error
        message = res.message ?? exception.message;
        // @ts-expect-error Extract error name
        error = res.error ?? exception.name;
      } else {
        message = res;
        error = exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error(
        `Unhandled Exception: ${exception.message}`,
        exception.stack,
      );
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.message;
    }

    const correlationId = request.headers['x-correlation-id'] || '-';

    response.status(status).json({
      success: false,
      statusCode: status,
      error,
      message,
      correlationId,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
