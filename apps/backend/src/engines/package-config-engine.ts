import { query } from '../database';
import { MedicalPackage, PackageItem, NormalRange } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface PackageConfigRules {
  minItems: number;
  maxItems: number;
  allowDuplicateDepartments: boolean;
  requiredDepartments: string[];
  priceMultiplier: {
    basic: number;
    standard: number;
    premium: number;
    custom: number;
  };
}

const defaultRules: PackageConfigRules = {
  minItems: 3,
  maxItems: 50,
  allowDuplicateDepartments: false,
  requiredDepartments: [],
  priceMultiplier: {
    basic: 0.9,
    standard: 0.85,
    premium: 0.8,
    custom: 1.0,
  },
};

interface DepartmentCapacity {
  departmentId: string;
  departmentName: string;
  dailyCapacity: number;
  currentReservations: number;
  availableSlots: number;
}

interface TimeSlot {
  slot: string;
  available: boolean;
  capacity: number;
  booked: number;
}

export class PackageConfigEngine {
  private rules: PackageConfigRules;

  constructor(rules?: Partial<PackageConfigRules>) {
    this.rules = { ...defaultRules, ...rules };
  }

  async createCustomPackage(
    name: string,
    description: string,
    itemIds: string[],
    category: 'basic' | 'standard' | 'premium' | 'custom' = 'custom'
  ): Promise<MedicalPackage> {
    const validation = await this.validatePackageItems(itemIds);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    const items = await this.getPackageItemsByIds(itemIds);
    const totalPrice = this.calculateTotalPrice(items, category);

    const pkg: MedicalPackage = {
      id: uuidv4(),
      name,
      description,
      price: totalPrice,
      originalPrice: items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0),
      category,
      items: items.map(item => ({
        id: item.id,
        name: item.name,
        departmentId: item.departmentId,
        itemType: item.itemType,
        estimatedDuration: item.estimatedDuration,
        normalRange: item.normalRange,
      })),
      isActive: true,
      estimatedDuration: items.reduce((sum, item) => sum + item.estimatedDuration, 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.savePackage(pkg);
    return pkg;
  }

  async validatePackageItems(itemIds: string[]): Promise<{ valid: boolean; error?: string }> {
    if (itemIds.length < this.rules.minItems) {
      return { valid: false, error: `套餐至少需要包含${this.rules.minItems}个项目` };
    }

    if (itemIds.length > this.rules.maxItems) {
      return { valid: false, error: `套餐最多只能包含${this.rules.maxItems}个项目` };
    }

    const items = await this.getPackageItemsByIds(itemIds);
    
    if (!this.rules.allowDuplicateDepartments) {
      const departmentIds = items.map(item => item.departmentId);
      const uniqueDepartments = new Set(departmentIds);
      if (uniqueDepartments.size !== departmentIds.length) {
        return { valid: false, error: '同一科室只能选择一个项目' };
      }
    }

    return { valid: true };
  }

  private async getPackageItemsByIds(itemIds: string[]): Promise<any[]> {
    if (itemIds.length === 0) return [];

    const placeholders = itemIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await query(
      `SELECT pi.*, d.name as department_name,
        CASE 
          WHEN pi.item_type = 'lab' THEN 50
          WHEN pi.item_type = 'imaging' THEN 150
          ELSE 80
        END as estimated_price
       FROM package_items pi
       LEFT JOIN departments d ON pi.department_id = d.id
       WHERE pi.id IN (${placeholders})`,
      itemIds
    );

    return result.rows;
  }

  private calculateTotalPrice(
    items: any[],
    category: 'basic' | 'standard' | 'premium' | 'custom'
  ): number {
    const basePrice = items.reduce((sum, item) => sum + (item.estimated_price || 0), 0);
    const multiplier = this.rules.priceMultiplier[category] || 1.0;
    return Math.round(basePrice * multiplier * 100) / 100;
  }

  private async savePackage(pkg: MedicalPackage): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO medical_packages (
          id, name, description, price, original_price, category, 
          is_active, estimated_duration
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          pkg.id,
          pkg.name,
          pkg.description,
          pkg.price,
          pkg.originalPrice,
          pkg.category,
          pkg.isActive,
          pkg.estimatedDuration,
        ]
      );

