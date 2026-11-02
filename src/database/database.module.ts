import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  User,
  Profile,
  Role,
  Permission,
  RefreshToken,
  Category,
  Tag,
  Article,
  Comment,
  Like,
  Bookmark,
  Follow,
  Notification,
  Report,
} from './entities/index.js';

export const ALL_ENTITIES = [
  User,
  Profile,
  Role,
  Permission,
  RefreshToken,
  Category,
  Tag,
  Article,
  Comment,
  Like,
  Bookmark,
  Follow,
  Notification,
  Report,
];

@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL');
        const isProduction =
          configService.get<string>('NODE_ENV') === 'production';

        return {
          type: 'postgres',
          url: databaseUrl,
          entities: ALL_ENTITIES,
          synchronize: false, // Auto schema sync in development / test
          logging: !isProduction ? ['error', 'warn'] : ['error'],
        };
      },
    }),
    TypeOrmModule.forFeature(ALL_ENTITIES),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
