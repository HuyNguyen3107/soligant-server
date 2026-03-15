import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import {
  OrdersService,
  type OrderResponse,
} from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateShippingFeeDto } from './dto/update-shipping-fee.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @RequirePermissions('orders.view')
  findAll(): Promise<OrderResponse[]> {
    return this.ordersService.findAll();
  }

  @Patch(':id/status')
  @RequirePermissions('orders.edit')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponse> {
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Patch(':id/shipping-fee')
  @RequirePermissions('orders.edit')
  updateShippingFee(
    @Param('id') id: string,
    @Body() dto: UpdateShippingFeeDto,
  ): Promise<OrderResponse> {
    return this.ordersService.updateShippingFee(id, dto);
  }
}
