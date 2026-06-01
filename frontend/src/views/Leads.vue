<template>
  <div class="page-container">
    <div class="page-header">
      <div class="page-title">线索列表</div>
      <el-button type="primary" @click="openDialog()">
        <el-icon><plus /></el-icon>
        新增线索
      </el-button>
    </div>

    <div class="search-bar">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width: 120px">
            <el-option label="新建" value="new" />
            <el-option label="跟进中" value="following" />
            <el-option label="已转化" value="converted" />
          </el-select>
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="searchForm.follow_person" placeholder="请输入" clearable style="width: 120px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadLeads">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="leadList" border style="width: 100%">
      <el-table-column label="重复" width="60">
        <template #default="{ row }">
          <el-tag v-if="row.is_duplicate" type="warning" size="small">重复</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="company_name" label="企业名称" min-width="140">
        <template #default="{ row }">
          <el-link type="primary" @click="$router.push(`/leads/${row.id}`)">{{ row.company_name }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="contact_person" label="联系人" width="100" />
      <el-table-column prop="phone" label="电话" width="120" />
      <el-table-column prop="company_scale" label="企业规模" width="100" />
      <el-table-column prop="industry" label="行业" width="100" />
      <el-table-column prop="required_area" label="需求面积" width="100">
        <template #default="{ row }">{{ row.required_area }}㎡</template>
      </el-table-column>
      <el-table-column prop="budget" label="预算" width="100">
        <template #default="{ row }">{{ row.budget }}元/月</template>
      </el-table-column>
      <el-table-column prop="source_channel" label="来源" width="100" />
      <el-table-column prop="follow_person" label="负责人" width="100" />
      <el-table-column prop="last_follow_time" label="最后跟进" width="160">
        <template #default="{ row }">
          <span v-if="row.last_follow_time">{{ formatDate(row.last_follow_time) }}</span>
          <span v-else style="color: #c0c4cc">未跟进</span>
        </template>
      </el-table-column>
      <el-table-column prop="next_follow_time" label="下次跟进" width="160">
        <template #default="{ row }">
          <span v-if="row.next_follow_time" style="color: #e6a23c">{{ formatDate(row.next_follow_time) }}</span>
          <span v-else style="color: #c0c4cc">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <span :class="['status-tag', `status-${row.status}`]">{{ statusLabels[row.status] || row.status }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" width="160">
        <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <div class="table-actions">
            <el-button size="small" @click="openFollowDialog(row)">跟进</el-button>
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="currentLead.id ? '编辑线索' : '新增线索'" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="企业名称" required>
          <el-input v-model="form.company_name" placeholder="请输入企业名称" @blur="checkDuplicate" />
          <div v-if="duplicateWarning" style="color: #e6a23c; font-size: 12px; margin-top: 4px">
            ⚠️ 检测到相似企业，请确认是否重复
          </div>
        </el-form-item>
        <el-form-item label="联系人">
          <el-input v-model="form.contact_person" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" @blur="checkDuplicate" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="企业规模">
          <el-select v-model="form.company_scale" style="width: 100%">
            <el-option label="微型(1-20人)" value="micro" />
            <el-option label="小型(20-100人)" value="small" />
            <el-option label="中型(100-500人)" value="medium" />
            <el-option label="大型(500人以上)" value="large" />
          </el-select>
        </el-form-item>
        <el-form-item label="行业">
          <el-input v-model="form.industry" />
        </el-form-item>
        <el-form-item label="需求面积">
          <el-input-number v-model="form.required_area" :min="0" />
          <span style="margin-left: 8px">㎡</span>
        </el-form-item>
        <el-form-item label="预算">
          <el-input-number v-model="form.budget" :min="0" />
          <span style="margin-left: 8px">元/月</span>
        </el-form-item>
        <el-form-item label="来源渠道">
          <el-select v-model="form.source_channel" style="width: 100%">
            <el-option label="网络推广" value="online" />
            <el-option label="转介绍" value="referral" />
            <el-option label="上门咨询" value="walkin" />
            <el-option label="招商活动" value="event" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进负责人">
          <el-input v-model="form.follow_person" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="新建" value="new" />
            <el-option label="跟进中" value="following" />
            <el-option label="已转化" value="converted" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="followDialogVisible" title="添加跟进记录" width="500px">
      <el-form :model="followForm" label-width="100px">
        <el-form-item label="跟进类型">
          <el-select v-model="followForm.follow_type" style="width: 100%">
            <el-option label="电话" value="phone" />
            <el-option label="微信" value="wechat" />
            <el-option label="面谈" value="meeting" />
            <el-option label="邮件" value="email" />
          </el-select>
        </el-form-item>
        <el-form-item label="跟进时间">
          <el-date-picker v-model="followForm.follow_time" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" style="width: 100%" />
        </el-form-item>
        <el-form-item label="跟进内容" required>
          <el-input v-model="followForm.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="客户反馈">
          <el-input v-model="followForm.feedback" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="跟进人">
          <el-input v-model="followForm.follow_person" />
        </el-form-item>
        <el-form-item label="下次跟进">
          <el-date-picker 
            v-model="followForm.next_follow_time" 
            type="datetime" 
            value-format="YYYY-MM-DD HH:mm:ss" 
            :min-date="new Date()"
            :disabled-date="disabledNextFollowDate"
            style="width: 100%" 
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="followDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveFollow">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { leads as leadsApi } from '@/api'

const leadList = ref([])
const dialogVisible = ref(false)
const followDialogVisible = ref(false)
const currentLead = ref({})
const duplicateWarning = ref(false)

const statusLabels = {
  new: '新建',
  following: '跟进中',
  converted: '已转化'
}

const searchForm = reactive({
  status: '',
  follow_person: ''
})

const form = reactive({
  id: null,
  company_name: '',
  contact_person: '',
  phone: '',
  email: '',
  company_scale: '',
  industry: '',
  required_area: 0,
  budget: 0,
  source_channel: '',
  follow_person: '',
  status: 'new',
  description: ''
})

const followForm = reactive({
  follow_type: 'phone',
  follow_time: '',
  content: '',
  feedback: '',
  follow_person: '',
  next_follow_time: ''
})

function formatDate(date) {
  return date ? date.replace('T', ' ').substring(0, 16) : ''
}

async function loadLeads() {
  const params = {
    status: searchForm.status || undefined,
    follow_person: searchForm.follow_person || undefined
  }
  const data = await leadsApi.list(params)
  leadList.value = data
}

function resetSearch() {
  searchForm.status = ''
  searchForm.follow_person = ''
  loadLeads()
}

async function checkDuplicate() {
  if (form.company_name || form.phone) {
    const result = await leadsApi.checkDuplicate({
      company_name: form.company_name,
      phone: form.phone
    })
    duplicateWarning.value = result.hasDuplicate
  }
}

function openDialog(row = null) {
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, { id: null, company_name: '', contact_person: '', phone: '', email: '', company_scale: '', industry: '', required_area: 0, budget: 0, source_channel: '', follow_person: '', status: 'new', description: '' })
  }
  duplicateWarning.value = false
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.company_name) {
    ElMessage.warning('请输入企业名称')
    return
  }
  if (form.id) {
    await leadsApi.update(form.id, form)
    ElMessage.success('更新成功')
  } else {
    await leadsApi.create(form)
    ElMessage.success('创建成功')
  }
  dialogVisible.value = false
  loadLeads()
}

