import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from './config/env.js';

import { User } from './entities/User.js';
import { Role } from './entities/Role.js';
import { Permission } from './entities/Permission.js';
import { Manufacturer } from './entities/Manufacturer.js';
import { Product } from './entities/Product.js';
import { ProductBatch } from './entities/ProductBatch.js';
import { Region } from './entities/Region.js';
import { PricePolicy } from './entities/PricePolicy.js';
import { Warehouse } from './entities/Warehouse.js';
import { Inventory } from './entities/Inventory.js';
import { RetailStore } from './entities/RetailStore.js';
import { CreditAccount } from './entities/CreditAccount.js';
import { Farmer } from './entities/Farmer.js';
import { CreditRecord } from './entities/CreditRecord.js';
import { PickupRequest } from './entities/PickupRequest.js';
import { LogisticsOrder } from './entities/LogisticsOrder.js';
import { LogisticsTemperature } from './entities/LogisticsTemperature.js';
import { Order } from './entities/Order.js';
import { OrderItem } from './entities/OrderItem.js';
import { CreditApplication } from './entities/CreditApplication.js';
import { Dispute } from './entities/Dispute.js';
import { TraceabilityRecord } from './entities/TraceabilityRecord.js';
import { Expert } from './entities/Expert.js';
import { ExpertAssignment } from './entities/ExpertAssignment.js';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.DB_HOST,
  port: env.DB_PORT,
  username: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
  synchronize: env.NODE_ENV === 'development',
  logging: env.NODE_ENV === 'development',
  entities: [
    User,
    Role,
    Permission,
    Manufacturer,
    Product,
    ProductBatch,
    Region,
    PricePolicy,
    Warehouse,
    Inventory,
    RetailStore,
    CreditAccount,
    Farmer,
    CreditRecord,
    PickupRequest,
    LogisticsOrder,
    LogisticsTemperature,
    Order,
    OrderItem,
    CreditApplication,
    Dispute,
    TraceabilityRecord,
    Expert,
    ExpertAssignment,
  ],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: [],
});
