import { Controller, Get, Query } from '@nestjs/common';
import { AddonOptionsService, AddonOptionResponse } from './addon-options.service';

@Controller('public/addon-options')
export class PublicAddonOptionsController {
  constructor(private readonly addonOptionsService: AddonOptionsService) {}

  @Get()
  findAll(@Query('productId') productId?: string): Promise<AddonOptionResponse[]> {
    return this.addonOptionsService.findPublic(productId);
  }
}
