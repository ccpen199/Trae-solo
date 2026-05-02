const bcrypt = require('bcryptjs');
const dayjs = require('dayjs');

exports.seed = async function(knex) {
  await knex('users').del();
  
  const hashedPassword = await bcrypt.hash('123456', 10);
  
  await knex('users').insert([
    {
      id: '10000000-0000-0000-0000-000000000001',
      username: 'admin',
      password: hashedPassword,
      nickname: '系统管理员',
      email: 'admin@game.com',
      phone: '13800000001',
      avatar: '',
      role: 'ADMIN',
      vip_level: 0,
      balance: 0,
      total_paid: 0,
      points: 0,
      metadata: '{}',
      is_active: true,
      version: 1
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      username: 'planner01',
      password: hashedPassword,
      nickname: '策划师小王',
      email: 'planner01@game.com',
      phone: '13800000002',
      avatar: '',
      role: 'PLANNER',
      vip_level: 0,
      balance: 0,
      total_paid: 0,
      points: 0,
      metadata: '{}',
      is_active: true,
      version: 1
    },
    {
      id: '10000000-0000-0000-0000-000000000003',
      username: 'operator01',
      password: hashedPassword,
      nickname: '运营小李',
      email: 'operator01@game.com',
      phone: '13800000003',
      avatar: '',
      role: 'OPERATOR',
      vip_level: 0,
      balance: 0,
      total_paid: 0,
      points: 0,
      metadata: '{}',
      is_active: true,
      version: 1
    },
    {
      id: '10000000-0000-0000-0000-000000000004',
      username: 'cs01',
      password: hashedPassword,
      nickname: '客服小张',
      email: 'cs01@game.com',
      phone: '13800000004',
      avatar: '',
      role: 'CUSTOMER_SERVICE',
      vip_level: 0,
      balance: 0,
      total_paid: 0,
      points: 0,
      metadata: '{}',
      is_active: true,
      version: 1
    },
    {
      id: '10000000-0000-0000-0000-000000000010',
      username: 'player01',
      password: hashedPassword,
      nickname: '勇敢的战士',
      email: 'player01@game.com',
      phone: '13900000010',
      avatar: '',
      role: 'PLAYER',
      vip_level: 2,
      balance: 1000.00,
      total_paid: 5000,
      points: 12500,
      metadata: '{"server_id":1,"character_id":"CHAR_001"}',
      is_active: true,
      version: 1
    },
    {
      id: '10000000-0000-0000-0000-000000000011',
      username: 'player02',
      password: hashedPassword,
      nickname: '神秘法师',
      email: 'player02@game.com',
      phone: '13900000011',
      avatar: '',
      role: 'PLAYER',
      vip_level: 0,
      balance: 100.00,
      total_paid: 0,
      points: 0,
      metadata: '{"server_id":1,"character_id":"CHAR_002"}',
      is_active: true,
      version: 1
    }
  ]);
};
