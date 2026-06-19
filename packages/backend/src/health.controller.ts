import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'community-backend',
      database: 'sqlite',
      timestamp: new Date().toISOString(),
    };
  }
}
