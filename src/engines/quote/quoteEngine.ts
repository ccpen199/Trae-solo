import { 
  QuoteCalculationContext, 
  QuoteItem, 
  Dimensions, 
  MaterialInfo, 
  HardwareInfo, 
  ProcessStep, 
  Discount, 
  AdditionalFee 
} from '../../types';
import {
  MaterialPriceRule,
  HardwarePriceRule,
  ProcessPriceRule,
  LaborPriceRule,
  QuoteCalculationResult,
  QuoteItemResult,
  MaterialBreakdown,
  HardwareBreakdown,
  ProcessBreakdown,
  ItemCalculationDetails,
  DiscountResult,
  AdditionalFeeResult,
  TaxDetails,
  CalculationMetadata,
  QuoteValidationResult,
  QuoteItemValidation,
  PriceRuleSet
} from './types';
import logger from '../../config/logger';

const CALCULATOR_VERSION = '1.0.0';
const PRICE_RULES_VERSION = '1.0.0';
const TAX_RULES_VERSION = '1.0.0';
const DEFAULT_TAX_RATE = 0.13;

export class QuoteEngine {
  private priceRules: PriceRuleSet;
  private taxRate: number;

  constructor() {
    this.priceRules = this.initializeDefaultPriceRules();
    this.taxRate = DEFAULT_TAX_RATE;
  }

