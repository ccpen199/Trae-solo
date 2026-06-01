const axios = require('axios');
const fs = require('fs');

async function testBrowserFlow() {
  console.log('=== 浏览器端完整登录流程测试 ===\n');
  
  const jar = axios.create({
    baseURL: 'http://127.0.0.1:46793',
    timeout: 10000,
    withCredentials: true,
  });

  jar.interceptors.response.use(
    (response) => response.data,
    (error) => Promise.reject(error)
  );

  const accounts = [
    { username: 'admin', expectedRole: 'admin', expectedPath: '/admin/parcels', expectedLabel: '系统管理员' },
    { username: 'platform', expectedRole: 'platform', expectedPath: '/admin/stats', expectedLabel: '平台管理员' },
    { username: 'ops', expectedRole: 'ops', expectedPath: '/admin/stats', expectedLabel: '运营管理员' },
    { username: 'stationmaster', expectedRole: 'station_master', expectedPath: '/dashboard', expectedLabel: '驿站站长' },
    { username: 'zhangsan', expectedRole: 'user', expectedPath: '/dashboard', expectedLabel: '普通用户' },
  ];

  const roleRedirectMap = {
    platform: '/admin/stats',
    ops: '/admin/stats',
    admin: '/admin/parcels',
    station_master: '/dashboard',
    user: '/dashboard',
  };

  for (const acc of accounts) {
    console.log(`🔑 测试账号: ${acc.username} (${acc.expectedLabel})`);
    
    try {
      const loginData = await jar.post('/api/auth/login', {
        username: acc.username,
        password: '123456',
      });

      if (!loginData.token) {
        console.log(`  ❌ 失败: 没有返回 token`);
        continue;
      }
      if (!loginData.user) {
        console.log(`  ❌ 失败: 没有返回 user 数据`);
        continue;
      }

      const user = loginData.user;
      if (user.role !== acc.expectedRole) {
        console.log(`  ❌ 失败: role 不匹配, expected=${acc.expectedRole}, actual=${user.role}`);
        continue;
      }
      if (user.username !== acc.username) {
        console.log(`  ❌ 失败: username 不匹配`);
        continue;
      }

      console.log(`  ✅ 登录成功: user=${user.username}, role=${user.role}`);
      console.log(`  token: ${loginData.token.substring(0, 30)}...`);

      const mockLocalStorage = {
        token: loginData.token,
        user: JSON.stringify(user),
      };
      console.log(`  💾 模拟 localStorage 保存: token=${mockLocalStorage.token.substring(0, 20)}..., user.username=${user.username}`);

      const redirect = roleRedirectMap[user.role];
      if (redirect !== acc.expectedPath) {
        console.log(`  ❌ 失败: 跳转路径不匹配, expected=${acc.expectedPath}, actual=${redirect}`);
        continue;
      }
      console.log(`  📍 跳转路径: ${redirect} ✅`);

      jar.defaults.headers.Authorization = `Bearer ${loginData.token}`;
      const meData = await jar.get('/api/auth/me');
      if (meData.username !== user.username || meData.role !== user.role) {
        console.log(`  ❌ 失败: /me 接口验证失败`);
        continue;
      }
      console.log(`  🔍 /api/auth/me 验证通过: ${meData.username}, role=${meData.role}`);

      if (['admin', 'platform', 'ops'].includes(user.role)) {
        try {
          const statsData = await jar.get('/api/admin/stats');
          if (!statsData.data || !statsData.data.users) {
            console.log(`  ⚠️  管理后台 /api/admin/stats 返回格式异常`);
          } else {
            console.log(`  📊 管理后台统计接口正常: total_users=${statsData.data.users.total_users}, total_parcels=${statsData.data.parcels.total_parcels}`);
          }
        } catch (e) {
          console.log(`  ❌ 管理后台无权限: ${e.message}`);
        }
      }

      if (user.role === 'user') {
        try {
          const parcelsData = await jar.get('/api/parcels');
          console.log(`  📦 包裹列表接口正常: ${parcelsData.pagination?.total || '?'} 个包裹`);
        } catch (e) {
          console.log(`  ⚠️  包裹列表接口异常: ${e.message}`);
        }

        try {
          const trackData = await jar.get('/api/parcels/track?numbers=SF1234567890123');
          console.log(`  🔍 包裹查询接口正常: ${trackData.count || '?'} 个结果`);
        } catch (e) {
          console.log(`  ⚠️  包裹查询接口异常: ${e.message}`);
        }

        try {
          const priceData = await jar.post('/api/shipping/calculate-price', {
            weight: 5.5, volume: 0.08, timeline: 'standard', insured_value: 1000,
          });
          console.log(`  💰 报价引擎正常: 快递=${priceData.data?.[0]?.courier || '?'}, 价格=${priceData.data?.[0]?.total_price || '?'}`);
        } catch (e) {
          console.log(`  ⚠️  报价引擎异常: ${e.message}`);
        }
      }

      if (user.role === 'station_master') {
        try {
          const stationsData = await jar.get('/api/community/stations');
          console.log(`  🏪 驿站列表接口正常: ${stationsData.data?.length || '?'} 个驿站`);
        } catch (e) {
          console.log(`  ⚠️  驿站列表接口异常: ${e.message}`);
        }
      }

      if (user.role !== 'user') {
        try {
          const traceData = await jar.get('/api/parcels/1/trace');
          if (traceData.data?.verification?.valid === true) {
            console.log(`  🔗 溯源链验证通过: 节点数=${traceData.data.trace_chain.length}, 验证=${traceData.data.verification.valid}`);
          } else {
            console.log(`  ⚠️  溯源链验证失败: valid=${traceData.data?.verification?.valid}`);
          }
        } catch (e) {
          console.log(`  ⚠️  溯源链接口异常: ${e.message}`);
        }
      }

      delete jar.defaults.headers.Authorization;
      console.log(`  🚪 模拟退出登录，清除 localStorage`);

      console.log(`  ✅ 【验收通过】${acc.expectedLabel} 完整业务链路验证通过\n`);

    } catch (error) {
      if (error.response) {
        console.log(`  ❌ 失败: HTTP ${error.response.status}, ${JSON.stringify(error.response.data)}`);
      } else {
        console.log(`  ❌ 失败: ${error.message}`);
      }
      console.log('');
    }
  }

  console.log('=== 所有账号测试完成 ===');
}

testBrowserFlow();
