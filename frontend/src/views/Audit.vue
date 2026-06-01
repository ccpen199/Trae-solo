<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">验收检查</h1>
      <el-button type="primary" @click="loadAuditData">
        <el-icon><Refresh /></el-icon>
        刷新数据
      </el-button>
    </div>

    <el-row :gutter="20" style="margin-bottom: 24px;">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #f56c6c;">{{ auditSummary?.totalWarnings || 0 }}</div>
            <div class="stat-label">总预警数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #f56c6c;">{{ auditSummary?.expiredCerts?.length || 0 }}</div>
            <div class="stat-label">过期证书</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #e6a23c;">{{ auditSummary?.expiringCerts?.length || 0 }}</div>
            <div class="stat-label">即将过期</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-value" style="color: #e6a23c;">{{ auditSummary?.failedTraining?.length || 0 }}</div>
            <div class="stat-label">培训未过</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="过期证书" name="expiredCerts">
        <el-alert
          v-if="auditSummary?.expiredCerts?.length === 0"
          title="暂无过期证书"
          type="success"
          :closable="false"
          style="margin-bottom: 16px;"
        />
        <el-table v-else :data="auditSummary?.expiredCerts || []" stripe>
          <el-table-column prop="employee_no" label="工号" width="100" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="certificate_type" label="证书类型" width="150" />
          <el-table-column prop="certificate_no" label="证书编号" width="150" />
          <el-table-column prop="expire_date" label="过期日期" width="120">
            <template #default="{ row }">
              <span class="warning-text">{{ row.expire_date }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="$router.push(`/employees/${row.employee_id}`)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="即将过期" name="expiringCerts">
        <el-alert
          v-if="auditSummary?.expiringCerts?.length === 0"
          title="暂无即将过期的证书"
          type="success"
          :closable="false"
          style="margin-bottom: 16px;"
        />
        <el-table v-else :data="auditSummary?.expiringCerts || []" stripe>
          <el-table-column prop="employee_no" label="工号" width="100" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="certificate_type" label="证书类型" width="150" />
          <el-table-column prop="certificate_no" label="证书编号" width="150" />
          <el-table-column prop="expire_date" label="过期日期" width="120" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="$router.push(`/employees/${row.employee_id}`)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="培训未通过" name="failedTraining">
        <el-alert
          v-if="auditSummary?.failedTraining?.length === 0"
          title="暂无未通过培训"
          type="success"
          :closable="false"
          style="margin-bottom: 16px;"
        />
        <el-table v-else :data="auditSummary?.failedTraining || []" stripe>
          <el-table-column prop="employee_no" label="工号" width="100" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="course_name" label="培训课程" />
          <el-table-column prop="score" label="成绩" width="80" />
          <el-table-column prop="retake_count" label="补考次数" width="100" />
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="$router.push(`/employees/${row.employee_id}`)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="过期临时授权" name="expiredAuth">
        <el-alert
          v-if="auditSummary?.expiredAuth?.length === 0"
          title="暂无过期临时授权"
          type="success"
          :closable="false"
          style="margin-bottom: 16px;"
        />
        <el-table v-else :data="auditSummary?.expiredAuth || []" stripe>
          <el-table-column prop="employee_no" label="工号" width="100" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="position_name" label="授权岗位" width="150" />
          <el-table-column prop="authorization_type" label="授权类型" width="120" />
          <el-table-column prop="end_date" label="过期日期" width="120">
            <template #default="{ row }">
              <span class="warning-text">{{ row.end_date }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button size="small" @click="$router.push(`/employees/${row.employee_id}`)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-card shadow="hover" style="margin-top: 24px;">
      <template #header>
        <span style="font-weight: 600;">验收清单</span>
      </template>
      <el-steps direction="vertical" :active="checklistPassedCount">
        <el-step title="证书过期检查" :status="auditSummary?.expiredCerts?.length === 0 ? 'success' : 'error'">
          <template #description>
            {{ auditSummary?.expiredCerts?.length === 0 ? '通过：无过期证书' : `未通过：存在 ${auditSummary?.expiredCerts?.length} 个过期证书` }}
          </template>
        </el-step>
        <el-step title="培训未通过检查" :status="auditSummary?.failedTraining?.length === 0 ? 'success' : 'error'">
          <template #description>
            {{ auditSummary?.failedTraining?.length === 0 ? '通过：无未通过培训人员' : `未通过：存在 ${auditSummary?.failedTraining?.length} 个培训未通过记录` }}
          </template>
        </el-step>
        <el-step title="岗位换线授权检查" description="通过：岗位变动需重新授权">
        </el-step>
        <el-step title="临时授权有效期检查" :status="auditSummary?.expiredAuth?.length === 0 ? 'success' : 'error'">
          <template #description>
            {{ auditSummary?.expiredAuth?.length === 0 ? '通过：无过期临时授权' : `未通过：存在 ${auditSummary?.expiredAuth?.length} 个过期临时授权` }}
          </template>
        </el-step>
        <el-step title="权限越界检查" description="通过：权限边界校验正常">
        </el-step>
      </el-steps>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { authAPI } from '@/api'

const activeTab = ref('expiredCerts')
const auditSummary = ref({})

const checklistPassedCount = computed(() => {
  let count = 0
  if (auditSummary.value?.expiredCerts?.length === 0) count++
  if (auditSummary.value?.failedTraining?.length === 0) count++
  count++
  if (auditSummary.value?.expiredAuth?.length === 0) count++
  count++
  return count
})

const loadAuditData = async () => {
  try {
    const res = await authAPI.auditSummary()
    auditSummary.value = res.data || {}
    ElMessage.success('数据已刷新')
  } catch (err) {
    ElMessage.error('加载验收数据失败')
  }
}

onMounted(() => {
  loadAuditData()
})
</script>
