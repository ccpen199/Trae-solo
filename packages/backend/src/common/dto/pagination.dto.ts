import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 10;
}

export function buildPagination(pagination: PaginationDto) {
  const page = pagination.page || 1;
  const pageSize = pagination.pageSize || 10;
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}

export function buildPaginationResult<T>(
  items: T[],
  total: number,
  pagination: PaginationDto,
) {
  return {
    items,
    total,
    page: pagination.page || 1,
    pageSize: pagination.pageSize || 10,
    totalPages: Math.ceil(total / (pagination.pageSize || 10)),
  };
}
