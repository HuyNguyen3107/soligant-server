import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import {
  ALL_ORDER_STATUSES,
  type OrderStatus,
} from '../schemas/order.schema';

export class UpdateOrderStatusDto {
  @IsEnum(ALL_ORDER_STATUSES, {
    message: `Trạng thái đơn hàng không hợp lệ. Giá trị cho phép: ${ALL_ORDER_STATUSES.join(', ')}.`,
  })
  status!: OrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  assignedTo?: string;
}
