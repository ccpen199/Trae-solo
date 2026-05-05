<template>
  <div class="page-container">
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #409EFF">
              <el-icon size="28"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ employeeCount }}</div>
              <div class="stat-label">员工总数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #67C23A">
              <el-icon size="28"><OfficeBuilding /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ departmentCount }}</div>
              <div class="stat-label">部门数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #E6A23C">
              <el-icon size="28"><Check /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ activeEmployeeCount }}</div>
              <div class="stat-label">在职员工</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #F56C6C">
              <el-icon size="28"><Close /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ inactiveEmployeeCount }}</div>
              <div class="stat-label">离职员工</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>快捷操作</span>
          </template>
          <div class="quick-actions">
            <el-button type="primary" size="large" @click="goToEmployees">
              <el-icon><User /></el-icon>
              <span>员工管理</span>
            </el-button>
            <el-button type="success" size="large" @click="goToDepartments">
              <el-icon><OfficeBuilding /></el-icon>
              <span>部门管理</span>
            </el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header>
            <span>系统说明</span>
          </template>
          <div class="system-info">
            <p><strong>架构说明：</strong></p>
            <ul>
              <li>采用三层架构：业务层(Biz)、实体层(Entity)、数据访问层(DAL)</li>
              <li>页面、业务对象和数据库操作完全解耦</li>
              <li>支持按模块独立开发和维护</li>
            </ul>
            <p style="margin-top: 10px"><strong>功能模块：</strong></p>
            <ul>
              <li>员工管理：新增、修改、查询、删除、离职状态变更</li>
              <li>员工详细信息：教育经历、家庭成员、项目经验等</li>
              <li>部门管理：新增、修改、查询、删除部门</li>
            </ul>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { departmentApi, employeeApi } from '@/api'

const router = useRouter()

const employeeCount = ref(0)
const departmentCount = ref(0)
const activeEmployeeCount = ref(0)
const inactiveEmployeeCount = ref(0)

const loadData = async () => {
  try {
    const deptRes = await departmentApi.list()
    if (deptRes.success) {
      departmentCount.value = deptRes.data.length
    }

    const empRes = await employeeApi.list({ pageSize: 1000 })
    if (empRes.success) {
      employeeCount.value = empRes.data.total
      const employees = empRes.data.list
      activeEmployeeCount.value = employees.filter(e => e.status === 1).length
      inactiveEmployeeCount.value = employees.filter(e => e.status === 2).length
    }
  } catch (error) {
    console.error('Load stats error:', error)
  }
}

const goToEmployees = () => router.push('/employees')
const goToDepartments = () => router.push('/departments')

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.stat-card {
  margin-bottom: 0;
}

.stat-content {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.quick-actions {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding: 20px 0;
}

.quick-actions .el-button {
  width: 150px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.system-info ul {
  margin: 5px 0 0 20px;
  color: #666;
  font-size: 14px;
  line-height: 1.8;
}
</style>
