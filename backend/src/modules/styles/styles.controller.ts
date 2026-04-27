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
import { StylesService } from './styles.service';
import { CreateStyleDto } from './dto/create-style.dto';
import { UpdateStyleDto } from './dto/update-style.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums/role.enum';
import { StyleStatus } from '../../common/enums/style-status.enum';

@Controller('styles')
export class StylesController {
  constructor(private readonly stylesService: StylesService) {}

  @Post()
  @Roles(Role.DESIGNER, Role.ADMIN)
  create(@Body() createStyleDto: CreateStyleDto, @Request() req) {
    return this.stylesService.create(createStyleDto, req.user.id);
  }

  @Get()
  @Roles(Role.DESIGNER, Role.PATTERN_MAKER, Role.PURCHASER, Role.FACTORY, Role.ADMIN)
  findAll(
    @Query('designerId') designerId?: string,
    @Query('status') status?: StyleStatus,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
  ) {
    return this.stylesService.findAll(
      designerId,
      status,
      Number(page),
      Number(pageSize),
    );
  }

  @Get('my')
  @Roles(Role.DESIGNER)
  findMyStyles(
    @Query('status') status?: StyleStatus,
    @Query('page') page: number = 1,
    @Query('pageSize') pageSize: number = 20,
    @Request() req?,
  ) {
    return this.stylesService.findAll(
      req.user.id,
      status,
      Number(page),
      Number(pageSize),
    );
  }

  @Get('status-info/:status')
  getStatusInfo(@Param('status') status: StyleStatus) {
    return this.stylesService.getStatusInfo(status);
  }

  @Get('next-statuses/:currentStatus')
  getNextStatuses(@Param('currentStatus') currentStatus: StyleStatus) {
    return this.stylesService.getNextStatuses(currentStatus);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stylesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.DESIGNER, Role.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateStyleDto: UpdateStyleDto,
    @Request() req,
  ) {
    return this.stylesService.update(id, updateStyleDto, req.user.id);
  }

  @Post(':id/submit')
  @Roles(Role.DESIGNER)
  submitForPattern(@Param('id') id: string, @Request() req) {
    return this.stylesService.submitForPattern(id, req.user.id);
  }

  @Post(':id/confirm-pattern')
  @Roles(Role.DESIGNER)
  confirmPattern(
    @Param('id') id: string,
    @Body() body: { confirmed: boolean; revisionNotes?: string },
    @Request() req,
  ) {
    return this.stylesService.confirmPattern(
      id,
      req.user.id,
      body.confirmed,
      body.revisionNotes,
    );
  }

  @Get(':id/histories')
  getHistories(@Param('id') id: string) {
    return this.stylesService.getHistories(id);
  }
}
