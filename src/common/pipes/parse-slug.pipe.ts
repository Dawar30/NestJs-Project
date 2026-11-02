import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';

@Injectable()
export class ParseSlugPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!value || typeof value !== 'string') {
      throw new BadRequestException('Slug must be a valid non-empty string');
    }

    const normalized = value
      .trim()
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (!normalized) {
      throw new BadRequestException('Provided slug is invalid after normalization');
    }

    return normalized;
  }
}
