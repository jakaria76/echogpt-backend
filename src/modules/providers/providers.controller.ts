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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProvidersService } from './providers.service';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('AI Provider Management')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Add a new AI Provider (Admin Only)' })
  @ApiResponse({ status: 201, description: 'Provider created successfully' })
  async create(@Body() dto: CreateProviderDto) {
    return this.providersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all supported AI Providers' })
  @ApiResponse({ status: 200, description: 'List of providers' })
  async findAll() {
    return this.providersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get details of a specific AI Provider' })
  async findOne(@Param('id') id: string) {
    return this.providersService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update AI Provider configurations (Admin Only)' })
  async update(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.providersService.update(id, dto);
  }

  @Patch(':id/toggle')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Enable or disable an AI Provider (Admin Only)' })
  async toggleStatus(@Param('id') id: string) {
    return this.providersService.toggleStatus(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an AI Provider (Admin Only)' })
  async remove(@Param('id') id: string) {
    return this.providersService.remove(id);
  }

  @Get(':id/health')
  @ApiOperation({ summary: 'Check provider health and configuration status' })
  async healthCheck(@Param('id') id: string) {
    return this.providersService.healthCheck(id);
  }
}