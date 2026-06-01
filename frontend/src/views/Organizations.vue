<template>
  <div class="organizations-page">
    <h2 class="page-title">责任单位管理</h2>
    
    <el-row :gutter="20">
      <el-col :span="8" v-for="org in organizations" :key="org.id">
        <el-card class="org-card" :body-style="{ padding: '20px' }">
          <div class="org-header">
            <div class="org-icon" :class="'org-' + org.type">
              <el-icon size="28">
                <component :is="getOrgIcon(org.type)" />
              </el-icon>
            </div>
            <div class="org-info">
              <h3 class="org-name">{{ org.name }}</h3>
              <el-tag :type="getOrgTagType(org.type)" size="small">
                {{ getOrgTypeName(org.type) }}
              </el-tag>
            </div>
          </div>
          <el-divider />
          <el-statistic title="待处理问题" :value="getOrgIssueCount(org.id)" class="org-stat" />
          <el-button type="primary" link @click="viewOrgIssues(org)" style="width: 100%; margin-top: 12px">
            查看问题列表
          </el-button>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="issuesDialogVisible" :title="selectedOrg?.name + ' - 问题列表'" width="900px">
      <el-table :data="orgIssues" stripe v-loading="loadingIssues">
        <el-table-column prop="id" label="编号" width="80" />
        <el-table-column prop="title" label="问题标题" min-width="200" />
        <el-table-column prop="floor" label="楼层" width="100" />
        <el-table-column prop="specialty" label="专业" width="100">
          <template #default="{ row }">
            {{ specialtyMap[row.specialty] || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="severity" label="严重程度" width="100">
          <template #default="{ row }">
            <el-tag :type="severityTypeMap[row.severity]">
              {{ severityMap[row.severity] || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="due_date" label="截止日期" width="120" />
        <el-table-column label="超期" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.is_overdue" type="danger" size="small">超期</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewIssue(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="issuesDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { orgsAPI, issuesAPI } from '../api'

const router = useRouter()
const organizations = ref([])
const issues = ref([])
const selectedOrg = ref(null)
const orgIssues = ref([])
const issuesDialogVisible = ref(false)
const loadingIssues = ref(false)

const specialtyMap = {
  architecture: '建筑',
  structure: '结构',
  mep: '机电',
  civil: '土建',
  hvac: '暖通',
  plumbing: '给排水',
  electrical: '电气'
}

const severityMap = {
  critical: '严重',
  major: '主要',
  minor: '次要',
  trivial: '轻微'
}

const severityTypeMap = {
  critical: 'danger',
  major: 'warning',
  minor: 'primary',
  trivial: 'info'
}

const statusMap = {
  draft: '草稿',
  pending: '待派发',
  assigned: '已派发',
  fixed: '待复验',
  rejected: '已退回',
  verified: '已验收',
  reopened: '已重开',
  closed: '已关闭'
}

const statusTypeMap = {
  draft: 'info',
  pending: 'warning',
  assigned: 'primary',
  fixed: 'success',
  rejected: 'danger',
  verified: 'success',
  reopened: 'warning',
  closed: 'info'
}

const getOrgIcon = (type) => {
  const icons = {
    owner: 'User',
    design: 'Edit',
    construction: 'Tools',
    supervision: 'View'
  }
  return icons[type] || 'OfficeBuilding'
}

const getOrgTypeName = (type) => {
  const names = {
    owner: '业主',
    design: '设计',
    construction: '施工',
    supervision: '监理'
  }
  return names[type] || type
}

const getOrgTagType = (type) => {
  const types = {
    owner: 'danger',
    design: 'primary',
    construction: 'success',
    supervision: 'warning'
  }
  return types[type] || 'info'
}

const getOrgIssueCount = (orgId) => {
  return issues.value.filter(i => 
    i.responsible_org_id === orgId && i.status !== 'closed'
  ).length
}

const loadOrganizations = async () => {
  try {
    const res = await orgsAPI.list()
    organizations.value = res.data
  } catch (e) {
    console.error('加载组织失败', e)
  }
}

const loadIssues = async () => {
  try {
    const res = await issuesAPI.list({})
    issues.value = res.data
  } catch (e) {
    console.error('加载问题失败', e)
  }
}

const viewOrgIssues = async (org) => {
  selectedOrg.value = org
  issuesDialogVisible.value = true
  loadingIssues.value = true
  try {
    const res = await orgsAPI.issues(org.id)
    orgIssues.value = res.data
  } catch (e) {
    console.error('加载组织问题失败', e)
  } finally {
    loadingIssues.value = false
  }
}

const viewIssue = (id) => {
  issuesDialogVisible.value = false
  setTimeout(() => {
    router.push(`/issues/${id}`)
  }, 100)
}

onMounted(() => {
  loadOrganizations()
  loadIssues()
})
</script>

<style scoped>
.organizations-page {
  padding-bottom: 20px;
}
.page-title {
  margin: 0 0 20px 0;
  font-size: 20px;
  font-weight: 600;
}
.org-card {
  margin-bottom: 20px;
}
.org-header {
  display: flex;
  align-items: center;
  gap: 16px;
}
.org-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.org-owner { background: linear-gradient(135deg, #f093fb, #f5576c); }
.org-design { background: linear-gradient(135deg, #667eea, #764ba2); }
.org-construction { background: linear-gradient(135deg, #4facfe, #00f2fe); }
.org-supervision { background: linear-gradient(135deg, #f6d365, #fda085); }
.org-info {
  flex: 1;
}
.org-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.org-stat {
  text-align: center;
  margin-bottom: 8px;
}
.text-muted {
  color: #909399;
}
</style>
