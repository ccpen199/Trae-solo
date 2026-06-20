import fetch from 'node-fetch';

const BASE = 'http://localhost:3001';

async function main() {
  const designers = await (await fetch(`${BASE}/api/designers?limit=2`)).json() as any;
  console.log('设计师总数:', designers.data.total);
  
  const first = designers.data.items[0];
  console.log('\n第一个设计师:', first.name, first.id);
  
  const detail = await (await fetch(`${BASE}/api/designers/${first.id}`)).json() as any;
  console.log('作品数:', detail.data.cases?.length || 0);
  if (detail.data.cases?.length) {
    console.log('作品:');
    detail.data.cases.forEach(c => console.log('  -', c.title));
  }
}

main();
