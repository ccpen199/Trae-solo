import { AppDataSource } from '../data-source.js';
import { Product, ProductStatus, ProductCategory } from '../entities/Product.js';
import { ProductBatch, BatchStatus } from '../entities/ProductBatch.js';
import { Manufacturer } from '../entities/Manufacturer.js';
import { PricePolicy, PricePolicyType, PriceLockDirection } from '../entities/PricePolicy.js';
import { Region } from '../entities/Region.js';
import { PricePolicyStatus } from '../types/common.js';
import { priceControlEngine, PriceValidationResult } from '../engines/price-control.engine.js';
import { In, IsNull, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

export interface CreateProductDto {
  name: string;
  sku: string;
  barcode?: string;
  category: ProductCategory;
  unit: string;
  suggestedUnitPrice: number;
  costPrice?: number;
  description?: string;
  specifications?: string;
  imageUrl?: string;
  images?: string[];
  shelfLifeDays?: number;
  requiresBatchTracking?: boolean;
  manufacturerId: string;
}

export interface CreateBatchDto {
  batchNumber: string;
  totalQuantity: number;
  productionDate?: string;
  expiryDate?: string;
  qualityReportNumber?: string;
  qualityNotes?: string;
  temperatureRequiredMin?: number;
  temperatureRequiredMax?: number;
  productId: string;
}

export interface CreatePricePolicyDto {
  name: string;
  policyType: PricePolicyType;
  floorPrice: number;
  ceilingPrice: number;
  suggestedPrice?: number;
  lockDirection: PriceLockDirection;
  isStrictlyEnforced?: boolean;
  enforcementRules?: string;
  startDate: Date;
  endDate?: Date;
  productId: string;
  regionId?: string;
}

export class ProductService {
  private productRepository = AppDataSource.getRepository(Product);
  private batchRepository = AppDataSource.getRepository(ProductBatch);
  private manufacturerRepository = AppDataSource.getRepository(Manufacturer);
  private pricePolicyRepository = AppDataSource.getRepository(PricePolicy);
  private regionRepository = AppDataSource.getRepository(Region);

  async createProduct(dto: CreateProductDto, creatorId: string): Promise<Product> {
    const manufacturer = await this.manufacturerRepository.findOne({
      where: { id: dto.manufacturerId },
    });

    if (!manufacturer) {
      throw new Error('厂家不存在');
    }

    const existingSku = await this.productRepository.findOne({
      where: { sku: dto.sku },
    });

    if (existingSku) {
      throw new Error(`SKU ${dto.sku} 已存在`);
    }

    const product = this.productRepository.create({
      name: dto.name,
      sku: dto.sku,
      barcode: dto.barcode || null,
      category: dto.category,
      unit: dto.unit,
      suggestedUnitPrice: dto.suggestedUnitPrice,
      costPrice: dto.costPrice || null,
      description: dto.description || null,
      specifications: dto.specifications || null,
      imageUrl: dto.imageUrl || null,
      images: dto.images || null,
      shelfLifeDays: dto.shelfLifeDays || null,
      requiresBatchTracking: dto.requiresBatchTracking ?? true,
      status: ProductStatus.DRAFT,
      manufacturerId: dto.manufacturerId,
      manufacturer,
      createdBy: creatorId,
    });

    return this.productRepository.save(product);
  }

  async updateProduct(
    productId: string,
    updates: Partial<Omit<CreateProductDto, 'manufacturerId' | 'sku'>>,
    updaterId: string
  ): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('产品不存在');
    }

    const allowedFields = [
      'name', 'barcode', 'category', 'unit', 'suggestedUnitPrice',
      'costPrice', 'description', 'specifications', 'imageUrl',
      'images', 'shelfLifeDays', 'requiresBatchTracking'
    ];

    for (const field of allowedFields) {
      if (field in updates) {
        (product as Record<string, unknown>)[field] = (updates as Record<string, unknown>)[field];
      }
    }

    product.updatedBy = updaterId;

    return this.productRepository.save(product);
  }

  async submitProductForReview(productId: string, submitterId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('产品不存在');
    }

    if (product.status !== ProductStatus.DRAFT) {
      throw new Error('只能提交草稿状态的产品');
    }

    product.status = ProductStatus.PENDING_REVIEW;
    product.updatedBy = submitterId;

    return this.productRepository.save(product);
  }

  async approveProduct(productId: string, approverId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('产品不存在');
    }

    if (product.status !== ProductStatus.PENDING_REVIEW) {
      throw new Error('只能审批待审核状态的产品');
    }

    product.status = ProductStatus.ACTIVE;
    product.updatedBy = approverId;

    return this.productRepository.save(product);
  }

  async createBatch(dto: CreateBatchDto, creatorId: string): Promise<ProductBatch> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new Error('产品不存在');
    }

    const existingBatch = await this.batchRepository.findOne({
      where: { productId: dto.productId, batchNumber: dto.batchNumber },
    });

    if (existingBatch) {
      throw new Error(`批次号 ${dto.batchNumber} 已存在`);
    }

    const batch = this.batchRepository.create({
      batchNumber: dto.batchNumber,
      totalQuantity: dto.totalQuantity,
      availableQuantity: dto.totalQuantity,
      productionDate: dto.productionDate || null,
      expiryDate: dto.expiryDate || null,
      qualityReportNumber: dto.qualityReportNumber || null,
      qualityNotes: dto.qualityNotes || null,
      temperatureRequiredMin: dto.temperatureRequiredMin || null,
      temperatureRequiredMax: dto.temperatureRequiredMax || null,
      status: BatchStatus.PRODUCING,
      productId: dto.productId,
      product,
      createdBy: creatorId,
    });

    return this.batchRepository.save(batch);
  }

  async completeQualityCheck(
    batchId: string,
    passed: boolean,
    reportNumber?: string,
    notes?: string,
    checkerId?: string
  ): Promise<ProductBatch> {
    const batch = await this.batchRepository.findOne({
      where: { id: batchId },
    });

    if (!batch) {
      throw new Error('批次不存在');
    }

    if (batch.status !== BatchStatus.QUALITY_CHECKING && batch.status !== BatchStatus.PRODUCING) {
      throw new Error('当前批次状态不允许质检');
    }

    if (passed) {
      batch.status = BatchStatus.QUALITY_PASSED;
    } else {
      batch.status = BatchStatus.QUALITY_FAILED;
    }

    if (reportNumber) {
      batch.qualityReportNumber = reportNumber;
    }
    if (notes) {
      batch.qualityNotes = notes;
    }
    if (checkerId) {
      batch.updatedBy = checkerId;
    }

    return this.batchRepository.save(batch);
  }

  async createPricePolicy(dto: CreatePricePolicyDto, creatorId: string): Promise<PricePolicy> {
    const product = await this.productRepository.findOne({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new Error('产品不存在');
    }

    if (dto.regionId) {
      const region = await this.regionRepository.findOne({
        where: { id: dto.regionId },
      });
      if (!region) {
        throw new Error('区域不存在');
      }
    }

    if (dto.floorPrice > dto.ceilingPrice) {
      throw new Error('底价不能高于限价');
    }

    const now = new Date();
    const overlappingPolicy = await this.pricePolicyRepository.findOne({
      where: {
        productId: dto.productId,
        regionId: dto.regionId || IsNull(),
        policyType: dto.policyType,
        status: In([PricePolicyStatus.ACTIVE, PricePolicyStatus.DRAFT]),
      },
    });

    if (overlappingPolicy) {
      throw new Error(`该产品在该区域已有${overlappingPolicy.status === PricePolicyStatus.ACTIVE ? '生效的' : '草稿'}价格政策`);
    }

    const policy = this.pricePolicyRepository.create({
      policyNumber: priceControlEngine.generatePolicyNumber(),
      name: dto.name,
      policyType: dto.policyType,
      floorPrice: dto.floorPrice,
      ceilingPrice: dto.ceilingPrice,
      suggestedPrice: dto.suggestedPrice || null,
      lockDirection: dto.lockDirection,
      isStrictlyEnforced: dto.isStrictlyEnforced ?? true,
      enforcementRules: dto.enforcementRules || null,
      startDate: dto.startDate,
      endDate: dto.endDate || null,
      status: PricePolicyStatus.DRAFT,
      productId: dto.productId,
      regionId: dto.regionId || null,
      createdBy: creatorId,
    });

    return this.pricePolicyRepository.save(policy);
  }

  async activatePricePolicy(policyId: string, activatorId: string): Promise<PricePolicy> {
    const policy = await this.pricePolicyRepository.findOne({
      where: { id: policyId },
    });

    if (!policy) {
      throw new Error('价格政策不存在');
    }

    if (policy.status !== PricePolicyStatus.DRAFT && policy.status !== PricePolicyStatus.SUSPENDED) {
      throw new Error('只能激活草稿或暂停状态的价格政策');
    }

    const now = new Date();
    if (policy.endDate && policy.endDate < now) {
      policy.status = PricePolicyStatus.EXPIRED;
      throw new Error('价格政策已过期');
    }

    policy.status = PricePolicyStatus.ACTIVE;
    policy.updatedBy = activatorId;

    return this.pricePolicyRepository.save(policy);
  }

  async syncPricePolicyToDistributionNodes(
    policyId: string,
    syncId: string
  ): Promise<{ success: boolean; totalSynced: number; errors: string[] }> {
    const policy = await this.pricePolicyRepository.findOne({
      where: { id: policyId },
    });

    if (!policy) {
      throw new Error('价格政策不存在');
    }

    if (policy.status !== PricePolicyStatus.ACTIVE) {
      throw new Error('只能同步已激活的价格政策');
    }

    const result = await priceControlEngine.syncPricePolicyToDistributionNodes(
      policy.productId,
      policyId
    );

    return {
      success: result.success,
      totalSynced: result.totalSynced,
      errors: result.errors,
    };
  }

  async validatePrice(
    productId: string,
    regionId: string | null,
    price: number,
    policyType: PricePolicyType = PricePolicyType.RETAIL
  ): Promise<PriceValidationResult> {
    return priceControlEngine.validatePrice(productId, regionId, price, policyType);
  }

  async getProductWithPolicies(productId: string): Promise<Product & { pricePolicies: PricePolicy[] }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['pricePolicies', 'pricePolicies.region'],
    });

    if (!product) {
      throw new Error('产品不存在');
    }

    return product as Product & { pricePolicies: PricePolicy[] };
  }

  async getBatchWithTraceability(batchId: string): Promise<ProductBatch> {
    const batch = await this.batchRepository.findOne({
      where: { id: batchId },
      relations: ['product', 'product.manufacturer', 'traceabilityRecords'],
    });

    if (!batch) {
      throw new Error('批次不存在');
    }

    return batch;
  }
}

export const productService = new ProductService();
