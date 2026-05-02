import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Table } from '../entities/table.entity';
import { TableStatus, TableZone } from '../../common/types';
import { TableStatusEngine } from '../engines/table-status.engine';

@Injectable()
export class TablesService {
  private readonly logger = new Logger(TablesService.name);

  constructor(
    @InjectRepository(Table)
    private tableRepository: Repository<Table>,
    private readonly tableStatusEngine: TableStatusEngine,
  ) {}

  async createTable(
    tableData: {
      tableNumber: string;
      capacity?: number;
      zone?: TableZone;
      position?: { x: number; y: number; floor: number };
      sortOrder?: number;
    },
  ): Promise<Table> {
    const existing = await this.tableRepository.findOne({
      where: { tableNumber: tableData.tableNumber },
    });

    if (existing) {
      throw new Error(`桌台编号已存在: ${tableData.tableNumber}`);
    }

    const table = this.tableRepository.create({
      ...tableData,
      status: TableStatus.VACANT,
      isActive: true,
    });

    return this.tableRepository.save(table);
  }

  async getTableById(id: string): Promise<Table> {
    return this.tableRepository.findOne({
      where: { id },
      relations: ['orders'],
    });
  }

  async getTableByNumber(tableNumber: string): Promise<Table> {
    return this.tableRepository.findOne({
      where: { tableNumber },
    });
  }

  async getAllTables(): Promise<Table[]> {
    return this.tableRepository.find({
      where: { isActive: true },
      order: {
        zone: 'ASC',
        sortOrder: 'ASC',
        tableNumber: 'ASC',
      },
    });
  }

  async getTablesByZone(zone: TableZone): Promise<Table[]> {
    return this.tableRepository.find({
      where: { zone, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async getTablesByStatus(status: TableStatus): Promise<Table[]> {
    return this.tableRepository.find({
      where: { status, isActive: true },
    });
  }

  async getTableStatusSummary(): Promise<{
    total: number;
    vacant: number;
    occupied: number;
    cleaning: number;
    reserved: number;
  }> {
    return this.tableStatusEngine.getTableStatusSummary();
  }

  async occupyTable(
    tableId: string,
    operatorId: string,
    guestCount?: number,
  ): Promise<Table> {
    return this.tableStatusEngine.occupyTable(
      tableId,
      operatorId,
      guestCount,
    );
  }

  async markTableCleaning(tableId: string): Promise<Table> {
    return this.tableStatusEngine.markTableCleaning(tableId);
  }

  async markTableVacant(tableId: string): Promise<Table> {
    return this.tableStatusEngine.markTableVacant(tableId);
  }

  async reserveTable(tableId: string): Promise<Table> {
    return this.tableStatusEngine.reserveTable(tableId);
  }

  async cancelReservation(tableId: string): Promise<Table> {
    return this.tableStatusEngine.cancelReservation(tableId);
  }

  async updateTable(
    id: string,
    updates: Partial<Table>,
  ): Promise<Table> {
    const table = await this.tableRepository.findOne({ where: { id } });

    if (!table) {
      throw new Error(`桌台不存在: ${id}`);
    }

    Object.assign(table, updates);

    return this.tableRepository.save(table);
  }

  async deleteTable(id: string): Promise<void> {
    const table = await this.tableRepository.findOne({ where: { id } });

    if (!table) {
      throw new Error(`桌台不存在: ${id}`);
    }

    table.isActive = false;

    await this.tableRepository.save(table);
  }

  async checkTableAvailability(tableId: string): Promise<{
    available: boolean;
    status: TableStatus;
  }> {
    const result = await this.tableStatusEngine.checkTableAvailability(tableId);
    return {
      available: result.available,
      status: result.status,
    };
  }

  async bulkCreateTables(
    tables: Array<{
      tableNumber: string;
      capacity?: number;
      zone?: TableZone;
      sortOrder?: number;
    }>,
  ): Promise<Table[]> {
    const results: Table[] = [];

    for (const tableData of tables) {
      try {
        const table = await this.createTable(tableData);
        results.push(table);
      } catch (error) {
        this.logger.warn(`创建桌台失败: ${tableData.tableNumber} - ${error.message}`);
      }
    }

    return results;
  }
}
