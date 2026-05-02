const dayjs = require('dayjs');

exports.seed = async function(knex) {
  await knex('vip_benefits').del();
  
  await knex('vip_benefits').insert([
    {
      id: '00000000-0000-0000-0000-000000000000',
      vip_level: 0,
      name: '普通玩家',
      description: '基础会员等级',
      discount_percent: 0,
      extra_points_rate: 1.0,
      daily_gift_quantity: 0,
      daily_gift_items: '[]',
      priority_access_days: 0,
      exclusive_product_ids: '[]',
      can_use_coupon: true,
      can_stack_discounts: false,
      max_simultaneous_orders: 3,
      refund_grace_hours: 24,
      is_enabled: true,
      metadata: '{}',
      version: 1
    },
    {
      id: '00000000-0000-0000-0000-000000000001',
      vip_level: 1,
      name: 'VIP1',
      description: 'VIP1会员',
      discount_percent: 5,
      extra_points_rate: 1.2,
      daily_gift_quantity: 1,
      daily_gift_items: '[{"code":"GOLD_COIN","quantity":100}]',
      priority_access_days: 0,
      exclusive_product_ids: '[]',
      can_use_coupon: true,
      can_stack_discounts: false,
      max_simultaneous_orders: 5,
      refund_grace_hours: 48,
      is_enabled: true,
      metadata: '{}',
      version: 1
    },
    {
      id: '00000000-0000-0000-0000-000000000002',
      vip_level: 2,
      name: 'VIP2',
      description: 'VIP2会员',
      discount_percent: 10,
      extra_points_rate: 1.5,
      daily_gift_quantity: 2,
      daily_gift_items: '[{"code":"GOLD_COIN","quantity":200},{"code":"EXP_BOOST","quantity":1}]',
      priority_access_days: 1,
      exclusive_product_ids: '[]',
      can_use_coupon: true,
      can_stack_discounts: false,
      max_simultaneous_orders: 8,
      refund_grace_hours: 72,
      is_enabled: true,
      metadata: '{}',
      version: 1
    },
    {
      id: '00000000-0000-0000-0000-000000000003',
      vip_level: 3,
      name: 'VIP3',
      description: 'VIP3会员',
      discount_percent: 15,
      extra_points_rate: 2.0,
      daily_gift_quantity: 3,
      daily_gift_items: '[{"code":"GOLD_COIN","quantity":500},{"code":"EXP_BOOST","quantity":2},{"code":"GEM","quantity":10}]',
      priority_access_days: 3,
      exclusive_product_ids: '[]',
      can_use_coupon: true,
      can_stack_discounts: true,
      max_simultaneous_orders: 10,
      refund_grace_hours: 168,
      is_enabled: true,
      metadata: '{}',
      version: 1
    }
  ]);
};
