import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { UpdateInventoryItemDto } from './dto/update-inventory-item.dto';
import { InventoryItemResponse, InventoryService } from './inventory.service';

@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions('inventory.view')
  findAll(): Promise<InventoryItemResponse[]> {
    return this.inventoryService.findAll();
  }

  @Patch(':id')
  @RequirePermissions('inventory.edit')
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateInventoryItemDto,
  ): Promise<InventoryItemResponse> {
    return this.inventoryService.updateItem(id, dto);
  }
}
