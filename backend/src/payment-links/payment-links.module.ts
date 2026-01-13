import { Module } from '@nestjs/common';
import { PaymentLinksService } from './payment-links.service';
import { PaymentLinksController } from './payment-links.controller';

@Module({
  controllers: [PaymentLinksController],
  providers: [PaymentLinksService],
  exports: [PaymentLinksService],
})
export class PaymentLinksModule {}



