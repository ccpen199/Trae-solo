import { IsString, IsNotEmpty, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class BomMaterialDto {
  @IsString()
  @IsNotEmpty()
  materialId!: string;

  @IsNumber()
  @IsNotEmpty()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  unit!: string;
}

export class CreateBomDto {
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @IsString()
  @IsNotEmpty()
  version!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BomMaterialDto)
  materials!: BomMaterialDto[];
}
