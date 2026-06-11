import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { SocialService } from './social.service';
import { FollowDto, UnfollowDto, UpdateRelationshipDto, RelationshipQueryDto } from './dto';
import { User } from '@pet/db';

@Controller('social')
export class SocialController {
  constructor(private readonly socialService: SocialService) {}

  @Post('follow')
  @UseGuards(AuthGuard('jwt'))
  async follow(@Req() req: Request & { user: User }, @Body() dto: FollowDto) {
    return this.socialService.follow(req.user.id, dto);
  }

  @Post('unfollow')
  @UseGuards(AuthGuard('jwt'))
  async unfollow(@Req() req: Request & { user: User }, @Body() dto: UnfollowDto) {
    return this.socialService.unfollow(req.user.id, dto);
  }

  @Get('followers')
  @UseGuards(AuthGuard('jwt'))
  async getFollowers(@Req() req: Request & { user: User }, @Query() query: RelationshipQueryDto) {
    return this.socialService.getFollowers(req.user.id, query);
  }

  @Get('following')
  @UseGuards(AuthGuard('jwt'))
  async getFollowing(@Req() req: Request & { user: User }, @Query() query: RelationshipQueryDto) {
    return this.socialService.getFollowing(req.user.id, query);
  }

  @Get('friends')
  @UseGuards(AuthGuard('jwt'))
  async getFriends(@Req() req: Request & { user: User }, @Query() query: RelationshipQueryDto) {
    return this.socialService.getFriends(req.user.id, query);
  }

  @Put(':targetId')
  @UseGuards(AuthGuard('jwt'))
  async updateRelationship(
    @Req() req: Request & { user: User },
    @Param('targetId') targetId: string,
    @Body() dto: UpdateRelationshipDto,
  ) {
    return this.socialService.updateRelationship(req.user.id, targetId, dto);
  }
}
