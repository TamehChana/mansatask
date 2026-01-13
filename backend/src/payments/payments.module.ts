import { Module, forwardRef } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentLinksModule } from '../payment-links/payment-links.module';
import { MansaTransfersService } from './services/mansa-transfers.service';
import { IdempotencyService } from '../common/services/idempotency.service';
import { EmailModule } from '../email/email.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { ApiLogService } from './services/api-log.service';

@Module({
  imports: [
    PaymentLinksModule,
    EmailModule,
    forwardRef(() => ReceiptsModule),
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MansaTransfersService,
    IdempotencyService,
    ApiLogService,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}


