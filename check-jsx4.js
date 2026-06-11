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
  
  // Check for function definitions
  if (line.match(/^\s*function\s+\w+\s*\(/)) {
    console.log(`\n=== Line ${lineNum + 1}: ${line.trim().substring(0, 50)} - START depth=${jsxDepth} ===`);
  }
  
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
      } else if (line[i+1] !== '!' && line.substring(i, i+3) !== '<!--') {
        jsxDepth++;
        const endIdx = line.indexOf('>', i);
        const tagStr = line.substring(i, endIdx + 1);
        if (tagStr.endsWith('/>')) {
          jsxDepth--;
        }
      }
    }
    
    i++;
  }
  
  // Check for function end (line with just })
  if (line.match(/^\s*}\s*$/) && jsxDepth === 0) {
    console.log(`=== Line ${lineNum + 1}: } - END depth=${jsxDepth} ===`);
  }
  
  // Report abnormal depths
  if (jsxDepth > 10 && lineNum % 50 === 0) {
    console.log(`Line ${lineNum + 1}: depth=${jsxDepth} - ${line.substring(0, 60)}`);
  }
}

console.log(`\nFinal JSX depth: ${jsxDepth}`);
