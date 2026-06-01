<template>
  <div class="issue-detail">
    <div class="page-header">
      <el-button @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <h2 class="page-title">问题详情 #{{ issue?.id }}</h2>
      <el-tag :type="statusTypeMap[issue?.status]" size="large">
        {{ statusMap[issue?.status] }}
      </el-tag>
    </div>

    <el-row :gutter="20">
      <el-col :span="16">
        <el-card class="info-card">
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="问题标题" :span="2">{{ issue?.title }}</el-descriptions-item>
            <el-descriptions-item label="专业">{{ specialtyMap[issue?.specialty] || '-' }}</el-descriptions-item>
            <el-descriptions-item label="问题类型">{{ typeMap[issue?.issue_type] || '-' }}</el-descriptions-item>
            <el-descriptions-item label="严重程度">
              <el-tag :type="severityTypeMap[issue?.severity]">
                {{ severityMap[issue?.severity] || '-' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="责任单位">{{ issue?.responsible_org_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="楼栋">{{ issue?.building || '-' }}</el-descriptions-item>
            <el-descriptions-item label="楼层">{{ issue?.floor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="模型位置">{{ issue?.model_location || '-' }}</el-descriptions-item>
            <el-descriptions-item label="图纸版本">{{ issue?.drawing_version || '-' }}</el-descriptions-item>
            <el-descriptions-item label="整改期限">{{ issue?.due_date || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建人">{{ issue?.creator_name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ issue?.created_at }}</el-descriptions-item>
            <el-descriptions-item label="问题描述" :span="2">{{ issue?.description || '-' }}</el-descriptions-item>
            <el-descriptions-item v-if="issue?.site_evidence" label="整改证据" :span="2">
              {{ issue.site_evidence }}
            </el-descriptions-item>
            <el-descriptions-item v-if="issue?.design_response" label="设计回复" :span="2">
              {{ issue.design_response }}
            </el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="flow-card">
          <template #header>
            <span>协同流程</span>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(item, index) in issue?.flow"
              :key="item.id"
              :timestamp="item.created_at"
              :type="getFlowType(item.action)"
              :icon="getFlowIcon(item.action)"
            >
              <div class="flow-item">
                <div class="flow-title">
                  <strong>{{ flowActionMap[item.action] || item.action }}</strong>
                  <span class="flow-operator">{{ item.operator_name }}</span>
                </div>
                <div v-if="item.comment" class="flow-comment">{{ item.comment }}</div>
                <div v-if="item.from_org_name || item.to_org_name" class="flow-orgs">
                  <span v-if="item.from_org_name">来自: {{ item.from_org_name }}</span>
                  <span v-if="item.to_org_name"> → 发给: {{ item.to_org_name }}</span>
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="action-card">
          <template #header>
            <span>流程操作</span>
          </template>
          <div class="action-buttons">
            <el-button type="primary" @click="openAction('assign')" v-if="issue?.status === 'pending' && canAssign">
              派发问题
            </el-button>
            <el-button type="warning" @click="openAction('reassign')" v-if="issue?.status === 'assigned' && canAssign">
              转派责任
            </el-button>
            <el-button type="success" @click="openAction('fix')" v-if="(issue?.status === 'assigned' || issue?.status === 'reopened' || issue?.status === 'rejected') && canFixIssue">
              提交整改
            </el-button>
            <el-button type="danger" @click="openAction('reject')" v-if="issue?.status === 'fixed' && canVerifyIssue">
              退回整改
            </el-button>
            <el-button type="primary" @click="openAction('verify')" v-if="issue?.status === 'fixed' && canVerifyIssue">
              复验确认
            </el-button>
            <el-button type="info" @click="openAction('close')" v-if="issue?.status === 'verified' && canCloseIssue">
              关闭问题
            </el-button>
            <el-empty v-if="!hasAnyAction" description="当前角色无操作权限" :image-size="80" />
          </div>
        </el-card>

        <el-card class="related-card">
          <template #header>
            <span>关联信息</span>
          </template>
          <div class="related-item">
            <div class="related-label">图纸版本</div>
            <div class="related-value">{{ issue?.drawing_version || '暂无' }}</div>
          </div>
          <div class="related-item">
            <div class="related-label">设计回复</div>
            <div class="related-value">{{ issue?.design_response || '暂无' }}</div>
          </div>
          <div class="related-item">
            <div class="related-label">现场证据</div>
            <div class="related-value">{{ issue?.site_evidence || '暂无' }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="actionDialogVisible" :title="actionDialogTitle" width="500px">
      <el-form :model="actionForm" label-width="100px">
        <el-form-item v-if="currentAction === 'assign' || currentAction === 'reassign'" label="责任单位">
          <el-select v-model="actionForm.responsible_org_id" placeholder="请选择责任单位" style="width: 100%">
            <el-option v-for="org in organizations" :key="org.id" :label="org.name" :value="org.id" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="currentAction === 'assign'" label="整改期限">
          <el-date-picker v-model="actionForm.due_date" type="date" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item v-if="currentAction === 'verify'" label="是否通过">
          <el-radio-group v-model="actionForm.passed">
            <el-radio :value="true">通过</el-radio>
            <el-radio :value="false">不通过</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="currentAction === 'verify' && !actionForm.passed" label="设计回复">
          <el-input v-model="actionForm.design_response" type="textarea" :rows="2" placeholder="请输入设计回复意见" />
        </el-form-item>
        <el-form-item v-if="currentAction === 'fix'" label="整改证据">
          <el-input v-model="actionForm.attachment" type="textarea" :rows="2" placeholder="请输入现场整改证据说明" />
        </el-form-item>
        <el-form-item label="处理意见">
          <el-input v-model="actionForm.comment" type="textarea" :rows="3" placeholder="请输入处理意见" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAction">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { issuesAPI, orgsAPI } from '../api'
import { useUserStore } from '../stores/user'

const route = useRoute()
const userStore = useUserStore()
const issue = ref(null)
const organizations = ref([])
const actionDialogVisible = ref(false)
const currentAction = ref('')
const actionForm = ref({
  responsible_org_id: null,
  due_date: '',
  comment: '',
  passed: true,
  design_response: '',
  attachment: ''
})

const canAssign = computed(() => userStore.canAssign())
const canFixIssue = computed(() => {
  if (!issue.value) return false
  return userStore.canFix(issue.value)
})
const canVerifyIssue = computed(() => userStore.canVerify())
const canCloseIssue = computed(() => userStore.canClose())

const hasAnyAction = computed(() => {
  if (!issue.value) return false
  const s = issue.value.status
  return (s === 'pending' && canAssign.value) ||
         (s === 'assigned' && (canAssign.value || canFixIssue.value)) ||
         ((s === 'reopened' || s === 'rejected') && canFixIssue.value) ||
         (s === 'fixed' && canVerifyIssue.value) ||
         (s === 'verified' && canCloseIssue.value)
})

const actionDialogTitle = computed(() => {
  const titles = {
    assign: '派发问题',
    reassign: '转派责任',
    fix: '提交整改',
    reject: '退回整改',
    verify: '复验确认',
    close: '关闭问题'
  }
  return titles[currentAction.value] || '流程处理'
})

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

const specialtyMap = {
  architecture: '建筑',
  structure: '结构',
  mep: '机电',
  civil: '土建',
  hvac: '暖通',
  plumbing: '给排水',
  electrical: '电气'
}

const typeMap = {
  design: '设计问题',
  construction: '施工问题',
  material: '材料问题',
  safety: '安全问题',
  quality: '质量问题',
  conflict: '碰撞冲突'
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

const flowActionMap = {
  create: '创建问题',
  assign: '派发问题',
  reassign: '转派责任',
  fix: '提交整改',
  reject: '退回整改',
  verify_pass: '复验通过',
  verify_fail: '复验不通过',
  close: '关闭问题'
}

const getFlowType = (action) => {
  const typeMap = {
    create: 'primary',
    assign: 'primary',
    reassign: 'warning',
    fix: 'success',
    reject: 'danger',
    verify_pass: 'success',
    verify_fail: 'danger',
    close: 'info'
  }
  return typeMap[action] || ''
}

const getFlowIcon = (action) => {
  const iconMap = {
    create: 'Plus',
    assign: 'Share',
    reassign: 'Switch',
    fix: 'Check',
    reject: 'Close',
    verify_pass: 'CircleCheck',
    verify_fail: 'CircleClose',
    close: 'Lock'
  }
  return iconMap[action] || ''
}

const loadIssue = async () => {
  try {
    const res = await issuesAPI.get(route.params.id)
    issue.value = res.data
  } catch (e) {
    ElMessage.error('加载问题详情失败')
  }
}

const loadOrganizations = async () => {
  try {
    const res = await orgsAPI.list()
    organizations.value = res.data
  } catch (e) {
    console.error('加载组织失败', e)
  }
}

const openAction = (action) => {
  currentAction.value = action
  actionForm.value = {
    responsible_org_id: null,
    due_date: '',
    comment: '',
    passed: true,
    design_response: '',
    attachment: ''
  }
  actionDialogVisible.value = true
}

const submitAction = async () => {
  try {
    const id = issue.value.id
    switch (currentAction.value) {
      case 'assign':
        await issuesAPI.assign(id, {
          responsible_org_id: actionForm.value.responsible_org_id,
          due_date: actionForm.value.due_date,
          comment: actionForm.value.comment
        })
        break
      case 'reassign':
        await issuesAPI.reassign(id, {
          responsible_org_id: actionForm.value.responsible_org_id,
          comment: actionForm.value.comment
        })
        break
      case 'fix':
        await issuesAPI.fix(id, {
          comment: actionForm.value.comment,
          attachment: actionForm.value.attachment
        })
        break
      case 'reject':
        await issuesAPI.reject(id, { comment: actionForm.value.comment })
        break
      case 'verify':
        await issuesAPI.verify(id, {
          passed: actionForm.value.passed,
          comment: actionForm.value.comment,
          design_response: actionForm.value.design_response
        })
        break
      case 'close':
        await issuesAPI.close(id, { comment: actionForm.value.comment })
        break
    }
    ElMessage.success('操作成功')
    actionDialogVisible.value = false
    loadIssue()
  } catch (e) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  }
}

onMounted(() => {
  loadIssue()
  loadOrganizations()
})
</script>

<style scoped>
.issue-detail {
  padding-bottom: 20px;
}
.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  flex: 1;
}
.info-card {
  margin-bottom: 20px;
}
.flow-card {
  margin-bottom: 20px;
}
.flow-item {
  padding: 8px 0;
}
.flow-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 4px;
}
.flow-operator {
  font-size: 12px;
  color: #909399;
}
.flow-comment {
  color: #606266;
  margin-bottom: 4px;
}
.flow-orgs {
  font-size: 12px;
  color: #909399;
}
.action-card {
  margin-bottom: 20px;
}
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.action-buttons .el-button {
  width: 100%;
}
.related-item {
  padding: 12px 0;
  border-bottom: 1px solid #ebeef5;
}
.related-item:last-child {
  border-bottom: none;
}
.related-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}
.related-value {
  color: #303133;
}
</style>
