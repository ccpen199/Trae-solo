<template>
  <div>
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item @click="goBack" style="cursor: pointer; color: #409eff;">故障诊断</el-breadcrumb-item>
        <el-breadcrumb-item>故障详情</el-breadcrumb-item>
      </el-breadcrumb>
      <h2 style="margin-top: 10px;">故障详情</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header" style="display: flex; justify-content: space-between; align-items: center;">
              <span>基本信息</span>
              <div>
                <el-button 
                  v-if="faultRecord?.status === 'active'" 
                  type="warning" 
                  @click="handleClearFault"
                >
                  清除故障
                </el-button>
                <el-button 
                  v-if="faultRecord?.status === 'active'" 
                  type="success" 
                  @click="handleRepair"
                >
                  完成维修
                </el-button>
              </div>
            </div>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="故障码">
              <el-tag type="danger" size="large">{{ faultRecord?.dtc_code }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="故障名称">{{ faultRecord?.dtc_name }}</el-descriptions-item>
            <el-descriptions-item label="故障分类">
              <el-tag :type="getCategoryType(faultRecord?.category)">
                {{ getCategoryText(faultRecord?.category) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="faultRecord?.status === 'active' ? 'danger' : 'success'">
                {{ faultRecord?.status === 'active' ? '活跃' : '已清除' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="严重程度">
              <el-tag :type="getSeverityType(faultRecord?.severity)">
                {{ faultRecord?.severity || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="发生次数">{{ faultRecord?.occurrence_count || 1 }}</el-descriptions-item>
            <el-descriptions-item label="车辆VIN">{{ faultRecord?.vin || '-' }}</el-descriptions-item>
            <el-descriptions-item label="车型">{{ faultRecord?.model_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="关联会话">{{ faultRecord?.session_code || '-' }}</el-descriptions-item>
            <el-descriptions-item label="发现时间">{{ formatTime(faultRecord?.detected_at) }}</el-descriptions-item>
            <el-descriptions-item label="清除时间">{{ formatTime(faultRecord?.cleared_at) || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ faultRecord?.created_by_name || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">故障描述</div>
          </template>
          <p style="line-height: 1.8;">{{ faultRecord?.description || '暂无描述' }}</p>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">故障原因</div>
          </template>
          <p style="line-height: 1.8;">{{ faultRecord?.possible_causes || '暂无' }}</p>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">处理建议</div>
          </template>
          <div v-html="faultRecord?.troubleshooting_steps" style="line-height: 1.8;"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">维修记录</div>
          </template>
          <el-form :inline="true" :model="repairForm" style="margin-bottom: 20px;">
            <el-form-item label="维修结果">
              <el-select v-model="repairForm.repair_result" style="width: 150px">
                <el-option label="已修复" value="repaired" />
                <el-option label="无法修复" value="unrepairable" />
                <el-option label="临时处理" value="temporary" />
              </el-select>
            </el-form-item>
            <el-form-item label="维修记录">
              <el-input 
                v-model="repairForm.repair_notes" 
                placeholder="请输入维修记录" 
                style="width: 300px"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="submitRepair">提交</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '../utils/request'

const route = useRoute()
const router = useRouter()
const faultId = computed(() => route.params.id)

const faultRecord = ref(null)

const repairForm = reactive({
  repair_result: 'repaired',
  repair_notes: '',
})

const formatTime = (time) => {
  if (!time) return '-'
  return new Date(time).toLocaleString('zh-CN')
}

const goBack = () => {
  router.push('/faults')
}

const getCategoryType = (category) => {
  const types = {
    sensor: 'warning',
    actuator: 'danger',
    communication: 'info',
    calibration: 'primary',
  }
  return types[category] || 'info'
}

const getCategoryText = (category) => {
  const texts = {
    sensor: '传感器异常',
    actuator: '执行器驱动异常',
    communication: '通讯异常',
    calibration: '标定不一致',
  }
  return texts[category] || category
}

const getSeverityType = (severity) => {
  const types = {
    low: 'info',
    medium: 'warning',
    high: 'danger',
  }
  return types[severity] || 'info'
}

const fetchFaultRecord = async () => {
  try {
    const data = await request.get(`/faults/records/${faultId.value}`)
    faultRecord.value = data
  } catch (err) {
    console.error('获取故障记录失败:', err)
  }
}

const handleClearFault = () => {
  ElMessageBox.confirm('确定要清除此故障吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.put(`/faults/records/${faultId.value}/clear`)
        ElMessage.success('故障已清除')
        fetchFaultRecord()
      } catch (err) {
        console.error('清除故障失败:', err)
      }
    })
    .catch(() => {})
}

const handleRepair = () => {
  ElMessageBox.confirm('确定要标记此故障为已维修吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(async () => {
      try {
        await request.put(`/faults/records/${faultId.value}/repair`, {
          repair_result: 'repaired',
          repair_notes: '维修完成',
        })
        ElMessage.success('维修状态已更新')
        fetchFaultRecord()
      } catch (err) {
        console.error('更新维修状态失败:', err)
      }
    })
    .catch(() => {})
}

const submitRepair = async () => {
  try {
    await request.put(`/faults/records/${faultId.value}/repair`, repairForm)
    ElMessage.success('维修记录已提交')
    repairForm.repair_notes = ''
    fetchFaultRecord()
  } catch (err) {
    console.error('提交维修记录失败:', err)
  }
}

onMounted(() => {
  fetchFaultRecord()
})
</script>

<style scoped>
.card-header {
  font-weight: bold;
  font-size: 16px;
}
</style>
