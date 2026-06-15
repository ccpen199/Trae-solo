import { IsString, IsOptional, IsInt, Min, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceCategoryDto {
  @ApiProperty({ description: '父级分类ID', required: false })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiProperty({ description: '分类名称', example: '社会保障' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: '分类编码', example: 'SHBZ' })
  @IsString()
  @MaxLength(50)
  code: string;

  @ApiPropertyOptional({ description: '层级', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number;

  @ApiPropertyOptional({ description: '排序号', example: 0 })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ description: '所属委办局编码', example: 'RSJ' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  deptCode?: string | null;
}

export class UpdateServiceCategoryDto {
  @ApiPropertyOptional({ description: '父级分类ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string | null;

  @ApiPropertyOptional({ description: '分类名称' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: '分类编码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: '层级' })
  @IsOptional()
  @IsInt()
  @Min(1)
  level?: number;

  @ApiPropertyOptional({ description: '排序号' })
  @IsOptional()
  @IsInt()
  sort?: number;

  @ApiPropertyOptional({ description: '所属委办局编码' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  deptCode?: string | null;
}

export class QueryServiceCategoryDto {
  @ApiPropertyOptional({ description: '分类名称（模糊查询）' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: '分类编码' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: '所属委办局编码' })
  @IsOptional()
  @IsString()
  deptCode?: string;

  @ApiPropertyOptional({ description: '层级' })
  @IsOptional()
  @IsInt()
  level?: number;

  @ApiPropertyOptional({ description: '父级分类ID' })
  @IsOptional()
  @IsUUID()
  parentId?: string;
}
