import { IsString, IsOptional, IsArray, ValidateNested, IsNumber, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

class BomMaterialDto {
  @IsString()
  @IsNotEmpty()
  materialId!: string;

  @IsNumber()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  unit!: string;
}

export class UpdateBomDto {
  @IsString()
  @IsOptional()
  version?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => BomMaterialDto)
  materials?: BomMaterialDto[];
}
