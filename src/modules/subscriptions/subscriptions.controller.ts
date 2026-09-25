import {
  Controller,
  Get,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Subscription Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get current subscription status and remaining quota' })
  @ApiResponse({ status: 200, description: 'Subscription details returned' })
  async getStatus(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.getStatus(userId);
  }

  @Post('upgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upgrade account to PREMIUM plan (500 requests/day)' })
  @ApiResponse({ status: 200, description: 'Successfully upgraded to PREMIUM' })
  async upgrade(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.upgrade(userId);
  }

  @Post('downgrade')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Downgrade account to FREE plan (20 requests/day)' })
  @ApiResponse({ status: 200, description: 'Successfully downgraded to FREE' })
  async downgrade(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.downgrade(userId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get detailed daily request usage and percentage' })
  @ApiResponse({ status: 200, description: 'Usage data returned' })
  async getUsage(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.getUsage(userId);
  }
}