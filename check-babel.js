const parser = require('/Users/chen/Documents/trae_projects/local_projects/may-89077/frontend/node_modules/@babel/parser');
const fs = require('fs');

const content = fs.readFileSync('/Users/chen/Documents/trae_projects/local_projects/may-89077/frontend/src/App.jsx', 'utf8');

try {
  parser.parse(content, {
    sourceType: 'module',
    plugins: ['jsx']
  });
  console.log('No syntax errors!');
} catch (e) {
  console.log('Error at line', e.loc.line, 'column', e.loc.column);
  console.log('Message:', e.message);
  console.log('');
  const lines = content.split('\n');
  const start = Math.max(0, e.loc.line - 5);
  const end = Math.min(lines.length, e.loc.line + 5);
  for (let i = start; i < end; i++) {
    const marker = i === e.loc.line - 1 ? '> ' : '  ';
    console.log(marker + (i + 1) + ': ' + lines[i]);
  }
}
