import { Controller, Get, Post, Param } from '@nestjs/common';
import { AppService } from './app.service.js';
import { Public } from './common/decorators/public.decorator.js';

@Public()
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}

@Public()
@Controller('cats')
export class CatsController {
  @Post()
  create(): string {
    return 'This action adds a new cat';
  }

  @Get()
  findAll(): string {
    return 'This action returns all cats';
  }

  @Get(':id')
  findOne(@Param() params: any): string {
    return `This action returns a #${params.id} cat`;
  }
}

@Public()
@Controller({ host: ':admin.localhost' })
export class AdminController {
  @Get()
  index(): string {
    return 'Admin page';
  }
}
