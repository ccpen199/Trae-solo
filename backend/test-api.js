const axios = require('axios');

const baseURL = 'http://localhost:9921/api';
let token = '';

const test = async () => {
  console.log('=== S2KOL2C 社交电商平台 API 测试 ===\n');

  try {
    console.log('1. 登录测试 (手机号: 13800000001)');
    const loginRes = await axios.post(`${baseURL}/auth/phone-login`, {
      phone: '13800000001',
      code: '123456'
    });
    token = loginRes.data.token;
    console.log('✅ 登录成功，用户:', loginRes.data.user.nickname);
    console.log('');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('2. 获取首页推荐');
    const homeRes = await axios.get(`${baseURL}/product/home-recommend`, { headers });
    console.log('✅ Banner数量:', homeRes.data.banners?.length);
    console.log('✅ 推荐商品数量:', homeRes.data.products?.length);
    console.log('');

    console.log('3. 获取商品分类');
    const catRes = await axios.get(`${baseURL}/product/categories`, { headers });
    console.log('✅ 分类数量:', catRes.data.categories?.length);
    console.log('');

    console.log('4. 获取商品详情 (ID: 1)');
    const productRes = await axios.get(`${baseURL}/product/1`, { headers });
    console.log('✅ 商品名称:', productRes.data.product.name);
    console.log('✅ 商品价格:', productRes.data.product.price);
    console.log('✅ 评价数量:', productRes.data.reviews?.length);
    console.log('');

    console.log('5. 添加商品到购物车');
    const addCartRes = await axios.post(`${baseURL}/cart/add`, {
      product_id: 1,
      quantity: 2
    }, { headers });
    console.log('✅ 购物车数量:', addCartRes.data.cart_count);
    console.log('');

    console.log('6. 获取购物车');
    const cartRes = await axios.get(`${baseURL}/cart`, { headers });
    console.log('✅ 购物车商品数量:', cartRes.data.items?.length);
    console.log('✅ 购物车总金额:', cartRes.data.total_amount);
    console.log('');

    console.log('7. 创建订单');
    const createOrderRes = await axios.post(`${baseURL}/order/create`, {
      product_id: 1,
      quantity: 1,
      address: { name: '测试用户', phone: '13800000000', address: '测试地址' }
    }, { headers });
    const orderId = createOrderRes.data.order.id;
    console.log('✅ 订单ID:', orderId);
    console.log('✅ 订单号:', createOrderRes.data.order.order_no);
    console.log('✅ 订单状态:', createOrderRes.data.order.status);
    console.log('');

    console.log('8. 支付订单');
    const payRes = await axios.post(`${baseURL}/order/${orderId}/pay`, null, { headers });
    console.log('✅ 支付结果:', payRes.data.message);
    console.log('');

    console.log('9. 获取订单列表');
    const ordersRes = await axios.get(`${baseURL}/order`, { headers });
    console.log('✅ 订单数量:', ordersRes.data.orders?.length);
    console.log('');

    console.log('10. 获取社区帖子');
    const postsRes = await axios.get(`${baseURL}/community/posts`, { headers });
    console.log('✅ 帖子数量:', postsRes.data.posts?.length);
    if (postsRes.data.posts?.length > 0) {
      console.log('✅ 最新帖子:', postsRes.data.posts[0].title);
    }
    console.log('');

    console.log('11. 搜索测试');
    const searchRes = await axios.get(`${baseURL}/product/list`, { 
      headers,
      params: { keyword: '蓝牙', page_size: 5 }
    });
    console.log('✅ 搜索结果数量:', searchRes.data.products?.length);
    console.log('');

    console.log('12. 管理后台统计');
    const dashboardRes = await axios.get(`${baseURL}/admin/dashboard`, { headers });
    console.log('✅ 总用户数:', dashboardRes.data.stats.total_users);
    console.log('✅ 总订单数:', dashboardRes.data.stats.total_orders);
    console.log('✅ 总商品数:', dashboardRes.data.stats.total_products);
    console.log('');

    console.log('===================================');
    console.log('🎉 所有核心业务链路测试通过！');
    console.log('===================================');
    console.log('');
    console.log('访问地址:');
    console.log('  前端: http://localhost:9922');
    console.log('  后端: http://localhost:9921');
    console.log('');
    console.log('测试账号:');
    console.log('  手机号: 13800000001 (管理员)');
    console.log('  验证码: 123456');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    process.exit(1);
  }
};

test();
