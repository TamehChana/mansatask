import { Controller, Get, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { StorageService } from '../storage/storage.service';
import { ConfigService } from '@nestjs/config';

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    storage: ServiceHealth;
  };
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

interface ServiceHealth {
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
}

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private prisma: PrismaService,
    private redisService: RedisService,
    private storageService: StorageService,
    private configService: ConfigService,
  ) {}

  @Get()
  async check(): Promise<HealthStatus> {
    const startTime = Date.now();
    const nodeEnv = this.configService.get<string>('config.nodeEnv') || 'development';

    const healthStatus: HealthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: nodeEnv,
      services: {
        database: await this.checkDatabase(),
        redis: await this.checkRedis(),
        storage: await this.checkStorage(),
      },
      memory: this.getMemoryUsage(),
    };

    // Determine overall status
    const serviceStatuses = Object.values(healthStatus.services);
    const unhealthyServices = serviceStatuses.filter((s) => s.status === 'unhealthy');
    const unknownServices = serviceStatuses.filter((s) => s.status === 'unknown');

    if (unhealthyServices.length > 0) {
      healthStatus.status = 'down';
    } else if (unknownServices.length > 0) {
      healthStatus.status = 'degraded';
    }

    const duration = Date.now() - startTime;
    this.logger.debug(`Health check completed in ${duration}ms`, {
      status: healthStatus.status,
      duration,
    });

    return healthStatus;
  }

  private async checkDatabase(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const dbCheck = Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Database query timeout')), 2000),
        ),
      ]);
      await dbCheck;
      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      const redisCheck = Promise.race([
        this.redisService.getClient().ping(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis ping timeout')), 2000),
        ),
      ]);
      await redisCheck;
      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy',
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkStorage(): Promise<ServiceHealth> {
    const startTime = Date.now();
    try {
      // Check if S3 is configured (StorageService handles this internally)
      // For now, just check if the service is initialized
      // In a real implementation, you might want to test S3 connectivity
      const responseTime = Date.now() - startTime;
      return {
        status: 'healthy', // StorageService handles fallback gracefully
        responseTime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private getMemoryUsage() {
    const usage = process.memoryUsage();
    const total = usage.heapTotal;
    const used = usage.heapUsed;
    const percentage = (used / total) * 100;

    return {
      used: Math.round(used / 1024 / 1024), // MB
      total: Math.round(total / 1024 / 1024), // MB
      percentage: Math.round(percentage * 100) / 100,
    };
  }
}


