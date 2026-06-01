const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PROJECT_NUM = '4872';
const TAIL_4 = PROJECT_NUM.padStart(4, '0');

const PORT_SLOTS = [
  { frontend: 40000 + parseInt(TAIL_4), backend: 50000 + parseInt(TAIL_4) },
  { frontend: 41000 + parseInt(TAIL_4), backend: 51000 + parseInt(TAIL_4) },
  { frontend: 42000 + parseInt(TAIL_4), backend: 52000 + parseInt(TAIL_4) },
  { frontend: 43000 + parseInt(TAIL_4), backend: 53000 + parseInt(TAIL_4) },
  { frontend: 44000 + parseInt(TAIL_4), backend: 54000 + parseInt(TAIL_4) },
  { frontend: 45000 + parseInt(TAIL_4), backend: 55000 + parseInt(TAIL_4) },
];

function isPortInUse(port) {
  try {
    execSync(`lsof -ti tcp:${port}`, { stdio: 'pipe' });
    return true;
  } catch (e) {
    return false;
  }
}

function getAvailablePorts() {
  for (let i = 0; i < PORT_SLOTS.length; i++) {
    const slot = PORT_SLOTS[i];
    const frontendInUse = isPortInUse(slot.frontend);
    const backendInUse = isPortInUse(slot.backend);
    
    if (!frontendInUse && !backendInUse) {
      console.log(`✅ 找到可用端口槽位 #${i + 1}: 前端 ${slot.frontend}, 后端 ${slot.backend}`);
      return slot;
    } else {
      console.log(`⚠️  端口槽位 #${i + 1}: 前端${slot.frontend}(${frontendInUse ? '占用' : '可用'}), 后端${slot.backend}(${backendInUse ? '占用' : '可用'})`);
    }
  }
  
  console.error('❌ 所有端口槽位都被占用！请手动释放端口后重试。');
  process.exit(1);
}

function writeEnvFile(frontendPort, backendPort) {
  const envPath = path.join(__dirname, '../.env');
  const content = `FRONTEND_PORT=${frontendPort}
BACKEND_PORT=${backendPort}
API_BASE_URL=http://127.0.0.1:${backendPort}
`;
  fs.writeFileSync(envPath, content);
  console.log(`📝 已写入 .env 文件: ${envPath}`);
}

if (require.main === module) {
  console.log(`🔍 检查端口可用性 (项目 may-${PROJECT_NUM})...`);
  const ports = getAvailablePorts();
  writeEnvFile(ports.frontend, ports.backend);
  console.log('✅ 端口配置完成！');
}

module.exports = { getAvailablePorts, isPortInUse, PORT_SLOTS };
