import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentLinksService } from './payment-links.service';
import { CreatePaymentLinkDto } from './dto/create-payment-link.dto';
import { UpdatePaymentLinkDto } from './dto/update-payment-link.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { User } from '@prisma/client';

@Controller('payment-links')
export class PaymentLinksController {
  constructor(private readonly paymentLinksService: PaymentLinksService) {}

  /**
   * POST /payment-links
   * Create a new payment link
   * Requires: Authentication
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: User,
    @Body() createPaymentLinkDto: CreatePaymentLinkDto,
  ) {
    return this.paymentLinksService.create(user.id, createPaymentLinkDto);
  }

  /**
   * GET /payment-links
   * Get all payment links for the authenticated user
   * Requires: Authentication
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findAll(@CurrentUser() user: User) {
    return this.paymentLinksService.findAll(user.id);
  }

  /**
   * GET /payment-links/public/:slug
   * Get public payment link by slug (no authentication required)
   * Validates: Link is active, not expired, not max uses reached
   * NOTE: This route must come before @Get(':id') to avoid route conflicts
   */
  @Get('public/:slug')
  @HttpCode(HttpStatus.OK)
  findBySlug(@Param('slug') slug: string) {
    return this.paymentLinksService.findBySlug(slug);
  }

  /**
   * GET /payment-links/:id
   * Get a single payment link by ID
   * Requires: Authentication
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paymentLinksService.findOne(id, user.id);
  }

  /**
   * PUT /payment-links/:id
   * Update a payment link
   * Requires: Authentication
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  update(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() updatePaymentLinkDto: UpdatePaymentLinkDto,
  ) {
    return this.paymentLinksService.update(id, user.id, updatePaymentLinkDto);
  }

  /**
   * DELETE /payment-links/:id
   * Delete a payment link (soft delete)
   * Requires: Authentication
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.paymentLinksService.remove(id, user.id);
  }
}

