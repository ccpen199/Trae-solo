import { build } from 'esbuild';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  console.log('编译后端代码...');
  
  try {
    await build({
      entryPoints: ['api/server.ts'],
      bundle: true,
      platform: 'node',
      format: 'esm',
      outfile: 'dist/server.js',
      packages: 'external',
      sourcemap: true,
      banner: {
        js: "import { createRequire } from 'module'; const require = createRequire(import.meta.url);"
      }
    });
    
    console.log('编译完成，启动服务器...');
    
    const server = spawn('node', ['dist/server.js'], {
      env: { ...process.env, NODE_ENV: 'development' },
      stdio: 'inherit'
    });
    
    server.on('error', (err) => {
      console.error('启动失败:', err);
      process.exit(1);
    });
    
    server.on('exit', (code) => {
      console.log(`服务器退出，代码: ${code}`);
    });
    
  } catch (err) {
    console.error('编译失败:', err);
    process.exit(1);
  }
}

start();
