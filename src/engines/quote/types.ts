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

export interface MaterialPriceRule {
  materialId: string;
  materialType: string;
  basePrice: number;
  pricePerUnit: number;
  unit: 'mm' | 'cm' | 'm' | 'piece' | 'kg';
  thicknessRules: ThicknessRule[];
  sizeRules: SizeRule[];
  quantityRules: QuantityRule[];
  supplierId: string;
  validFrom: Date;
  validTo: Date | null;
  isActive: boolean;
}

export interface ThicknessRule {
  minThickness: number;
  maxThickness: number;
  priceMultiplier: number;
  priceAddition: number;
}

export interface SizeRule {
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  priceMultiplier: number;
  priceAddition: number;
}

export interface QuantityRule {
  minQuantity: number;
  maxQuantity: number;
  priceMultiplier: number;
  priceAddition: number;
}

export interface HardwarePriceRule {
  hardwareId: string;
  hardwareType: string;
  name: string;
  unitPrice: number;
  unit: 'piece' | 'set' | 'kg';
  supplierId: string;
  validFrom: Date;
  validTo: Date | null;
  isActive: boolean;
  compatibility: string[];
}

export interface ProcessPriceRule {
  processId: string;
  processType: string;
  name: string;
  basePrice: number;
  pricePerUnit: number;
  unit: 'hour' | 'piece' | 'm2' | 'm';
  complexityRules: ComplexityRule[];
  validFrom: Date;
  validTo: Date | null;
  isActive: boolean;
}

export interface ComplexityRule {
  minComplexity: number;
  maxComplexity: number;
  priceMultiplier: number;
  priceAddition: number;
  description: string;
}

export interface LaborPriceRule {
  skillLevel: 'basic' | 'intermediate' | 'advanced' | 'expert';
  hourlyRate: number;
  overtimeRate: number;
  validFrom: Date;
  validTo: Date | null;
  isActive: boolean;
}

export interface QuoteCalculationResult {
  orderId: string;
  designId: string;
  totalAmount: number;
  materialCost: number;
  laborCost: number;
  hardwareCost: number;
  processCost: number;
  discountAmount: number;
  additionalFees: number;
  taxAmount: number;
  finalAmount: number;
  items: QuoteItemResult[];
  discounts: DiscountResult[];
  fees: AdditionalFeeResult[];
  taxDetails: TaxDetails;
  calculationMetadata: CalculationMetadata;
}

export interface QuoteItemResult {
  itemId: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  materialCost: number;
  laborCost: number;
  hardwareCost: number;
  processCost: number;
  discountAmount: number;
  totalPrice: number;
  dimensions: Dimensions;
  materialBreakdown: MaterialBreakdown[];
  hardwareBreakdown: HardwareBreakdown[];
  processBreakdown: ProcessBreakdown[];
  calculationDetails: ItemCalculationDetails;
}

export interface MaterialBreakdown {
  materialId: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  dimensions: Dimensions;
  priceRules: string[];
}

export interface HardwareBreakdown {
  hardwareId: string;
  name: string;
  type: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  supplierId: string;
}

export interface ProcessBreakdown {
  processId: string;
  name: string;
  description: string;
  cost: number;
  duration: number;
  unit: 'hour' | 'day';
  department: string;
  complexityLevel: number;
}

export interface ItemCalculationDetails {
  basePrice: number;
  materialMultiplier: number;
  sizeMultiplier: number;
  quantityMultiplier: number;
  complexityMultiplier: number;
  laborHours: number;
  laborRate: number;
  formula: string;
}

export interface DiscountResult {
  discountId: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'VOLUME';
  amount: number;
  description: string;
  applicableItems: string[];
  discountAmount: number;
  conditions: DiscountConditionResult[];
}

export interface DiscountConditionResult {
  field: string;
  operator: string;
  value: any;
  isSatisfied: boolean;
  actualValue: any;
}

export interface AdditionalFeeResult {
  feeId: string;
  type: 'DELIVERY' | 'INSTALLATION' | 'DESIGN' | 'OTHER';
  name: string;
  amount: number;
  description: string;
  taxable: boolean;
  taxAmount: number;
}

export interface TaxDetails {
  taxRate: number;
  taxableAmount: number;
  taxAmount: number;
  nonTaxableAmount: number;
  breakdown: TaxBreakdownItem[];
}

export interface TaxBreakdownItem {
  category: string;
  amount: number;
  taxRate: number;
  taxAmount: number;
}

export interface CalculationMetadata {
  calculatedAt: Date;
  calculatorVersion: string;
  priceRulesVersion: string;
  taxRulesVersion: string;
  calculationTimeMs: number;
  warnings: string[];
}

export interface QuoteValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  items: QuoteItemValidation[];
}

export interface QuoteItemValidation {
  itemId: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface PriceRuleSet {
  materialRules: Map<string, MaterialPriceRule>;
  hardwareRules: Map<string, HardwarePriceRule>;
  processRules: Map<string, ProcessPriceRule>;
  laborRules: Map<string, LaborPriceRule>;
  effectiveDate: Date;
}
