import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { Member } from './entities/member.entity';
import { MemberLevel, MemberStatus, UserRole } from '../common/types';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('会员')
@ApiBearerAuth()
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Public()
  @Post()
  @ApiOperation({ summary: '注册会员' })
  async createMember(
    @Body()
    memberData: {
      name: string;
      phone: string;
      avatar?: string;
      birthday?: string;
      address?: string;
    },
  ): Promise<Member> {
    return this.membersService.createMember(memberData);
  }

  @Get()
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '获取会员列表' })
  @ApiQuery({ name: 'level', required: false, enum: MemberLevel })
  @ApiQuery({ name: 'status', required: false, enum: MemberStatus })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getAllMembers(
    @Query('level') level?: MemberLevel,
    @Query('status') status?: MemberStatus,
    @Query('keyword') keyword?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<{ data: Member[]; total: number }> {
    return this.membersService.getAllMembers(
      { level, status, keyword },
      { page, limit },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '获取会员详情' })
  async getMemberById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Member> {
    return this.membersService.getMemberById(id);
  }

  @Get('phone/:phone')
  @ApiOperation({ summary: '根据手机号获取会员' })
  async getMemberByPhone(
    @Param('phone') phone: string,
  ): Promise<Member> {
    return this.membersService.getMemberByPhone(phone);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新会员信息' })
  async updateMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updates: Partial<Member>,
  ): Promise<Member> {
    return this.membersService.updateMember(id, updates);
  }

  @Post(':id/recharge')
  @Roles(UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '会员充值' })
  async recharge(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('amount') amount: number,
  ): Promise<Member> {
    return this.membersService.recharge(id, amount);
  }

  @Post(':id/points')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '调整积分' })
  async adjustPoints(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('points') points: number,
  ): Promise<Member> {
    return this.membersService.adjustPoints(id, points);
  }

  @Post(':id/update-level')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '更新会员等级' })
  async updateMemberLevel(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Member> {
    return this.membersService.updateMemberLevel(id);
  }

  @Put(':id/deactivate')
  @Roles(UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: '停用会员' })
  async deactivateMember(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.membersService.deactivateMember(id);
  }
}
