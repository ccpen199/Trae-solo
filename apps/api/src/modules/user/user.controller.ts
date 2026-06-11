import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Req, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { UserService } from './user.service';
import { UpdateUserDto, CreateAddressDto, UpdateAddressDto } from './dto';
import { User, UserStatus, UserRole } from '@pet/db';
import { getListQueryParams } from '@pet/shared/utils';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: Request & { user: User }) {
    return this.userService.getProfile(req.user.id);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() req: Request & { user: User },
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.updateProfile(req.user.id, dto);
  }

  @Get('membership')
  @UseGuards(AuthGuard('jwt'))
  async getMembershipInfo(@Req() req: Request & { user: User }) {
    return this.userService.getMembershipInfo(req.user.id);
  }

  @Get('addresses')
  @UseGuards(AuthGuard('jwt'))
  async getAddressList(@Req() req: Request & { user: User }) {
    return this.userService.getAddressList(req.user.id);
  }

  @Get('addresses/:addressId')
  @UseGuards(AuthGuard('jwt'))
  async getAddress(
    @Req() req: Request & { user: User },
    @Param('addressId') addressId: string,
  ) {
    return this.userService.getAddressById(req.user.id, addressId);
  }

  @Post('addresses')
  @UseGuards(AuthGuard('jwt'))
  async createAddress(
    @Req() req: Request & { user: User },
    @Body() dto: CreateAddressDto,
  ) {
    return this.userService.createAddress(req.user.id, dto);
  }

  @Put('addresses/:addressId')
  @UseGuards(AuthGuard('jwt'))
  async updateAddress(
    @Req() req: Request & { user: User },
    @Param('addressId') addressId: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.userService.updateAddress(req.user.id, addressId, dto);
  }

  @Delete('addresses/:addressId')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAddress(
    @Req() req: Request & { user: User },
    @Param('addressId') addressId: string,
  ) {
    return this.userService.deleteAddress(req.user.id, addressId);
  }

  @Post('addresses/:addressId/default')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async setDefaultAddress(
    @Req() req: Request & { user: User },
    @Param('addressId') addressId: string,
  ) {
    return this.userService.setDefaultAddress(req.user.id, addressId);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getUserList(@Query() query: Record<string, unknown>) {
    const params = getListQueryParams(query);
    return this.userService.getUserList(params);
  }

  @Get(':userId')
  @UseGuards(AuthGuard('jwt'))
  async getUserById(@Param('userId') userId: string) {
    return this.userService.getUserById(userId);
  }

  @Put(':userId/status')
  @UseGuards(AuthGuard('jwt'))
  async updateUserStatus(
    @Param('userId') userId: string,
    @Body() body: { status: UserStatus },
  ) {
    return this.userService.updateUserStatus(userId, body.status);
  }

  @Put(':userId/role')
  @UseGuards(AuthGuard('jwt'))
  async updateUserRole(
    @Param('userId') userId: string,
    @Body() body: { role: UserRole },
  ) {
    return this.userService.updateUserRole(userId, body.role);
  }

  @Post(':userId/balance')
  @UseGuards(AuthGuard('jwt'))
  async adjustUserBalance(
    @Param('userId') userId: string,
    @Body() body: { amount: number; reason: string },
  ) {
    return this.userService.adjustUserBalance(userId, body.amount, body.reason);
  }

  @Post(':userId/points')
  @UseGuards(AuthGuard('jwt'))
  async adjustUserPoints(
    @Param('userId') userId: string,
    @Body() body: { points: number; reason: string },
  ) {
    return this.userService.adjustUserPoints(userId, body.points, body.reason);
  }
}
