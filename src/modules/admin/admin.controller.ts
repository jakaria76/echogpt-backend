import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Admin Panel')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin Dashboard statistics & overview (Admin Only)' })
  @ApiResponse({ status: 200, description: 'Dashboard stats returned successfully' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get paginated list of all users with subscriptions' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  async getAllUsers(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getAllUsers(page, limit);
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List all user subscriptions' })
  async getAllSubscriptions() {
    return this.adminService.getAllSubscriptions();
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get aggregated API usage analytics and response metrics' })
  async getUsageAnalytics() {
    return this.adminService.getUsageAnalytics();
  }

  @Get('logs')
  @ApiOperation({ summary: 'Get real-time API request audit logs' })
  @ApiQuery({ name: 'limit', required: false, example: 50 })
  async getLogs(
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
  ) {
    return this.adminService.getApiUsageLogs(limit);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health, memory stats, and server uptime' })
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }
}