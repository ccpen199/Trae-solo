import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCorpusDto {
  @ApiProperty({ description: '问题' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ description: '答案' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ description: '分类' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ description: '意图' })
  @IsString()
  @IsNotEmpty()
  intent: string;

  @ApiPropertyOptional({ description: '实体信息' })
  @IsObject()
  @IsOptional()
  entities?: any;

  @ApiProperty({ description: '来源类型' })
  @IsString()
  @IsNotEmpty()
  sourceType: string;

  @ApiPropertyOptional({ description: '来源ID' })
  @IsString()
  @IsOptional()
  sourceId?: string;

  @ApiPropertyOptional({ description: '难度等级' })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  difficulty?: number;

  @ApiPropertyOptional({ description: '是否审核通过' })
  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;
}

export class UpdateCorpusDto extends CreateCorpusDto {}

export class CorpusQueryDto {
  @ApiPropertyOptional({ description: '关键词' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiPropertyOptional({ description: '分类' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: '意图' })
  @IsString()
  @IsOptional()
  intent?: string;

  @ApiPropertyOptional({ description: '是否审核通过' })
  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isApproved?: boolean;

  @ApiPropertyOptional({ description: '页码' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: '每页数量' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 20;
}

export class AskQuestionDto {
  @ApiProperty({ description: '用户问题' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiPropertyOptional({ description: '会话ID' })
  @IsString()
  @IsOptional()
  sessionId?: string;
}
