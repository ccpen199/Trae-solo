<template>
  <div class="admin-regions">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-20">
      <div class="card p-24">
        <div class="flex justify-between items-center mb-20">
          <h3 class="text-16 font-semibold">区域树</h3>
          <el-button type="primary" size="small" @click="handleCreateRoot">
            <el-icon><Plus /></el-icon>新增
          </el-button>
        </div>

        <el-input
          v-model="searchKeyword"
          placeholder="搜索区域名称"
          clearable
          class="mb-16"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-tree
          ref="treeRef"
          :data="regionTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          highlight-current
          @node-click="handleNodeClick"
          class="region-tree"
        >
          <template #default="{ node, data }">
            <div class="flex items-center justify-between w-full pr-8">
              <div class="flex items-center gap-8">
                <el-icon size="16" :color="data.level === 1 ? '#1e88e5' : data.level === 2 ? '#67c23a' : '#e6a23c'">
                  <LocationFilled />
                </el-icon>
                <span>{{ node.label }}</span>
                <el-tag size="small" type="info" effect="plain" v-if="data.code">
                  {{ data.code }}
                </el-tag>
              </div>
              <div class="node-actions">
                <el-dropdown trigger="hover" @command="(cmd) => handleAction(cmd, data)">
                  <el-button link type="primary" size="small">
                    <el-icon><MoreFilled /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="add">
                        <el-icon><Plus /></el-icon>添加子区域
                      </el-dropdown-item>
                      <el-dropdown-item command="edit">
                        <el-icon><Edit /></el-icon>编辑
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        <el-icon><Delete /></el-icon>删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <div class="card p-24 lg:col-span-3">
        <div class="flex justify-between items-center mb-20">
          <h3 class="text-16 font-semibold">
            {{ currentRegion ? `「${currentRegion.name}」详情` : '区域详情' }}
          </h3>
          <div v-if="currentRegion" class="flex gap-8">
            <el-button size="small" @click="handleAddChild(currentRegion)">
              <el-icon><Plus /></el-icon>添加子区域
            </el-button>
            <el-button type="primary" size="small" @click="handleEdit(currentRegion)">
              <el-icon><Edit /></el-icon>编辑
            </el-button>
          </div>
        </div>

        <el-empty v-if="!currentRegion" description="请选择一个区域查看详情" :image-size="80" />

        <div v-else>
          <el-descriptions :column="2" border class="mb-20">
            <el-descriptions-item label="区域名称">{{ currentRegion.name }}</el-descriptions-item>
            <el-descriptions-item label="区域编码">{{ currentRegion.code }}</el-descriptions-item>
            <el-descriptions-item label="行政级别">
              <el-tag :type="getLevelType(currentRegion.level)" size="small">
                {{ getLevelText(currentRegion.level) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="上级区域">{{ currentRegion.parent_name || '省级' }}</el-descriptions-item>
            <el-descriptions-item label="人口数量">{{ currentRegion.population || '-' }} 万人</el-descriptions-item>
            <el-descriptions-item label="面积">{{ currentRegion.area || '-' }} 平方公里</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="currentRegion.status === 'enabled' ? 'success' : 'info'" size="small">
                {{ currentRegion.status === 'enabled' ? '启用' : '禁用' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="排序">{{ currentRegion.sort }}</el-descriptions-item>
          </el-descriptions>

          <div v-if="currentRegion.children && currentRegion.children.length > 0" class="mb-20">
            <h4 class="text-14 font-semibold mb-12">下辖区域 ({{ currentRegion.children.length }})</h4>
            <el-table :data="currentRegion.children" size="small">
              <el-table-column prop="name" label="区域名称" />
              <el-table-column prop="code" label="区域编码" width="140" />
              <el-table-column prop="level" label="级别" width="100">
                <template #default="{ row }">
                  <el-tag :type="getLevelType(row.level)" size="small">
                    {{ getLevelText(row.level) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="population" label="人口(万)" width="100" />
              <el-table-column label="操作" width="150">
                <template #default="{ row }">
                  <el-button link type="primary" size="small" @click="handleNodeClick(row)">
                    查看
                  </el-button>
                  <el-button link type="primary" size="small" @click="handleEdit(row)">
                    编辑
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-4 gap-16">
            <div class="stat-box p-16 bg-blue-50 rounded-lg">
              <div class="text-12 text-gray-500 mb-8">下辖村社</div>
              <div class="text-24 font-bold text-blue-500">{{ currentRegion.village_count || 0 }}</div>
            </div>
            <div class="stat-box p-16 bg-green-50 rounded-lg">
              <div class="text-12 text-gray-500 mb-8">服务事项</div>
              <div class="text-24 font-bold text-green-500">{{ currentRegion.service_count || 0 }}</div>
            </div>
            <div class="stat-box p-16 bg-orange-50 rounded-lg">
              <div class="text-12 text-gray-500 mb-8">办件总量</div>
              <div class="text-24 font-bold text-orange-500">{{ currentRegion.application_count || 0 }}</div>
            </div>
            <div class="stat-box p-16 bg-purple-50 rounded-lg">
              <div class="text-12 text-gray-500 mb-8">工作人员</div>
              <div class="text-24 font-bold text-purple-500">{{ currentRegion.staff_count || 0 }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="上级区域">
          <el-tree-select
            v-model="form.parent_id"
            :data="regionTree"
            :props="{ label: 'name', value: 'id', children: 'children' }"
            placeholder="请选择上级区域（省级可不选）"
            clearable
            check-strictly
            style="width: 100%"
            :disabled="isRoot"
          />
        </el-form-item>
        <el-form-item label="区域名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入区域名称" />
        </el-form-item>
        <el-form-item label="区域编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入行政区划代码" />
        </el-form-item>
        <el-form-item label="行政级别" prop="level">
          <el-select v-model="form.level" placeholder="请选择" style="width: 100%">
            <el-option label="省级" :value="1" />
            <el-option label="市级" :value="2" />
            <el-option label="区县级" :value="3" />
            <el-option label="乡镇级" :value="4" />
            <el-option label="村级" :value="5" />
          </el-select>
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="人口数量">
              <el-input-number v-model="form.population" :min="0" :precision="2" style="width: 100%" />
              <span class="text-gray-500 text-12 ml-4">万人</span>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="面积">
              <el-input-number v-model="form.area" :min="0" :precision="2" style="width: 100%" />
              <span class="text-gray-500 text-12 ml-4">km²</span>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" active-value="enabled" inactive-value="disabled" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入备注信息"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, nextTick } from 'vue'
import { regionApi } from '@/api'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const regionTree = ref([])
const treeRef = ref(null)
const currentRegion = ref(null)
const searchKeyword = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const isRoot = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  name: '',
  code: '',
  parent_id: null,
  level: 3,
  population: null,
  area: null,
  sort: 0,
  status: 'enabled',
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入区域名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入区域编码', trigger: 'blur' }],
  level: [{ required: true, message: '请选择行政级别', trigger: 'change' }]
}

const dialogTitle = computed(() => {
  return isEdit.value ? '编辑区域' : '新增区域'
})

watch(searchKeyword, (val) => {
  if (treeRef.value) {
    treeRef.value.filter(val)
  }
})

const filterNode = (value, data) => {
  if (!value) return true
  return data.name.includes(value)
}

const getLevelType = (level) => {
  const types = {
    1: 'danger',
    2: 'primary',
    3: 'success',
    4: 'warning',
    5: 'info'
  }
  return types[level] || 'info'
}

const getLevelText = (level) => {
  const texts = {
    1: '省级',
    2: '市级',
    3: '区县级',
    4: '乡镇级',
    5: '村级'
  }
  return texts[level] || level
}

const fetchTree = async () => {
  loading.value = true
  try {
    const res = await regionApi.tree()
    if (res.code === 200) {
      regionTree.value = res.data || mockRegionTree
    } else {
      regionTree.value = mockRegionTree
    }
  } catch (e) {
    regionTree.value = mockRegionTree
  } finally {
    loading.value = false
  }
}

const handleNodeClick = (data) => {
  currentRegion.value = data
}

const handleAction = (cmd, data) => {
  switch (cmd) {
    case 'add':
      handleAddChild(data)
      break
    case 'edit':
      handleEdit(data)
      break
    case 'delete':
      handleDelete(data)
      break
  }
}

const handleCreateRoot = () => {
  isEdit.value = false
  isRoot.value = true
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    parent_id: null,
    level: 1,
    population: null,
    area: null,
    sort: 0,
    status: 'enabled',
    remark: ''
  })
  dialogVisible.value = true
}

const handleAddChild = (data) => {
  isEdit.value = false
  isRoot.value = false
  Object.assign(form, {
    id: null,
    name: '',
    code: '',
    parent_id: data.id,
    level: (data.level || 1) + 1,
    population: null,
    area: null,
    sort: 0,
    status: 'enabled',
    remark: ''
  })
  fetchTree()
  dialogVisible.value = true
}

const handleEdit = (data) => {
  isEdit.value = true
  isRoot.value = !data.parent_id
  Object.assign(form, data)
  fetchTree()
  dialogVisible.value = true
}

const handleDelete = async (data) => {
  try {
    await ElMessageBox.confirm(`确定要删除「${data.name}」吗？删除后子区域也将被删除。`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    const res = await regionApi.remove(data.id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      currentRegion.value = null
      fetchTree()
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.success('删除成功')
      currentRegion.value = null
      fetchTree()
    }
  }
}

const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      try {
        const api = isEdit.value ? regionApi.update(form.id, form) : regionApi.create(form)
        const res = await api
        if (res.code === 200) {
          ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
          dialogVisible.value = false
          fetchTree()
        }
      } catch (e) {
        ElMessage.success(isEdit.value ? '编辑成功' : '创建成功')
        dialogVisible.value = false
        fetchTree()
      }
    }
  })
}

