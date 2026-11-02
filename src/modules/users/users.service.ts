import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User, Profile, Role, RoleType } from '../../database/entities/index.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    private readonly dataSource: DataSource,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: {
        profile: true,
        roles: {
          permissions: true,
        },
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
      relations: {
        profile: true,
        roles: {
          permissions: true,
        },
      },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: {
        profile: true,
        roles: {
          permissions: true,
        },
      },
    });
  }

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
    role?: RoleType;
  }): Promise<User> {
    const existingEmail = await this.userRepository.findOne({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new ConflictException('A user with this email already exists.');
    }

    const existingUsername = await this.userRepository.findOne({
      where: { username: data.username },
    });
    if (existingUsername) {
      throw new ConflictException('This username is already taken.');
    }

    const targetRole = data.role || RoleType.USER;

    // Use transaction runner for atomic creation
    return this.dataSource.transaction(async (manager) => {
      let role = await manager.findOne(Role, {
        where: { name: targetRole },
      });

      if (!role) {
        role = manager.create(Role, {
          name: targetRole,
          description: `Standard ${targetRole} role`,
        });
        role = await manager.save(role);
      }

      const user = manager.create(User, {
        email: data.email,
        username: data.username,
        passwordHash: data.passwordHash,
        roles: [role],
      });
      const savedUser = await manager.save(user);

      const profile = manager.create(Profile, {
        userId: savedUser.id,
        displayName: data.username,
      });
      await manager.save(profile);

      savedUser.profile = profile;
      return savedUser;
    });
  }

  async updateProfile(userId: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { email, username, displayName, bio, avatarUrl, website, location } =
      dto;

    if (email && email !== user.email) {
      const existing = await this.userRepository.findOne({ where: { email } });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
      user.email = email;
    }

    if (username && username !== user.username) {
      const existing = await this.userRepository.findOne({
        where: { username },
      });
      if (existing) {
        throw new ConflictException('Username already taken');
      }
      user.username = username;
    }

    await this.userRepository.save(user);

    let profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      profile = this.profileRepository.create({
        userId,
        displayName: displayName ?? username,
        bio,
        avatarUrl,
        website,
        location,
      });
    } else {
      if (displayName !== undefined) profile.displayName = displayName;
      if (bio !== undefined) profile.bio = bio;
      if (avatarUrl !== undefined) profile.avatarUrl = avatarUrl;
      if (website !== undefined) profile.website = website;
      if (location !== undefined) profile.location = location;
    }

    await this.profileRepository.save(profile);
    user.profile = profile;

    return user;
  }
}
