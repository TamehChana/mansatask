import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get dashboard statistics
   * GET /dashboard/stats
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats(@CurrentUser() user: { id: string }) {
    const stats = await this.dashboardService.getDashboardStats(user.id);
    return {
      success: true,
      data: stats,
    };
  }
}



