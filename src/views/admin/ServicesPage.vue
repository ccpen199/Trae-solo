<template>
  <div class="min-h-screen bg-neutral-900 text-white p-6">
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-white mb-1">事项管理</h1>
        <p class="text-neutral-400 text-sm">管理政务服务事项及其配置</p>
      </div>
      <button @click="openDialog()" class="btn-primary flex items-center gap-2">
        <Plus class="w-4 h-4" />
        新增事项
      </button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
      <div class="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
        <div class="text-sm text-neutral-400 mb-1">事项总数</div>
        <div class="text-2xl font-bold text-white">{{ stats.total }}</div>
        <div class="text-xs text-green-400 mt-1">↑ 12 本月新增</div>
      </div>
      <div class="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
        <div class="text-sm text-neutral-400 mb-1">上架事项</div>
        <div class="text-2xl font-bold text-green-400">{{ stats.active }}</div>
        <div class="text-xs text-neutral-500 mt-1">占比 {{ stats.activeRate }}%</div>
      </div>
      <div class="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
        <div class="text-sm text-neutral-400 mb-1">平均办结时长</div>
        <div class="text-2xl font-bold text-blue-400">{{ stats.avgDuration }}天</div>
        <div class="text-xs text-green-400 mt-1">↓ 0.3天 环比</div>
      </div>
      <div class="bg-neutral-800/50 rounded-xl p-4 border border-neutral-800">
        <div class="text-sm text-neutral-400 mb-1">按时办结率</div>
        <div class="text-2xl font-bold text-cyan-400">{{ stats.onTimeRate }}%</div>
        <div class="text-xs text-green-400 mt-1">↑ 1.2% 环比</div>
      </div>
    </div>

    <div class="bg-neutral-800/50 rounded-xl p-5 border border-neutral-800 mb-5">
      <div class="flex flex-wrap gap-4 items-end">
        <div class="flex-1 min-w-[200px]">
          <label class="text-sm text-neutral-400 block mb-1.5">搜索</label>
          <el-input v-model="filters.keyword" placeholder="搜索事项名称、描述..." clearable class="!bg-neutral-700/50">
            <template #prefix><Search class="w-4 h-4 text-neutral-500" /></template>
          </el-input>
        </div>
        <div class="w-48">
          <label class="text-sm text-neutral-400 block mb-1.5">所属部门</label>
          <el-select v-model="filters.departmentId" placeholder="全部部门" clearable class="!w-full">
            <el-option v-for="d in departments" :key="d.id" :label="d.shortName" :value="d.id" />
          </el-select>
        </div>
        <div class="w-40">
          <label class="text-sm text-neutral-400 block mb-1.5">分类</label>
          <el-select v-model="filters.category" placeholder="全部分类" clearable class="!w-full">
            <el-option label="社会保障" value="social_security" />
            <el-option label="医疗保险" value="medical_insurance" />
            <el-option label="教育服务" value="education" />
            <el-option label="住房公积金" value="housing_fund" />
            <el-option label="交通出行" value="traffic" />
          </el-select>
        </div>
        <div class="w-36">
          <label class="text-sm text-neutral-400 block mb-1.5">状态</label>
          <el-select v-model="filters.status" placeholder="全部状态" clearable class="!w-full">
            <el-option label="上架" value="active" />
            <el-option label="暂停" value="suspended" />
            <el-option label="下架" value="offline" />
          </el-select>
        </div>
        <div class="flex gap-2">
          <button @click="loadServices" class="btn-primary !px-5">查询</button>
          <button @click="resetFilters" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600 !px-5">重置</button>
        </div>
      </div>
    </div>

    <div class="bg-neutral-800/50 rounded-xl border border-neutral-800 overflow-hidden">
      <el-table :data="serviceList" class="!bg-transparent" :header-cell-style="{ background: 'transparent', color: '#9CA3AF', borderBottom: '1px solid #374151' }"
        :cell-style="{ background: 'transparent', color: '#D1D5DB', borderBottom: '1px solid #374151' }">
        <el-table-column prop="name" label="事项名称" min-width="200">
          <template #default="{ row }">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-neutral-700/50 flex items-center justify-center text-gov-blue font-bold text-sm">
                {{ row.name.charAt(0) }}
              </div>
              <div>
                <div class="text-white font-medium">{{ row.name }}</div>
                <div class="text-xs text-neutral-500">{{ row.shortName }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="departmentName" label="部门" width="150">
          <template #default="{ row }">
            <span class="text-neutral-300 text-sm">{{ row.departmentName.replace('抚州市', '').replace('国家税务总局', '') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <span class="text-xs px-2 py-1 rounded-full bg-blue-500/15 text-blue-400">{{ getCategoryLabel(row.category) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <span :class="getStatusClass(row.status)">{{ getStatusLabel(row.status) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="步骤数" width="80" align="center">
          <template #default="{ row }">
            <span class="text-white font-medium">{{ row.steps?.length || 0 }}</span>
            <span class="text-neutral-500 text-xs">步</span>
          </template>
        </el-table-column>
        <el-table-column prop="applyCount" label="办件量" width="100" align="right">
          <template #default="{ row }">
            <span class="text-white font-medium">{{ row.applyCount.toLocaleString() }}</span>
          </template>
        </el-table-column>
        <el-table-column label="平均办理时长" width="110" align="right">
          <template #default="{ row }">
            <span class="text-white">{{ row.promiseDays || 0 }}</span>
            <span class="text-neutral-500 text-xs">天</span>
          </template>
        </el-table-column>
        <el-table-column label="按时办结率" width="100" align="right">
          <template #default="{ row }">
            <div class="flex items-center justify-end gap-1.5">
              <div class="w-16 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                <div class="h-full bg-green-500 rounded-full" :style="{ width: (row.satisfaction || 95) + '%' }"></div>
              </div>
              <span class="text-green-400 text-sm">{{ row.satisfaction || 95 }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="satisfaction" label="满意度" width="100" align="right">
          <template #default="{ row }">
            <div class="flex items-center justify-end gap-1">
              <Star class="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span class="text-white">{{ row.satisfaction }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <div class="flex items-center gap-1 flex-wrap">
              <button @click="goToSteps(row)" class="px-2.5 py-1.5 text-xs text-blue-400 hover:bg-blue-500/10 rounded transition-colors">
                步骤管理
              </button>
              <button @click="openFormConfig(row)" class="px-2.5 py-1.5 text-xs text-cyan-400 hover:bg-cyan-500/10 rounded transition-colors">
                表单配置
              </button>
              <button @click="viewStats(row)" class="px-2.5 py-1.5 text-xs text-purple-400 hover:bg-purple-500/10 rounded transition-colors">
                数据统计
              </button>
              <button @click="openDialog(row)" class="px-2.5 py-1.5 text-xs text-green-400 hover:bg-green-500/10 rounded transition-colors">
                编辑
              </button>
              <button @click="toggleStatus(row)" class="px-2.5 py-1.5 text-xs text-yellow-400 hover:bg-yellow-500/10 rounded transition-colors">
                {{ row.status === 'active' ? '下架' : '上架' }}
              </button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div class="p-4 flex items-center justify-between border-t border-neutral-800">
        <span class="text-sm text-neutral-500">共 {{ pagination.total }} 条记录</span>
        <el-pagination v-model:current-page="pagination.page" v-model:page-size="pagination.pageSize"
          :total="pagination.total" layout="prev, pager, next" :page-sizes="[10, 20, 50]" background />
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑事项' : '新增事项'" width="720px" class="!bg-neutral-900"
      :close-on-click-modal="false">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基本信息" name="basic">
          <div class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <label class="text-sm text-neutral-400 block mb-1.5">事项名称 <span class="text-red-400">*</span></label>
              <el-input v-model="formData.name" placeholder="请输入事项名称" />
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">简称</label>
              <el-input v-model="formData.shortName" placeholder="事项简称" />
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">所属部门 <span class="text-red-400">*</span></label>
              <el-select v-model="formData.departmentId" placeholder="请选择部门" class="!w-full">
                <el-option v-for="d in departments" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">服务分类 <span class="text-red-400">*</span></label>
              <el-select v-model="formData.category" placeholder="请选择分类" class="!w-full">
                <el-option label="社会保障" value="social_security" />
                <el-option label="医疗保险" value="medical_insurance" />
                <el-option label="教育服务" value="education" />
                <el-option label="住房公积金" value="housing_fund" />
                <el-option label="交通出行" value="traffic" />
                <el-option label="文化旅游" value="culture_tourism" />
              </el-select>
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">服务层级</label>
              <el-select v-model="formData.level" placeholder="请选择" class="!w-full">
                <el-option label="国家级" value="national" />
                <el-option label="省级" value="provincial" />
                <el-option label="市级" value="municipal" />
                <el-option label="区级" value="district" />
              </el-select>
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">承诺办结时限</label>
              <el-input v-model="formData.workDays" placeholder="如：3个工作日" />
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">收费标准</label>
              <el-input v-model="formData.chargeStandard" placeholder="如：免费" />
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-1.5">状态</label>
              <el-switch v-model="formData.status" active-value="active" inactive-value="offline"
                active-text="上架" inactive-text="下架" />
            </div>
            <div class="col-span-2">
              <label class="text-sm text-neutral-400 block mb-1.5">事项描述</label>
              <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入事项描述" />
            </div>
            <div class="col-span-2 flex gap-6">
              <label class="flex items-center gap-2 cursor-pointer">
                <el-checkbox v-model="formData.onlineApply" />
                <span class="text-sm text-neutral-300">支持在线申请</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <el-checkbox v-model="formData.appointment" />
                <span class="text-sm text-neutral-300">支持预约办理</span>
              </label>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="办事指南" name="guide">
          <div class="space-y-5">
            <div>
              <label class="text-sm text-neutral-400 block mb-2">办理条件</label>
              <div v-for="(cond, idx) in formData.conditions" :key="idx" class="flex gap-2 mb-2">
                <el-input v-model="formData.conditions[idx]" placeholder="请输入办理条件" />
                <button @click="formData.conditions.splice(idx, 1)" class="px-3 text-red-400 hover:bg-red-500/10 rounded">
                  <X class="w-4 h-4" />
                </button>
              </div>
              <button @click="formData.conditions.push('')" class="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Plus class="w-3.5 h-3.5" /> 添加条件
              </button>
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-2">所需材料</label>
              <div class="space-y-3">
                <div v-for="(mat, idx) in formData.materials" :key="idx" class="p-3 rounded-lg bg-neutral-700/30 border border-neutral-700/50">
                  <div class="flex items-start justify-between mb-2">
                    <span class="text-sm text-white font-medium">材料 {{ idx + 1 }}</span>
                    <button @click="formData.materials.splice(idx, 1)" class="text-red-400 hover:text-red-300">
                      <X class="w-4 h-4" />
                    </button>
                  </div>
                  <div class="grid grid-cols-2 gap-3">
                    <el-input v-model="mat.name" placeholder="材料名称" size="small" />
                    <el-select v-model="mat.required" placeholder="是否必填" class="!w-full" size="small">
                      <el-option :label="true" :value="true">必填</el-option>
                      <el-option :label="false" :value="false">选填</el-option>
                    </el-select>
                    <el-input v-model="mat.format" placeholder="格式要求（如：原件+复印件）" size="small" class="col-span-2" />
                    <el-input v-model="mat.description" placeholder="材料说明" size="small" class="col-span-2" />
                  </div>
                </div>
              </div>
              <button @click="formData.materials.push({ id: '', name: '', required: true, format: '', description: '' })"
                class="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2">
                <Plus class="w-3.5 h-3.5" /> 添加材料
              </button>
            </div>
            <div>
              <label class="text-sm text-neutral-400 block mb-2">注意事项</label>
              <div v-for="(note, idx) in formData.notices" :key="idx" class="flex gap-2 mb-2">
                <el-input v-model="formData.notices[idx]" placeholder="请输入注意事项" />
                <button @click="formData.notices.splice(idx, 1)" class="px-3 text-red-400 hover:bg-red-500/10 rounded">
                  <X class="w-4 h-4" />
                </button>
              </div>
              <button @click="formData.notices.push('')" class="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                <Plus class="w-3.5 h-3.5" /> 添加注意事项
              </button>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="表单配置" name="form">
          <div class="text-center py-10">
            <FileText class="w-12 h-12 text-neutral-600 mx-auto mb-3" />
            <p class="text-neutral-400 mb-2">表单字段配置</p>
            <p class="text-sm text-neutral-500 mb-4">可在「表单引擎」中为该事项配置专用表单模板</p>
            <button class="btn-primary !px-5">前往表单引擎</button>
          </div>
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <div class="flex justify-end gap-3">
          <button @click="dialogVisible = false" class="btn-secondary !bg-neutral-700 !text-white !border-neutral-600 hover:!bg-neutral-600">取消</button>
          <button @click="submitForm" class="btn-primary">确认保存</button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Search, X, Star, FileText } from 'lucide-vue-next'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getServiceList, getDepartmentList } from '@/api/services'
import { generateId } from '@/utils'
import type { ServiceItem, Department, ServiceCategory, ServiceStatus } from '@/types'

const router = useRouter()

const serviceList = ref<ServiceItem[]>([])
const departments = ref<Department[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const activeTab = ref('basic')

const filters = reactive({
  keyword: '',
  departmentId: '',
  category: '',
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const stats = computed(() => ({
  total: serviceList.value.length,
  active: serviceList.value.filter(s => s.status === 'active').length,
  activeRate: serviceList.value.length ? Math.round(serviceList.value.filter(s => s.status === 'active').length / serviceList.value.length * 100) : 0,
  avgDuration: serviceList.value.length ? (serviceList.value.reduce((sum, s) => sum + (s.promiseDays || 0), 0) / serviceList.value.length).toFixed(1) : '0',
  onTimeRate: 96.8
}))

const defaultForm = () => ({
  id: '',
  name: '',
  shortName: '',
  departmentId: '',
  departmentName: '',
  category: '' as ServiceCategory,
  status: 'active' as ServiceStatus,
  level: 'municipal' as const,
  description: '',
  workDays: '',
  chargeStandard: '',
  onlineApply: true,
  appointment: false,
  conditions: [] as string[],
  notices: [] as string[],
  materials: [] as Array<{ id: string; name: string; required: boolean; format: string; description: string }>
})

const formData = reactive(defaultForm())

const getCategoryLabel = (cat: string) => {
  const map: Record<string, string> = {
    social_security: '社会保障', medical_insurance: '医疗保险', education: '教育服务',
    housing_fund: '住房公积金', traffic: '交通出行', culture_tourism: '文化旅游',
    civil_affairs: '民政服务', taxation: '税务服务', industry_commerce: '市场监管',
    public_security: '公安户政', justice: '司法服务', health: '卫生健康'
  }
  return map[cat] || cat
}

const getStatusClass = (status: ServiceStatus) => {
  const map: Record<ServiceStatus, string> = {
    active: 'text-xs px-2 py-1 rounded-full bg-green-500/15 text-green-400',
    suspended: 'text-xs px-2 py-1 rounded-full bg-yellow-500/15 text-yellow-400',
    offline: 'text-xs px-2 py-1 rounded-full bg-neutral-500/15 text-neutral-400'
  }
  return map[status] || map.offline
}

const getStatusLabel = (status: ServiceStatus) => {
  const map: Record<ServiceStatus, string> = { active: '上架', suspended: '暂停', offline: '下架' }
  return map[status] || '未知'
}

const loadServices = async () => {
  const res = await getServiceList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    keyword: filters.keyword || undefined,
    departmentId: filters.departmentId || undefined,
    category: (filters.category as ServiceCategory) || undefined,
    status: filters.status || undefined
  })
  serviceList.value = res.data.list
  pagination.total = res.data.total
}

const loadDepartments = async () => {
  const res = await getDepartmentList()
  departments.value = res.data
}

const resetFilters = () => {
  filters.keyword = ''
  filters.departmentId = ''
  filters.category = ''
  filters.status = ''
  pagination.page = 1
  loadServices()
}

const goToSteps = (row: ServiceItem) => {
  router.push(`/admin/services/${row.id}/steps`)
}

const openFormConfig = (row: ServiceItem) => {
  ElMessage.info(`打开「${row.name}」表单配置`)
}

const viewStats = (row: ServiceItem) => {
  ElMessage.info(`查看「${row.name}」数据统计`)
}

const openDialog = (row?: ServiceItem) => {
  Object.assign(formData, defaultForm())
  activeTab.value = 'basic'
  if (row) {
    isEdit.value = true
    Object.assign(formData, {
      id: row.id,
      name: row.name,
      shortName: row.shortName,
      departmentId: row.departmentId,
      departmentName: row.departmentName,
      category: row.category,
      status: row.status,
      level: row.level,
      description: row.description,
      workDays: row.workDays,
      chargeStandard: row.chargeStandard,
      onlineApply: row.onlineApply,
      appointment: row.appointment,
      conditions: [...row.conditions],
      notices: [...row.notices],
      materials: row.materials.map(m => ({ ...m }))
    })
  } else {
    isEdit.value = false
  }
  dialogVisible.value = true
}

const submitForm = async () => {
  if (!formData.name || !formData.departmentId || !formData.category) {
    ElMessage.warning('请填写必填项')
    return
  }
  const dept = departments.value.find(d => d.id === formData.departmentId)
  formData.departmentName = dept?.name || ''
  formData.id = formData.id || generateId()
  ElMessage.success(isEdit.value ? '修改成功' : '创建成功')
  dialogVisible.value = false
  loadServices()
}

const toggleStatus = (row: ServiceItem) => {
  const action = row.status === 'active' ? '下架' : '上架'
  ElMessageBox.confirm(`确认${action}事项「${row.name}」？`, '提示', {
    confirmButtonText: '确认', cancelButtonText: '取消', type: 'warning'
  }).then(() => {
    row.status = row.status === 'active' ? 'offline' : 'active'
    ElMessage.success(`${action}成功`)
  }).catch(() => {})
}

const deleteService = (row: ServiceItem) => {
  ElMessageBox.confirm(`确认删除事项「${row.name}」？此操作不可恢复。`, '警告', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'error',
    confirmButtonClass: 'el-button--danger'
  }).then(() => {
    serviceList.value = serviceList.value.filter(s => s.id !== row.id)
    ElMessage.success('删除成功')
  }).catch(() => {})
}

onMounted(() => {
  loadServices()
  loadDepartments()
})
</script>
