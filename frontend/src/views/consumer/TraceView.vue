<template>
  <div class="trace-container">
    <el-card shadow="hover" class="trace-card">
      <template #header>
        <div class="card-header">
          <h2>农产品溯源查询</h2>
        </div>
      </template>
      <div class="trace-content">
        <div class="scan-section">
          <el-input
            v-model="batchCode"
            placeholder="请输入批次号或扫描二维码"
            clearable
            size="large"
            class="batch-input"
          />
          <el-button type="primary" size="large" @click="traceBatch" class="trace-button">
            溯源查询
          </el-button>
        </div>
        
        <div class="info-section">
          <h3>溯源说明</h3>
          <ul>
            <li>扫描产品包装上的二维码获取批次号</li>
            <li>或直接输入批次号进行查询</li>
            <li>系统将展示产品从种植到流通的完整信息</li>
            <li>包含农事记录、质检报告和流通轨迹</li>
          </ul>
        </div>
        
        <div class="example-section">
          <h3>示例批次号</h3>
          <div class="example-codes">
            <el-tag v-for="code in exampleCodes" :key="code" @click="selectExample(code)">
              {{ code }}
            </el-tag>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const batchCode = ref('')

const exampleCodes = [
  'FA-PR-26-ABC123',
  'FA-PR-26-DEF456',
  'FA-PR-26-GHI789'
]

const traceBatch = () => {
  if (batchCode.value) {
    router.push(`/consumer/result/${batchCode.value}`)
  } else {
    // 提示用户输入批次号
    console.log('请输入批次号')
  }
}

const selectExample = (code) => {
  batchCode.value = code
  traceBatch()
}
</script>

<style scoped>
.trace-container {
  padding: 40px 0;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.trace-card {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  font-size: 24px;
  color: #303133;
  font-weight: bold;
}

.trace-content {
  padding: 40px;
}

.scan-section {
  margin-bottom: 30px;
}

.batch-input {
  margin-bottom: 20px;
  font-size: 16px;
}

.trace-button {
  width: 100%;
  padding: 15px;
  font-size: 18px;
}

.info-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.info-section h3 {
  margin-top: 0;
  font-size: 16px;
  color: #303133;
  margin-bottom: 15px;
}

.info-section ul {
  margin: 0;
  padding-left: 20px;
}

.info-section li {
  margin-bottom: 8px;
  color: #606266;
  line-height: 1.4;
}

.example-section {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.example-section h3 {
  margin-top: 0;
  font-size: 16px;
  color: #303133;
  margin-bottom: 15px;
}

.example-codes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.example-codes .el-tag {
  cursor: pointer;
  padding: 8px 16px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.example-codes .el-tag:hover {
  background-color: #409EFF;
  color: white;
}
</style>
