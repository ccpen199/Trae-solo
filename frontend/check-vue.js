import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const adminDir = path.join(__dirname, './src/views/admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.vue'));

console.log('检查 ' + files.length + ' 个 Vue 文件...\n');

let hasError = false;
for (const file of files) {
  const filePath = path.join(adminDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  try {
    const checks = [];
    
    if (!content.includes('<script setup>')) {
      checks.push('缺少 <script setup>');
    }
    if (!content.includes('</template>')) {
      checks.push('缺少 </template>');
    }
    if (content.includes('TODO') || content.includes('FIXME')) {
      checks.push('包含待办注释');
    }
    
    if (checks.length > 0) {
      console.log('⚠️  ' + file + ': ' + checks.join(', '));
      hasError = true;
    } else {
      console.log('✅ ' + file + ' - OK');
    }
  } catch (e) {
    console.log('❌ ' + file + ' - ' + e.message);
    hasError = true;
  }
}

console.log('\n' + (hasError ? '存在警告' : '全部通过基本检查'));
console.log('\n所有文件列表：');
files.forEach((f, i) => {
  console.log('  ' + (i + 1).toString().padStart(2, ' ') + '. ' + path.join(adminDir, f));
});

const result = {
  total: files.length,
  files: files.map(f => path.join(adminDir, f))
};
fs.writeFileSync(path.join(__dirname, 'check-result.json'), JSON.stringify(result, null, 2));
console.log('\n结果已保存到 check-result.json');
process.exit(0);