      for (let i = 0; i < pkg.items.length; i++) {
        const item = pkg.items[i];
        await client.query(
          `INSERT INTO package_items (
            id, package_id, name, department_id, item_type, 
            estimated_duration, normal_range_min, normal_range_max, 
            normal_range_unit, sort_order
           ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            uuidv4(),
            pkg.id,
            item.name,
            item.departmentId,
            item.itemType,
            item.estimatedDuration,
            item.normalRange?.min,
            item.normalRange?.max,
            item.normalRange?.unit,
            i,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getAvailablePackages(category?: string): Promise<MedicalPackage[]> {
    let queryText = `SELECT * FROM medical_packages WHERE is_active = true`;
    const params: unknown[] = [];

    if (category) {
      queryText += ` AND category = $1`;
      params.push(category);
    }

    queryText += ` ORDER BY category, price`;

    const result = await query(queryText, params);

    const packages: MedicalPackage[] = [];
    for (const row of result.rows) {
      const itemsResult = await query(
        `SELECT * FROM package_items WHERE package_id = $1 ORDER BY sort_order`,
        [row.id]
      );

      packages.push({
        id: row.id,
        name: row.name,
        description: row.description,
        price: parseFloat(row.price),
        originalPrice: parseFloat(row.original_price),
        category: row.category,
        isActive: row.is_active,
        estimatedDuration: row.estimated_duration,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        items: itemsResult.rows.map((itemRow: any) => ({
          id: itemRow.id,
          name: itemRow.name,
          departmentId: itemRow.department_id,
          itemType: itemRow.item_type,
          estimatedDuration: itemRow.estimated_duration,
          normalRange: itemRow.normal_range_min || itemRow.normal_range_max
            ? {
                min: itemRow.normal_range_min ? parseFloat(itemRow.normal_range_min) : undefined,
                max: itemRow.normal_range_max ? parseFloat(itemRow.normal_range_max) : undefined,
                unit: itemRow.normal_range_unit || '',
              }
            : undefined,
        })),
      });
    }

    return packages;
  }

  async getPackageById(packageId: string): Promise<MedicalPackage | null> {
    const result = await query(
      `SELECT * FROM medical_packages WHERE id = $1 AND is_active = true`,
      [packageId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const itemsResult = await query(
      `SELECT * FROM package_items WHERE package_id = $1 ORDER BY sort_order`,
      [packageId]
    );

    return {
      id: row.id,
      name: row.name,
      description: row.description,
      price: parseFloat(row.price),
      originalPrice: parseFloat(row.original_price),
      category: row.category,
      isActive: row.is_active,
      estimatedDuration: row.estimated_duration,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      items: itemsResult.rows.map((itemRow: any) => ({
        id: itemRow.id,
        name: itemRow.name,
        departmentId: itemRow.department_id,
        itemType: itemRow.item_type,
        estimatedDuration: itemRow.estimated_duration,
        normalRange: itemRow.normal_range_min || itemRow.normal_range_max
          ? {
              min: itemRow.normal_range_min ? parseFloat(itemRow.normal_range_min) : undefined,
              max: itemRow.normal_range_max ? parseFloat(itemRow.normal_range_max) : undefined,
              unit: itemRow.normal_range_unit || '',
            }
          : undefined,
      })),
    };
  }

  async checkDepartmentCapacity(
    departmentId: string,
    date: Date
  ): Promise<DepartmentCapacity> {
    const deptResult = await query(
      `SELECT * FROM departments WHERE id = $1`,
      [departmentId]
    );

    if (deptResult.rows.length === 0) {
      throw new Error('科室不存在');
    }

    const department = deptResult.rows[0];

    const reservationResult = await query(
      `SELECT COUNT(*) as count 
       FROM reservations r
       JOIN package_items pi ON r.package_id = pi.package_id
       WHERE pi.department_id = $1 
       AND r.reservation_date = $2
       AND r.status NOT IN ('cancelled')`,
      [departmentId, date]
    );

    const currentReservations = parseInt(reservationResult.rows[0].count, 10);
    const dailyCapacity = department.capacity * 10;

    return {
      departmentId: department.id,
      departmentName: department.name,
      dailyCapacity,
      currentReservations,
      availableSlots: Math.max(0, dailyCapacity - currentReservations),
    };
  }

  async getAvailableTimeSlots(
    date: Date,
    departmentId?: string
  ): Promise<TimeSlot[]> {
    const timeSlots = this.generateTimeSlots();

    for (const slot of timeSlots) {
      let queryText = `
        SELECT COUNT(DISTINCT r.id) as booked
        FROM reservations r
        WHERE r.reservation_date = $1 
        AND r.time_slot = $2
        AND r.status NOT IN ('cancelled')
      `;
      const params: unknown[] = [date, slot.slot];

      if (departmentId) {
        queryText = `
          SELECT COUNT(DISTINCT r.id) as booked
          FROM reservations r
          JOIN package_items pi ON r.package_id = pi.package_id
          WHERE pi.department_id = $1
          AND r.reservation_date = $2 
          AND r.time_slot = $3
          AND r.status NOT IN ('cancelled')
        `;
        params.unshift(departmentId);
      }

      const result = await query(queryText, params);
      slot.booked = parseInt(result.rows[0].booked, 10);
      slot.available = slot.booked < slot.capacity;
    }

    return timeSlots;
  }

  private generateTimeSlots(): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const morningStart = 8;
    const morningEnd = 12;
    const afternoonStart = 13;
    const afternoonEnd = 17;

    for (let hour = morningStart; hour < morningEnd; hour++) {
      slots.push(
        { slot: `${hour}:00`, available: true, capacity: 15, booked: 0 },
        { slot: `${hour}:30`, available: true, capacity: 15, booked: 0 }
      );
    }

    for (let hour = afternoonStart; hour < afternoonEnd; hour++) {
      slots.push(
        { slot: `${hour}:00`, available: true, capacity: 15, booked: 0 },
        { slot: `${hour}:30`, available: true, capacity: 15, booked: 0 }
      );
    }

    return slots;
  }

  async validateReservationAvailability(
    packageId: string,
    date: Date,
    timeSlot: string
  ): Promise<{ available: boolean; conflicts?: string[] }> {
    const pkg = await this.getPackageById(packageId);
    if (!pkg) {
      return { available: false, conflicts: ['套餐不存在'] };
    }

    const conflicts: string[] = [];

    for (const item of pkg.items) {
      const capacity = await this.checkDepartmentCapacity(item.departmentId, date);
      
      if (capacity.availableSlots <= 0) {
        conflicts.push(`${capacity.departmentName}已约满`);
      }

      const timeSlots = await this.getAvailableTimeSlots(date, item.departmentId);
      const selectedSlot = timeSlots.find(s => s.slot === timeSlot);
      
      if (selectedSlot && !selectedSlot.available) {
        conflicts.push(`${capacity.departmentName}${timeSlot}时段已约满`);
      }
    }

    return {
      available: conflicts.length === 0,
      conflicts: conflicts.length > 0 ? conflicts : undefined,
    };
  }
}

import { pool } from '../database';
export const packageConfigEngine = new PackageConfigEngine();
