import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { VoiceService } from './voice.service';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Voice')
@Controller('voice')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class VoiceController {
  constructor(private readonly voiceService: VoiceService) {}

  @Post('command')
  processCommand(@Request() req: any, @Body() dto: { text: string; asrSource?: string }) {
    return this.voiceService.processVoiceCommand(
      req.user.userId,
      req.user.homeId,
      dto.text,
      dto.asrSource,
    );
  }
}
