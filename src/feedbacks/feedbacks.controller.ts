import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/require-permissions.decorator';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { FeedbacksService, type FeedbackResponse } from './feedbacks.service';

@Controller('feedbacks')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class FeedbacksController {
  constructor(private readonly feedbacksService: FeedbacksService) {}

  @Get()
  @RequirePermissions('feedbacks.view')
  findAll(): Promise<FeedbackResponse[]> {
    return this.feedbacksService.findAll();
  }

  @Get(':id')
  @RequirePermissions('feedbacks.view')
  findOne(@Param('id') id: string): Promise<FeedbackResponse> {
    return this.feedbacksService.findOne(id);
  }

  @Post()
  @RequirePermissions('feedbacks.create')
  create(@Body() dto: CreateFeedbackDto): Promise<FeedbackResponse> {
    return this.feedbacksService.create(dto);
  }

  @Patch(':id')
  @RequirePermissions('feedbacks.edit')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
  ): Promise<FeedbackResponse> {
    return this.feedbacksService.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions('feedbacks.delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    return this.feedbacksService.delete(id);
  }
}
