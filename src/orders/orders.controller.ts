import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import type { AuthenticatedRequestUser } from '../auth/auth.service';
import { OrdersService, type OrderResponse } from './orders.service';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { UpdateShippingFeeDto } from './dto/update-shipping-fee.dto';
import { AssignOrderDto } from './dto/assign-order.dto';
import { UpdateOrderProgressImagesDto } from './dto/update-order-progress-images.dto';

interface AuthRequest {
  user: AuthenticatedRequestUser;
}

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
    return this.ordersService.updateStatus(id, dto.status, dto.assignedTo);
  }

  @Patch(':id/shipping-fee')
  @RequirePermissions('orders.edit')
  updateShippingFee(
    @Param('id') id: string,
    @Body() dto: UpdateShippingFeeDto,
  ): Promise<OrderResponse> {
    return this.ordersService.updateShippingFee(id, dto);
  }

  @Patch(':id/progress-images')
  @RequirePermissions('orders.edit')
  updateProgressImages(
    @Param('id') id: string,
    @Body() dto: UpdateOrderProgressImagesDto,
  ): Promise<OrderResponse> {
    return this.ordersService.updateProgressImages(id, dto);
  }

  /**
   * Phân công / nhận đơn / chuyển giao đơn hàng.
   *
   * Logic phân quyền:
   *  - Có quyền `orders.assign` (hoặc super admin) → gán bất kỳ user nào, kể cả bỏ trống.
   *  - Không có quyền `orders.assign`:
   *      · Đơn chưa có người nhận → chỉ được gán cho chính mình (self-assign).
   *      · Đơn đang do mình nhận → chỉ được chuyển giao cho người khác (transfer).
   *      · Đơn đang do người khác nhận → bị từ chối.
   */
  @Patch(':id/assign')
  @RequirePermissions('orders.view')
  async assignOrder(
    @Param('id') id: string,
    @Body() dto: AssignOrderDto,
    @Request() req: AuthRequest,
  ): Promise<OrderResponse> {
    const requestUser = req.user;
    const canAssignAny =
      requestUser.isSuperAdmin ||
      requestUser.permissions.includes('orders.assign');

    if (!canAssignAny) {
      // Lấy đơn hiện tại để kiểm tra assignedTo
      const order = await this.ordersService.findById(id);
      const currentAssignee = order.assignedTo ?? '';
      const requesterId = String(requestUser._id ?? requestUser.id);

      if (currentAssignee === '') {
        // Đơn chưa có người nhận → chỉ cho phép self-assign
        if (dto.assignedTo !== requesterId) {
          throw new ForbiddenException(
            'Bạn chỉ có thể tự nhận đơn này cho chính mình.',
          );
        }
      } else if (currentAssignee === requesterId) {
        // Mình đang nhận đơn → cho phép chuyển giao cho người khác
        // (không giới hạn chọn ai, chỉ cần không phải bỏ trống)
        if (!dto.assignedTo) {
          throw new ForbiddenException(
            'Không thể bỏ trống người nhận đơn khi chuyển giao. Vui lòng chọn người khác.',
          );
        }
      } else {
        throw new ForbiddenException(
          'Bạn không có quyền thay đổi người phụ trách đơn hàng này.',
        );
      }
    }

    return this.ordersService.assignOrder(id, dto.assignedTo ?? '');
  }
}
