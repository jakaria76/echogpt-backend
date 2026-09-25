import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlanType } from '@prisma/client';
import * as os from 'os';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, premiumUsers, totalRequests, activeProviders] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({
        where: { plan: PlanType.PREMIUM, isActive: true },
      }),
      this.prisma.apiUsageLog.count(),
      this.prisma.aiProvider.count({
        where: { isEnabled: true },
      }),
    ]);

    const totalConversations = await this.prisma.conversation.count();
    const totalMessages = await this.prisma.chatMessage.count();
    const totalSearches = await this.prisma.webSearch.count();

    return {
      overview: {
        totalUsers,
        premiumUsers,
        freeUsers: totalUsers - premiumUsers,
        totalRequests,
        activeProviders,
      },
      activity: {
        totalConversations,
        totalMessages,
        totalSearches,
      },
      timestamp: new Date(),
    };
  }

  async getAllUsers(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isVerified: true,
          createdAt: true,
          subscription: {
            select: {
              plan: true,
              dailyRequestLimit: true,
              usedRequestsToday: true,
              isActive: true,
            },
          },
        },
      }),
      this.prisma.user.count(),
    ]);

    return {
      data: users,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getAllSubscriptions() {
    return this.prisma.subscription.findMany({
      include: {
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getApiUsageLogs(limit = 50) {
    return this.prisma.apiUsageLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getUsageAnalytics() {
    // Endpoint-wise aggregation
    const logs = await this.prisma.apiUsageLog.groupBy({
      by: ['method', 'endpoint'],
      _count: {
        _all: true,
      },
      _avg: {
        durationMs: true,
      },
      orderBy: {
        _count: {
          endpoint: 'desc',
        },
      },
      take: 10,
    });

    return logs.map((log) => ({
      method: log.method,
      endpoint: log.endpoint,
      totalHits: log._count._all,
      avgResponseTimeMs: Math.round(log._avg.durationMs || 0),
    }));
  }

  async getSystemHealth() {
    const memoryUsage = process.memoryUsage();

    return {
      status: 'UP',
      uptimeSeconds: Math.floor(process.uptime()),
      system: {
        platform: process.platform,
        architecture: process.arch,
        cpuCores: os.cpus().length,
        freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
        totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
      },
      processMemory: {
        rssMB: Math.round(memoryUsage.rss / (1024 * 1024)),
        heapTotalMB: Math.round(memoryUsage.heapTotal / (1024 * 1024)),
        heapUsedMB: Math.round(memoryUsage.heapUsed / (1024 * 1024)),
      },
      database: 'CONNECTED',
      timestamp: new Date(),
    };
  }
}