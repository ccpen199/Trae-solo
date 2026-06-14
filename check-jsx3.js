const fs = require('fs');
const content = fs.readFileSync('/Users/chen/Documents/trae_projects/local_projects/may-89077/frontend/src/App.jsx', 'utf8');
const lines = content.split('\n');

let jsxDepth = 0;
let inComment = false;
let inString = false;
let stringChar = '';

for (let lineNum = 0; lineNum < lines.length; lineNum++) {
  const line = lines[lineNum];
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (!inString && !inComment && char === '/' && line[i+1] === '/') {
      break;
    }
    if (!inString && !inComment && char === '/' && line[i+1] === '*') {
      inComment = true;
      i += 2;
      continue;
    }
    if (inComment && char === '*' && line[i+1] === '/') {
      inComment = false;
      i += 2;
      continue;
    }
    if (inComment) {
      i++;
      continue;
    }
    
    if ((char === "'" || char === '"' || char === '`') && line[i-1] !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
      }
      i++;
      continue;
    }
    if (inString) {
      i++;
      continue;
    }
    
    if (char === '<') {
      if (line[i+1] === '/' && jsxDepth > 0) {
        jsxDepth--;
        const endTag = line.substring(i, line.indexOf('>', i) + 1);
        if (lineNum >= 2000 && lineNum <= 2080) {
          console.log(`Line ${lineNum + 1}: CLOSE ${endTag} → depth=${jsxDepth}`);
        }
      } else if (line[i+1] !== '!' && line.substring(i, i+3) !== '<!--') {
        jsxDepth++;
        const endIdx = line.indexOf('>', i);
        const tagStr = line.substring(i, endIdx + 1);
        const isSelfClosing = tagStr.endsWith('/>');
        if (isSelfClosing) {
          jsxDepth--;
        }
        if (lineNum >= 2000 && lineNum <= 2080) {
          console.log(`Line ${lineNum + 1}: OPEN  ${tagStr.substring(0, 40)}${tagStr.length > 40 ? '...' : ''} → depth=${jsxDepth}`);
        }
      }
    }
    
    i++;
  }
  
  if (lineNum >= 2075 && lineNum <= 2080) {
    console.log(`Line ${lineNum + 1}: FINAL depth=${jsxDepth} | ${line.substring(0, 60)}`);
  }
}

console.log(`\nFinal JSX depth: ${jsxDepth}`);
