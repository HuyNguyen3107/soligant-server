import { Controller, Get, Query } from '@nestjs/common';
import { BackgroundsService } from './backgrounds.service';

@Controller('public/backgrounds')
export class PublicBackgroundsController {
  constructor(private readonly backgroundsService: BackgroundsService) {}

  @Get()
  findAll(@Query('productType') productType?: string) {
    return this.backgroundsService.findPublic(productType);
  }
}
