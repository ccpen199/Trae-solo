import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bom } from '../../boms/entities/bom.entity';
import { BomItem } from '../../boms/entities/bom-item.entity';
import { Pattern } from '../../patterns/entities/pattern.entity';
import { Material } from '../../materials/entities/material.entity';
import { NumberGeneratorService } from './number-generator.service';

@Injectable()
export class BomCalculationEngine {
  private readonly logger = new Logger(BomCalculationEngine.name);

  private readonly defaultWasteRates = {
    fabric: 0.08,
    lining: 0.05,
    interfacing: 0.03,
    button: 0.02,
    zipper: 0.01,
    thread: 0.1,
    label: 0.02,
    default: 0.05,
  };

  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    private numberGeneratorService: NumberGeneratorService,
  ) {}

  async generateBomFromPattern(
    pattern: Pattern,
    productionQuantity: number,
    sizes: string[],
  ): Promise<{ bom: Bom; items: BomItem[] }> {
    this.logger.log(`开始为款号 ${pattern.styleId} 生成BOM，生产数量: ${productionQuantity}`);

    const bom = new Bom();
    bom.bomNumber = this.numberGeneratorService.generateBomNumber();
    bom.styleId = pattern.styleId;
    bom.patternId = pattern.id;
    bom.productionQuantity = productionQuantity;
    bom.sizes = sizes;
    bom.bomType = 'production';
    bom.totalFabricCost = 0;
    bom.totalAccessoryCost = 0;
    bom.totalLaborCost = 0;
    bom.totalCost = 0;
    bom.unitCost = 0;

    const items: BomItem[] = [];

    if (pattern.estimatedMaterials && pattern.estimatedMaterials.length > 0) {
      for (const mat of pattern.estimatedMaterials) {
        const item = await this.createBomItem(
          mat,
          productionQuantity,
          sizes.length,
          bom,
        );
        items.push(item);
      }
    }

    if (pattern.fabricConsumption && pattern.fabricConsumption > 0) {
      const fabricItem = await this.createFabricBomItem(
        pattern.fabricConsumption,
        pattern.fabricWidth,
        productionQuantity,
        bom,
      );
      items.push(fabricItem);
    }

    if (pattern.liningConsumption && pattern.liningConsumption > 0) {
      const liningItem = await this.createLiningBomItem(
        pattern.liningConsumption,
        pattern.fabricWidth,
        productionQuantity,
        bom,
      );
      items.push(liningItem);
    }

    if (pattern.interfacingConsumption && pattern.interfacingConsumption > 0) {
      const interfacingItem = await this.createInterfacingBomItem(
        pattern.interfacingConsumption,
        pattern.fabricWidth,
        productionQuantity,
        bom,
      );
      items.push(interfacingItem);
    }

    this.calculateBomTotals(bom, items);

    this.logger.log(`BOM生成完成，共 ${items.length} 项物料`);

    return { bom, items };
  }

  private async createBomItem(
    estimatedMaterial: any,
    productionQuantity: number,
    sizeCount: number,
    bom: Bom,
  ): Promise<BomItem> {
    const item = new BomItem();
    item.bomId = bom.id;
    item.lineNumber = 0;
    item.itemType = estimatedMaterial.category || 'material';
    item.category = estimatedMaterial.category || 'material';
    item.name = estimatedMaterial.type || '未命名物料';
    item.unit = estimatedMaterial.unit || 'pcs';

    const wasteRate = this.getWasteRate(estimatedMaterial.category);
    const quantityPerUnit = estimatedMaterial.consumption || 1;
    const totalQuantity = quantityPerUnit * productionQuantity;
    const totalQuantityWithWaste = totalQuantity * (1 + wasteRate);

    item.quantityPerUnit = quantityPerUnit;
    item.wasteRate = wasteRate * 100;
    item.totalQuantity = totalQuantity;
    item.totalQuantityWithWaste = totalQuantityWithWaste;

    const material = await this.findMaterialByName(estimatedMaterial.type);
    if (material) {
      item.materialId = material.id;
      item.materialCode = material.materialCode;
      item.unitPrice = material.unitPrice;
      item.totalCost = item.unitPrice * item.totalQuantityWithWaste;
      item.currency = material.currency;
    } else {
      item.unitPrice = 0;
      item.totalCost = 0;
    }

    return item;
  }

  private async createFabricBomItem(
    consumption: number,
    fabricWidth: number | null,
    productionQuantity: number,
    bom: Bom,
  ): Promise<BomItem> {
    const item = new BomItem();
    item.bomId = bom.id;
    item.lineNumber = 1;
    item.itemType = 'fabric';
    item.category = '面料';
    item.name = '主面料';
    item.unit = 'm';

    const wasteRate = this.getWasteRate('fabric');
    const quantityPerUnit = consumption;
    const totalQuantity = quantityPerUnit * productionQuantity;
    const totalQuantityWithWaste = totalQuantity * (1 + wasteRate);

    item.quantityPerUnit = quantityPerUnit;
    item.wasteRate = wasteRate * 100;
    item.totalQuantity = totalQuantity;
    item.totalQuantityWithWaste = totalQuantityWithWaste;

    if (fabricWidth) {
      item.specification = `幅宽 ${fabricWidth}cm`;
    }

    item.unitPrice = 0;
    item.totalCost = 0;

    return item;
  }

  private async createLiningBomItem(
    consumption: number,
    fabricWidth: number | null,
    productionQuantity: number,
    bom: Bom,
  ): Promise<BomItem> {
    const item = new BomItem();
    item.bomId = bom.id;
    item.lineNumber = 2;
    item.itemType = 'lining';
    item.category = '里料';
    item.name = '里布';
    item.unit = 'm';

    const wasteRate = this.getWasteRate('lining');
    const quantityPerUnit = consumption;
    const totalQuantity = quantityPerUnit * productionQuantity;
    const totalQuantityWithWaste = totalQuantity * (1 + wasteRate);

    item.quantityPerUnit = quantityPerUnit;
    item.wasteRate = wasteRate * 100;
    item.totalQuantity = totalQuantity;
    item.totalQuantityWithWaste = totalQuantityWithWaste;

    if (fabricWidth) {
      item.specification = `幅宽 ${fabricWidth}cm`;
    }

    item.unitPrice = 0;
    item.totalCost = 0;

    return item;
  }

  private async createInterfacingBomItem(
    consumption: number,
    fabricWidth: number | null,
    productionQuantity: number,
    bom: Bom,
  ): Promise<BomItem> {
    const item = new BomItem();
    item.bomId = bom.id;
    item.lineNumber = 3;
    item.itemType = 'interfacing';
    item.category = '衬料';
    item.name = '粘合衬';
    item.unit = 'm';

    const wasteRate = this.getWasteRate('interfacing');
    const quantityPerUnit = consumption;
    const totalQuantity = quantityPerUnit * productionQuantity;
    const totalQuantityWithWaste = totalQuantity * (1 + wasteRate);

    item.quantityPerUnit = quantityPerUnit;
    item.wasteRate = wasteRate * 100;
    item.totalQuantity = totalQuantity;
    item.totalQuantityWithWaste = totalQuantityWithWaste;

    item.unitPrice = 0;
    item.totalCost = 0;

    return item;
  }

  private calculateBomTotals(bom: Bom, items: BomItem[]): void {
    let fabricCost = 0;
    let accessoryCost = 0;

    items.forEach((item, index) => {
      item.lineNumber = index + 1;

      if (item.itemType === 'fabric' || item.itemType === 'lining' || item.itemType === 'interfacing') {
        fabricCost += item.totalCost;
      } else {
        accessoryCost += item.totalCost;
      }
    });

    bom.totalFabricCost = fabricCost;
    bom.totalAccessoryCost = accessoryCost;
    bom.totalCost = fabricCost + accessoryCost + bom.totalLaborCost;
    
    if (bom.productionQuantity > 0) {
      bom.unitCost = bom.totalCost / bom.productionQuantity;
    }
  }

  private getWasteRate(category: string): number {
    const categoryLower = category?.toLowerCase() || 'default';
    return this.defaultWasteRates[categoryLower] || this.defaultWasteRates.default;
  }

  private async findMaterialByName(name: string): Promise<Material | null> {
    if (!name) return null;

    return this.materialRepository.findOne({
      where: [
        { name: name },
        { materialCode: name },
      ],
    });
  }

  recalculateBomCosts(bom: Bom, items: BomItem[]): Bom {
    this.calculateBomTotals(bom, items);
    return bom;
  }

  calculateMaterialRequirements(
    bomItems: BomItem[],
    quantity: number,
  ): { item: BomItem; requiredQuantity: number }[] {
    return bomItems.map((item) => {
      const currentQuantity = item.totalQuantity / item.bom.productionQuantity || 1;
      const requiredQuantity = currentQuantity * quantity * (1 + item.wasteRate / 100);
      
      return {
        item,
        requiredQuantity,
      };
    });
  }
}
