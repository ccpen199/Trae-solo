<template>
  <div>
    <el-card class="page-card">
      <template #header>
        <div class="card-header">
          <span class="page-title">变量列表 (Variable-Factory)</span>
        </div>
      </template>
      
      <el-table :data="variables" v-loading="loading" stripe>
        <el-table-column prop="name" label="变量名称" width="200">
          <template #default="{ row }">
            <div class="var-name-cell">
              <el-icon color="#409EFF"><Coin /></el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="code" label="变量编码" width="200">
          <template #default="{ row }">
            <el-tag type="info" effect="plain">{{ row.code }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="数据类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="250" show-overflow-tooltip />
        <el-table-column prop="source_type" label="来源类型" width="120">
          <template #default="{ row }">
            <el-tag size="small">{{ row.source_type || '-' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="weight" label="权重" width="100">
          <template #default="{ row }">
            <el-input-number 
              v-model="row.weight" 
              :min="0" 
              :max="10" 
              :step="0.1" 
              size="small"
              @change="(val) => updateWeight(row.id, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../utils/api'

const variables = ref([])
const loading = ref(false)

const getTypeTag = (type) => {
  switch (type) {
    case 'integer': return 'primary'
    case 'float': return 'success'
    case 'boolean': return 'warning'
    case 'string': return 'info'
    default: return 'info'
  }
}

const loadVariables = async () => {
  loading.value = true
  try {
    const res = await api.get('/variables')
    if (res.data.success) {
      variables.value = res.data.data
    }
  } catch (e) {
    console.error('加载变量失败', e)
  } finally {
    loading.value = false
  }
}

const updateWeight = async (variableId, weight) => {
  try {
    const res = await api.put(`/variables/${variableId}/weight`, { weight })
    if (res.data.success) {
      ElMessage.success('权重已更新')
    }
  } catch (e) {
    console.error('更新权重失败', e)
  }
}

onMounted(() => {
  loadVariables()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.var-name-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
