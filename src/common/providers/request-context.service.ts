import { Inject, Injectable, Scope } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import type { Request } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private readonly startTime = performance.now();

  constructor(@Inject(REQUEST) private readonly request: Request) {}

  getCorrelationId(): string {
    return (this.request.headers['x-correlation-id'] as string) || 'unknown';
  }

  getIp(): string {
    return this.request.ip || '127.0.0.1';
  }

  getUserAgent(): string {
    return (this.request.headers['user-agent'] as string) || 'unknown';
  }

  getElapsedMs(): number {
    return Number((performance.now() - this.startTime).toFixed(2));
  }
}
