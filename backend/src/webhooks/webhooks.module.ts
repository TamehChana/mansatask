import { Module, forwardRef } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { ReceiptsModule } from '../receipts/receipts.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    forwardRef(() => ReceiptsModule),
    EmailModule,
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService],
  exports: [WebhooksService],
})
export class WebhooksModule {}


