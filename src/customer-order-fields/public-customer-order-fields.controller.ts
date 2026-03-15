import { Controller, Get } from '@nestjs/common';
import {
  CustomerOrderFieldsConfigResponse,
  CustomerOrderFieldsService,
} from './customer-order-fields.service';

@Controller('public/customer-order-fields')
export class PublicCustomerOrderFieldsController {
  constructor(
    private readonly customerOrderFieldsService: CustomerOrderFieldsService,
  ) {}

  @Get()
  findConfig(): Promise<CustomerOrderFieldsConfigResponse> {
    return this.customerOrderFieldsService.findPublicConfig();
  }
}