async function handleDelete(row) {
  try {
    await ElMessageBox.confirm('确定要删除该线索吗？', '提示', { type: 'warning' })
    await leadsApi.delete(row.id)
    ElMessage.success('删除成功')
    loadLeads()
  } catch {
  }
}

function disabledNextFollowDate(time) {
  return time.getTime() < Date.now() - 86400000
}

function openFollowDialog(row) {
  currentLead.value = row
  Object.assign(followForm, { follow_type: 'phone', follow_time: new Date().toISOString().slice(0, 19).replace('T', ' '), content: '', feedback: '', follow_person: row.follow_person || '', next_follow_time: '' })
  followDialogVisible.value = true
}

async function saveFollow() {
  if (!followForm.content) {
    ElMessage.warning('请输入跟进内容')
    return
  }
  if (followForm.next_follow_time) {
    const nextFollowTime = new Date(followForm.next_follow_time).getTime()
    const followTime = new Date(followForm.follow_time).getTime()
    const now = Date.now()
    if (nextFollowTime < followTime) {
      ElMessage.warning('下次跟进时间不能早于跟进时间')
      return
    }
    if (nextFollowTime < now) {
      ElMessage.warning('下次跟进时间不能早于当前时间')
      return
    }
  }
  await leadsApi.addFollowup(currentLead.value.id, followForm)
  ElMessage.success('跟进记录已添加')
  followDialogVisible.value = false
  loadLeads()
}

onMounted(() => {
  loadLeads()
})
</script>
