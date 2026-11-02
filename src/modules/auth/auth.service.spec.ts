import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RefreshToken, RoleType, User } from '../../database/entities/index.js';
import { UnauthorizedException } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: { findByEmail: any; create: any; findById: any };
  let jwtService: { signAsync: any; verifyAsync: any };
  let refreshTokenRepository: {
    create: any;
    save: any;
    findOne: any;
    update: any;
  };

  const mockUser: Partial<User> = {
    id: 'user-uuid-1',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '',
    isActive: true,
    isEmailVerified: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    profile: {
      id: 'profile-1',
      userId: 'user-uuid-1',
      displayName: 'Test User',
      createdAt: new Date(),
      updatedAt: new Date(),
      user: null as any,
    },
    roles: [
      {
        id: 'role-1',
        name: RoleType.USER,
        createdAt: new Date(),
        updatedAt: new Date(),
        permissions: [],
        users: [],
      },
    ],
  };

  beforeEach(async () => {
    mockUser.passwordHash = await bcrypt.hash('secretPassword', 10);

    usersService = {
      findByEmail: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
    };

    jwtService = {
      signAsync: vi.fn().mockResolvedValue('mock-token'),
      verifyAsync: vi.fn(),
    };

    refreshTokenRepository = {
      create: vi.fn().mockImplementation((dto) => dto),
      save: vi.fn().mockResolvedValue({ id: 'rt-1' }),
      findOne: vi.fn(),
      update: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        {
          provide: ConfigService,
          useValue: {
            get: vi.fn((key: string) => {
              if (key === 'JWT_ACCESS_SECRET') return 'test-access-secret';
              if (key === 'JWT_REFRESH_SECRET') return 'test-refresh-secret';
              return null;
            }),
          },
        },
        {
          provide: getRepositoryToken(RefreshToken),
          useValue: refreshTokenRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('should return user object if email and password match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'secretPassword',
      );
      expect(result).toBeDefined();
      expect(result?.email).toBe('test@example.com');
    });

    it('should return null if password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'wrongPassword',
      );
      expect(result).toBeNull();
    });

    it('should return null if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'unknown@example.com',
        'password',
      );
      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should hash password and create user returning token pair', async () => {
      usersService.create.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'test@example.com',
        username: 'testuser',
        password: 'secretPassword',
      });

      expect(usersService.create).toHaveBeenCalled();
      expect(result.accessToken).toBe('mock-token');
      expect(result.refreshToken).toBe('mock-token');
      expect(result.user.username).toBe('testuser');
      expect(refreshTokenRepository.save).toHaveBeenCalled();
    });
  });

  describe('refreshTokens', () => {
    it('should throw UnauthorizedException if token verification fails', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(service.refreshTokens('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token reuse is detected', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 'user-uuid-1' });
      refreshTokenRepository.findOne.mockResolvedValue({
        id: 'rt-1',
        isRevoked: true,
        expiresAt: new Date(Date.now() + 100000),
      });

      await expect(service.refreshTokens('reused-token')).rejects.toThrow(
        'Token reuse detected. All sessions revoked for security.',
      );
      expect(refreshTokenRepository.update).toHaveBeenCalledWith(
        { userId: 'user-uuid-1' },
        { isRevoked: true },
      );
    });
  });
});
