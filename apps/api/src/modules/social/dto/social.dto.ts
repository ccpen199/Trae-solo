import { IsString, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { RelationshipType } from '@pet/shared/enums';

export class FollowDto {
  @IsString()
  @IsNotEmpty()
  followingId: string;
}

export class UnfollowDto {
  @IsString()
  @IsNotEmpty()
  followingId: string;
}

export class UpdateRelationshipDto {
  @IsEnum(RelationshipType)
  type: RelationshipType;

  @IsString()
  @IsOptional()
  remark?: string;
}

export class RelationshipQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  pageSize?: string;
}
