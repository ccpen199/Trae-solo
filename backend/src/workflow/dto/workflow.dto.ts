import { IsString, IsOptional, IsUUID, IsEnum } from 'class-validator';
import { ReviewStatus } from '../../common/enums';

export class StartWorkflowDto {
  @IsUUID()
  contentId: string;
}

export class ProcessReviewDto {
  @IsEnum(ReviewStatus)
  status: ReviewStatus;

  @IsString()
  @IsOptional()
  comment?: string;

  @IsOptional()
  annotations?: any;

  @IsOptional()
  diffData?: any;
}
