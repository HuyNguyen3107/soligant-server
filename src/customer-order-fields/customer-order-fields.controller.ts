import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import {
  CustomerOrderFieldsConfigResponse,
  CustomerOrderFieldsService,
} from './customer-order-fields.service';
import { UpdateCustomerOrderFieldsDto } from './dto/update-customer-order-fields.dto';

@Controller('customer-order-fields')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CustomerOrderFieldsController {
  constructor(
    private readonly customerOrderFieldsService: CustomerOrderFieldsService,
  ) {}

  @Get()
  @RequirePermissions('customer-order-fields.view')
  findConfig(): Promise<CustomerOrderFieldsConfigResponse> {
    return this.customerOrderFieldsService.findAdminConfig();
  }

  @Put()
  @RequirePermissions('customer-order-fields.edit')
  updateConfig(
    @Body() dto: UpdateCustomerOrderFieldsDto,
  ): Promise<CustomerOrderFieldsConfigResponse> {
    return this.customerOrderFieldsService.updateConfig(dto);
  }
}
