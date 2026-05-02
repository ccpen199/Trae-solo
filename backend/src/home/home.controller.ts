import { Controller, Get, Redirect } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';

@Controller()
export class HomeController {
  @Public()
  @Get()
  @Redirect('/api/docs', 301)
  redirectToDocs() {
    return { url: '/api/docs' };
  }

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
