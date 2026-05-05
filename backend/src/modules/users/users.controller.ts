import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query
} from '@nestjs/common';
import { UsersService, CreateUserDto, UpdateUserDto, UpdatePasswordDto } from './users.service';
import { RequiresPermission, CurrentUser, Public } from '../../common/decorators/auth.decorator';
import { PermissionModule, PermissionAction } from '../../common/types';
import { User } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequiresPermission(PermissionModule.USER, PermissionAction.CREATE)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequiresPermission(PermissionModule.USER, PermissionAction.READ)
  findAll(@Query('includeInactive') includeInactive: string) {
    return this.usersService.findAll(includeInactive === 'true');
  }

  @Get('current')
  getCurrent(@CurrentUser() user: User) {
    return this.usersService.findOne(user.id);
  }

  @Get('username/:username')
  @RequiresPermission(PermissionModule.USER, PermissionAction.READ)
  findByUsername(@Param('username') username: string) {
    return this.usersService.findByUsername(username);
  }

  @Get(':id')
  @RequiresPermission(PermissionModule.USER, PermissionAction.READ)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission(PermissionModule.USER, PermissionAction.UPDATE)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put('current/password')
  async updateCurrentPassword(
    @CurrentUser() user: User,
    @Body() updatePasswordDto: UpdatePasswordDto
  ) {
    await this.usersService.updatePassword(user.id, updatePasswordDto);
    return { message: '密码修改成功' };
  }

  @Put(':id/reset-password')
  @RequiresPermission(PermissionModule.USER, PermissionAction.UPDATE)
  async resetPassword(
    @Param('id') id: string,
    @Body('newPassword') newPassword: string
  ) {
    await this.usersService.resetPassword(id, newPassword);
    return { message: '密码重置成功' };
  }

  @Delete(':id')
  @RequiresPermission(PermissionModule.USER, PermissionAction.DELETE)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
