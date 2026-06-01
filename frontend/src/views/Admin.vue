<script setup>
import { ref, onMounted } from 'vue'
import { api } from '../api'

const loading = ref(false)
const dbInfo = ref(null)
const apiStatus = ref(null)

async function checkHealth() {
  loading.value = true
  try {
    const data = await api.health()
    apiStatus.value = data
  } catch (e) {
    apiStatus.value = { status: 'error', message: 'API连接失败' }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  checkHealth()
})
</script>

<template>
  <div class="admin h-full flex flex-col bg-gray-100">
    <div class="navbar flex items-center justify-between p-16 bg-white shadow">
      <div class="flex items-center gap-12">
        <span class="text-20">⚙️</span>
        <span class="text-18 font-medium">系统管理</span>
      </div>
      <button class="btn btn-outline text-14" @click="() => location.href = '/'">
        返回首页
      </button>
    </div>
    
    <div class="content flex-1 p-16 overflow-auto">
      <div class="card mb-24">
        <h3 class="text-16 font-medium mb-16">系统状态</h3>
        <div class="grid grid-cols-2 gap-16">
          <div class="p-12 bg-green-50 rounded-lg">
            <div class="text-12 text-secondary mb-4">后端服务</div>
            <div class="text-16 font-medium text-primary flex items-center gap-8">
              <span v-if="apiStatus">✅</span>
              <span v-else class="loading"></span>
              {{ apiStatus?.status === 'ok' ? '运行正常' : '检查中...' }}
            </div>
          </div>
          <div class="p-12 bg-blue-50 rounded-lg">
            <div class="text-12 text-secondary mb-4">数据库</div>
            <div class="text-16 font-medium text-blue-600 flex items-center gap-8">
              ✅ SQLite
            </div>
          </div>
        </div>
      </div>
      
      <div class="card mb-24">
        <h3 class="text-16 font-medium mb-16">测试用户</h3>
        <div class="space-y-12">
          <div class="flex items-center justify-between p-12 border rounded-lg">
            <div>
              <div class="text-16 font-medium">👤 张三</div>
              <div class="text-14 text-secondary">ID: user_001 | 余额: ¥1000.00</div>
            </div>
            <button class="btn btn-primary text-14" @click="() => location.href = '/#/receive?user=user_001'">
              登录
            </button>
          </div>
          <div class="flex items-center justify-between p-12 border rounded-lg">
            <div>
              <div class="text-16 font-medium">👤 李四</div>
              <div class="text-14 text-secondary">ID: user_002 | 余额: ¥500.00</div>
            </div>
            <button class="btn btn-primary text-14" @click="() => location.href = '/#/receive?user=user_002'">
              登录
            </button>
          </div>
        </div>
      </div>
      
      <div class="card mb-24">
        <h3 class="text-16 font-medium mb-16">功能测试向导</h3>
        <ol class="space-y-12 text-14">
          <li class="flex gap-12">
            <span class="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">1</span>
            <div>
              <div class="font-medium">生成收款码</div>
              <p class="text-secondary mt-4">进入「收钱」页面，点击「设置金额收钱」或直接生成普通收款码</p>
            </div>
          </li>
          <li class="flex gap-12">
            <span class="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">2</span>
            <div>
              <div class="font-medium">扫码付款</div>
              <p class="text-secondary mt-4">打开扫一扫，选择另一个用户的收款码，输入金额后确认付款</p>
            </div>
          </li>
          <li class="flex gap-12">
            <span class="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">3</span>
            <div>
              <div class="font-medium">验证交易记录</div>
              <p class="text-secondary mt-4">进入「交易记录」页面，查看余额变动和交易明细</p>
            </div>
          </li>
          <li class="flex gap-12">
            <span class="w-20 h-20 rounded-full bg-primary text-white flex items-center justify-center flex-shrink-0">4</span>
            <div>
              <div class="font-medium">绑卡测试</div>
              <p class="text-secondary mt-4">进入「银行卡」页面，使用测试卡号绑定储蓄卡</p>
            </div>
          </li>
        </ol>
      </div>
      
      <div class="card">
        <h3 class="text-16 font-medium mb-16">API 端点</h3>
        <div class="space-y-8 font-mono text-12">
          <div class="p-8 bg-gray-50 rounded">GET /api/health - 健康检查</div>
          <div class="p-8 bg-gray-50 rounded">GET /api/users/:id - 获取用户信息</div>
          <div class="p-8 bg-gray-50 rounded">POST /api/qrcode/generate - 生成二维码</div>
          <div class="p-8 bg-gray-50 rounded">GET /api/qrcode/:id - 获取二维码信息</div>
          <div class="p-8 bg-gray-50 rounded">POST /api/transactions/initiate - 发起交易</div>
          <div class="p-8 bg-gray-50 rounded">POST /api/transactions/:id/confirm - 确认交易</div>
          <div class="p-8 bg-gray-50 rounded">GET /api/transactions/user/:id - 用户交易记录</div>
          <div class="p-8 bg-gray-50 rounded">GET /api/bank-cards/user/:id - 用户银行卡列表</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.p-16 {
  padding: 16px;
}

.p-12 {
  padding: 12px;
}

.p-8 {
  padding: 8px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-24 {
  margin-bottom: 24px;
}

.mt-4 {
  margin-top: 4px;
}

.gap-12 {
  gap: 12px;
}

.gap-16 {
  gap: 16px;
}

.gap-8 {
  gap: 8px;
}

.flex-shrink-0 {
  flex-shrink: 0;
}

.bg-gray-100 {
  background: #f3f4f6;
}

.bg-green-50 {
  background: rgba(7, 193, 96, 0.1);
}

.bg-blue-50 {
  background: rgba(59, 130, 246, 0.1);
}

.bg-gray-50 {
  background: #f9fafb;
}

.text-blue-600 {
  color: #2563eb;
}

.border {
  border: 1px solid var(--border);
}

.rounded-lg {
  border-radius: 8px;
}

.rounded-full {
  border-radius: 9999px;
}

.shadow {
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.grid {
  display: grid;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.space-y-12 > * + * {
  margin-top: 12px;
}

.space-y-8 > * + * {
  margin-top: 8px;
}

.w-20 {
  width: 20px;
}

.h-20 {
  height: 20px;
}

.text-20 {
  font-size: 20px;
}

.overflow-auto {
  overflow: auto;
}

.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
</style>
