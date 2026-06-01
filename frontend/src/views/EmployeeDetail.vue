<template>
  <div class="page-container">
    <div class="page-header">
      <div style="display: flex; align-items: center; gap: 12px;">
        <el-button @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1 class="page-title">员工详情 - {{ employee?.name }} ({{ employee?.employee_no }})</h1>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="24">
        <el-card shadow="hover" style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: 600;">基本信息</span>
          </template>
          <el-descriptions :column="4" border>
            <el-descriptions-item label="工号">{{ employee?.employee_no }}</el-descriptions-item>
            <el-descriptions-item label="姓名">{{ employee?.name }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ employee?.gender }}</el-descriptions-item>
            <el-descriptions-item label="部门">{{ employee?.department }}</el-descriptions-item>
            <el-descriptions-item label="岗位">{{ employee?.position_name }}</el-descriptions-item>
            <el-descriptions-item label="技能等级">Lv.{{ employee?.skill_level }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="employee?.status === 'active' ? 'success' : 'info'">
                {{ employee?.status === 'active' ? '在职' : '离职' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="禁岗状态">
              <el-tag v-if="employee?.forbidden_post" type="danger">是</el-tag>
              <span v-else>否</span>
            </el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="证书管理" name="certificates">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
          <span style="font-weight: 600;">证书列表</span>
          <el-button size="small" type="primary" @click="showCertDialog = true">添加证书</el-button>
        </div>
        <el-table :data="employee?.certificates || []" stripe>
          <el-table-column prop="certificate_type" label="证书类型" />
          <el-table-column prop="certificate_no" label="证书编号" />
          <el-table-column prop="issue_date" label="发证日期" width="120" />
          <el-table-column prop="expire_date" label="到期日期" width="120">
            <template #default="{ row }">
              <span :class="isExpired(row.expire_date) ? 'warning-text' : ''">{{ row.expire_date }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="issuer" label="发证机构" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'valid' ? 'success' : 'danger'">
                {{ row.status === 'valid' ? '有效' : '无效' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="技能信息" name="skills">
        <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
          <span style="font-weight: 600;">技能列表</span>
          <el-button size="small" type="primary" @click="showSkillDialog = true">添加技能</el-button>
        </div>
        <el-table :data="employee?.skills || []" stripe>
          <el-table-column prop="skill_name" label="技能名称" />
          <el-table-column prop="skill_level" label="技能等级" width="120">
            <template #default="{ row }">
              <el-tag type="primary">Lv.{{ row.skill_level }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="acquired_date" label="获得日期" width="120" />
          <el-table-column prop="expire_date" label="到期日期" width="120" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="培训记录" name="training">
        <el-table :data="employee?.trainingRecords || []" stripe>
          <el-table-column prop="course_name" label="培训课程" />
          <el-table-column prop="training_date" label="培训日期" width="120" />
          <el-table-column prop="sign_in_status" label="签到状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.sign_in_status === 'signed' ? 'success' : 'info'">
                {{ row.sign_in_status === 'signed' ? '已签到' : '待签到' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="score" label="成绩" width="80" />
          <el-table-column prop="pass_status" label="通过状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.pass_status === 'pass' ? 'success' : row.pass_status === 'fail' ? 'danger' : 'warning'">
                {{ row.pass_status === 'pass' ? '通过' : row.pass_status === 'fail' ? '未通过' : '待考' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="retake_count" label="补考次数" width="100" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="考试记录" name="exams">
        <el-table :data="employee?.exams || []" stripe>
          <el-table-column prop="exam_name" label="考试名称" />
          <el-table-column prop="exam_type" label="考试类型" width="100" />
          <el-table-column prop="exam_date" label="考试日期" width="120" />
          <el-table-column prop="score" label="成绩" width="80" />
          <el-table-column prop="pass_status" label="通过状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.pass_status === 'pass' ? 'success' : row.pass_status === 'fail' ? 'danger' : 'warning'">
                {{ row.pass_status === 'pass' ? '通过' : row.pass_status === 'fail' ? '未通过' : '待考' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="retake_count" label="补考次数" width="100" />
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="上岗授权" name="authorizations">
        <el-table :data="employee?.authorizations || []" stripe>
          <el-table-column prop="authorization_type" label="授权类型" />
          <el-table-column prop="position_name" label="授权岗位" />
          <el-table-column prop="applicant" label="申请人" width="100" />
          <el-table-column prop="approver" label="审批人" width="100" />
          <el-table-column prop="start_date" label="生效日期" width="120" />
          <el-table-column prop="end_date" label="到期日期" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.status === 'approved' ? 'success' : row.status === 'rejected' ? 'danger' : 'warning'">
                {{ row.status === 'approved' ? '已通过' : row.status === 'rejected' ? '已拒绝' : '待审批' }}
              </el-tag>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="showCertDialog" title="添加证书" width="500px">
      <el-form :model="certForm" label-width="100px">
        <el-form-item label="证书类型">
          <el-input v-model="certForm.certificate_type" />
        </el-form-item>
        <el-form-item label="证书编号">
          <el-input v-model="certForm.certificate_no" />
        </el-form-item>
        <el-form-item label="发证日期">
          <el-date-picker v-model="certForm.issue_date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="到期日期">
          <el-date-picker v-model="certForm.expire_date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
        <el-form-item label="发证机构">
          <el-input v-model="certForm.issuer" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCertDialog = false">取消</el-button>
        <el-button type="primary" @click="saveCertificate">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showSkillDialog" title="添加技能" width="500px">
      <el-form :model="skillForm" label-width="100px">
        <el-form-item label="技能名称">
          <el-input v-model="skillForm.skill_name" />
        </el-form-item>
        <el-form-item label="技能等级">
          <el-select v-model="skillForm.skill_level" style="width: 100%;">
            <el-option v-for="n in 5" :key="n" :label="`Lv.${n}`" :value="n" />
          </el-select>
        </el-form-item>
        <el-form-item label="获得日期">
          <el-date-picker v-model="skillForm.acquired_date" type="date" value-format="YYYY-MM-DD" style="width: 100%;" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSkillDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSkill">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { employeesAPI } from '@/api'

const route = useRoute()
const employee = ref(null)
const activeTab = ref('certificates')
const showCertDialog = ref(false)
const showSkillDialog = ref(false)

const certForm = ref({
  certificate_type: '',
  certificate_no: '',
  issue_date: '',
  expire_date: '',
  issuer: ''
})

const skillForm = ref({
  skill_name: '',
  skill_level: 1,
  acquired_date: ''
})

const isExpired = (date) => {
  if (!date) return false
  return dayjs(date).isBefore(dayjs(), 'day')
}

const loadEmployee = async () => {
  try {
    const res = await employeesAPI.get(route.params.id)
    employee.value = res.data
  } catch (err) {
    ElMessage.error('加载员工详情失败')
  }
}

const saveCertificate = async () => {
  try {
    await employeesAPI.addCertificate(route.params.id, certForm.value)
    ElMessage.success('添加成功')
    showCertDialog.value = false
    loadEmployee()
  } catch (err) {
    ElMessage.error('添加失败')
  }
}

const saveSkill = async () => {
  try {
    await employeesAPI.addSkill(route.params.id, skillForm.value)
    ElMessage.success('添加成功')
    showSkillDialog.value = false
    loadEmployee()
  } catch (err) {
    ElMessage.error('添加失败')
  }
}

onMounted(() => {
  loadEmployee()
})
</script>
