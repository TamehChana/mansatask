import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Get current user profile
   * GET /users/profile
   */
  @Get('profile')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  /**
   * Update current user profile
   * PUT /users/profile
   */
  @Put('profile')
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, updateProfileDto);
  }
}



