import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import {
  OrdersService,
  type OrderResponse,
} from './orders.service';

@Controller('public/orders')
export class PublicOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':orderCode')
  findByOrderCode(@Param('orderCode') orderCode: string): Promise<OrderResponse> {
    return this.ordersService.findPublicByOrderCode(orderCode);
  }

  @Post()
  create(@Body() dto: CreateOrderDto): Promise<OrderResponse> {
    return this.ordersService.createPublic(dto);
  }
}
