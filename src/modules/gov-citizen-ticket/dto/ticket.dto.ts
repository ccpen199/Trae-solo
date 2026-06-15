import { IsString, IsOptional, IsEnum, IsUUID, IsNotEmpty, IsInt, Min, Max, IsPhoneNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TicketSource, TicketPriority, TicketStatus } from '../entities/ticket.entity';

export class CreateTicketDto {
  @ApiProperty({ description: '工单标题', required: true })
  @IsString({ message: '标题必须是字符串' })
  @IsNotEmpty({ message: '标题不能为空' })
  title: string;

  @ApiProperty({ description: '工单内容', required: true })
  @IsString({ message: '内容必须是字符串' })
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiProperty({ description: '联系人姓名', required: false })
  @IsOptional()
  @IsString({ message: '联系人姓名必须是字符串' })
  contactName?: string;

  @ApiProperty({ description: '联系电话', required: false })
  @IsOptional()
  @IsString({ message: '联系电话必须是字符串' })
  contactPhone?: string;

  @ApiProperty({ description: '工单分类ID', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId格式无效' })
  categoryId?: string;

  @ApiProperty({ description: '工单子分类ID', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'subCategoryId格式无效' })
  subCategoryId?: string;

  @ApiProperty({ description: '工单来源', required: false, enum: ['hotline_12345', 'app', 'website', 'wechat', 'onsite'], default: 'app' })
  @IsOptional()
  @IsEnum(['hotline_12345', 'app', 'website', 'wechat', 'onsite'], { message: '工单来源参数无效' })
  source?: TicketSource;

  @ApiProperty({ description: '优先级', required: false, enum: ['urgent', 'high', 'normal', 'low'], default: 'normal' })
  @IsOptional()
  @IsEnum(['urgent', 'high', 'normal', 'low'], { message: '优先级参数无效' })
  priority?: TicketPriority;

  @ApiProperty({ description: '期望回复时间(ISO时间字符串)', required: false })
  @IsOptional()
  @IsString({ message: 'expectReplyTime必须是字符串' })
  expectReplyTime?: string;

  @ApiProperty({ description: '附件列表', required: false, type: [Object] })
  @IsOptional()
  @IsArray({ message: 'attachments必须是数组' })
  attachments?: Array<{ fileName: string; fileUrl: string; fileSize?: number; fileType?: string }>;
}

export class TicketListQueryDto {
  @ApiProperty({ description: '工单状态筛选', required: false, enum: ['pending', 'dispatched', 'processing', 'transferred', 'closed', 'cancelled'] })
  @IsOptional()
  @IsEnum(['pending', 'dispatched', 'processing', 'transferred', 'closed', 'cancelled'], { message: '状态参数无效' })
  status?: TicketStatus;

  @ApiProperty({ description: '工单来源筛选', required: false, enum: ['hotline_12345', 'app', 'website', 'wechat', 'onsite'] })
  @IsOptional()
  @IsEnum(['hotline_12345', 'app', 'website', 'wechat', 'onsite'], { message: '来源参数无效' })
  source?: TicketSource;

  @ApiProperty({ description: '优先级筛选', required: false, enum: ['urgent', 'high', 'normal', 'low'] })
  @IsOptional()
  @IsEnum(['urgent', 'high', 'normal', 'low'], { message: '优先级参数无效' })
  priority?: TicketPriority;

  @ApiProperty({ description: '搜索关键词(标题/内容)', required: false })
  @IsOptional()
  @IsString({ message: 'keyword必须是字符串' })
  keyword?: string;

  @ApiProperty({ description: '工单编号', required: false })
  @IsOptional()
  @IsString({ message: 'ticketNo必须是字符串' })
  ticketNo?: string;

  @ApiProperty({ description: '分类ID', required: false })
  @IsOptional()
  @IsUUID('4', { message: 'categoryId格式无效' })
  categoryId?: string;

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

export class TicketUrgencyDto {
  @ApiProperty({ description: '工单ID', required: true })
  @IsUUID('4', { message: 'ticketId格式无效' })
  @IsNotEmpty({ message: 'ticketId不能为空' })
  ticketId: string;

  @ApiProperty({ description: '催办原因', required: false })
  @IsOptional()
  @IsString({ message: 'urgencyReason必须是字符串' })
  urgencyReason?: string;

  @ApiProperty({ description: '联系电话', required: false })
  @IsOptional()
  @IsString({ message: 'contactPhone必须是字符串' })
  contactPhone?: string;
}

export class TicketCancelDto {
  @ApiProperty({ description: '取消原因', required: true })
  @IsString({ message: '取消原因必须是字符串' })
  @IsNotEmpty({ message: '取消原因不能为空' })
  cancelReason: string;
}
