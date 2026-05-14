const axios = require('axios');

const baseURL = 'http://localhost:9921/api';
let token = '';

const test = async () => {
  console.log('=== 分类和商品测试 ===\n');

  try {
    console.log('1. 登录测试');
    const loginRes = await axios.post(`${baseURL}/auth/phone-login`, {
      phone: '13800000001',
      code: '123456'
    });
    token = loginRes.data.token;
    console.log('✅ 登录成功\n');

    const headers = { Authorization: `Bearer ${token}` };

    console.log('2. 获取分类列表 (包含二级分类)');
    const catRes = await axios.get(`${baseURL}/product/categories`, { headers });
    const categories = catRes.data.categories;
    console.log('✅ 一级分类数量:', categories.length);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (id: ${cat.id}), 二级分类数: ${cat.children?.length || 0}`);
      if (cat.children?.length > 0) {
        console.log(`     ${cat.children.map(c => c.name).join(', ')}`);
      }
    });
    console.log('');

    console.log('3. 获取首页推荐 (检查banner)');
    const homeRes = await axios.get(`${baseURL}/product/home-recommend`, { headers });
    console.log('✅ Banner数量:', homeRes.data.banners?.length);
    homeRes.data.banners?.forEach((b, i) => {
      console.log(`   Banner ${i + 1}: ${b.image.substring(0, 60)}...`);
    });
    console.log('✅ 推荐商品数量:', homeRes.data.products?.length);
    console.log('');

    console.log('4. 按分类获取商品');
    for (const cat of categories.slice(0, 3)) {
      const prodRes = await axios.get(`${baseURL}/product/list`, { 
        headers,
        params: { category_id: cat.id, page_size: 5 }
      });
      console.log(`   ${cat.name} 分类商品数: ${prodRes.data.products?.length}`);
      prodRes.data.products?.slice(0, 2).forEach(p => {
        console.log(`     - ${p.name} (¥${p.price})`);
      });
    }
    console.log('');

    console.log('5. 热销榜');
    const hotRes = await axios.get(`${baseURL}/product/hot-selling`, { headers, params: { limit: 5 } });
    console.log('✅ 热销商品数量:', hotRes.data.products?.length);
    hotRes.data.products?.forEach((p, i) => {
      console.log(`   ${i + 1}. ${p.name} (已售${p.sales}件)`);
    });

    console.log('\n===================================');
    console.log('🎉 测试通过！');
    console.log('===================================');

  } catch (error) {
    console.error('❌ 测试失败:', error.response?.data || error.message);
    process.exit(1);
  }
};

test();