  private initializeDefaultPriceRules(): PriceRuleSet {
    const materialRules = new Map<string, MaterialPriceRule>();
    const hardwareRules = new Map<string, HardwarePriceRule>();
    const processRules = new Map<string, ProcessPriceRule>();
    const laborRules = new Map<string, LaborPriceRule>();

    materialRules.set('particle_board_18', {
      materialId: 'particle_board_18',
      materialType: 'board',
      basePrice: 120,
      pricePerUnit: 180,
      unit: 'm2',
      thicknessRules: [
        { minThickness: 0, maxThickness: 16, priceMultiplier: 0.85, priceAddition: 0 },
        { minThickness: 16, maxThickness: 18, priceMultiplier: 1.0, priceAddition: 0 },
        { minThickness: 18, maxThickness: 25, priceMultiplier: 1.15, priceAddition: 20 }
      ],
      sizeRules: [
        { minWidth: 0, maxWidth: 1200, minHeight: 0, maxHeight: 2400, priceMultiplier: 1.0, priceAddition: 0 },
        { minWidth: 1200, maxWidth: 1800, minHeight: 0, maxHeight: 2700, priceMultiplier: 1.1, priceAddition: 50 },
        { minWidth: 1800, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity, priceMultiplier: 1.25, priceAddition: 100 }
      ],
      quantityRules: [
        { minQuantity: 0, maxQuantity: 10, priceMultiplier: 1.0, priceAddition: 0 },
        { minQuantity: 10, maxQuantity: 50, priceMultiplier: 0.95, priceAddition: 0 },
        { minQuantity: 50, maxQuantity: Infinity, priceMultiplier: 0.9, priceAddition: 0 }
      ],
      supplierId: 'supplier_001',
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true
    });

    materialRules.set('mdf_18', {
      materialId: 'mdf_18',
      materialType: 'board',
      basePrice: 180,
      pricePerUnit: 260,
      unit: 'm2',
      thicknessRules: [
        { minThickness: 0, maxThickness: 15, priceMultiplier: 0.85, priceAddition: 0 },
        { minThickness: 15, maxThickness: 18, priceMultiplier: 1.0, priceAddition: 0 },
        { minThickness: 18, maxThickness: 25, priceMultiplier: 1.2, priceAddition: 30 }
      ],
      sizeRules: [
        { minWidth: 0, maxWidth: 1200, minHeight: 0, maxHeight: 2400, priceMultiplier: 1.0, priceAddition: 0 },
        { minWidth: 1200, maxWidth: 1800, minHeight: 0, maxHeight: 2700, priceMultiplier: 1.15, priceAddition: 80 },
        { minWidth: 1800, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity, priceMultiplier: 1.3, priceAddition: 150 }
      ],
      quantityRules: [
        { minQuantity: 0, maxQuantity: 10, priceMultiplier: 1.0, priceAddition: 0 },
        { minQuantity: 10, maxQuantity: 50, priceMultiplier: 0.95, priceAddition: 0 },
        { minQuantity: 50, maxQuantity: Infinity, priceMultiplier: 0.88, priceAddition: 0 }
      ],
      supplierId: 'supplier_002',
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true
    });

    materialRules.set('oak_veneer_18', {
      materialId: 'oak_veneer_18',
      materialType: 'board',
      basePrice: 350,
      pricePerUnit: 520,
      unit: 'm2',
      thicknessRules: [
        { minThickness: 0, maxThickness: 18, priceMultiplier: 1.0, priceAddition: 0 },
        { minThickness: 18, maxThickness: 25, priceMultiplier: 1.25, priceAddition: 50 }
      ],
      sizeRules: [
        { minWidth: 0, maxWidth: 1200, minHeight: 0, maxHeight: 2400, priceMultiplier: 1.0, priceAddition: 0 },
        { minWidth: 1200, maxWidth: Infinity, minHeight: 0, maxHeight: Infinity, priceMultiplier: 1.2, priceAddition: 100 }
      ],
      quantityRules: [
        { minQuantity: 0, maxQuantity: 5, priceMultiplier: 1.0, priceAddition: 0 },
        { minQuantity: 5, maxQuantity: 20, priceMultiplier: 0.95, priceAddition: 0 }
      ],
      supplierId: 'supplier_003',
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true
    });

    hardwareRules.set('hinge_blum_standard', {
      hardwareId: 'hinge_blum_standard',
      hardwareType: 'hinge',
      name: '百隆标准铰链',
      unitPrice: 28,
      unit: 'piece',
      supplierId: 'supplier_004',
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true,
      compatibility: ['cabinet', 'wardrobe']
    });

    hardwareRules.set('drawer_slide_blum_softclose', {
      hardwareId: 'drawer_slide_blum_softclose',
      hardwareType: 'slide',
      name: '百隆阻尼导轨',
      unitPrice: 45,
      unit: 'set',
      supplierId: 'supplier_004',
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true,
      compatibility: ['drawer']
    });

    hardwareRules.set('handle_stainless_steel', {
      hardwareId: 'handle_stainless_steel',
      hardwareType: 'handle',
      name: '不锈钢拉手',
      unitPrice: 12,
      unit: 'piece',
      supplierId: 'supplier_005',
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true,
      compatibility: ['cabinet', 'wardrobe', 'drawer']
    });

    processRules.set('cutting_cnc', {
      processId: 'cutting_cnc',
      processType: 'cutting',
      name: 'CNC开料',
      basePrice: 30,
      pricePerUnit: 8,
      unit: 'piece',
      complexityRules: [
        { minComplexity: 1, maxComplexity: 3, priceMultiplier: 1.0, priceAddition: 0, description: '简单形状' },
        { minComplexity: 3, maxComplexity: 6, priceMultiplier: 1.3, priceAddition: 10, description: '中等复杂度' },
        { minComplexity: 6, maxComplexity: 10, priceMultiplier: 1.6, priceAddition: 25, description: '复杂形状' }
      ],
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true
    });

    processRules.set('edge_banding', {
      processId: 'edge_banding',
      processType: 'edge',
      name: '封边',
      basePrice: 15,
      pricePerUnit: 5,
      unit: 'm',
      complexityRules: [
        { minComplexity: 1, maxComplexity: 10, priceMultiplier: 1.0, priceAddition: 0, description: '标准封边' }
      ],
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true
    });

    processRules.set('drilling', {
      processId: 'drilling',
      processType: 'drilling',
      name: '打孔',
      basePrice: 5,
      pricePerUnit: 2,
      unit: 'hole',
      complexityRules: [
        { minComplexity: 1, maxComplexity: 10, priceMultiplier: 1.0, priceAddition: 0, description: '标准孔位' }
      ],
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true
    });

    laborRules.set('basic', {
      skillLevel: 'basic',
      hourlyRate: 80,
      overtimeRate: 120,
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true
    });

    laborRules.set('intermediate', {
      skillLevel: 'intermediate',
      hourlyRate: 120,
      overtimeRate: 180,
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true
    });

    laborRules.set('advanced', {
      skillLevel: 'advanced',
      hourlyRate: 180,
      overtimeRate: 270,
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true
    });

    laborRules.set('expert', {
      skillLevel: 'expert',
      hourlyRate: 250,
      overtimeRate: 375,
      validFrom: new Date('2024-01-01'),
      validTo: null,
      isActive: true
    });

    return {
      materialRules,
      hardwareRules,
      processRules,
      laborRules,
      effectiveDate: new Date()
    };
  }

