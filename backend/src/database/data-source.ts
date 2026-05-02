import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { User } from '../entities/User';
import { TicketType } from '../entities/TicketType';
import { TimeSlot } from '../entities/TimeSlot';
import { Inventory } from '../entities/Inventory';
import { Order } from '../entities/Order';
import { TicketCode } from '../entities/TicketCode';
import { VerificationRecord } from '../entities/VerificationRecord';
import { PassengerFlowLog } from '../entities/PassengerFlowLog';
import { ChannelSettlement } from '../entities/ChannelSettlement';

export const AppDataSource = new DataSource({
  type: config.database.type,
  database: config.database.database,
  entities: [
    User,
    TicketType,
    TimeSlot,
    Inventory,
    Order,
    TicketCode,
    VerificationRecord,
    PassengerFlowLog,
    ChannelSettlement,
  ],
  synchronize: config.database.synchronize,
  logging: config.database.logging,
});

export const initializeDatabase = async (): Promise<DataSource> => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('✅ Database connection established');
  }
  return AppDataSource;
};