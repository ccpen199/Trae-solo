import {
  IsString,
  IsOptional,
  IsInt,
  IsUUID,
  IsArray,
  IsBoolean,
  ValidateNested,
  IsObject,
  MaxLength,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ScenarioOption } from '../entities/scenario-tree.entity';
import { ConditionGroup } from '../entities/scenario-condition.entity';

export class ScenarioOptionDto implements ScenarioOption {
  @ApiProperty({ description: '选项键' })
  @IsString()
  key: string;

  @ApiProperty({ description: '选项标签' })
  @IsString()
  label: string;

  @ApiProperty({ description: '选项值' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ description: '下一节点ID' })
  @IsOptional()
  @IsUUID()
  nextNodeId?: string;

  @ApiPropertyOptional({ description: '结果子项ID' })
  @IsOptional()
  @IsUUID()
  resultSubitemId?: string;
}

export class CreateScenarioTreeDto {
  @ApiProperty({ description: '所属事项ID' })
  @IsUUID()
  itemId: string;

  @ApiPropertyOptional({ description: '父节点ID' })
  @IsOptional()
  @IsUUID()
  parentNodeId?: string | null;

  @ApiPropertyOptional({ description: '节点编码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  nodeCode?: string | null;

  @ApiProperty({ description: '问题内容' })
  @IsString()
  question: string;

  @ApiPropertyOptional({ description: '选项列表', type: [ScenarioOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScenarioOptionDto)
  options?: ScenarioOptionDto[] | null;

  @ApiPropertyOptional({ description: '默认下一节点ID' })
  @IsOptional()
  @IsUUID()
  nextNodeId?: string | null;

  @ApiPropertyOptional({ description: '结果子项ID' })
  @IsOptional()
  @IsUUID()
  resultSubitemId?: string | null;

  @ApiPropertyOptional({ description: '排序号', default: 0 })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ description: '是否根节点', default: false })
  @IsOptional()
  @IsBoolean()
  isRoot?: boolean;

  @ApiPropertyOptional({ description: '是否叶子节点', default: false })
  @IsOptional()
  @IsBoolean()
  isLeaf?: boolean;
}

export class ScenarioAnswerDto {
  @ApiProperty({ description: '节点ID' })
  @IsUUID()
  nodeId: string;

  @ApiProperty({ description: '选择的选项键' })
  @IsString()
  answerKey: string;
}

export class SubmitScenarioGuideDto {
  @ApiProperty({ description: '事项ID' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: '用户回答的问题路径', type: [ScenarioAnswerDto] })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ScenarioAnswerDto)
  answers: ScenarioAnswerDto[];
}

export class CreateScenarioConditionDto {
  @ApiProperty({ description: '所属事项ID' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: '匹配的子项ID' })
  @IsUUID()
  subitemId: string;

  @ApiProperty({ description: '条件名称' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiProperty({ description: '条件表达式(JSON)' })
  @IsObject()
  expression: ConditionGroup;

  @ApiPropertyOptional({ description: '匹配优先级', default: 0 })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({ description: '条件描述' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ description: '是否启用', default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}

export class SmartMatchSubitemDto {
  @ApiProperty({ description: '事项ID' })
  @IsUUID()
  itemId: string;

  @ApiProperty({ description: '用户数据用于智能匹配', type: 'object' })
  @IsObject()
  userData: Record<string, unknown>;
}