  public async calculateQuote(
    context: QuoteCalculationContext
  ): Promise<QuoteCalculationResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    logger.info(`开始计算报价: orderId=${context.orderId}, designId=${context.designId}`);

    const itemResults = await Promise.all(
      context.items.map(item => this.calculateQuoteItem(item, warnings))
    );

    const subtotal = itemResults.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalMaterialCost = itemResults.reduce((sum, item) => sum + item.materialCost, 0);
    const totalLaborCost = itemResults.reduce((sum, item) => sum + item.laborCost, 0);
    const totalHardwareCost = itemResults.reduce((sum, item) => sum + item.hardwareCost, 0);
    const totalProcessCost = itemResults.reduce((sum, item) => sum + item.processCost, 0);

    const discountResults = this.calculateDiscounts(
      context.discounts,
      itemResults,
      subtotal
    );
    const totalDiscountAmount = discountResults.reduce((sum, d) => sum + d.discountAmount, 0);

    const feeResults = this.calculateAdditionalFees(context.additionalFees);
    const totalFees = feeResults.reduce((sum, f) => sum + f.amount, 0);

    const afterDiscount = subtotal - totalDiscountAmount;
    const taxableAmount = afterDiscount + totalFees;
    const taxAmount = this.roundToTwoDecimals(taxableAmount * this.taxRate);
    const finalAmount = this.roundToTwoDecimals(taxableAmount + taxAmount);

    const calculationTimeMs = Date.now() - startTime;

    logger.info(`报价计算完成: orderId=${context.orderId}, finalAmount=${finalAmount}, time=${calculationTimeMs}ms`);

