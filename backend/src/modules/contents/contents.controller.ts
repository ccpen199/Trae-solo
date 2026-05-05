import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  Patch
} from '@nestjs/common';
import { ContentsService, CreateContentDto, UpdateContentDto, ContentQuery } from './contents.service';
import { RequiresPermission, CurrentUser } from '../../common/decorators/auth.decorator';
import { PermissionModule, PermissionAction } from '../../common/types';
import { User } from '../users/entities/user.entity';
import { IsArray, IsUUID, ArrayNotEmpty } from 'class-validator';

class BatchPublishDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids: string[];
}

class MoveContentDto {
  @IsUUID()
  targetCategoryId: string;
}

@Controller('contents')
export class ContentsController {
  constructor(private readonly contentsService: ContentsService) {}

  @Post()
  @RequiresPermission(PermissionModule.CONTENT, PermissionAction.CREATE)
  create(
    @Body() createContentDto: CreateContentDto, 
    @CurrentUser() user: User
  ) {
    return this.contentsService.create(createContentDto, user.id);
  }

  @Get()
  @RequiresPermission(PermissionModule.CONTENT, PermissionAction.READ)
  findAll(
    @Query() query: ContentQuery,
  ) {
    return this.contentsService.findAll(query);
  }

  @Get(':id')
  @RequiresPermission(PermissionModule.CONTENT, PermissionAction.READ)
  findOne(@Param('id') id: string) {
    return this.contentsService.findOne(id);
  }

  @Put(':id')
  @RequiresPermission(PermissionModule.CONTENT, PermissionAction.UPDATE)
  update(
    @Param('id') id: string, 
    @Body() updateContentDto: UpdateContentDto,
    @CurrentUser() user: User
  ) {
    return this.contentsService.update(id, updateContentDto, user.id);
  }

  @Delete(':id')
  @RequiresPermission(PermissionModule.CONTENT, PermissionAction.DELETE)
  remove(@Param('id') id: string) {
    return this.contentsService.remove(id);
  }

  @Patch(':id/publish')
  @RequiresPermission(PermissionModule.CONTENT, PermissionAction.PUBLISH)
  publish(
    @Param('id') id: string,
    @CurrentUser() user: User
  ) {
    return this.contentsService.publish(id, user.id);
  }

  @Post('batch-publish')
  @RequiresPermission(PermissionModule.CONTENT, PermissionAction.PUBLISH)
  batchPublish(
    @Body() dto: BatchPublishDto,
    @CurrentUser() user: User
  ) {
    return this.contentsService.batchPublish(dto.ids, user.id);
  }

  @Patch(':id/draft')
  @RequiresPermission(PermissionModule.CONTENT, PermissionAction.UPDATE)
  draft(
    @Param('id') id: string,
    @CurrentUser() user: User
  ) {
    return this.contentsService.draft(id, user.id);
  }

  @Post(':id/move')
  @RequiresPermission(PermissionModule.CONTENT, PermissionAction.UPDATE)
  move(
    @Param('id') id: string,
    @Body() dto: MoveContentDto,
    @CurrentUser() user: User
  ) {
    return this.contentsService.move(id, dto.targetCategoryId, user.id);
  }

  @Post(':id/copy')
  @RequiresPermission(PermissionModule.CONTENT, PermissionAction.CREATE)
  copy(
    @Param('id') id: string,
    @CurrentUser() user: User
  ) {
    return this.contentsService.copy(id, user.id);
  }
}
