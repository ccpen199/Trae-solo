import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CreateCommentDto, UpdateCommentDto, CommentQueryDto } from './dto/comment.dto';
import type { Comment } from '@pet/db';
import type { PaginationResult, ContentAuditStatus } from '@pet/shared';

@Controller('community/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createCommentDto: CreateCommentDto & { userId: string }): Promise<Comment> {
    const { userId, ...rest } = createCommentDto;
    return this.commentService.create(userId, rest);
  }

  @Get()
  async findAll(@Query() query: CommentQueryDto): Promise<PaginationResult<Comment>> {
    return this.commentService.findAll(query);
  }

  @Get(':id/replies')
  async findReplies(
    @Param('id') id: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ): Promise<PaginationResult<Comment>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.commentService.findReplies(id, pageNum, pageSizeNum);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Comment> {
    return this.commentService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: UpdateCommentDto & { userId: string },
  ): Promise<Comment> {
    const { userId, ...rest } = updateCommentDto;
    return this.commentService.update(id, userId, rest);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Body('userId') userId: string): Promise<void> {
    await this.commentService.remove(id, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async likeComment(@Param('id') id: string, @Body('userId') userId: string): Promise<void> {
    await this.commentService.likeComment(id, userId);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlikeComment(@Param('id') id: string, @Body('userId') userId: string): Promise<void> {
    await this.commentService.unlikeComment(id, userId);
  }

  @Get(':id/liked')
  async isLiked(@Param('id') id: string, @Query('userId') userId: string): Promise<{ isLiked: boolean }> {
    const isLiked = await this.commentService.isLiked(id, userId);
    return { isLiked };
  }

  @Post(':id/audit')
  async auditComment(
    @Param('id') id: string,
    @Body() body: { status: ContentAuditStatus; reason?: string; auditorId?: string },
  ): Promise<Comment> {
    const { status, reason, auditorId } = body;
    return this.commentService.auditComment(id, status, reason, auditorId);
  }
}
