import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { HomeService } from './home.service';
import { JwtAuthGuard } from '../auth/guards';

@ApiTags('Homes')
@Controller('homes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get()
  getUserHomes(@Request() req: any) {
    return this.homeService.getUserHomes(req.user.userId);
  }

  @Post()
  createHome(@Request() req: any, @Body() dto: any) {
    return this.homeService.createHome(req.user.userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.homeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.homeService.update(id, req.user.userId, dto);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.homeService.addMember(id, req.user.userId, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') targetId: string, @Request() req: any) {
    return this.homeService.removeMember(id, req.user.userId, targetId);
  }

  @Post(':id/rooms')
  createRoom(@Param('id') id: string, @Request() req: any, @Body() dto: any) {
    return this.homeService.createRoom(id, req.user.userId, dto);
  }

  @Patch('rooms/:roomId')
  updateRoom(@Param('roomId') roomId: string, @Request() req: any, @Body() dto: any) {
    return this.homeService.updateRoom(roomId, req.user.userId, dto);
  }

  @Delete('rooms/:roomId')
  deleteRoom(@Param('roomId') roomId: string, @Request() req: any) {
    return this.homeService.deleteRoom(roomId, req.user.userId);
  }

  @Get(':id/devices-by-room')
  getRoomsWithDevices(@Param('id') id: string, @Request() req: any) {
    return this.homeService.getRoomsWithDevices(id, req.user.userId);
  }
}
