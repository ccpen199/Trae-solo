const fs = require('fs');

function checkSyntax(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const stack = [];
    const pairs = {'(': ')', '{': '}', '[': ']'};
    const opening = '({[';
    const closing = ')}]';
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      const line = content.slice(0, i).split('\n').length;
      
      if (opening.includes(char)) {
        stack.push({char, line, pos: i});
      } else if (closing.includes(char)) {
        const last = stack.pop();
        if (!last || pairs[last.char] !== char) {
          console.log(`${filePath}:${line} 括号不匹配 - 期望 '${last ? pairs[last.char] : 'none'}', 得到 '${char}'`);
          return false;
        }
      }
    }
    
    if (stack.length > 0) {
      stack.forEach(item => {
        console.log(`${filePath}:${item.line} 未关闭的 '${item.char}'`);
      });
      return false;
    }
    return true;
  } catch (e) {
    console.log(`${filePath}: ${e.message}`);
    return false;
  }
}

const files = [
  'src/contexts/AuthContext.jsx',
  'src/components/Layout.jsx',
  'src/pages/Dashboard.jsx',
  'src/pages/Login.jsx',
  'src/pages/Clients.jsx',
  'src/pages/Documents.jsx',
  'src/pages/Accounting.jsx',
  'src/pages/TaxDeclarations.jsx',
  'src/pages/MonthlyReports.jsx',
  'src/pages/Renewals.jsx',
  'src/pages/Todos.jsx',
  'src/services/api.js',
  'src/App.jsx',
  'src/main.jsx'
];

console.log('=== 语法检查开始 ===');
let allPassed = true;
files.forEach(file => {
  if (fs.existsSync(file)) {
    if (!checkSyntax(file)) {
      allPassed = false;
    }
  } else {
    console.log(`${file}: 文件不存在`);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('✓ 所有文件括号匹配检查通过');
} else {
  console.log('✗ 发现语法问题');
  process.exit(1);
}
console.log('=== 语法检查结束 ===');
