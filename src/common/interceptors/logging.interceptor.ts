import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const { method, originalUrl, ip } = request;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async () => {
        const durationMs = Date.now() - startTime;
        const statusCode = response.statusCode;
        const userId = request.user?.id || null;

        // Skip swagger internal polling/docs endpoints from flooding the logs
        if (originalUrl.includes('/api/docs')) {
          return;
        }

        try {
          await this.prisma.apiUsageLog.create({
            data: {
              userId,
              endpoint: originalUrl,
              method,
              statusCode,
              durationMs,
              ipAddress: typeof ip === 'string' ? ip : null,
            },
          });
        } catch (error) {
          // Non-blocking log failure
          console.error('Failed to write API usage log:', error);
        }
      }),
    );
  }
}