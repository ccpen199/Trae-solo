import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  findAll(@Query('role') role?: Role) {
    return this.usersService.findAll(role);
  }

  @Get('designers')
  @Roles(Role.ADMIN, Role.DESIGNER, Role.PATTERN_MAKER)
  getDesigners() {
    return this.usersService.getDesigners();
  }

  @Get('pattern-makers')
  @Roles(Role.ADMIN, Role.DESIGNER, Role.PATTERN_MAKER)
  getPatternMakers() {
    return this.usersService.getPatternMakers();
  }

  @Get('purchasers')
  @Roles(Role.ADMIN, Role.PURCHASER, Role.DESIGNER)
  getPurchasers() {
    return this.usersService.getPurchasers();
  }

  @Get('factories')
  @Roles(Role.ADMIN, Role.FACTORY, Role.PURCHASER, Role.DESIGNER)
  getFactories() {
    return this.usersService.getFactories();
  }

  @Get('me')
  getCurrentUser(@Request() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('me')
  updateCurrentUser(
    @Request() req,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
