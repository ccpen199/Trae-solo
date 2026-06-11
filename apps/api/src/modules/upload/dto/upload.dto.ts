import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadFileDto {
  @IsString()
  @IsNotEmpty()
  folder: string;

  @IsEnum(['image', 'video', 'gif'])
  fileType: string;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maxWidth?: number;

  @IsInt()
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  maxHeight?: number;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  quality?: number;
}

export class BatchUploadDto {
  @IsString()
  @IsNotEmpty()
  folder: string;

  @IsEnum(['image', 'video', 'gif'])
  fileType: string;

  @IsInt()
  @IsOptional()
  @Min(1)
  @Type(() => Number)
  maxCount?: number = 9;
}
