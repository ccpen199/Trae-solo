<template>
  <div>
    <div class="form-filter-bar">
      <el-form :inline="true" :model="filterForm" size="default">
        <el-form-item label="搜索">
          <el-input v-model="filterForm.keyword" placeholder="姓名/手机号/身份证号" clearable style="width: 200px;" :prefix-icon="Search" />
        </el-form-item>
        <el-form-item label="标签">
          <el-select v-model="filterForm.tag" placeholder="画像标签" clearable style="width: 160px;">
            <el-option v-for="t in tagOptions" :key="t.value" :label="t.label" :value="t.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="年龄段">
          <el-select v-model="filterForm.ageRange" placeholder="请选择" clearable style="width: 140px;">
            <el-option label="18-25岁" value="18-25" />
            <el-option label="26-35岁" value="26-35" />
            <el-option label="36-45岁" value="36-45" />
            <el-option label="46-60岁" value="46-60" />
            <el-option label="60岁以上" value="60+" />
          </el-select>
        </el-form-item>
        <el-form-item label="区县">
          <el-select v-model="filterForm.district" placeholder="请选择" clearable style="width: 140px;">
            <el-option label="金水区" value="jinshui" /><el-option label="二七区" value="erqi" />
            <el-option label="中原区" value="zhongyuan" /><el-option label="管城回族区" value="guancheng" />
          </el-select>
        </el-form-item>
        <el-form-item label="认证等级">
          <el-select v-model="filterForm.level" placeholder="请选择" clearable style="width: 120px;">
            <el-option label="L1 未认证" value="L1" />
            <el-option label="L2 基础认证" value="L2" />
            <el-option label="L3 实名认证" value="L3" />
            <el-option label="L4 人脸认证" value="L4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="doSearch">查询</el-button>
          <el-button :icon="RefreshRight" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-wrapper">
      <div class="table-toolbar">
        <div>
          <el-button type="primary" :icon="Plus">添加市民</el-button>
          <el-button :icon="Upload">批量导入</el-button>
          <el-button :icon="Download">导出画像</el-button>
          <el-button type="warning" :icon="Refresh">重新计算画像</el-button>
        </div>
        <el-tag type="info" round>共 {{ total }} 条画像记录</el-tag>
      </div>

      <el-table :data="tableData" stripe v-loading="loading" row-key="citizenId">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-panel">
              <el-descriptions :column="3" border size="small">
                <el-descriptions-item label="基本信息">
                  <el-avatar :size="36" style="margin-right: 10px;">{{ row.name.charAt(0) }}</el-avatar>
                  {{ row.name }} · {{ row.gender === 'male' ? '男' : '女' }} · {{ row.age }}岁
                </el-descriptions-item>
                <el-descriptions-item label="认证等级">
                  <el-tag v-for="i in Number(row.verifiedLevel.replace('L',''))" :key="i" type="primary" size="small" style="margin-right: 4px;">L{{ i }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="活跃指数">
                  <el-progress :percentage="row.activityScore" :stroke-width="14" :color="row.activityScore >= 70 ? '#67c23a' : row.activityScore >= 40 ? '#e6a23c' : '#f56c6c'" />
                </el-descriptions-item>
                <el-descriptions-item label="画像标签" :span="3">
                  <el-tag
                    v-for="tag in row.tags"
                    :key="tag"
                    :type="['primary','success','warning','info','danger'][row.tags.indexOf(tag) % 5]"
                    style="margin: 4px 6px 4px 0;"
                    round
                    size="small"
                  >{{ tag }}</el-tag>
                </el-descriptions-item>
                <el-descriptions-item label="偏好服务类别">社会保障、医疗保障、住房公积金（共12类）</el-descriptions-item>
                <el-descriptions-item label="近30天办件">18 件 · 平均评分 4.6</el-descriptions-item>
                <el-descriptions-item label="家庭成员">{{ row.memberIds }} 人关联</el-descriptions-item>
              </el-descriptions>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="市民ID" width="130" prop="citizenId" />
        <el-table-column label="姓名" width="100">
          <template #default="{ row }">
            <el-avatar :size="24" style="margin-right: 8px; vertical-align: middle;">{{ row.name.charAt(0) }}</el-avatar>
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="130" prop="phone" />
        <el-table-column label="年龄/性别" width="100">
          <template #default="{ row }">{{ row.age }}/{{ row.gender === 'male' ? '男' : '女' }}</template>
        </el-table-column>
        <el-table-column label="区县" width="90">
          <template #default="{ row }">{{ districtMap[row.district] || '-' }}</template>
        </el-table-column>
        <el-table-column label="认证" width="80" align="center">
          <template #default="{ row }">
            <el-tag size="small" :type="row.verifiedLevel === 'L3' ? 'success' : row.verifiedLevel === 'L2' ? 'warning' : 'info'" round>
              {{ row.verifiedLevel }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="标签数" width="80" align="center">
          <template #default="{ row }"><el-tag type="primary" effect="plain" round size="small">{{ row.tagCount }}</el-tag></template>
        </el-table-column>
        <el-table-column label="活跃度" width="140">
          <template #default="{ row }">
            <el-progress
              :percentage="row.activityScore"
              :stroke-width="10"
              :color="row.activityScore >= 70 ? '#67c23a' : row.activityScore >= 40 ? '#e6a23c' : '#f56c6c'"
            />
          </template>
        </el-table-column>
        <el-table-column label="最近活跃" width="170">
          <template #default="{ row }">
            <el-tooltip :content="row.lastActiveAt">
              <span style="color: #606266;">{{ formatAgo(row.lastActiveAt) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">画像详情</el-button>
            <el-button type="warning" link size="small" @click="recompute(row)">重算画像</el-button>
            <el-button type="danger" link size="small">封禁</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-bar">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" :title="`市民画像详情 - ${currentRow?.citizenId}`" width="900px" top="6vh">
      <el-descriptions v-if="currentRow" :column="2" border size="default">
        <el-descriptions-item label="市民ID">{{ currentRow.citizenId }}</el-descriptions-item>
        <el-descriptions-item label="认证等级">{{ currentRow.verifiedLevel }}</el-descriptions-item>
        <el-descriptions-item label="注册时间">2024-01-15 10:30:00</el-descriptions-item>
        <el-descriptions-item label="最近登录">{{ formatAgo(currentRow.lastActiveAt) }}</el-descriptions-item>
        <el-descriptions-item label="画像标签" :span="2">
          <el-tag v-for="t in currentRow.tags" :key="t" style="margin: 4px 6px 4px 0;" round>{{ t }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="偏好服务（高频优先）" :span="2">
          <el-steps :active="3" finish-status="success" size="small">
            <el-step title="社会保障" description="48次访问" />
            <el-step title="医疗保障" description="36次访问" />
            <el-step title="住房公积金" description="28次访问" />
            <el-step title="不动产登记" description="12次访问" />
          </el-steps>
        </el-descriptions-item>
      </el-descriptions>

      <el-tabs v-model="activeTab" style="margin-top: 20px;">
        <el-tab-pane label="行为趋势" name="behavior">
          <v-chart :option="behaviorChart" style="height: 240px;" autoresize />
        </el-tab-pane>
        <el-tab-pane label="办件历史" name="applications">
          <el-table :data="historyList" size="small">
            <el-table-column prop="date" label="时间" width="170" />
            <el-table-column prop="serviceName" label="办事事项" />
            <el-table-column label="结果" width="80" align="center">
              <template #default="{ row }">
                <el-tag v-if="row.success" type="success" size="small">成功</el-tag>
                <el-tag v-else type="danger" size="small">失败</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="rating" label="评分" width="80" align="center">
              <template #default="{ row }">
                <el-rate v-model="row.rating" disabled size="small" />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="匹配推送记录" name="push">
          <el-empty description="暂无推送记录数据" />
        </el-tab-pane>
      </el-tabs>

      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="recompute(currentRow)">立即重算画像</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { Search, RefreshRight, Plus, Upload, Download, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

use([CanvasRenderer, LineChart, GridComponent, TooltipComponent])

const loading = ref(false)
const total = ref(89)
const detailVisible = ref(false)
const currentRow = ref<any>(null)
const activeTab = ref('behavior')

const filterForm = reactive({ keyword: '', tag: '', ageRange: '', district: '', level: '' })
const pagination = reactive({ page: 1, size: 10 })

const districtMap: Record<string, string> = {
  jinshui: '金水区', erqi: '二七区', zhongyuan: '中原区',
  guancheng: '管城', huiji: '惠济区', zhengdong: '郑东新区'
}

const tagOptions = [
  { label: '学龄前儿童家长', value: 'preschool_parent' },
  { label: '灵活就业人员', value: 'flexible_worker' },
  { label: '即将退休', value: 'retiring_soon' },
  { label: '首套房购买者', value: 'first_home_buyer' },
  { label: '慢性病患者', value: 'chronic_patient' },
  { label: '二孩家庭', value: 'two_child_family' }
]

const districts = ['jinshui', 'erqi', 'zhongyuan', 'guancheng', 'huiji', 'zhengdong']
const nameList = ['张**', '李**', '王**', '赵**', '陈**', '刘**', '杨**', '黄**', '周**', '吴**', '徐**', '孙**', '马**', '朱**', '胡**']
const tagPool = ['学龄前儿童家长', '灵活就业人员', '首套房购买者', '异地就医需求', '二孩家庭', '个体工商户', '即将退休', '慢性病患者', '租房提取公积金', '高考生家长', '人才引进落户']

function genCitizens(page: number, size: number) {
  return Array.from({ length: size }, (_, i) => {
    const idx = (page - 1) * size + i + 1
    const age = 22 + (idx * 7) % 48
    const tagCount = 3 + (idx % 7)
    const shuffled = [...tagPool].sort(() => Math.random() - 0.5)
    return {
      citizenId: `CIT-${String(20250000 + idx).padStart(8, '0')}`,
      name: nameList[idx % nameList.length],
      phone: `138****${String(1000 + idx * 17).slice(-4)}`,
      age,
      gender: idx % 3 === 0 ? 'female' : 'male',
      district: districts[idx % districts.length],
      verifiedLevel: idx % 9 === 0 ? 'L1' : idx % 4 === 0 ? 'L2' : 'L3',
      tagCount,
      activityScore: Math.floor(25 + Math.random() * 75),
      tags: shuffled.slice(0, tagCount),
      memberIds: idx % 5 + 1,
      lastActiveAt: new Date(Date.now() - Math.random() * 7 * 86400000).toISOString()
    }
  })
}

const tableData = ref<any[]>([])
onMounted(() => { tableData.value = genCitizens(1, 10) })

const historyList = Array.from({ length: 10 }, (_, i) => ({
  date: new Date(Date.now() - i * 3 * 86400000).toLocaleString('zh-CN'),
  serviceName: ['社保参保证明', '医保参保登记', '公积金提取', '不动产查询', '入学报名'][i % 5],
  success: i !== 3,
  rating: i === 3 ? 2 : [5, 4, 5, 5, 4][i % 5]
}))

const behaviorChart = {
  tooltip: { trigger: 'axis' },
  grid: { left: 40, right: 20, top: 20, bottom: 30 },
  xAxis: { type: 'category', data: Array.from({ length: 14 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (13 - i)); return `${d.getMonth()+1}/${d.getDate()}` }) },
  yAxis: { type: 'value' },
  series: [{ type: 'line', smooth: true, areaStyle: { opacity: 0.3 },
    data: Array.from({ length: 14 }, () => Math.floor(1 + Math.random() * 8)),
    lineStyle: { color: '#1E4FA5', width: 2 }, itemStyle: { color: '#1E4FA5' }
  }]
}

function doSearch() { loading.value = true; setTimeout(() => { loading.value = false; tableData.value = genCitizens(1, 10); ElMessage.success('查询完成') }, 600) }
function resetFilter() { Object.assign(filterForm, { keyword: '', tag: '', ageRange: '', district: '', level: '' }) }
function viewDetail(row: any) { currentRow.value = row; detailVisible.value = true }
function recompute(row: any) { ElMessage.success(`已提交画像重算任务：${row?.citizenId || '批量'}`) }

function formatAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000), hr = Math.floor(diff / 3600000), day = Math.floor(diff / 86400000)
  if (day > 0) return `${day}天前`; if (hr > 0) return `${hr}小时前`; if (min > 0) return `${min}分钟前`; return '刚刚'
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;
.expand-panel { padding: 16px 32px 24px; background: #fafbfc; border-radius: 8px; margin: 0 8px; }
</style>
