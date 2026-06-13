import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { SceneService } from './scene.service';
import { JwtAuthGuard } from '../auth/guards';
import { SceneStatus } from '@iot/shared';

@ApiTags('Scenes')
@Controller('scenes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class SceneController {
  constructor(private readonly sceneService: SceneService) {}

  @Post()
  create(@Request() req: any, @Body() dto: any) {
    return this.sceneService.create({ ...dto, homeId: dto.homeId || req.user.homeId });
  }

  @Get()
  findAll(@Request() req: any, @Query('status') status?: SceneStatus) {
    return this.sceneService.findAll(req.user.homeId, status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sceneService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.sceneService.update(id, dto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.sceneService.delete(id);
  }

  @Post(':id/toggle')
  toggle(@Param('id') id: string, @Body() dto: { status: SceneStatus }) {
    return this.sceneService.toggleScene(id, dto.status);
  }

  @Post(':id/execute')
  execute(@Param('id') id: string, @Request() req: any) {
    return this.sceneService.executeScene(id, req.user.userId);
  }

  @Post(':id/duplicate')
  duplicate(@Param('id') id: string, @Body() dto?: { name?: string }) {
    return this.sceneService.duplicateScene(id, dto?.name);
  }
}
