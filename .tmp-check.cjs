const fs = require('fs');

function check(name, path) {
  console.log(`\n=== ${name} ===`);
  try {
    const raw = fs.readFileSync(path, 'utf8');
    const d = JSON.parse(raw);
    console.log('success:', d.success);
    if (d.success && d.data) {
      if (Array.isArray(d.data)) {
        console.log('count:', d.data.length);
        if (d.data.length > 0) {
          const first = d.data[0];
          console.log('first item keys:', Object.keys(first).slice(0, 10).join(', '));
        }
      } else {
        console.log('keys:', Object.keys(d.data).join(', '));
        for (const k of Object.keys(d.data)) {
          const v = d.data[k];
          if (Array.isArray(v)) {
            console.log(`  ${k}: ${v.length} items`);
          } else if (typeof v === 'object') {
            console.log(`  ${k}: [object]`);
          } else {
            console.log(`  ${k}: ${v}`);
          }
        }
      }
    }
  } catch (e) {
    console.log('ERROR:', e.message);
    console.log('raw len:', fs.readFileSync(path, 'utf8').length);
  }
}

check('Dashboard', '/tmp/dash.json');
check('Events', '/tmp/events.json');
check('Issues', '/tmp/issues.json');
