import { BadRequestException } from '@nestjs/common';
import { ParseSlugPipe } from './parse-slug.pipe.js';
import { describe, it, expect, beforeEach } from 'vitest';

describe('ParseSlugPipe', () => {
  let pipe: ParseSlugPipe;

  beforeEach(() => {
    pipe = new ParseSlugPipe();
  });

  it('should normalize uppercase characters to lowercase', () => {
    expect(pipe.transform('Hello-World')).toBe('hello-world');
  });

  it('should trim leading and trailing spaces and hyphens', () => {
    expect(pipe.transform('  --nest-js-best-practices--  ')).toBe(
      'nest-js-best-practices',
    );
  });

  it('should strip out special non-alphanumeric characters', () => {
    expect(pipe.transform('learn-nest.js!#100%')).toBe('learn-nestjs100');
  });

  it('should throw BadRequestException if string is empty or invalid', () => {
    expect(() => pipe.transform('')).toThrow(BadRequestException);
    expect(() => pipe.transform('   ')).toThrow(BadRequestException);
    expect(() => pipe.transform('!@#$%^&*()')).toThrow(BadRequestException);
  });
});