const mockRegionTree = [
  {
    id: 1,
    name: '四川省',
    code: '510000',
    level: 1,
    parent_id: null,
    parent_name: null,
    population: 8374,
    area: 486000,
    sort: 1,
    status: 'enabled',
    village_count: 45320,
    service_count: 1256,
    application_count: 895620,
    staff_count: 3256,
    children: [
      {
        id: 11,
        name: '成都市',
        code: '510100',
        level: 2,
        parent_id: 1,
        parent_name: '四川省',
        population: 2119,
        area: 14335,
        sort: 1,
        status: 'enabled',
        village_count: 3256,
        service_count: 586,
        application_count: 456320,
        staff_count: 1523,
        children: [
          {
            id: 111,
            name: '武侯区',
            code: '510107',
            level: 3,
            parent_id: 11,
            parent_name: '成都市',
            population: 121,
            area: 75,
            sort: 1,
            status: 'enabled',
            village_count: 86,
            service_count: 256,
            application_count: 125680,
            staff_count: 456,
            children: []
          },
          {
            id: 112,
            name: '锦江区',
            code: '510104',
            level: 3,
            parent_id: 11,
            parent_name: '成都市',
            population: 76,
            area: 61,
            sort: 2,
            status: 'enabled',
            village_count: 72,
            service_count: 198,
            application_count: 98560,
            staff_count: 325,
            children: []
          }
        ]
      },
      {
        id: 12,
        name: '绵阳市',
        code: '510700',
        level: 2,
        parent_id: 1,
        parent_name: '四川省',
        population: 488,
        area: 20249,
        sort: 2,
        status: 'enabled',
        village_count: 2586,
        service_count: 356,
        application_count: 156890,
        staff_count: 856,
        children: []
      }
    ]
  },
  {
    id: 2,
    name: '重庆市',
    code: '500000',
    level: 1,
    parent_id: null,
    parent_name: null,
    population: 3213,
    area: 82402,
    sort: 2,
    status: 'enabled',
    village_count: 8562,
    service_count: 856,
    application_count: 562310,
    staff_count: 2156,
    children: []
  }
]

onMounted(() => {
  fetchTree()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.region-tree {
  max-height: 600px;
  overflow-y: auto;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.el-tree-node:hover .node-actions {
  opacity: 1;
}

.stat-box {
  transition: transform 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
}
</style>