    return {
      orderId: context.orderId,
      designId: context.designId,
      totalAmount: subtotal,
      materialCost: totalMaterialCost,
      laborCost: totalLaborCost,
      hardwareCost: totalHardwareCost,
      processCost: totalProcessCost,
      discountAmount: totalDiscountAmount,
      additionalFees: totalFees,
      taxAmount,
      finalAmount,
      items: itemResults,
      discounts: discountResults,
      fees: feeResults,
      taxDetails: {
        taxRate: this.taxRate,
        taxableAmount,
        taxAmount,
        nonTaxableAmount: 0,
        breakdown: [
          { category: '商品金额', amount: afterDiscount, taxRate: this.taxRate, taxAmount: this.roundToTwoDecimals(afterDiscount * this.taxRate) },
          { category: '附加费用', amount: totalFees, taxRate: this.taxRate, taxAmount: this.roundToTwoDecimals(totalFees * this.taxRate) }
        ]
      },
      calculationMetadata: {
        calculatedAt: new Date(),
        calculatorVersion: CALCULATOR_VERSION,
        priceRulesVersion: PRICE_RULES_VERSION,
        taxRulesVersion: TAX_RULES_VERSION,
        calculationTimeMs,
        warnings
      }
    };
  }

  private async calculateQuoteItem(
    item: QuoteItem,
    warnings: string[]
  ): Promise<QuoteItemResult> {
    const materialBreakdown = this.calculateMaterialCost(item, warnings);
    const hardwareBreakdown = this.calculateHardwareCost(item);
    const processBreakdown = this.calculateProcessCost(item);

    const totalMaterialCost = materialBreakdown.reduce((sum, m) => sum + m.totalPrice, 0);
    const totalHardwareCost = hardwareBreakdown.reduce((sum, h) => sum + h.totalPrice, 0);
    const totalProcessCost = processBreakdown.reduce((sum, p) => sum + p.cost, 0);

    const laborHours = this.estimateLaborHours(item);
    const laborRate = this.getLaborRate(item);
    const totalLaborCost = this.roundToTwoDecimals(laborHours * laborRate);

    const basePrice = totalMaterialCost + totalLaborCost + totalHardwareCost + totalProcessCost;
    const materialMultiplier = this.calculateMaterialMultiplier(item.material);
    const sizeMultiplier = this.calculateSizeMultiplier(item.dimensions);
    const quantityMultiplier = this.calculateQuantityMultiplier(item.quantity);
    const complexityMultiplier = this.calculateComplexityMultiplier(item);

    const unitPrice = this.roundToTwoDecimals(
      basePrice * materialMultiplier * sizeMultiplier * quantityMultiplier * complexityMultiplier
    );
    const totalPrice = this.roundToTwoDecimals(unitPrice * item.quantity);

    return {
      itemId: item.id,
      name: item.name,
      type: item.type,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice,
      materialCost: totalMaterialCost,
      laborCost: totalLaborCost,
      hardwareCost: totalHardwareCost,
      processCost: totalProcessCost,
      discountAmount: 0,
      totalPrice,
      dimensions: item.dimensions,
      materialBreakdown,
      hardwareBreakdown,
      processBreakdown,
      calculationDetails: {
        basePrice,
        materialMultiplier,
        sizeMultiplier,
        quantityMultiplier,
        complexityMultiplier,
        laborHours,
        laborRate,
        formula: `totalPrice = (materialCost + laborCost + hardwareCost + processCost) * materialMultiplier * sizeMultiplier * quantityMultiplier * complexityMultiplier * quantity`
      }
    };
  }

  private calculateMaterialCost(
    item: QuoteItem,
    warnings: string[]
  ): MaterialBreakdown[] {
    const breakdown: MaterialBreakdown[] = [];
    const material = item.material;

    if (!material) {
      warnings.push(`项目 ${item.name} 未指定材料，使用默认价格`);
      return breakdown;
    }

    const priceRule = this.priceRules.materialRules.get(material.id);
    
    if (!priceRule) {
      const defaultPrice = material.unitPrice || 100;
      const area = this.calculateArea(item.dimensions);
      breakdown.push({
        materialId: material.id,
        name: material.name,
        quantity: area,
        unit: 'm2',
        unitPrice: defaultPrice,
        totalPrice: this.roundToTwoDecimals(area * defaultPrice),
        dimensions: item.dimensions,
        priceRules: ['default']
      });
      warnings.push(`材料 ${material.name} (${material.id}) 未找到价格规则，使用默认价格`);
      return breakdown;
    }

    const area = this.calculateArea(item.dimensions);
    const thickness = this.extractThickness(material);
    
    const thicknessRule = this.findMatchingThicknessRule(priceRule.thicknessRules, thickness);
    const sizeRule = this.findMatchingSizeRule(priceRule.sizeRules, item.dimensions);
    const quantityRule = this.findMatchingQuantityRule(priceRule.quantityRules, item.quantity);

    let unitPrice = priceRule.pricePerUnit;
    const priceRules: string[] = [];

    if (thicknessRule) {
      unitPrice = unitPrice * thicknessRule.priceMultiplier + thicknessRule.priceAddition;
      priceRules.push(`thickness:${thicknessRule.minThickness}-${thicknessRule.maxThickness}`);
    }

    if (sizeRule) {
      unitPrice = unitPrice * sizeRule.priceMultiplier + sizeRule.priceAddition;
      priceRules.push(`size:${sizeRule.minWidth}-${sizeRule.maxWidth}`);
    }

    if (quantityRule) {
      unitPrice = unitPrice * quantityRule.priceMultiplier + quantityRule.priceAddition;
      priceRules.push(`quantity:${quantityRule.minQuantity}-${quantityRule.maxQuantity}`);
    }

    breakdown.push({
      materialId: material.id,
      name: material.name,
      quantity: area,
      unit: priceRule.unit,
      unitPrice: this.roundToTwoDecimals(unitPrice),
      totalPrice: this.roundToTwoDecimals(area * unitPrice),
      dimensions: item.dimensions,
      priceRules
    });

    return breakdown;
  }

  private calculateHardwareCost(item: QuoteItem): HardwareBreakdown[] {
    const breakdown: HardwareBreakdown[] = [];

    for (const hardware of item.hardware) {
      const priceRule = this.priceRules.hardwareRules.get(hardware.id);
      
      const unitPrice = priceRule?.unitPrice || hardware.unitPrice || 0;
      const totalPrice = this.roundToTwoDecimals(unitPrice * hardware.quantity);

      breakdown.push({
        hardwareId: hardware.id,
        name: hardware.name,
        type: hardware.type,
        quantity: hardware.quantity,
        unit: priceRule?.unit || 'piece',
        unitPrice: this.roundToTwoDecimals(unitPrice),
        totalPrice,
        supplierId: priceRule?.supplierId || hardware.supplierId || ''
      });
    }

    return breakdown;
  }

  private calculateProcessCost(item: QuoteItem): ProcessBreakdown[] {
    const breakdown: ProcessBreakdown[] = [];

    for (const step of item.processSteps) {
      const priceRule = this.priceRules.processRules.get(step.id);
      
      const complexityLevel = this.estimateComplexityLevel(step);
      const complexityRule = priceRule?.complexityRules.find(
        r => complexityLevel >= r.minComplexity && complexityLevel < r.maxComplexity
      );

      let cost = step.cost;
      if (priceRule) {
        const baseCost = priceRule.basePrice + priceRule.pricePerUnit * 1;
        cost = baseCost * (complexityRule?.priceMultiplier || 1) + (complexityRule?.priceAddition || 0);
      }

      breakdown.push({
        processId: step.id,
        name: step.name,
        description: step.description,
        cost: this.roundToTwoDecimals(cost),
        duration: step.duration,
        unit: step.unit,
        department: step.department,
        complexityLevel
      });
    }

    return breakdown;
  }

  private calculateDiscounts(
    discounts: Discount[],
    items: QuoteItemResult[],
    subtotal: number
  ): DiscountResult[] {
    const results: DiscountResult[] = [];

    for (const discount of discounts) {
      const applicableItems = this.getApplicableItems(discount, items);
      
      if (applicableItems.length === 0) {
        continue;
      }

      const conditions = this.evaluateDiscountConditions(discount, items, subtotal);
      const allConditionsSatisfied = conditions.every(c => c.isSatisfied);

      if (!allConditionsSatisfied) {
        results.push({
          discountId: discount.id,
          type: discount.type,
          amount: discount.amount,
          description: discount.description,
          applicableItems,
          discountAmount: 0,
          conditions
        });
        continue;
      }

      let discountAmount = 0;
      const applicableSubtotal = items
        .filter(i => applicableItems.includes(i.itemId))
        .reduce((sum, i) => sum + i.totalPrice, 0);

      if (discount.type === 'PERCENTAGE') {
        discountAmount = this.roundToTwoDecimals(applicableSubtotal * (discount.amount / 100));
      } else if (discount.type === 'FIXED_AMOUNT') {
        discountAmount = discount.amount;
      } else if (discount.type === 'VOLUME') {
        const totalQuantity = items
          .filter(i => applicableItems.includes(i.itemId))
          .reduce((sum, i) => sum + i.quantity, 0);
        discountAmount = this.roundToTwoDecimals(applicableSubtotal * (discount.amount / 100));
      }

      results.push({
        discountId: discount.id,
        type: discount.type,
        amount: discount.amount,
        description: discount.description,
        applicableItems,
        discountAmount,
        conditions
      });
    }

    return results;
  }

  private calculateAdditionalFees(fees: AdditionalFee[]): AdditionalFeeResult[] {
    return fees.map(fee => ({
      feeId: fee.id,
      type: fee.type,
      name: fee.name,
      amount: fee.amount,
      description: fee.description,
      taxable: fee.taxable,
      taxAmount: fee.taxable ? this.roundToTwoDecimals(fee.amount * this.taxRate) : 0
    }));
  }

  private calculateArea(dimensions: Dimensions): number {
    const widthM = dimensions.width / 1000;
    const heightM = dimensions.height / 1000;
    return this.roundToTwoDecimals(widthM * heightM);
  }

  private extractThickness(material: MaterialInfo): number {
    const match = material.name.match(/(\d+)\s*(mm|cm)/i);
    if (match) {
      const value = parseInt(match[1], 10);
      const unit = match[2].toLowerCase();
      return unit === 'cm' ? value * 10 : value;
    }
    return 18;
  }

  private findMatchingThicknessRule(
    rules: { minThickness: number; maxThickness: number; priceMultiplier: number; priceAddition: number }[],
    thickness: number
  ): typeof rules[0] | null {
    return rules.find(r => thickness >= r.minThickness && thickness < r.maxThickness) || null;
  }

  private findMatchingSizeRule(
    rules: { minWidth: number; maxWidth: number; minHeight: number; maxHeight: number; priceMultiplier: number; priceAddition: number }[],
    dimensions: Dimensions
  ): typeof rules[0] | null {
    return rules.find(r => 
      dimensions.width >= r.minWidth && dimensions.width < r.maxWidth &&
      dimensions.height >= r.minHeight && dimensions.height < r.maxHeight
    ) || null;
  }

  private findMatchingQuantityRule(
    rules: { minQuantity: number; maxQuantity: number; priceMultiplier: number; priceAddition: number }[],
    quantity: number
  ): typeof rules[0] | null {
    return rules.find(r => quantity >= r.minQuantity && quantity < r.maxQuantity) || null;
  }

  private estimateLaborHours(item: QuoteItem): number {
    const baseHours = {
      cabinet: 8,
      wardrobe: 16,
      drawer: 2,
      desk: 6,
      bookshelf: 4,
      bed: 12,
      dining_table: 10,
      default: 8
    };

    const typeHours = baseHours[item.type as keyof typeof baseHours] || baseHours.default;
    const sizeFactor = this.calculateArea(item.dimensions) / 1.5;
    
    return this.roundToTwoDecimals(typeHours * Math.max(1, sizeFactor));
  }

  private getLaborRate(item: QuoteItem): number {
    const skillMap: Record<string, string> = {
      cabinet: 'intermediate',
      wardrobe: 'advanced',
      bed: 'advanced',
      dining_table: 'expert',
      default: 'intermediate'
    };

    const skillLevel = skillMap[item.type] || skillMap.default;
    const laborRule = this.priceRules.laborRules.get(skillLevel);
    
    return laborRule?.hourlyRate || 120;
  }

  private calculateMaterialMultiplier(material: MaterialInfo | null): number {
    if (!material) return 1.0;

    const materialTypeMultipliers: Record<string, number> = {
      particle_board: 1.0,
      mdf: 1.2,
      plywood: 1.3,
      oak_veneer: 1.5,
      walnut_veneer: 1.6,
      solid_wood: 2.0
    };

    return materialTypeMultipliers[material.id] || 
           materialTypeMultipliers[material.type] || 
           1.0;
  }

  private calculateSizeMultiplier(dimensions: Dimensions): number {
    const area = this.calculateArea(dimensions);
    
    if (area < 0.5) return 0.9;
    if (area < 1.5) return 1.0;
    if (area < 3.0) return 1.1;
    if (area < 5.0) return 1.2;
    return 1.3;
  }

  private calculateQuantityMultiplier(quantity: number): number {
    if (quantity < 5) return 1.0;
    if (quantity < 10) return 0.98;
    if (quantity < 20) return 0.95;
    if (quantity < 50) return 0.92;
    return 0.88;
  }

  private calculateComplexityMultiplier(item: QuoteItem): number {
    const baseComplexity = 1.0;
    
    let hardwareComplexity = 1.0;
    if (item.hardware.length > 10) hardwareComplexity = 1.15;
    else if (item.hardware.length > 5) hardwareComplexity = 1.05;

    let processComplexity = 1.0;
    if (item.processSteps.length > 8) processComplexity = 1.2;
    else if (item.processSteps.length > 5) processComplexity = 1.1;

    return baseComplexity * hardwareComplexity * processComplexity;
  }

  private estimateComplexityLevel(step: ProcessStep): number {
    const complexityMap: Record<string, number> = {
      'cutting_cnc': 3,
      'edge_banding': 2,
      'drilling': 2,
      'grooving': 3,
      'veneer_pressing': 4,
      'polishing': 3,
      'painting': 4,
      'assembly': 3
    };

    return complexityMap[step.id] || 2;
  }

  private getApplicableItems(discount: Discount, items: QuoteItemResult[]): string[] {
    if (!discount.applicableTo || discount.applicableTo.length === 0) {
      return items.map(i => i.itemId);
    }

    return items
      .filter(i => discount.applicableTo.includes(i.itemId) || discount.applicableTo.includes(i.type))
      .map(i => i.itemId);
  }

  private evaluateDiscountConditions(
    discount: Discount,
    items: QuoteItemResult[],
    subtotal: number
  ): { field: string; operator: string; value: any; isSatisfied: boolean; actualValue: any }[] {
    const results: { field: string; operator: string; value: any; isSatisfied: boolean; actualValue: any }[] = [];

    for (const condition of discount.conditions) {
      let actualValue: any;
      let isSatisfied = false;

      switch (condition.field) {
        case 'subtotal':
          actualValue = subtotal;
          break;
        case 'totalQuantity':
          actualValue = items.reduce((sum, i) => sum + i.quantity, 0);
          break;
        case 'itemCount':
          actualValue = items.length;
          break;
        default:
          actualValue = null;
      }

      if (actualValue !== null) {
        switch (condition.operator) {
          case '>':
            isSatisfied = actualValue > condition.value;
            break;
          case '>=':
            isSatisfied = actualValue >= condition.value;
            break;
          case '<':
            isSatisfied = actualValue < condition.value;
            break;
          case '<=':
            isSatisfied = actualValue <= condition.value;
            break;
          case '==':
          case '=':
            isSatisfied = actualValue === condition.value;
            break;
          case '!=':
            isSatisfied = actualValue !== condition.value;
            break;
          default:
            isSatisfied = true;
        }
      }

      results.push({
        field: condition.field,
        operator: condition.operator,
        value: condition.value,
        isSatisfied,
        actualValue
      });
    }

    return results;
  }

  private roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
  }

  public validateQuote(
    context: QuoteCalculationContext
  ): QuoteValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const itemValidations: QuoteItemValidation[] = [];

    if (!context.orderId) {
      errors.push('订单ID不能为空');
    }

    if (!context.designId) {
      errors.push('设计方案ID不能为空');
    }

    if (!context.items || context.items.length === 0) {
      errors.push('报价项目不能为空');
    }

    for (const item of context.items) {
      const itemErrors: string[] = [];
      const itemWarnings: string[] = [];

      if (!item.id) {
        itemErrors.push('项目ID不能为空');
      }

      if (!item.name) {
        itemErrors.push('项目名称不能为空');
      }

      if (!item.type) {
        itemErrors.push('项目类型不能为空');
      }

      if (!item.quantity || item.quantity <= 0) {
        itemErrors.push('项目数量必须大于0');
      }

      if (!item.dimensions) {
        itemErrors.push('项目尺寸不能为空');
      } else {
        if (item.dimensions.width <= 0 || item.dimensions.height <= 0 || item.dimensions.depth <= 0) {
          itemErrors.push('项目尺寸必须大于0');
        }
      }

      if (!item.material) {
        itemWarnings.push('项目未指定材料，将使用默认价格');
      }

      itemValidations.push({
        itemId: item.id,
        isValid: itemErrors.length === 0,
        errors: itemErrors,
        warnings: itemWarnings
      });

      errors.push(...itemErrors);
      warnings.push(...itemWarnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      items: itemValidations
    };
  }

  public setTaxRate(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('税率必须在0到1之间');
    }
    this.taxRate = rate;
  }

  public getTaxRate(): number {
    return this.taxRate;
  }

  public setPriceRules(rules: Partial<PriceRuleSet>): void {
    if (rules.materialRules) {
      this.priceRules.materialRules = rules.materialRules;
    }
    if (rules.hardwareRules) {
      this.priceRules.hardwareRules = rules.hardwareRules;
    }
    if (rules.processRules) {
      this.priceRules.processRules = rules.processRules;
    }
    if (rules.laborRules) {
      this.priceRules.laborRules = rules.laborRules;
    }
    this.priceRules.effectiveDate = new Date();
  }

  public getPriceRules(): PriceRuleSet {
    return { ...this.priceRules };
  }
}

export const quoteEngine = new QuoteEngine();

export default QuoteEngine;
