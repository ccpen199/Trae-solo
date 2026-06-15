import { IsString, IsOptional, IsUUID, IsNotEmpty, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DispatchTicketDto {
  @ApiProperty({ description: '工单ID', required: true })
  @IsUUID('4', { message: 'ticketId格式无效' })
  @IsNotEmpty({ message: 'ticketId不能为空' })
  ticketId: string;

  @ApiProperty({ description: '指派部门编码', required: true })
  @IsString({ message: 'deptCode必须是字符串' })
  @IsNotEmpty({ message: 'deptCode不能为空' })
  deptCode: string;

  @ApiProperty({ description: '指派部门名称', required: false })
  @IsOptional()
  @IsString({ message: 'deptName必须是字符串' })
  deptName?: string;

  @ApiProperty({ description: '分派备注', required: false })
  @IsOptional()
  @IsString({ message: 'remark必须是字符串' })
  remark?: string;
}

export class TransferTicketDto {
  @ApiProperty({ description: '工单ID', required: true })
  @IsUUID('4', { message: 'ticketId格式无效' })
  @IsNotEmpty({ message: 'ticketId不能为空' })
  ticketId: string;

  @ApiProperty({ description: '目标部门编码', required: true })
  @IsString({ message: 'targetDeptCode必须是字符串' })
  @IsNotEmpty({ message: 'targetDeptCode不能为空' })
  targetDeptCode: string;

  @ApiProperty({ description: '目标部门名称', required: false })
  @IsOptional()
  @IsString({ message: 'targetDeptName必须是字符串' })
  targetDeptName?: string;

  @ApiProperty({ description: '转办原因', required: true })
  @IsString({ message: '转办原因必须是字符串' })
  @IsNotEmpty({ message: '转办原因不能为空' })
  transferReason: string;
}

export class ReturnTicketDto {
  @ApiProperty({ description: '工单ID', required: true })
  @IsUUID('4', { message: 'ticketId格式无效' })
  @IsNotEmpty({ message: 'ticketId不能为空' })
  ticketId: string;

  @ApiProperty({ description: '退回原因', required: true })
  @IsString({ message: '退回原因必须是字符串' })
  @IsNotEmpty({ message: '退回原因不能为空' })
  returnReason: string;
}

export class ExtendTicketDto {
  @ApiProperty({ description: '工单ID', required: true })
  @IsUUID('4', { message: 'ticketId格式无效' })
  @IsNotEmpty({ message: 'ticketId不能为空' })
  ticketId: string;

  @ApiProperty({ description: '延期后的期望回复时间(ISO时间字符串)', required: true })
  @IsString({ message: 'expectReplyTime必须是字符串' })
  @IsNotEmpty({ message: 'expectReplyTime不能为空' })
  expectReplyTime: string;

  @ApiProperty({ description: '延期原因', required: true })
  @IsString({ message: '延期原因必须是字符串' })
  @IsNotEmpty({ message: '延期原因不能为空' })
  extendReason: string;
}

export class ReplyTicketDto {
  @ApiProperty({ description: '工单ID', required: true })
  @IsUUID('4', { message: 'ticketId格式无效' })
  @IsNotEmpty({ message: 'ticketId不能为空' })
  ticketId: string;

  @ApiProperty({ description: '回复内容', required: true })
  @IsString({ message: '回复内容必须是字符串' })
  @IsNotEmpty({ message: '回复内容不能为空' })
  responseContent: string;

  @ApiProperty({ description: '是否为最终回复', required: false, default: false })
  @IsOptional()
  isFinal?: boolean;

  @ApiProperty({ description: '回复附件', required: false, type: [Object] })
  @IsOptional()
  @IsArray({ message: 'attachments必须是数组' })
  attachments?: Array<{ fileName: string; fileUrl: string; fileSize?: number; fileType?: string }>;
}

export class CloseTicketDto {
  @ApiProperty({ description: '工单ID', required: true })
  @IsUUID('4', { message: 'ticketId格式无效' })
  @IsNotEmpty({ message: 'ticketId不能为空' })
  ticketId: string;

  @ApiProperty({ description: '办结结论', required: true })
  @IsString({ message: '办结结论必须是字符串' })
  @IsNotEmpty({ message: '办结结论不能为空' })
  conclusion: string;

  @ApiProperty({ description: '最终回复内容', required: false })
  @IsOptional()
  @IsString({ message: 'finalResponse必须是字符串' })
  finalResponse?: string;
}

export class AdminTicketListQueryDto {
  @ApiProperty({ description: '部门编码', required: false })
  @IsOptional()
  @IsString({ message: 'deptCode必须是字符串' })
  deptCode?: string;

  @ApiProperty({ description: '是否待我处理', required: false })
  @IsOptional()
  mine?: boolean;
}
