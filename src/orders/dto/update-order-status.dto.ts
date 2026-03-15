import { IsEnum } from 'class-validator';
import { type OrderStatus } from '../schemas/order.schema';

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'confirmed', 'processing', 'completed', 'cancelled'], {
    message:
      'Trạng thái đơn hàng phải là pending, confirmed, processing, completed hoặc cancelled.',
  })
  status!: OrderStatus;
}
