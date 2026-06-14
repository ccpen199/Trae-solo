import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { CreateCorpusDto, UpdateCorpusDto, CorpusQueryDto, AskQuestionDto } from './dto/ai.dto';
import { Public } from '@/common/decorators/public.decorator';

@ApiTags('AI')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('corpus')
  @ApiBearerAuth()
  @ApiOperation({ summary: '新增AI训练语料' })
  async createCorpus(@Body() dto: CreateCorpusDto) {
    return this.aiService.createCorpus(dto);
  }

  @Post('corpus/batch')
  @ApiBearerAuth()
  @ApiOperation({ summary: '批量导入语料' })
  async batchCreate(@Body() corpora: CreateCorpusDto[]) {
    return this.aiService.batchCreate(corpora);
  }

  @Get('corpus')
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取AI语料列表' })
  async findAllCorpus(@Query() query: CorpusQueryDto) {
    return this.aiService.findAllCorpora(query);
  }

  @Get('corpus/stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: '语料库统计' })
  async getCorpusStats() {
    return this.aiService.getCorpusStats();
  }

  @Put('corpus/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新语料' })
  async updateCorpus(@Param('id') id: string, @Body() dto: UpdateCorpusDto) {
    return this.aiService.updateCorpus(id, dto);
  }

  @Delete('corpus/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除语料' })
  async deleteCorpus(@Param('id') id: string) {
    return this.aiService.deleteCorpus(id);
  }

  @Public()
  @Post('ask')
  @ApiOperation({ summary: 'AI智能问答' })
  async ask(@Body() dto: AskQuestionDto) {
    return this.aiService.ask(dto);
  }
}
