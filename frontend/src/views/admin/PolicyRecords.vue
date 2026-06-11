<template>
  <div class="page-container">
    <div class="nav-bar">
      <div class="back-btn" @click="goBack">
        <el-icon><ArrowLeft /></el-icon> 返回
      </div>
      <div class="page-title" style="margin:0;">
        <el-icon><Calculator /></el-icon> 政策计算器记录
      </div>
    </div>

    <div class="card">
      <el-tabs v-model="activeTab" @tab-change="loadData">
        <el-tab-pane label="社保补缴试算记录" name="social" />
        <el-tab-pane label="创业担保贷款记录" name="loan" />
      </el-tabs>

      <el-table :data="records" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="user_name" label="用户姓名" width="120" />
        <el-table-column prop="id_card" label="身份证" width="200" />
        <el-table-column label="输入参数" min-width="300">
          <template #default="{ row }">
            <div class="params-box">
              <template v-if="activeTab === 'social'">
                <span class="param-tag">缴费基数: {{ row.input_params?.base || '-' }}</span>
                <span class="param-tag">补缴月数: {{ row.input_params?.months || '-' }}</span>
                <span class="param-tag">类型: {{ row.input_params?.type || '-' }}</span>
              </template>
              <template v-else>
                <span class="param-tag">贷款金额: {{ row.input_params?.amount || '-' }}</span>
                <span class="param-tag">期限: {{ row.input_params?.term || '-' }}</span>
                <span class="param-tag">利率: {{ row.input_params?.rate || '-' }}</span>
              </template>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="输出结果" min-width="240">
          <template #default="{ row }">
            <template v-if="activeTab === 'social'">
              <div class="result-box">
                <div class="result-item">
                  <span class="result-label">总补缴额:</span>
                  <span class="result-value">¥ {{ Number(row.output_result?.total || 0).toLocaleString() }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">个人部分:</span>
                  <span class="result-value">¥ {{ Number(row.output_result?.personal || 0).toLocaleString() }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">单位部分:</span>
                  <span class="result-value">¥ {{ Number(row.output_result?.enterprise || 0).toLocaleString() }}</span>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="result-box">
                <div class="result-item">
                  <span class="result-label">月供:</span>
                  <span class="result-value">¥ {{ Number(row.output_result?.monthly || 0).toLocaleString() }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">总利息:</span>
                  <span class="result-value">¥ {{ Number(row.output_result?.interest || 0).toLocaleString() }}</span>
                </div>
                <div class="result-item">
                  <span class="result-label">还款总额:</span>
                  <span class="result-value">¥ {{ Number(row.output_result?.total || 0).toLocaleString() }}</span>
                </div>
              </div>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="计算时间" width="180" />
      </el-table>
      <el-empty v-if="!loading && records.length === 0" description="暂无计算记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import api from '../../store/auth'

const router = useRouter()
const loading = ref(false)
const activeTab = ref('social')
const records = ref([])

function parseParams(p) {
  try { return typeof p === 'string' ? JSON.parse(p) : (p || {}) } catch { return {} }
}
function parseResult(r) {
  try { return typeof r === 'string' ? JSON.parse(r) : (r || {}) } catch { return {} }
}

async function loadData() {
  loading.value = true
  try {
    const res = await api.get('/admin/policy-calculations', {
      params: { type: activeTab.value }
    })
    const list = res.data.data || []
    records.value = list.map(item => ({
      ...item,
      input_params: parseParams(item.input_params),
      output_result: parseResult(item.output_result)
    }))
  } catch (e) {
    ElMessage.error(e.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/admin')
}

onMounted(loadData)
</script>

<style scoped>
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}
.back-btn {
  cursor: pointer;
  color: #1d4ed8;
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
}
.params-box {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.param-tag {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  background: #f0f9ff;
  color: #0369a1;
  border: 1px solid #bae6fd;
}
.result-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.result-item {
  display: flex;
  align-items: center;
  font-size: 13px;
}
.result-label {
  color: #6b7280;
  margin-right: 8px;
  min-width: 70px;
}
.result-value {
  color: #1d4ed8;
  font-weight: 600;
}
</style>
