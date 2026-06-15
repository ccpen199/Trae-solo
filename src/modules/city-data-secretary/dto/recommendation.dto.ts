import { IsString, IsOptional, IsEnum, IsInt, Min, Max, IsUUID, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RecommendType } from '../entities/recommendation.entity';

export type FeedbackType = 'click' | 'ignore' | 'favorite';

export class RecommendQueryDto {
  @ApiProperty({ description: '推荐类型', required: false, enum: ['service_item', 'cert', 'policy'] })
  @IsOptional()
  @IsEnum(['service_item', 'cert', 'policy'], { message: '推荐类型参数无效' })
  recommendType?: RecommendType;

  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @IsInt({ message: 'page必须是整数' })
  @Min(1, { message: 'page不能小于1' })
  page?: number = 1;

  @ApiProperty({ description: '每页数量', required: false, default: 10 })
  @IsOptional()
  @IsInt({ message: 'pageSize必须是整数' })
  @Min(1, { message: 'pageSize不能小于1' })
  @Max(100, { message: 'pageSize不能大于100' })
  pageSize?: number = 10;
}

export class RecommendFeedbackDto {
  @ApiProperty({ description: '推荐记录ID', required: true })
  @IsUUID('4', { message: 'recommendationId格式无效' })
  @IsNotEmpty({ message: 'recommendationId不能为空' })
  recommendationId: string;

  @ApiProperty({ description: '反馈类型', required: true, enum: ['click', 'ignore', 'favorite'] })
  @IsEnum(['click', 'ignore', 'favorite'], { message: '反馈类型参数无效' })
  @IsNotEmpty({ message: 'feedbackType不能为空' })
  feedbackType: FeedbackType;

  @ApiProperty({ description: '用户备注', required: false })
  @IsOptional()
  @IsString({ message: 'remark必须是字符串' })
  remark?: string;
}

export class BatchFeedbackDto {
  @ApiProperty({ description: '批量反馈列表', required: true, type: [RecommendFeedbackDto] })
  @IsNotEmpty({ message: '反馈列表不能为空' })
  items: RecommendFeedbackDto[];
}

export class RecommendGenerateDto {
  @ApiProperty({ description: '用户ID', required: true })
  @IsUUID('4', { message: 'userId格式无效' })
  @IsNotEmpty({ message: 'userId不能为空' })
  userId: string;

  @ApiProperty({ description: '推荐类型', required: false, enum: ['service_item', 'cert', 'policy'] })
  @IsOptional()
  @IsEnum(['service_item', 'cert', 'policy'], { message: '推荐类型参数无效' })
  recommendType?: RecommendType;

  @ApiProperty({ description: '推荐数量', required: false, default: 10 })
  @IsOptional()
  @IsInt({ message: 'limit必须是整数' })
  @Min(1, { message: 'limit不能小于1' })
  @Max(50, { message: 'limit不能大于50' })
  limit?: number = 10;
}
