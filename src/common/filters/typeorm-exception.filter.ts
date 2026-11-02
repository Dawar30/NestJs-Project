import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  CannotCreateEntityIdMapError,
  EntityNotFoundError,
  QueryFailedError,
} from 'typeorm';
import type { Request, Response } from 'express';

@Catch(QueryFailedError, EntityNotFoundError, CannotCreateEntityIdMapError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(TypeOrmExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error occurred';
    let error = 'DatabaseError';

    if (exception instanceof EntityNotFoundError) {
      status = HttpStatus.NOT_FOUND;
      message = 'The requested entity could not be found';
      error = 'Not Found';
    } else if (exception instanceof CannotCreateEntityIdMapError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Cannot create entity relation mapping';
      error = 'Bad Request';
    } else if (exception instanceof QueryFailedError) {
      const driverError = (exception as any).driverError;
      const code = driverError?.code;

      switch (code) {
        case '23505': {
          // unique_violation
          status = HttpStatus.CONFLICT;
          message = driverError?.detail || 'A record with these unique details already exists.';
          error = 'Conflict';
          break;
        }
        case '23503': {
          // foreign_key_violation
          status = HttpStatus.BAD_REQUEST;
          message = driverError?.detail || 'Foreign key constraint violated.';
          error = 'Bad Request';
          break;
        }
        case '23502': {
          // not_null_violation
          status = HttpStatus.BAD_REQUEST;
          message = `Field ${driverError?.column} cannot be null.`;
          error = 'Bad Request';
          break;
        }
        default: {
          this.logger.warn(`Unhandled TypeORM Error: ${exception.message}`);
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'An unexpected database error occurred.';
          error = 'Internal Server Error';
          break;
        }
      }
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
