const fs = require('fs');
const https = require('http');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`Parse error: ${e.message}\nData: ${data.substring(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const base = 'http://127.0.0.1:59190';
  
  console.log('=== 1. Dashboard ===');
  try {
    const d = await fetchJson(`${base}/api/dashboard`);
    console.log('success:', d.success);
    console.log('KPI:', {
      onSaleEvents: d.data.onSaleEvents,
      activeTiers: d.data.activeTiers,
      crossGMV: d.data.crossGMV,
      pricingHeat: d.data.pricingHeat?.length,
      trendingArtists: d.data.trendingArtists?.length,
      topEvents: d.data.topEvents?.length,
      currencyBreakdown: d.data.currencyBreakdown?.length,
    });
    if (d.data.topEvents?.length > 0) {
      console.log('First topEvent:', {
        id: d.data.topEvents[0].id,
        title_zh: d.data.topEvents[0].title?.zh,
        region: d.data.topEvents[0].region,
        priceMin: d.data.topEvents[0].priceMin,
        hotIndex: d.data.topEvents[0].hotIndex,
      });
    }
  } catch (e) { console.log('FAIL:', e.message); }

  console.log('\n=== 2. Events (default) ===');
  try {
    const d = await fetchJson(`${base}/api/events`);
    console.log('success:', d.success, 'count:', d.data?.length);
    if (d.data?.length > 0) {
      console.log('First event:', {
        id: d.data[0].id,
        title_zh: d.data[0].title?.zh,
        region: d.data[0].region,
        currencies: d.data[0].currencies,
        languages: d.data[0].languages,
        priceMin: d.data[0].priceMin,
        hotIndex: d.data[0].hotIndex,
        status: d.data[0].status,
      });
    }
  } catch (e) { console.log('FAIL:', e.message); }

  console.log('\n=== 3. Events by region ===');
  for (const r of ['mainland', 'HKMT', 'JP_KR', 'SEA']) {
    try {
      const d = await fetchJson(`${base}/api/events?region=${r}`);
      console.log(`  ${r}: ${d.data?.length} events`);
    } catch (e) { console.log(`  ${r}: FAIL - ${e.message}`); }
  }

  console.log('\n=== 4. Events by keyword "sahara" ===');
  try {
    const d = await fetchJson(`${base}/api/events?keyword=sahara`);
    console.log('count:', d.data?.length);
  } catch (e) { console.log('FAIL:', e.message); }

  console.log('\n=== 5. Issues ===');
  try {
    const d = await fetchJson(`${base}/api/issues`);
    console.log('success:', d.success, 'count:', d.data?.length);
    if (d.data?.length > 0) {
      const types = {};
      const statuses = {};
      for (const it of d.data) {
        types[it.type] = (types[it.type] || 0) + 1;
        statuses[it.status] = (statuses[it.status] || 0) + 1;
      }
      console.log('Types:', types);
      console.log('Statuses:', statuses);
      console.log('First issue:', {
        id: d.data[0].id,
        type: d.data[0].type,
        status: d.data[0].status,
        summary: d.data[0].summary,
        compensationAmount: d.data[0].compensationAmount,
      });
    }
  } catch (e) { console.log('FAIL:', e.message); }

  console.log('\n=== 6. Event detail (first event) ===');
  try {
    const list = await fetchJson(`${base}/api/events`);
    if (list.data?.length > 0) {
      const evId = list.data[0].id;
      const d = await fetchJson(`${base}/api/events/${evId}`);
      console.log('success:', d.success);
      if (d.data) {
        console.log('title_zh:', d.data.title?.zh);
        console.log('ticketTiers:', d.data.ticketTiers?.length);
        console.log('pricingSeries:', d.data.pricingSeries ? 'yes' : 'no');
        console.log('paymentChannels:', d.data.paymentChannels?.length);
        console.log('guarantee:', d.data.guarantee ? 'yes' : 'no');
        console.log('currencies:', d.data.currencies);
        console.log('languages:', d.data.languages);
      }
    }
  } catch (e) { console.log('FAIL:', e.message); }
}

main().catch(console.error);
