import { v4 as uuidv4 } from 'uuid';
import { DataSource } from 'typeorm';
import config from '../config';
import {
  UserEntity,
  BudgetEntity,
  CouponTemplateEntity,
  CouponInstanceEntity,
  OrderEntity,
  AuditLogEntity,
  DistributionJobEntity,
  StateTransitionEntity,
  StackingRuleEntity,
  FraudCheckEntity
} from '../entities';
import path from 'path';
import fs from 'fs';

const databasePath = path.join(__dirname, '../../data/coupon-marketing.sqlite');

export const AppDataSource = new DataSource({
  type: 'sqljs',
  location: databasePath,
  autoSave: true,
  synchronize: config.database.synchronize,
  logging: config.database.logging,
  entities: [
    UserEntity,
    BudgetEntity,
    CouponTemplateEntity,
    CouponInstanceEntity,
    OrderEntity,
    AuditLogEntity,
    DistributionJobEntity,
    StateTransitionEntity,
    StackingRuleEntity,
    FraudCheckEntity
  ],
  migrations: [],
  subscribers: []
});

export async function initializeDatabase(): Promise<DataSource> {
  const dataDir = path.join(__dirname, '../../data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log('Database connection established successfully (SQLite/sql.js)');
    console.log('Database path:', databasePath);
    await seedInitialData();
  }
  return AppDataSource;
}

async function seedInitialData(): Promise<void> {
  const userRepository = AppDataSource.getRepository(UserEntity);
  const budgetRepository = AppDataSource.getRepository(BudgetEntity);
  const stateTransitionRepository = AppDataSource.getRepository(StateTransitionEntity);
  const stackingRuleRepository = AppDataSource.getRepository(StackingRuleEntity);
  
  const existingUsers = await userRepository.count();
  if (existingUsers === 0) {
    const bcrypt = require('bcryptjs');
    const saltRounds = 10;
    
    const adminPassword = await bcrypt.hash('Admin@123', saltRounds);
    const operatorPassword = await bcrypt.hash('Operator@123', saltRounds);
    const merchantPassword = await bcrypt.hash('Merchant@123', saltRounds);
    const financePassword = await bcrypt.hash('Finance@123', saltRounds);
    
    const users = [
      userRepository.create({
        id: 'user_admin_001',
        username: 'admin',
        email: 'admin@coupon-system.com',
        passwordHash: adminPassword,
        role: 'admin' as any,
        isActive: true
      }),
      userRepository.create({
        id: 'user_operator_001',
        username: 'operator',
        email: 'operator@coupon-system.com',
        passwordHash: operatorPassword,
        role: 'operator' as any,
        isActive: true
      }),
      userRepository.create({
        id: 'user_merchant_001',
        username: 'merchant',
        email: 'merchant@coupon-system.com',
        passwordHash: merchantPassword,
        role: 'merchant' as any,
        storeId: 'store_001',
        isActive: true
      }),
      userRepository.create({
        id: 'user_finance_001',
        username: 'finance',
        email: 'finance@coupon-system.com',
        passwordHash: financePassword,
        role: 'finance' as any,
        isActive: true
      })
    ];
    
    await userRepository.save(users);
    console.log('Initial users created');
  }
  
  const existingBudgets = await budgetRepository.count();
  if (existingBudgets === 0) {
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    
    const defaultBudget = budgetRepository.create({
      id: 'budget_main_001',
      name: '年度营销预算',
      description: '2024年度优惠券营销总预算',
      periodType: 'yearly',
      startDate: now,
      endDate: nextYear,
      totalBudget: 1000000.00,
      allocatedBudget: 0,
      usedBudget: 0,
      remainingBudget: 1000000.00,
      ownerId: 'user_admin_001',
      status: 'active'
    });
    
    await budgetRepository.save(defaultBudget);
    console.log('Default budget created');
  }
  
  const existingTransitions = await stateTransitionRepository.count();
  if (existingTransitions === 0) {
    const transitions = [
      { id: uuidv4(), from: 'created' as any, to: 'pending_distribution' as any, action: 'approve_distribution', allowedRoles: ['admin', 'operator'], isActive: true },
      { id: uuidv4(), from: 'pending_distribution' as any, to: 'distributing' as any, action: 'start_distribution', allowedRoles: ['admin', 'operator', 'system'], isActive: true },
      { id: uuidv4(), from: 'distributing' as any, to: 'pending_use' as any, action: 'complete_distribution', allowedRoles: ['system'], isActive: true },
      { id: uuidv4(), from: 'pending_use' as any, to: 'used' as any, action: 'use_coupon', allowedRoles: ['customer', 'system'], isActive: true },
      { id: uuidv4(), from: 'used' as any, to: 'refunded' as any, action: 'refund_coupon', allowedRoles: ['customer', 'merchant', 'system'], isActive: true },
      { id: uuidv4(), from: 'pending_use' as any, to: 'cancelled' as any, action: 'cancel_coupon', allowedRoles: ['admin', 'operator'], isActive: true },
      { id: uuidv4(), from: 'pending_use' as any, to: 'frozen' as any, action: 'freeze_coupon', allowedRoles: ['admin', 'operator', 'system'], isActive: true },
      { id: uuidv4(), from: 'frozen' as any, to: 'pending_use' as any, action: 'unfreeze_coupon', allowedRoles: ['admin', 'operator'], isActive: true },
      { id: uuidv4(), from: 'pending_use' as any, to: 'expired' as any, action: 'expire_coupon', allowedRoles: ['system'], isActive: true },
      { id: uuidv4(), from: 'created' as any, to: 'invalid' as any, action: 'invalidate_coupon', allowedRoles: ['admin'], isActive: true }
    ].map(t => stateTransitionRepository.create(t));
    
    await stateTransitionRepository.save(transitions);
    console.log('Default state transitions created');
  }
  
  const existingRules = await stackingRuleRepository.count();
  if (existingRules === 0) {
    const rules = [
      {
        id: uuidv4(),
        name: '满减券叠加规则',
        priority: 1,
        allowedTypes: ['fixed_discount', 'percentage_discount'],
        maxStackCount: 2,
        conditions: { minOrderAmount: 100, sameStore: true },
        isActive: true
      },
      {
        id: uuidv4(),
        name: '免邮券叠加规则',
        priority: 2,
        allowedTypes: ['free_shipping'],
        maxStackCount: 1,
        conditions: {},
        isActive: true
      }
    ].map(r => stackingRuleRepository.create(r));
    
    await stackingRuleRepository.save(rules);
    console.log('Default stacking rules created');
  }
}

export default AppDataSource;
