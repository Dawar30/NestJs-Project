import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const start = performance.now();
    const correlationId = req.headers['x-correlation-id'] || '-';

    res.on('finish', () => {
      const { statusCode } = res;
      const duration = (performance.now() - start).toFixed(2);
      this.logger.log(
        `[${correlationId}] ${method} ${originalUrl} ${statusCode} +${duration}ms - IP: ${ip}`,
      );
    });

    next();
  }
}
