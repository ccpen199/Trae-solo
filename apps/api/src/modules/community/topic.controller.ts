import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { TopicService } from './topic.service';
import { CreateTopicDto, UpdateTopicDto, TopicQueryDto } from './dto/topic.dto';
import type { Topic } from '@pet/db';
import type { PaginationResult } from '@pet/shared';

@Controller('community/topics')
export class TopicController {
  constructor(private readonly topicService: TopicService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTopicDto: CreateTopicDto): Promise<Topic> {
    return this.topicService.create(createTopicDto);
  }

  @Get()
  async findAll(@Query() query: TopicQueryDto): Promise<PaginationResult<Topic>> {
    return this.topicService.findAll(query);
  }

  @Get('hot')
  async findHotTopics(@Query('limit') limit: string): Promise<Topic[]> {
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.topicService.findHotTopics(limitNum);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<Topic> {
    return this.topicService.findBySlug(slug);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Topic> {
    return this.topicService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateTopicDto: UpdateTopicDto): Promise<Topic> {
    return this.topicService.update(id, updateTopicDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.topicService.remove(id);
  }

  @Post(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async followTopic(@Param('id') id: string, @Body('userId') userId: string): Promise<void> {
    await this.topicService.followTopic(id, userId);
  }

  @Delete(':id/follow')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollowTopic(@Param('id') id: string, @Body('userId') userId: string): Promise<void> {
    await this.topicService.unfollowTopic(id, userId);
  }

  @Get(':id/following')
  async isFollowing(@Param('id') id: string, @Query('userId') userId: string): Promise<{ isFollowing: boolean }> {
    const isFollowing = await this.topicService.isFollowing(id, userId);
    return { isFollowing };
  }

  @Get('user/:userId/followed')
  async getUserFollowedTopics(
    @Param('userId') userId: string,
    @Query('page') page: string,
    @Query('pageSize') pageSize: string,
  ): Promise<PaginationResult<Topic>> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 20;
    return this.topicService.getUserFollowedTopics(userId, pageNum, pageSizeNum);
  }
}
