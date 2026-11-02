import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  validateSync,
} from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @IsOptional()
  PORT: number = 3000;

  @IsString()
  DATABASE_URL: string = 'postgresql://postgres:postgres@localhost:5432/blog_db?schema=public';

  @IsString()
  JWT_ACCESS_SECRET: string = 'super-secret-access-key-change-in-production';

  @IsString()
  @IsOptional()
  JWT_ACCESS_EXPIRATION: string = '15m';

  @IsString()
  JWT_REFRESH_SECRET: string = 'super-secret-refresh-key-change-in-production';

  @IsString()
  @IsOptional()
  JWT_REFRESH_EXPIRATION: string = '7d';

  @IsString()
  @IsOptional()
  REDIS_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  REDIS_PORT: number = 6379;

  @IsNumber()
  @IsOptional()
  THROTTLE_TTL: number = 60000;

  @IsNumber()
  @IsOptional()
  THROTTLE_LIMIT: number = 100;

  @IsString()
  @IsOptional()
  CORS_ORIGIN: string = '*';
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
}
