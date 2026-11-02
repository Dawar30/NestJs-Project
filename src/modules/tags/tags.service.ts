import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../../database/entities/index.js';
import { CreateTagDto } from './dto/create-tag.dto.js';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  private slugify(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateTagDto): Promise<Tag> {
    const slug = this.slugify(dto.name);
    const existing = await this.tagRepository.findOne({
      where: [{ name: dto.name }, { slug }],
    });

    if (existing) {
      throw new ConflictException('A tag with this name or slug already exists');
    }

    const tag = this.tagRepository.create({
      name: dto.name,
      slug,
    });
    return this.tagRepository.save(tag);
  }

  async findOrCreateMany(tagNames: string[]): Promise<Tag[]> {
    const cleanNames = [
      ...new Set(tagNames.map((n) => n.trim()).filter(Boolean)),
    ];
    const tags: Tag[] = [];

    for (const name of cleanNames) {
      const slug = this.slugify(name);
      let tag = await this.tagRepository.findOne({ where: { slug } });
      if (!tag) {
        tag = this.tagRepository.create({ name, slug });
        tag = await this.tagRepository.save(tag);
      }
      tags.push(tag);
    }

    return tags;
  }

  async findAll(): Promise<any[]> {
    const tags = await this.tagRepository.find({
      relations: { articles: true },
    });

    return tags
      .map((tag) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        createdAt: tag.createdAt,
        updatedAt: tag.updatedAt,
        articlesCount: tag.articles?.length || 0,
      }))
      .sort((a, b) => b.articlesCount - a.articlesCount);
  }

  async findBySlug(slug: string): Promise<any> {
    const tag = await this.tagRepository.findOne({
      where: { slug },
      relations: { articles: true },
    });

    if (!tag) {
      throw new NotFoundException(`Tag '${slug}' not found`);
    }

    return {
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
      articlesCount: tag.articles?.length || 0,
    };
  }
}
