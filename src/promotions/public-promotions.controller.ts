import { Controller, Get } from '@nestjs/common';
import {
  type PromotionResponse,
  PromotionsService,
} from './promotions.service';

@Controller('public/promotions')
export class PublicPromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  findAll(): Promise<PromotionResponse[]> {
    return this.promotionsService.findPublic();
  }
}