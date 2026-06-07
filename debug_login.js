import axios from 'axios';

const BASE_URL = 'http://127.0.0.1:49055';

async function main() {
  console.log('='.repeat(80));
  console.log('登录流程调试');
  console.log('='.repeat(80));

  console.log('\n1. 登录请求...');
  try {
    const login = await axios.post(`${BASE_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    console.log('   登录成功!');
    console.log('   Token:', login.data.data.token.substring(0, 30) + '...');
    console.log('   User:', login.data.data.user);
    
    const token = login.data.data.token;
    const h = { Authorization: `Bearer ${token}` };

    console.log('\n2. 验证Token (getMe)...');
    const me = await axios.get(`${BASE_URL}/api/auth/me`, { headers: h });
    console.log('   Token有效:', me.data.data);

    console.log('\n3. Dashboard API...');
    const dash = await axios.get(`${BASE_URL}/api/dashboard/admin`, { headers: h });
    console.log('   SLA:', dash.data.data.sla);
    console.log('   活跃骑手:', dash.data.data.knights.count);
    console.log('   今日运单:', dash.data.data.today_waybills);

    console.log('\n4. 运单列表API...');
    const wb = await axios.get(`${BASE_URL}/api/waybills?pageSize=3`, { headers: h });
    console.log('   运单数量:', wb.data.data.total);
    console.log('   第一个运单:', wb.data.data.list[0].order_no);
    console.log('   调度依据存在:', !!wb.data.data.list[0].dispatch);
    console.log('   骑手信息存在:', !!wb.data.data.list[0].knight);
    console.log('   SLA存在:', !!wb.data.data.list[0].sla);
    console.log('   状态流转存在:', !!wb.data.data.list[0].status_flow);

    console.log('\n5. 骑手列表API...');
    const kh = await axios.get(`${BASE_URL}/api/knights?pageSize=3`, { headers: h });
    console.log('   骑手数量:', kh.data.data.total);
    console.log('   第一个骑手:', kh.data.data.list[0].name);
    console.log('   负载率存在:', kh.data.data.list[0].load_rate !== undefined);
    console.log('   承运能力存在:', !!kh.data.data.list[0].capacity_info);

    console.log('\n6. 异常列表API...');
    const ex = await axios.get(`${BASE_URL}/api/exceptions?pageSize=3`, { headers: h });
    console.log('   异常数量:', ex.data.data.total);

    console.log('\n' + '='.repeat(80));
    console.log('✓ 所有后端API正常!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('   错误:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('   响应:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

main().catch(console.error);
