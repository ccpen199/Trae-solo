const http = require('http');

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get({ hostname: '127.0.0.1', port: 59309, path }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { reject(new Error(`Parse error: ${e.message}, raw=${d.slice(0,200)}`)); }
      });
    }).on('error', reject);
  });
}

async function main() {
  console.log('=== 第三轮全面验证 ===\n');

  // 1. 灵感图谱
  console.log('1. 灵感图谱 API');
  try {
    const r = await getJSON('/api/ai/inspiration-graph?limit=20');
    console.log('  status:', r.status, 'success:', r.data.success);
    console.log('  statistics:', JSON.stringify(r.data.data?.statistics));
    const styles = r.data.data?.distributions?.styles;
    console.log('  风格分布:', JSON.stringify(styles));
    const recs = r.data.data?.recommendations;
    console.log('  推荐数:', recs?.length);
    if (recs?.length) {
      const d0 = recs[0];
      console.log('  推荐[0]字段检查:');
      console.log('    _id:', d0._id, 'title:', d0.title);
      console.log('    styleTags:', d0.styleTags, 'constructionStage:', d0.constructionStage);
      console.log('    houseType:', d0.houseType, 'houseArea:', d0.houseArea);
      console.log('    createdAt:', !!d0.createdAt, 'budget:', d0.budget?.totalEstimated);
    }
  } catch(e) { console.log('  ERROR:', e.message); }

  // 2. 安装阶段
  console.log('\n2. 日记筛选: stage=installation (安装阶段)');
  try {
    const r = await getJSON('/api/diaries?stage=installation&limit=10');
    console.log('  status:', r.status, 'count:', r.data.data?.diaries?.length);
    r.data.data?.diaries?.forEach(d => console.log('   -', d.title, 'stage:', d.constructionStage));
  } catch(e) { console.log('  ERROR:', e.message); }

  // 3. 北欧风格（前端完整名）
  console.log('\n3. 日记筛选: style=北欧风格 (完整名)');
  try {
    const r = await getJSON('/api/diaries?style=%E5%8C%97%E6%AC%A7%E9%A3%8E%E6%A0%BC&limit=10');
    console.log('  status:', r.status, 'count:', r.data.data?.diaries?.length);
    r.data.data?.diaries?.forEach(d => console.log('   -', d.title, 'styleTags:', d.styleTags));
  } catch(e) { console.log('  ERROR:', e.message); }

  // 4. 北欧（短名）
  console.log('\n4. 日记筛选: style=北欧 (短名)');
  try {
    const r = await getJSON('/api/diaries?style=%E5%8C%97%E6%AC%A7&limit=10');
    console.log('  status:', r.status, 'count:', r.data.data?.diaries?.length);
    r.data.data?.diaries?.forEach(d => console.log('   -', d.title, 'styleTags:', d.styleTags));
  } catch(e) { console.log('  ERROR:', e.message); }

  // 5. 地中海
  console.log('\n5. 日记筛选: style=地中海');
  try {
    const r = await getJSON('/api/diaries?style=%E5%9C%B0%E4%B8%AD%E6%B5%B7&limit=10');
    console.log('  status:', r.status, 'count:', r.data.data?.diaries?.length);
    r.data.data?.diaries?.forEach(d => console.log('   -', d.title, 'styleTags:', d.styleTags));
  } catch(e) { console.log('  ERROR:', e.message); }

  // 6. 全部日记
  console.log('\n6. 全部日记');
  try {
    const r = await getJSON('/api/diaries?limit=20');
    console.log('  total:', r.data.data?.pagination?.total);
    r.data.data?.diaries?.forEach(d => console.log('   -', d.title, 'stage:', d.constructionStage, 'styles:', d.styleTags));
  } catch(e) { console.log('  ERROR:', e.message); }

  // 7. 设计师 + 资质 + 服务半径
  console.log('\n7. 设计师列表');
  try {
    const r = await getJSON('/api/designers?limit=3');
    r.data.data?.designers?.forEach((d, i) => {
      console.log(`  [${i}] ${d.nickname}`);
      console.log('     serviceRadius:', d.serviceRadius, 'serviceAreas:', JSON.stringify(d.serviceAreas));
      console.log('     credentials:', JSON.stringify(d.credentials || d.qualifications || 'NONE'));
      console.log('     portfolio count:', d.portfolio?.length);
      if (d.portfolio?.length) {
        console.log('     portfolio[0]:', JSON.stringify(d.portfolio[0]).slice(0, 150));
      }
      console.log('     statistics:', JSON.stringify(d.statistics));
    });
  } catch(e) { console.log('  ERROR:', e.message); }

  // 8. 设计师按风格筛选
  console.log('\n8. 设计师筛选: style=北欧风格');
  try {
    const r = await getJSON('/api/designers?style=%E5%8C%97%E6%AC%A7%E9%A3%8E%E6%A0%BC&limit=10');
    console.log('  count:', r.data.data?.designers?.length);
    r.data.data?.designers?.forEach(d => console.log('   -', d.nickname, 'portfolioStyles:', d.portfolio?.map(p => p.style)));
  } catch(e) { console.log('  ERROR:', e.message); }
}

main().catch(console.error);
