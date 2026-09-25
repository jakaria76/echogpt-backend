import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatus(userId: string) {
    let subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: {
          userId,
          plan: 'FREE',
          dailyRequestLimit: 20,
          usedRequestsToday: 0,
        },
      });
    }

    // Auto reset if new day
    const now = new Date();
    const lastReset = new Date(subscription.lastResetAt);
    const isNewDay =
      now.getUTCDate() !== lastReset.getUTCDate() ||
      now.getUTCMonth() !== lastReset.getUTCMonth() ||
      now.getUTCFullYear() !== lastReset.getUTCFullYear();

    if (isNewDay) {
      subscription = await this.prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          usedRequestsToday: 0,
          lastResetAt: now,
        },
      });
    }

    const remainingRequests = Math.max(
      0,
      subscription.dailyRequestLimit - subscription.usedRequestsToday,
    );

    return {
      plan: subscription.plan,
      dailyRequestLimit: subscription.dailyRequestLimit,
      usedRequestsToday: subscription.usedRequestsToday,
      remainingRequests,
      isActive: subscription.isActive,
      expiresAt: subscription.expiresAt,
    };
  }

  async upgrade(userId: string) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days premium

    const subscription = await this.prisma.subscription.upsert({
      where: { userId },
      update: {
        plan: 'PREMIUM',
        dailyRequestLimit: 500, // Premium gets 500 requests/day
        isActive: true,
        expiresAt,
      },
      create: {
        userId,
        plan: 'PREMIUM',
        dailyRequestLimit: 500,
        usedRequestsToday: 0,
        isActive: true,
        expiresAt,
      },
    });

    return {
      message: 'Subscription upgraded to PREMIUM successfully',
      subscription,
    };
  }

  async downgrade(userId: string) {
    const subscription = await this.prisma.subscription.update({
      where: { userId },
      data: {
        plan: 'FREE',
        dailyRequestLimit: 20,
        expiresAt: null,
      },
    });

    return {
      message: 'Subscription downgraded to FREE successfully',
      subscription,
    };
  }

  async getUsage(userId: string) {
    const status = await this.getStatus(userId);
    return {
      usedRequestsToday: status.usedRequestsToday,
      dailyRequestLimit: status.dailyRequestLimit,
      remainingRequests: status.remainingRequests,
      usagePercentage: `${((status.usedRequestsToday / status.dailyRequestLimit) * 100).toFixed(1)}%`,
    };
  }
}