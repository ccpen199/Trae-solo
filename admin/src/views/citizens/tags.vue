<template>
  <div class="tags-container">
    <div class="tags-header">
      <div>
        <h2>市民标签体系管理</h2>
        <p class="header-sub">标签分类 · 关联规则 · 画像覆盖</p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="openAddDialog">新增标签</el-button>
        <el-button :icon="Connection" @click="openMergeDialog">合并标签</el-button>
        <el-button :icon="Download" @click="handleExport">导出标签</el-button>
      </div>
    </div>

    <el-row :gutter="20" class="category-row">
      <el-col :span="6" v-for="cat in categories" :key="cat.key">
        <div
          class="category-card"
          :class="{ active: activeCategory === cat.key }"
          @click="activeCategory = cat.key"
        >
          <div class="cat-icon" :style="{ background: cat.color }">
            <el-icon :size="22"><component :is="cat.icon" /></el-icon>
          </div>
          <div class="cat-info">
            <div class="cat-name">{{ cat.name }}</div>
            <div class="cat-count">{{ cat.tagCount }} 个标签</div>
          </div>
          <div class="cat-coverage">覆盖 {{ cat.coverage }} 人</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="14">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">{{ currentCategoryName }} · 标签列表</div>
            <el-input
              v-model="tagSearch"
              placeholder="搜索标签名称"
              clearable
              style="width: 200px;"
              :prefix-icon="Search"
              size="small"
            />
          </div>
          <el-table :data="filteredTags" stripe size="default" row-key="id">
            <el-table-column prop="name" label="标签名称" min-width="140">
              <template #default="{ row }">
                <div class="tag-name-cell">
                  <span class="tag-dot" :style="{ background: row.color }"></span>
                  <span>{{ row.name }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="覆盖人数" width="120" align="right">
              <template #default="{ row }">{{ formatNum(row.coverage) }}</template>
            </el-table-column>
            <el-table-column label="权重" width="130">
              <template #default="{ row }">
                <el-slider
                  v-model="row.weight"
                  :min="0"
                  :max="100"
                  :show-tooltip="false"
                  :stroke-width="8"
                  style="width: 100px;"
                  @change="handleWeightChange(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="创建来源" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.source === 'auto' ? 'primary' : 'success'" effect="plain" round size="small">
                  {{ row.source === 'auto' ? '自动' : '人工' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="关联规则" min-width="160">
              <template #default="{ row }">
                <span class="rule-text">{{ row.rule }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="editWeight(row)">编辑权重</el-button>
                <el-button type="warning" link size="small" @click="viewCitizens(row)">关联市民</el-button>
                <el-popconfirm title="确定删除该标签？" @confirm="deleteTag(row)">
                  <template #reference>
                    <el-button type="danger" link size="small">删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="10">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">标签关联关系图</div>
            <el-tag type="info" round size="small">{{ currentCategoryName }}</el-tag>
          </div>
          <v-chart :option="graphOption" style="height: 460px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <el-dialog v-model="addDialogVisible" :title="editingTag ? '编辑标签权重' : '新增标签'" width="520px">
      <el-form :model="addForm" label-width="90px" size="default">
        <el-form-item label="标签名称" v-if="!editingTag">
          <el-input v-model="addForm.name" placeholder="请输入标签名称" />
        </el-form-item>
        <el-form-item label="所属分类" v-if="!editingTag">
          <el-select v-model="addForm.category" placeholder="请选择分类" style="width: 100%;">
            <el-option v-for="cat in categories" :key="cat.key" :label="cat.name" :value="cat.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="权重">
          <el-slider v-model="addForm.weight" :min="0" :max="100" show-input />
        </el-form-item>
        <el-form-item label="创建来源" v-if="!editingTag">
          <el-radio-group v-model="addForm.source">
            <el-radio label="auto">自动</el-radio>
            <el-radio label="manual">人工</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="关联规则">
          <el-input v-model="addForm.rule" type="textarea" :rows="3" placeholder="描述标签关联规则" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitAdd">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="mergeDialogVisible" title="合并标签" width="560px">
      <el-form label-width="90px" size="default">
        <el-form-item label="源标签">
          <el-select v-model="mergeForm.sourceIds" multiple placeholder="选择要合并的标签" style="width: 100%;">
            <el-option v-for="t in allTags" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标标签">
          <el-select v-model="mergeForm.targetId" placeholder="合并到目标标签" style="width: 100%;">
            <el-option v-for="t in allTags" :key="t.id" :label="t.name" :value="t.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <el-alert type="warning" :closable="false" style="margin-top: 8px;">
        合并后源标签将被删除，关联市民自动迁移至目标标签
      </el-alert>
      <template #footer>
        <el-button @click="mergeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitMerge">确认合并</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="citizenDialogVisible" title="关联市民列表" width="700px">
      <el-table :data="citizenList" size="small">
        <el-table-column prop="id" label="市民ID" width="130" />
        <el-table-column prop="name" label="姓名" width="90" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column prop="district" label="区县" width="90" />
        <el-table-column label="活跃度" width="110">
          <template #default="{ row }">
            <el-progress :percentage="row.activity" :stroke-width="8" :color="row.activity >= 70 ? '#27AE60' : row.activity >= 40 ? '#F39C12' : '#E74C3C'" />
          </template>
        </el-table-column>
        <el-table-column label="最近活跃" width="120">
          <template #default="{ row }">{{ row.lastActive }}</template>
        </el-table-column>
      </el-table>
      <div style="margin-top: 16px; text-align: right;">
        <el-pagination :total="156" :page-size="10" layout="total, prev, pager, next" background small />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { GraphChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, TitleComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { Plus, Download, Search, User, Briefcase, Service, StarFilled, Connection } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

use([CanvasRenderer, GraphChart, TooltipComponent, LegendComponent, TitleComponent])

const activeCategory = ref('population')
const tagSearch = ref('')
const addDialogVisible = ref(false)
const mergeDialogVisible = ref(false)
const citizenDialogVisible = ref(false)
const editingTag = ref<any>(null)

const addForm = reactive({ name: '', category: '', weight: 50, source: 'auto', rule: '' })
const mergeForm = reactive({ sourceIds: [] as string[], targetId: '' })

const categories = reactive([
  { key: 'population', name: '人口属性', icon: User, color: '#1E4FA5', tagCount: 4, coverage: 8926340 },
  { key: 'lifestyle', name: '生活状态', icon: Briefcase, color: '#27AE60', tagCount: 4, coverage: 5423100 },
  { key: 'service', name: '服务偏好', icon: Service, color: '#F39C12', tagCount: 5, coverage: 6789200 },
  { key: 'lifecycle', name: '生命事件', icon: StarFilled, color: '#8E44AD', tagCount: 5, coverage: 3215600 }
])

const currentCategoryName = computed(() => categories.find(c => c.key === activeCategory.value)?.name || '')

interface TagItem {
  id: string
  name: string
  category: string
  coverage: number
  weight: number
  source: 'auto' | 'manual'
  rule: string
  color: string
}

const tagsData = ref<TagItem[]>([
  { id: 'T001', name: '年龄段-青年', category: 'population', coverage: 2856200, weight: 72, source: 'auto', rule: '18≤年龄≤35', color: '#1E4FA5' },
  { id: 'T002', name: '年龄段-中年', category: 'population', coverage: 3124800, weight: 68, source: 'auto', rule: '36≤年龄≤55', color: '#3B7DD8' },
  { id: 'T003', name: '性别-男', category: 'population', coverage: 4568100, weight: 30, source: 'auto', rule: '性别=男', color: '#0D3A7C' },
  { id: 'T004', name: '学历-本科及以上', category: 'population', coverage: 3289400, weight: 55, source: 'auto', rule: '学历∈[本科,硕士,博士]', color: '#79BBFF' },
  { id: 'T005', name: '就业状态', category: 'lifestyle', coverage: 4892300, weight: 80, source: 'auto', rule: '社保缴费状态=正常', color: '#27AE60' },
  { id: 'T006', name: '退休状态', category: 'lifestyle', coverage: 1235600, weight: 75, source: 'auto', rule: '年龄≥60且社保状态=退休', color: '#2ECC71' },
  { id: 'T007', name: '在校状态', category: 'lifestyle', coverage: 856200, weight: 60, source: 'auto', rule: '年龄≤22且学籍=在读', color: '#58D68D' },
  { id: 'T008', name: '灵活就业', category: 'lifestyle', coverage: 987400, weight: 85, source: 'manual', rule: '无固定雇主+近12月缴费<6月', color: '#82E0AA' },
  { id: 'T009', name: '社保偏好', category: 'service', coverage: 5623400, weight: 90, source: 'auto', rule: '近30天社保类访问≥3次', color: '#F39C12' },
  { id: 'T010', name: '医保偏好', category: 'service', coverage: 4892700, weight: 88, source: 'auto', rule: '近30天医保类访问≥3次', color: '#F5B041' },
  { id: 'T011', name: '公积金偏好', category: 'service', coverage: 2156800, weight: 72, source: 'auto', rule: '近30天公积金类访问≥2次', color: '#F8C471' },
  { id: 'T012', name: '教育偏好', category: 'service', coverage: 1893400, weight: 65, source: 'manual', rule: '近30天教育类访问≥2次', color: '#FAD7A0' },
  { id: 'T013', name: '住房偏好', category: 'service', coverage: 1567800, weight: 60, source: 'auto', rule: '近30天住房类访问≥2次', color: '#FDEBD0' },
  { id: 'T014', name: '新生儿事件', category: 'lifecycle', coverage: 456200, weight: 92, source: 'auto', rule: '近90天出生登记', color: '#8E44AD' },
  { id: 'T015', name: '入学事件', category: 'lifecycle', coverage: 623400, weight: 88, source: 'auto', rule: '近90天入学报名', color: '#A569BD' },
  { id: 'T016', name: '退休事件', category: 'lifecycle', coverage: 312800, weight: 85, source: 'auto', rule: '近90天退休审批', color: '#BB8FCE' },
  { id: 'T017', name: '购房事件', category: 'lifecycle', coverage: 287600, weight: 90, source: 'auto', rule: '近90天不动产登记', color: '#D2B4DE' },
  { id: 'T018', name: '创业事件', category: 'lifecycle', coverage: 198400, weight: 82, source: 'manual', rule: '近90天工商注册', color: '#E8DAEF' }
])

const allTags = computed(() => tagsData.value)

const filteredTags = computed(() =>
  tagsData.value
    .filter(t => t.category === activeCategory.value)
    .filter(t => !tagSearch.value || t.name.includes(tagSearch.value))
)

const graphOption = computed(() => {
  const catTags = filteredTags.value
  const catColor = categories.find(c => c.key === activeCategory.value)?.color || '#1E4FA5'

  const nodes = catTags.map((t, i) => ({
    id: t.id,
    name: t.name,
    symbolSize: 40 + t.weight * 0.6,
    itemStyle: { color: t.color || catColor },
    label: { show: true, fontSize: 11, color: '#303133' },
    value: t.coverage
  }))

  const links: { source: string; target: string; lineStyle?: { width: number; color: string; opacity: number } }[] = []
  for (let i = 0; i < catTags.length; i++) {
    for (let j = i + 1; j < catTags.length; j++) {
      const overlap = Math.floor(Math.min(catTags[i].coverage, catTags[j].coverage) * (0.1 + Math.random() * 0.3))
      if (overlap > 0) {
        links.push({
          source: catTags[i].id,
          target: catTags[j].id,
          lineStyle: { width: Math.min(4, overlap / 500000), color: catColor, opacity: 0.4 }
        })
      }
    }
  }

  return {
    tooltip: {
      formatter: (params: any) => {
        if (params.dataType === 'node') return `${params.name}<br/>覆盖: ${formatNum(params.value)} 人`
        if (params.dataType === 'edge') return `${params.data.source} ↔ ${params.data.target}`
        return ''
      }
    },
    series: [{
      type: 'graph',
      layout: 'force',
      data: nodes,
      links,
      roam: true,
      draggable: true,
      force: { repulsion: 300, edgeLength: [80, 200], gravity: 0.1 },
      emphasis: { focus: 'adjacency', lineStyle: { width: 4 } },
      edgeLabel: { show: false }
    }]
  }
})

const citizenList = ref(
  Array.from({ length: 10 }, (_, i) => ({
    id: `CIT-${String(20250010 + i).padStart(8, '0')}`,
    name: ['张**', '李**', '王**', '赵**', '陈**', '刘**', '杨**', '黄**', '周**', '吴**'][i],
    phone: `138****${String(1001 + i * 37).slice(-4)}`,
    district: ['金水区', '二七区', '中原区', '管城区', '惠济区'][i % 5],
    activity: Math.floor(30 + Math.random() * 70),
    lastActive: `${Math.floor(Math.random() * 24)}小时前`
  }))
)

function formatNum(n: number) {
  if (n >= 100000000) return (n / 100000000).toFixed(2) + '亿'
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN')
}

function openAddDialog() {
  editingTag.value = null
  Object.assign(addForm, { name: '', category: activeCategory.value, weight: 50, source: 'auto', rule: '' })
  addDialogVisible.value = true
}

function editWeight(row: TagItem) {
  editingTag.value = row
  Object.assign(addForm, { name: row.name, category: row.category, weight: row.weight, source: row.source, rule: row.rule })
  addDialogVisible.value = true
}

function submitAdd() {
  if (editingTag.value) {
    editingTag.value.weight = addForm.weight
    editingTag.value.rule = addForm.rule
    ElMessage.success('标签权重已更新')
  } else {
    if (!addForm.name) { ElMessage.warning('请输入标签名称'); return }
    tagsData.value.push({
      id: `T${String(tagsData.value.length + 1).padStart(3, '0')}`,
      name: addForm.name,
      category: addForm.category,
      coverage: Math.floor(10000 + Math.random() * 500000),
      weight: addForm.weight,
      source: addForm.source as 'auto' | 'manual',
      rule: addForm.rule || '自定义规则',
      color: categories.find(c => c.key === addForm.category)?.color || '#1E4FA5'
    })
    const cat = categories.find(c => c.key === addForm.category)
    if (cat) cat.tagCount++
    ElMessage.success('标签创建成功')
  }
  addDialogVisible.value = false
}

function deleteTag(row: TagItem) {
  const idx = tagsData.value.findIndex(t => t.id === row.id)
  if (idx > -1) {
    tagsData.value.splice(idx, 1)
    const cat = categories.find(c => c.key === row.category)
    if (cat) cat.tagCount--
    ElMessage.success('标签已删除')
  }
}

function handleWeightChange(row: TagItem) {
  const cat = categories.find(c => c.key === row.category)
  if (cat) cat.coverage = tagsData.value.filter(t => t.category === row.category).reduce((s, t) => s + t.coverage, 0)
}

function openMergeDialog() {
  mergeForm.sourceIds = []
  mergeForm.targetId = ''
  mergeDialogVisible.value = true
}

function submitMerge() {
  if (mergeForm.sourceIds.length === 0 || !mergeForm.targetId) {
    ElMessage.warning('请选择源标签和目标标签')
    return
  }
  if (mergeForm.sourceIds.includes(mergeForm.targetId)) {
    ElMessage.warning('源标签不能包含目标标签')
    return
  }
  tagsData.value = tagsData.value.filter(t => !mergeForm.sourceIds.includes(t.id))
  const target = tagsData.value.find(t => t.id === mergeForm.targetId)
  if (target) {
    target.coverage += Math.floor(Math.random() * 50000)
  }
  mergeDialogVisible.value = false
  ElMessage.success('标签合并成功')
}

function viewCitizens(row: TagItem) {
  citizenDialogVisible.value = true
}

function handleExport() {
  ElMessage.success('标签数据导出成功')
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.tags-container { padding: 0; }
.tags-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 8px 0 20px;
  h2 { margin: 0 0 8px; font-size: 22px; color: $text-primary; font-weight: 700; }
  .header-sub { margin: 0; color: $text-secondary; font-size: 13px; }
  .header-actions { display: flex; gap: 12px; }
}

.category-row { margin-bottom: 20px; }

.category-card {
  display: flex; align-items: center; gap: 14px; padding: 18px 20px;
  background: $bg-card; border-radius: $radius-lg; border: 2px solid $border-lighter;
  cursor: pointer; transition: all 0.25s;
  &:hover { border-color: $primary-light; box-shadow: $shadow-md; }
  &.active { border-color: $primary-color; background: linear-gradient(135deg, rgba(30,79,165,0.06), rgba(30,79,165,0.02)); }
  .cat-icon {
    width: 44px; height: 44px; border-radius: $radius-md; display: flex;
    align-items: center; justify-content: center; color: #fff; flex-shrink: 0;
  }
  .cat-info { flex: 1; min-width: 0; }
  .cat-name { font-size: 15px; font-weight: 600; color: $text-primary; }
  .cat-count { font-size: 12px; color: $text-secondary; margin-top: 4px; }
  .cat-coverage { font-size: 12px; color: $primary-color; font-weight: 600; white-space: nowrap; }
}

.tag-name-cell {
  display: flex; align-items: center; gap: 8px;
  .tag-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
}

.rule-text {
  font-size: 12px; color: $text-secondary;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
</style>
