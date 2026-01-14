import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { ListTransactionsDto } from './dto/list-transactions.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('transactions')
@UseGuards(JwtAuthGuard) // Protect all transaction routes
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  /**
   * GET /transactions
   * Get all transactions for the authenticated user
   * Requires: Authentication
   * Supports: Filtering (status, provider, date range) and pagination
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(
    @CurrentUser() user: User,
    @Query() listTransactionsDto: ListTransactionsDto,
  ) {
    return this.transactionsService.findAll(user.id, listTransactionsDto);
  }

  /**
   * GET /transactions/:id
   * Get a single transaction by ID
   * Requires: Authentication
   */
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.transactionsService.findOne(id, user.id);
  }
}




