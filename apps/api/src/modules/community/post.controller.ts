import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { PostService } from './post.service';
import { CreatePostDto, UpdatePostDto, PostQueryDto, AuditPostDto } from './dto/post.dto';
import type { Post as PostModel } from '@pet/db';
import type { PaginationResult } from '@pet/shared';

@Controller('community/posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPostDto: CreatePostDto & { userId: string }): Promise<PostModel> {
    const { userId, ...rest } = createPostDto;
    return this.postService.create(userId, rest);
  }

  @Get()
  async findAll(@Query() query: PostQueryDto): Promise<PaginationResult<PostModel>> {
    return this.postService.findAll(query);
  }

  @Get('essence')
  async findEssencePosts(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ): Promise<PaginationResult<PostModel>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.postService.findEssencePosts(pageNum, pageSizeNum);
  }

  @Get('top')
  async findTopPosts(
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ): Promise<PaginationResult<PostModel>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.postService.findTopPosts(pageNum, pageSizeNum);
  }

  @Get('hot')
  async findHotPosts(@Query('limit') limit: string): Promise<PostModel[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.postService.findHotPosts(limitNum);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<PostModel> {
    return this.postService.findOne(id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto & { userId: string },
  ): Promise<PostModel> {
    const { userId, ...rest } = updatePostDto;
    return this.postService.update(id, userId, rest);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Body('userId') userId: string): Promise<void> {
    await this.postService.remove(id, userId);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async likePost(@Param('id') id: string, @Body('userId') userId: string): Promise<void> {
    await this.postService.likePost(id, userId);
  }

  @Delete(':id/like')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlikePost(@Param('id') id: string, @Body('userId') userId: string): Promise<void> {
    await this.postService.unlikePost(id, userId);
  }

  @Get(':id/liked')
  async isLiked(@Param('id') id: string, @Query('userId') userId: string): Promise<{ isLiked: boolean }> {
    const isLiked = await this.postService.isLiked(id, userId);
    return { isLiked };
  }

  @Post(':id/audit')
  async auditPost(
    @Param('id') id: string,
    @Body() auditPostDto: AuditPostDto & { auditorId?: string },
  ): Promise<PostModel> {
    const { auditorId, ...rest } = auditPostDto;
    return this.postService.auditPost(id, rest, auditorId);
  }

  @Put(':id/top')
  async setTop(@Param('id') id: string, @Body('isTop') isTop: boolean): Promise<PostModel> {
    return this.postService.setTop(id, isTop);
  }

  @Put(':id/essence')
  async setEssence(@Param('id') id: string, @Body('isEssence') isEssence: boolean): Promise<PostModel> {
    return this.postService.setEssence(id, isEssence);
  }
}
