import { Injectable, Logger, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class TransientLoggerService {
  private context = 'App';
  private readonly logger = new Logger();

  setContext(context: string): void {
    this.context = context;
  }

  log(message: string): void {
    this.logger.log(`[${this.context}] ${message}`);
  }

  warn(message: string): void {
    this.logger.warn(`[${this.context}] ${message}`);
  }

  error(message: string, trace?: string): void {
    this.logger.error(`[${this.context}] ${message}`, trace);
  }
}
