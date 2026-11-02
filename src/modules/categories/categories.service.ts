import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Category } from '../../database/entities/index.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  private slugify(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = this.slugify(dto.name);
    const existing = await this.categoryRepository.findOne({
      where: [{ name: dto.name }, { slug }],
    });

    if (existing) {
      throw new ConflictException(
        'A category with this name or slug already exists',
      );
    }

    const category = this.categoryRepository.create({
      name: dto.name,
      slug,
      description: dto.description,
    });
    return this.categoryRepository.save(category);
  }

  async findAll(): Promise<any[]> {
    const categories = await this.categoryRepository.find({
      relations: { articles: true },
      order: { name: 'ASC' },
    });

    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
      articlesCount: cat.articles?.length || 0,
    }));
  }

  async findBySlug(slug: string): Promise<any> {
    const category = await this.categoryRepository.findOne({
      where: { slug },
      relations: { articles: true },
    });

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      articlesCount: category.articles?.length || 0,
    };
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    let slug = category.slug;
    if (dto.name && dto.name !== category.name) {
      slug = this.slugify(dto.name);
      const existing = await this.categoryRepository.findOne({
        where: {
          slug,
          id: Not(id),
        },
      });
      if (existing) {
        throw new ConflictException(
          'A category with this generated slug already exists',
        );
      }
      category.name = dto.name;
      category.slug = slug;
    }

    if (dto.description !== undefined) {
      category.description = dto.description;
    }

    return this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<{ message: string }> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.categoryRepository.remove(category);
    return { message: 'Category removed successfully' };
  }
}
