import fetch from 'node-fetch';

const BASE = 'http://localhost:3001';

async function main() {
  const list = await (await fetch(`${BASE}/api/cases?limit=8`)).json();
  console.log('总数:', list.data.total);
  console.log('案例列表:');
  list.data.items.forEach(c => console.log(`  - ${c.title} | ${c.style} | ${c.houseType} | ${c.area}㎡ | ¥${c.budgetMin}-${c.budgetMax}万`));

  const detail = await (await fetch(`${BASE}/api/cases/${list.data.items[0].id}`)).json();
  console.log('\n详情 -', detail.data.title);
  console.log('  平面图:', detail.data.floorPlan ? '有' : '无');
  console.log('  材料数:', detail.data.materials?.length || 0);
  console.log('  节点数:', detail.data.constructionNodes?.length || 0);
  console.log('  图片数:', Array.isArray(detail.data.images) ? detail.data.images.length : 0);
  if (detail.data.materials?.length) {
    console.log('  前3条材料:');
    detail.data.materials.slice(0, 3).forEach(m => console.log(`    - ${m.name} ${m.brand} ¥${m.unitPrice}`));
  }
  if (detail.data.constructionNodes?.length) {
    console.log('  施工节点:');
    detail.data.constructionNodes.forEach(n => console.log(`    - ${n.phase}: ${n.duration}`));
  }

  const designers = await (await fetch(`${BASE}/api/designers?limit=3`)).json();
  console.log('\n设计师总数:', designers.data.total);
  designers.data.items.forEach(d => console.log(`  - ${d.name} | ${d.region} | ${d.styles?.join(',')}`));
}

main();
