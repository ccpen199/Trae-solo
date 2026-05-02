<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { request } from '@/utils/api'

const loading = ref(false)
const members = ref<any[]>([])
const searchQuery = ref('')
const pagination = ref({
  page: 1,
  limit: 20,
  total: 0,
})

const filteredMembers = computed(() => {
  if (!searchQuery.value) return members.value
  const query = searchQuery.value.toLowerCase()
  return members.value.filter(
    (m) =>
      m.name.toLowerCase().includes(query) ||
      m.phone.includes(query) ||
      m.memberNumber.includes(query)
  )
})

const levelColors: Record<string, string> = {
  bronze: '#cd7f32',
  silver: '#c0c0c0',
  gold: '#ffd700',
  platinum: '#e5e4e2',
  diamond: '#b9f2ff',
}

const levelLabels: Record<string, string> = {
  bronze: '青铜',
  silver: '白银',
  gold: '黄金',
  platinum: '铂金',
  diamond: '钻石',
}

const statusColors: Record<string, string> = {
  active: 'success',
  inactive: 'info',
  suspended: 'danger',
}

const statusLabels: Record<string, string> = {
  active: '正常',
  inactive: '禁用',
  suspended: '冻结',
}

const fetchMembers = async () => {
  loading.value = true
  try {
    const result = await request.get('/members/search', {
      params: {
        page: pagination.value.page,
        limit: pagination.value.limit,
      },
    })
    members.value = result.data
    pagination.value.total = result.total
  } catch (error) {
    ElMessage.error('加载会员数据失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchMembers()
}

const handleSizeChange = (size: number) => {
  pagination.value.limit = size
  pagination.value.page = 1
  fetchMembers()
}

const handleCurrentChange = (page: number) => {
  pagination.value.page = page
  fetchMembers()
}

const toggleStatus = async (member: any, status: string) => {
  try {
    await request.put(`/members/${member.id}`, { status })
    ElMessage.success('状态已更新')
    fetchMembers()
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const suspendMember = async (member: any) => {
  try {
    await ElMessageBox.confirm(`确定要冻结会员 "${member.name}" 吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await toggleStatus(member, 'suspended')
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error.response?.data?.message || '操作失败')
    }
  }
}

const activateMember = async (member: any) => {
  try {
    await toggleStatus(member, 'active')
  } catch (error: any) {
    ElMessage.error(error.response?.data?.message || '操作失败')
  }
}

const viewMemberDetail = async (member: any) => {
  ElMessage.info(`查看会员详情: ${member.name}`)
}

const rechargeMember = async (member: any) => {
  ElMessage.info(`为会员 ${member.name} 充值`)
}

const getLevelStyle = (level: string) => {
  return {
    backgroundColor: levelColors[level] + '20',
    color: levelColors[level],
    borderColor: levelColors[level],
  }
}

onMounted(() => {
  fetchMembers()
})
</script>

<template>
  <div class="members-page">
    <el-card class="header-card">
      <template #header>
        <div class="header-content">
          <span class="card-title">会员管理</span>
          <el-button type="primary" size="small" @click="fetchMembers">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>

      <div class="search-section">
        <el-input
          v-model="searchQuery"
          placeholder="搜索会员姓名/手机号/会员号"
          clearable
          style="width: 300px"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch" style="margin-left: 12px">
          搜索
        </el-button>
      </div>
    </el-card>

    <el-card class="members-card" v-loading="loading">
      <el-table :data="filteredMembers" stripe>
        <el-table-column prop="memberNumber" label="会员号" width="140">
          <template #default="{ row }">
            <span class="member-number">{{ row.memberNumber }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" width="100">
          <template #default="{ row }">
            <span class="member-name">{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="level" label="会员等级" width="100">
          <template #default="{ row }">
            <el-tag size="small" :style="getLevelStyle(row.level)">
              {{ levelLabels[row.level] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="120">
          <template #default="{ row }">
            <span class="balance">¥{{ row.balance.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="100">
          <template #default="{ row }">
            <span class="points">{{ row.points }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalSpent" label="累计消费" width="120">
          <template #default="{ row }">
            ¥{{ row.totalSpent.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusColors[row.status]" size="small">
              {{ statusLabels[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="170">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="220">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewMemberDetail(row)">
              详情
            </el-button>
            <el-button type="success" link size="small" @click="rechargeMember(row)">
              充值
            </el-button>
            <el-button
              v-if="row.status === 'active'"
              type="warning"
              link
              size="small"
              @click="suspendMember(row)"
            >
              冻结
            </el-button>
            <el-button
              v-if="row.status === 'suspended' || row.status === 'inactive'"
              type="success"
              link
              size="small"
              @click="activateMember(row)"
            >
              激活
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="pagination.total > 0"
        class="pagination"
        background
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        :page-size="pagination.limit"
        :current-page="pagination.page"
        :page-sizes="[10, 20, 50, 100]"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
  </div>
</template>

<style scoped>
.members-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-card,
.members-card {
  border: none;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
}

.search-section {
  display: flex;
  align-items: center;
}

.member-number {
  font-weight: 600;
  color: #409eff;
}

.member-name {
  font-weight: 500;
  color: #303133;
}

.balance {
  font-weight: 600;
  color: #67c23a;
}

.points {
  font-weight: 500;
  color: #e6a23c;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
