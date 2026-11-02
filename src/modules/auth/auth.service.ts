import {
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service.js';
import { RefreshToken, User } from '../../database/entities/index.js';
import { RegisterDto } from './dto/register.dto.js';
import bcrypt from 'bcryptjs';
import { createHash } from 'node:crypto';

export interface TokensResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    username: string;
    roles: string[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async register(dto: RegisterDto): Promise<TokensResponse> {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.usersService.create({
      email: dto.email,
      username: dto.username,
      passwordHash,
      role: dto.role,
    });

    return this.generateAuthTokens(user);
  }

  async login(user: User): Promise<TokensResponse> {
    return this.generateAuthTokens(user);
  }

  async refreshTokens(refreshToken: string): Promise<TokensResponse> {
    let payload: any;
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret:
          this.configService.get<string>('JWT_REFRESH_SECRET') ||
          'super-secret-refresh-key-change-in-production',
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const hashedToken = this.hashToken(refreshToken);
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { tokenHash: hashedToken },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token not recognized');
    }

    // Refresh token reuse detection (security safeguard)
    if (tokenRecord.isRevoked) {
      // Possible compromise: revoke all active tokens for this user
      await this.refreshTokenRepository.update(
        { userId: payload.sub },
        { isRevoked: true },
      );
      throw new UnauthorizedException(
        'Token reuse detected. All sessions revoked for security.',
      );
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User account no longer exists');
    }

    // Generate new tokens
    const tokens = await this.generateAuthTokens(user);
    const newHashedToken = this.hashToken(tokens.refreshToken);

    // Rotate: Mark old token as revoked and record replaced_by_token
    await this.refreshTokenRepository.update(
      { id: tokenRecord.id },
      {
        isRevoked: true,
        replacedByToken: newHashedToken,
      },
    );

    return tokens;
  }

  async logout(
    userId: string,
    refreshToken?: string,
  ): Promise<{ message: string }> {
    if (refreshToken) {
      const hashedToken = this.hashToken(refreshToken);
      await this.refreshTokenRepository.update(
        { userId, tokenHash: hashedToken },
        { isRevoked: true },
      );
    } else {
      await this.refreshTokenRepository.update(
        { userId },
        { isRevoked: true },
      );
    }

    return { message: 'Logged out successfully' };
  }

  private async generateAuthTokens(user: User): Promise<TokensResponse> {
    const roles = user.roles ? user.roles.map((r) => r.name) : [];
    const permissions: string[] = [];

    user.roles?.forEach((r) => {
      r.permissions?.forEach((p) => {
        permissions.push(`${p.action}:${p.resource}`);
      });
    });

    const jwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roles,
      permissions,
    };

    const accessSecret =
      this.configService.get<string>('JWT_ACCESS_SECRET') ||
      'super-secret-access-key-change-in-production';
    const accessExpiration =
      this.configService.get<string>('JWT_ACCESS_EXPIRATION') || '15m';

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ||
      'super-secret-refresh-key-change-in-production';
    const refreshExpiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(jwtPayload, {
        secret: accessSecret,
        expiresIn: accessExpiration as any,
      }),
      this.jwtService.signAsync(
        { sub: user.id },
        {
          secret: refreshSecret,
          expiresIn: refreshExpiration as any,
        },
      ),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const tokenEntity = this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    });
    await this.refreshTokenRepository.save(tokenEntity);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        roles,
      },
    };
  }
}
