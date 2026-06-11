const fs = require('fs');
const content = fs.readFileSync('/Users/chen/Documents/trae_projects/local_projects/may-89077/frontend/src/App.jsx', 'utf8');
const lines = content.split('\n');

const functionsToCheck = [
  { name: 'AdminCity', start: 2187 },
  { name: 'AdminSecurity', start: 2262 },
  { name: 'AdminStatistics', start: 2384 },
];

functionsToCheck.forEach(({ name, start }) => {
  console.log(`\n=== Checking ${name} (starts at line ${start}) ===`);
  
  let jsxDepth = 0;
  let inComment = false;
  let inString = false;
  let stringChar = '';
  let inReturn = false;
  
  for (let lineNum = start - 1; lineNum < Math.min(start + 200, lines.length); lineNum++) {
    const line = lines[lineNum];
    const oldDepth = jsxDepth;
    let i = 0;
    
    if (line.includes('return (')) inReturn = true;
    
    while (i < line.length) {
      const char = line[i];
      
      if (!inString && !inComment && char === '/' && line[i+1] === '/') break;
      if (!inString && !inComment && char === '/' && line[i+1] === '*') { inComment = true; i += 2; continue; }
      if (inComment && char === '*' && line[i+1] === '/') { inComment = false; i += 2; continue; }
      if (inComment) { i++; continue; }
      
      if ((char === "'" || char === '"' || char === '`') && line[i-1] !== '\\') {
        if (!inString) { inString = true; stringChar = char; }
        else if (char === stringChar) inString = false;
        i++; continue;
      }
      if (inString) { i++; continue; }
      
      if (char === '<') {
        if (line[i+1] === '/' && jsxDepth > 0) {
          jsxDepth--;
          if (inReturn) console.log(`Line ${lineNum+1}: CLOSE </...> → depth=${jsxDepth}`);
        } else if (line[i+1] !== '!' && line.substring(i, i+3) !== '<!--') {
          jsxDepth++;
          const endIdx = line.indexOf('>', i);
          const tagStr = line.substring(i, endIdx + 1);
          if (tagStr.endsWith('/>')) {
            jsxDepth--;
            if (inReturn) console.log(`Line ${lineNum+1}: SELF  <${tagStr.substring(1, 20)}.../> → depth=${jsxDepth}`);
          } else {
            if (inReturn) console.log(`Line ${lineNum+1}: OPEN  <${tagStr.substring(1, 20)}... → depth=${jsxDepth}`);
          }
        }
      }
      i++;
    }
    
    if (line.match(/^\s*}\s*$/) && jsxDepth === 0 && inReturn) {
      console.log(`Line ${lineNum+1}: FUNCTION END - final depth=${jsxDepth}`);
      break;
    }
  }
});
