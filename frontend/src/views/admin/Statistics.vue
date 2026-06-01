<template>
  <div class="page-container">
    <h2 style="margin-bottom: 20px">数据统计</h2>
    
    <el-row :gutter="20" style="margin-bottom: 20px">
      <el-col :span="6">
        <div class="card text-center">
          <div style="font-size: 14px; color: #666; margin-bottom: 10px">社团总数</div>
          <div style="font-size: 32px; font-weight: bold; color: #409EFF">{{ overview.clubCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card text-center">
          <div style="font-size: 14px; color: #666; margin-bottom: 10px">待审批社团</div>
          <div style="font-size: 32px; font-weight: bold; color: #E6A23C">{{ overview.pendingClubs }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card text-center">
          <div style="font-size: 14px; color: #666; margin-bottom: 10px">学生用户</div>
          <div style="font-size: 32px; font-weight: bold; color: #67C23A">{{ overview.studentCount }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="card text-center">
          <div style="font-size: 14px; color: #666; margin-bottom: 10px">已批活动</div>
          <div style="font-size: 32px; font-weight: bold; color: #909399">{{ overview.activityCount }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card mb-20">
          <h3 style="margin-bottom: 15px">社团成员统计</h3>
          <el-table :data="memberStats" style="width: 100%">
            <el-table-column prop="name" label="社团名称" />
            <el-table-column prop="member_count" label="当前成员" />
            <el-table-column prop="max_members" label="最大人数" />
            <el-table-column label="成员占比">
              <template #default="{ row }">
                <el-progress :percentage="Math.round(row.member_count / row.max_members * 100)" :stroke-width="10" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card mb-20">
          <h3 style="margin-bottom: 15px">经费统计</h3>
          <el-table :data="fundStats" style="width: 100%">
            <el-table-column prop="name" label="社团名称" />
            <el-table-column prop="balance" label="账户余额">
              <template #default="{ row }">¥{{ row.balance }}</template>
            </el-table-column>
            <el-table-column prop="total_income" label="累计收入">
              <template #default="{ row }">¥{{ row.total_income }}</template>
            </el-table-column>
            <el-table-column prop="total_expense" label="累计支出">
              <template #default="{ row }">¥{{ row.total_expense }}</template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>

    <div class="card">
      <h3 style="margin-bottom: 15px">用户列表</h3>
      <el-table :data="users" style="width: 100%">
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="role" label="角色">
          <template #default="{ row }">
            <el-tag size="small" :type="roleType(row.role)">{{ roleText(row.role) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="student_id" label="学号" />
        <el-table-column prop="phone" label="电话" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="created_at" label="注册时间" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { stats } from '@/api'

const overview = ref({ clubCount: 0, pendingClubs: 0, studentCount: 0, activityCount: 0 })
const memberStats = ref([])
const fundStats = ref([])
const users = ref([])

const loadData = async () => {
  try {
    const [overviewRes, memberRes, fundRes, usersRes] = await Promise.all([
      stats.overview(),
      stats.membersByClub(),
      stats.fundsOverview(),
      stats.users()
    ])
    overview.value = overviewRes.data
    memberStats.value = memberRes.data
    fundStats.value = fundRes.data
    users.value = usersRes.data
  } catch (err) {
    console.error(err)
  }
}

const roleType = (role) => {
  const map = { admin: 'danger', teacher: 'warning', leader: 'success', student: 'info' }
  return map[role] || 'info'
}

const roleText = (role) => {
  const map = { admin: '管理员', teacher: '指导老师', leader: '负责人', student: '学生' }
  return map[role] || role
}

onMounted(loadData)
</script>
