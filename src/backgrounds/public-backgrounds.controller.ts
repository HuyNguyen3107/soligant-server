import { Controller, Get } from '@nestjs/common';
import { BackgroundsService } from './backgrounds.service';

@Controller('public/backgrounds')
export class PublicBackgroundsController {
  constructor(private readonly backgroundsService: BackgroundsService) {}

  @Get()
  findAll() {
    return this.backgroundsService.findPublic();
  }
}
