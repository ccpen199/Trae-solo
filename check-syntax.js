const fs = require('fs');
const content = fs.readFileSync('/Users/chen/Documents/trae_projects/local_projects/may-89077/frontend/src/App.jsx', 'utf8');
let braceCount = 0;
let parenCount = 0;
let inComment = false;
let inString = false;
let stringChar = '';

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const line = content.substring(0, i).split('\n').length;
  
  if (!inString && !inComment && char === '/' && content[i+1] === '/') {
    const newline = content.indexOf('\n', i);
    if (newline === -1) break;
    i = newline;
    continue;
  }
  
  if (!inString && !inComment && char === '/' && content[i+1] === '*') {
    inComment = true;
    i++;
    continue;
  }
  if (inComment && char === '*' && content[i+1] === '/') {
    inComment = false;
    i++;
    continue;
  }
  if (inComment) continue;
  
  if ((char === "'" || char === '"') && content[i-1] !== '\\') {
    if (!inString) {
      inString = true;
      stringChar = char;
    } else if (char === stringChar) {
      inString = false;
    }
    continue;
  }
  if (inString) continue;
  
  if (char === '{') braceCount++;
  if (char === '}') braceCount--;
  if (char === '(') parenCount++;
  if (char === ')') parenCount--;
  
  if (braceCount < 0) console.log('Line', line, 'Extra closing brace');
  if (parenCount < 0) console.log('Line', line, 'Extra closing paren');
}
console.log('Final brace balance:', braceCount);
console.log('Final paren balance:', parenCount);
