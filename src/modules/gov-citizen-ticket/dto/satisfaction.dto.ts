import { IsString, IsOptional, IsInt, Min, Max, IsUUID, IsNotEmpty, IsBoolean, IsObject, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitSatisfactionDto {
  @ApiProperty({ description: '工单ID', required: true })
  @IsUUID('4', { message: 'ticketId格式无效' })
  @IsNotEmpty({ message: 'ticketId不能为空' })
  ticketId: string;

  @ApiProperty({ description: '总体评分(1-5星)', required: true, minimum: 1, maximum: 5 })
  @IsInt({ message: 'rating必须是整数' })
  @Min(1, { message: 'rating不能小于1' })
  @Max(5, { message: 'rating不能大于5' })
  rating: number;

  @ApiProperty({ description: '分项评分: 响应速度(1-5)、处理态度(1-5)、解决效果(1-5)、是否公开', required: false, type: Object })
  @IsOptional()
  @IsObject({ message: 'subRatings必须是对象' })
  subRatings?: {
    responseSpeed?: number;
    attitude?: number;
    resolutionEffect?: number;
    isPublic?: boolean;
  };

  @ApiProperty({ description: '评价内容', required: false })
  @IsOptional()
  @IsString({ message: 'comment必须是字符串' })
  comment?: string;

  @ApiProperty({ description: '是否公开评价', required: false, default: false })
  @IsOptional()
  @IsBoolean({ message: 'isPublic必须是布尔值' })
  isPublic?: boolean;
}

export class SatisfactionQueryDto {
  @ApiProperty({ description: '工单ID', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'ticketId格式无效' })
  ticketId?: string;

  @ApiProperty({ description: '最低评分', required: false })
  @IsOptional()
  @IsInt({ message: 'minRating必须是整数' })
  @Min(1, { message: 'minRating不能小于1' })
  @Max(5, { message: 'minRating不能大于5' })
  minRating?: number;

  @ApiProperty({ description: '最高评分', required: false })
  @IsOptional()
  @IsInt({ message: 'maxRating必须是整数' })
  @Min(1, { message: 'maxRating不能小于1' })
  @Max(5, { message: 'maxRating不能大于5' })
  maxRating?: number;

  @ApiProperty({ description: '是否只看已公开', required: false })
  @IsOptional()
  @IsBoolean({ message: 'onlyPublic必须是布尔值' })
  onlyPublic?: boolean;

  @ApiProperty({ description: '开始日期(YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString({ message: 'startDate必须是字符串' })
  startDate?: string;

  @ApiProperty({ description: '结束日期(YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString({ message: 'endDate必须是字符串' })
  endDate?: string;

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

export class ReplySatisfactionDto {
  @ApiProperty({ description: '满意度评价ID', required: true })
  @IsUUID('4', { message: 'surveyId格式无效' })
  @IsNotEmpty({ message: 'surveyId不能为空' })
  surveyId: string;

  @ApiProperty({ description: '官方回复内容', required: true })
  @IsString({ message: '回复内容必须是字符串' })
  @IsNotEmpty({ message: '回复内容不能为空' })
  replyContent: string;
}

export class SatisfactionStatsQueryDto {
  @ApiProperty({ description: '部门编码', required: false })
  @IsOptional()
  @IsString({ message: 'deptCode必须是字符串' })
  deptCode?: string;

  @ApiProperty({ description: '统计维度', required: false, enum: ['day', 'week', 'month', 'quarter', 'year'], default: 'month' })
  @IsOptional()
  @IsEnum(['day', 'week', 'month', 'quarter', 'year'], { message: '统计维度参数无效' })
  dimension?: 'day' | 'week' | 'month' | 'quarter' | 'year';

  @ApiProperty({ description: '开始日期(YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString({ message: 'startDate必须是字符串' })
  startDate?: string;

  @ApiProperty({ description: '结束日期(YYYY-MM-DD)', required: false })
  @IsOptional()
  @IsString({ message: 'endDate必须是字符串' })
  endDate?: string;
}

export class PublicSatisfactionListDto {
  @ApiProperty({ description: '分类ID筛选', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId格式无效' })
  categoryId?: string;

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
