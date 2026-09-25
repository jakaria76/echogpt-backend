import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionLimitGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    let subscription = await this.prisma.subscription.findUnique({
      where: { userId: user.id },
    });

    if (!subscription) {
      subscription = await this.prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          dailyRequestLimit: 20,
          usedRequestsToday: 0,
        },
      });
    }

    // Check if 24 hours / midnight passed to reset daily quota
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

    if (subscription.usedRequestsToday >= subscription.dailyRequestLimit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Daily request limit exceeded. Upgrade to PREMIUM for higher limits.',
          remainingRequests: 0,
          plan: subscription.plan,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}