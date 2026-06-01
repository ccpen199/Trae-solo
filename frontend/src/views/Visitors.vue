<template>
  <div class="visitors">
    <el-card>
      <template #header>
        <el-row :gutter="16" align="middle">
          <el-col :span="14"><span>访客管理</span></el-col>
          <el-col :span="4">
            <el-checkbox v-model="onlyBlacklisted" @change="loadData">仅黑名单</el-checkbox>
          </el-col>
          <el-col :span="6">
            <el-input v-model="search" placeholder="搜索访客" clearable size="small" @input="loadData" />
          </el-col>
        </el-row>
      </template>
      <el-table :data="list" size="small" v-loading="loading">
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="id_card" label="身份证号" width="180" />
        <el-table-column prop="phone" label="电话" width="120" />
        <el-table-column prop="company" label="公司" />
        <el-table-column label="风险等级" width="120">
          <template #default="{ row }">
            <el-tag :type="row.risk_level === 'high' ? 'danger' : 'success'">
              {{ row.risk_level === 'high' ? '高风险' : '正常' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="黑名单" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_blacklisted ? 'danger' : 'info'" size="small">
              {{ row.is_blacklisted ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="blacklist_reason" label="备注原因" show-overflow-tooltip />
        <el-table-column prop="updated_at" label="更新时间" width="160">
          <template #default="{ row }">{{ formatTime(row.updated_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button 
              :type="row.risk_level === 'high' ? 'success' : 'warning'" 
              size="small" 
              link
              @click="setRiskLevel(row)"
            >
              {{ row.risk_level === 'high' ? '降风险' : '设高风险' }}
            </el-button>
            <el-button 
              :type="row.is_blacklisted ? 'success' : 'danger'" 
              size="small" 
              link
              @click="toggleBlacklist(row)"
            >
              {{ row.is_blacklisted ? '解除拉黑' : '拉黑' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="showDialog" :title="dialogTitle" width="400px">
      <el-form :model="form">
        <el-form-item label="原因">
          <el-input v-model="form.reason" type="textarea" :rows="3" :placeholder="dialogPlaceholder" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAction">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { visitors } from '../api'

const list = ref([])
const loading = ref(false)
const search = ref('')
const onlyBlacklisted = ref(false)
const showDialog = ref(false)
const currentVisitor = ref(null)
const actionType = ref('')
const form = reactive({ reason: '' })

const dialogTitle = computed(() => {
  const titles = {
    blacklist: '加入黑名单',
    unblacklist: '解除黑名单',
    risk_high: '设置高风险',
    risk_normal: '恢复正常风险'
  }
  return titles[actionType.value] || ''
})

const dialogPlaceholder = computed(() => {
  return actionType.value.includes('un') || actionType.value === 'risk_normal' 
    ? '请输入原因（选填）' 
    : '请输入原因'
})

const loadData = async () => {
  loading.value = true
  try {
    const res = await visitors.list({ 
      search: search.value, 
      blacklisted: onlyBlacklisted.value ? 'true' : '' 
    })
    list.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

const toggleBlacklist = (row) => {
  currentVisitor.value = row
  actionType.value = row.is_blacklisted ? 'unblacklist' : 'blacklist'
  form.reason = ''
  showDialog.value = true
}

const setRiskLevel = (row) => {
  currentVisitor.value = row
  actionType.value = row.risk_level === 'high' ? 'risk_normal' : 'risk_high'
  form.reason = ''
  showDialog.value = true
}

const confirmAction = async () => {
  try {
    if (actionType.value.includes('blacklist')) {
      await visitors.blacklist(currentVisitor.value.id, {
        blacklisted: actionType.value === 'blacklist',
        reason: form.reason
      })
    } else {
      await visitors.setRisk(currentVisitor.value.id, {
        riskLevel: actionType.value === 'risk_high' ? 'high' : 'low',
        reason: form.reason
      })
    }
    ElMessage.success('操作成功')
    showDialog.value = false
    loadData()
  } catch (e) {
    ElMessage.error('操作失败')
  }
}

const formatTime = (t) => t ? t.slice(0, 16) : ''

onMounted(loadData)
</script>
