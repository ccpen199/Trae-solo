<template>
  <div class="page-container">
    <div class="departments-header">
      <div>
        <h2>委办局接入管理</h2>
        <p class="header-sub">
          <el-icon><Connection /></el-icon>
          共 {{ departments.length }} 个委办局 · 在线 {{ onlineCount }} · 调试 {{ debuggingCount }} · 停用 {{ offlineCount }}
          <el-tag type="success" effect="dark" style="margin-left: 12px;" size="small">
            <el-icon><Odometer /></el-icon> 实时监控
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增接入</el-button>
        <el-button :icon="Refresh" @click="refreshData">刷新状态</el-button>
        <el-button :icon="Download">导出配置</el-button>
      </div>
    </div>

    <div class="form-filter-bar filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索部门名称/简称/负责人"
            :prefix-icon="Search"
            clearable
            style="width: 240px;"
          />
        </el-form-item>
        <el-form-item label="接入状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 160px;">
            <el-option label="已接入" value="online" />
            <el-option label="调试中" value="debugging" />
            <el-option label="已停用" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门类型">
          <el-select v-model="filterForm.category" placeholder="全部类型" clearable style="width: 180px;">
            <el-option label="公安司法" value="公安司法" />
            <el-option label="社会保障" value="社会保障" />
            <el-option label="医疗卫生" value="医疗卫生" />
            <el-option label="教育文化" value="教育文化" />
            <el-option label="城乡建设" value="城乡建设" />
            <el-option label="交通运输" value="交通运输" />
            <el-option label="财政税务" value="财政税务" />
            <el-option label="政务服务" value="政务服务" />
            <el-option label="民生保障" value="民生保障" />
            <el-option label="生态环境" value="生态环境" />
            <el-option label="应急管理" value="应急管理" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Filter" @click="applyFilter">筛选</el-button>
          <el-button :icon="RefreshLeft" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="departments-grid">
      <div
        v-for="dept in filteredDepartments"
        :key="dept.id"
        class="dept-card"
        :class="{ 'is-expanded': expandedId === dept.id }"
        @click="toggleExpand(dept.id)"
      >
        <div class="card-top">
          <div class="dept-logo" :style="{ background: dept.logoBg }">
            <el-icon :size="28" :color="#fff"><component :is="dept.icon" /></el-icon>
          </div>
          <div class="dept-basic">
            <div class="dept-name-row">
              <span class="dept-name">{{ dept.name }}</span>
              <el-tag
                :type="statusTagType(dept.status)"
                effect="dark"
                round
                size="small"
                class="status-tag"
              >
                <el-icon style="margin-right: 2px;">
                  <component :is="statusIcon(dept.status)" />
                </el-icon>
                {{ statusText(dept.status) }}
              </el-tag>
            </div>
            <div class="dept-abbr">{{ dept.abbr }} · {{ dept.category }}</div>
          </div>
          <el-icon class="expand-icon" :class="{ rotated: expandedId === dept.id }">
            <ArrowDown />
          </el-icon>
        </div>

        <div class="card-metrics">
          <div class="metric-item">
            <div class="metric-label">API接口</div>
            <div class="metric-value">{{ dept.apiCount }}</div>
          </div>
          <div class="metric-item">
            <div class="metric-label">7日调用</div>
            <div class="metric-value">{{ formatNum(dept.callCount7d) }}</div>
          </div>
          <div class="metric-item mini-chart-wrapper">
            <div class="metric-label">调用趋势</div>
            <v-chart :option="getMiniChartOption(dept)" style="height: 36px; width: 80px;" autoresize />
          </div>
        </div>

        <div class="card-health">
          <div class="health-row">
            <span class="health-label">健康度</span>
            <el-progress
              :percentage="dept.healthScore"
              :stroke-width="8"
              :color="healthColor(dept.healthScore)"
              :show-text="false"
              style="flex: 1; margin: 0 10px;"
            />
            <span class="health-score" :style="{ color: healthColor(dept.healthScore) }">
              {{ dept.healthScore }}%
            </span>
          </div>
        </div>

        <div class="card-footer">
          <div class="footer-item">
            <el-icon :size="12"><Clock /></el-icon>
            <span>心跳: {{ dept.lastHeartbeat }}</span>
          </div>
          <div class="footer-item">
            <el-icon :size="12"><Calendar /></el-icon>
            <span>接入: {{ dept.connectDate }}</span>
          </div>
        </div>

        <div class="card-contact">
          <el-avatar :size="28" style="background: #1E4FA5;">{{ dept.owner.charAt(0) }}</el-avatar>
          <div class="contact-info">
            <div class="owner-name">{{ dept.owner }}</div>
            <div class="owner-phone">{{ dept.phone }}</div>
          </div>
          <div class="contact-actions" @click.stop>
            <el-button type="primary" link :icon="Phone" @click="handleCall(dept)">联系</el-button>
            <el-button type="primary" link :icon="Setting" @click.stop="handleConfig(dept)">配置</el-button>
          </div>
        </div>

        <div v-if="expandedId === dept.id" class="card-detail" @click.stop>
          <el-tabs v-model="dept.activeTab" class="detail-tabs">
            <el-tab-pane label="API接口列表" name="apis">
              <div class="detail-section">
                <div class="section-header">
                  <span class="section-title"><el-icon><List /></el-icon> API 接口清单 ({{ dept.apis.length }})</span>
                  <el-input
                    v-model="dept.apiSearch"
                    placeholder="搜索接口名称"
                    :prefix-icon="Search"
                    size="small"
                    clearable
                    style="width: 200px;"
                  />
                </div>
                <el-table :data="filterApis(dept)" size="small" stripe>
                  <el-table-column prop="code" label="接口编码" width="160" />
                  <el-table-column prop="name" label="接口名称" min-width="200" />
                  <el-table-column prop="method" label="方法" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag
                        :type="row.method === 'GET' ? 'success' : row.method === 'POST' ? 'primary' : 'warning'"
                        size="small"
                        effect="plain"
                      >{{ row.method }}</el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column prop="path" label="路径" min-width="220" />
                  <el-table-column label="调用量" width="120" align="right">
                    <template #default="{ row }">{{ formatNum(row.callCount) }}</template>
                  </el-table-column>
                  <el-table-column label="成功率" width="110">
                    <template #default="{ row }">
                      <el-progress
                        :percentage="row.successRate"
                        :stroke-width="6"
                        :color="healthColor(row.successRate)"
                        :text-inside="true"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="响应时间" width="100" align="center">
                    <template #default="{ row }">{{ row.avgResponse }}ms</template>
                  </el-table-column>
                  <el-table-column label="状态" width="80" align="center">
                    <template #default="{ row }">
                      <el-tag :type="row.status === 'active' ? 'success' : 'info'" size="small" round>
                        {{ row.status === 'active' ? '启用' : '停用' }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </el-tab-pane>

            <el-tab-pane label="健康监测" name="health">
              <div class="detail-section">
                <div class="health-stats">
                  <div class="health-stat-card success">
                    <div class="hs-icon"><CircleCheck /></div>
                    <div class="hs-info">
                      <div class="hs-value">{{ dept.healthStats.successRate }}%</div>
                      <div class="hs-label">7日平均成功率</div>
                    </div>
                  </div>
                  <div class="health-stat-card primary">
                    <div class="hs-icon"><Timer /></div>
                    <div class="hs-info">
                      <div class="hs-value">{{ dept.healthStats.avgResponse }}ms</div>
                      <div class="hs-label">平均响应时间</div>
                    </div>
                  </div>
                  <div class="health-stat-card warning">
                    <div class="hs-icon"><WarningFilled /></div>
                    <div class="hs-info">
                      <div class="hs-value">{{ dept.healthStats.errorCount }}</div>
                      <div class="hs-label">7日异常次数</div>
                    </div>
                  </div>
                  <div class="health-stat-card danger">
                    <div class="hs-icon"><DataAnalysis /></div>
                    <div class="hs-info">
                      <div class="hs-value">{{ dept.healthStats.errorRate }}%</div>
                      <div class="hs-label">错误率</div>
                    </div>
                  </div>
                </div>

                <el-row :gutter="20" style="margin-top: 20px;">
                  <el-col :span="12">
                    <div class="chart-wrapper">
                      <div class="chart-title"><el-icon><TrendCharts /></el-icon> 最近7天成功率趋势</div>
                      <v-chart :option="getSuccessRateOption(dept)" style="height: 260px;" autoresize />
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="chart-wrapper">
                      <div class="chart-title"><el-icon><DataLine /></el-icon> 最近7天响应时间趋势</div>
                      <v-chart :option="getResponseTimeOption(dept)" style="height: 260px;" autoresize />
                    </div>
                  </el-col>
                </el-row>

                <div class="chart-wrapper" style="margin-top: 20px;">
                  <div class="chart-title"><el-icon><Histogram /></el-icon> 最近7天调用量与错误数对比</div>
                  <v-chart :option="getCallErrorOption(dept)" style="height: 260px;" autoresize />
                </div>
              </div>
            </el-tab-pane>

            <el-tab-pane label="适配器配置" name="adapter">
              <div class="detail-section">
                <el-descriptions :column="2" border size="default">
                  <el-descriptions-item label="适配器名称">{{ dept.adapter.name }}</el-descriptions-item>
                  <el-descriptions-item label="适配器版本">v{{ dept.adapter.version }}</el-descriptions-item>
                  <el-descriptions-item label="对接协议">{{ dept.adapter.protocol }}</el-descriptions-item>
                  <el-descriptions-item label="数据格式">{{ dept.adapter.format }}</el-descriptions-item>
                  <el-descriptions-item label="基础地址" :span="2">{{ dept.adapter.baseUrl }}</el-descriptions-item>
                  <el-descriptions-item label="AppKey">{{ dept.adapter.appKey }}</el-descriptions-item>
                  <el-descriptions-item label="AppSecret">{{ dept.adapter.appSecret }}</el-descriptions-item>
                  <el-descriptions-item label="签名方式">{{ dept.adapter.signType }}</el-descriptions-item>
                  <el-descriptions-item label="超时时间">{{ dept.adapter.timeout }}ms</el-descriptions-item>
                  <el-descriptions-item label="重试次数">{{ dept.adapter.retryCount }}次</el-descriptions-item>
                  <el-descriptions-item label="限流配置">{{ dept.adapter.rateLimit }}次/分钟</el-descriptions-item>
                  <el-descriptions-item label="白名单IP" :span="2">
                    <el-tag v-for="ip in dept.adapter.whitelistIps" :key="ip" size="small" style="margin-right: 6px;">
                      {{ ip }}
                    </el-tag>
                  </el-descriptions-item>
                </el-descriptions>

                <div class="adapter-actions">
                  <el-button type="primary" :icon="Edit">编辑配置</el-button>
                  <el-button :icon="Key">密钥管理</el-button>
                  <el-button :icon="Connection">测试连通性</el-button>
                  <el-button type="success" :icon="Check">启用适配器</el-button>
                  <el-button type="danger" :icon="SwitchButton">停用适配器</el-button>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <el-empty v-if="filteredDepartments.length === 0" description="没有匹配的委办局" :image-size="100" style="padding: 80px 0;" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Search, Refresh, Download, Plus, Filter, RefreshLeft, ArrowDown, Clock, Calendar,
  Phone, Setting, List, CircleCheck, Timer, WarningFilled, DataAnalysis, TrendCharts,
  DataLine, Histogram, Edit, Key, Connection, Check, SwitchButton, Odometer,
  OfficeBuilding, User, Document, Lock, School, FirstAidKit, Money,
  House, Van, Guide, ShoppingCart, PoliceCar, Place, DataBoard, Reading,
  SunnyFiles, Lightning
} from '@element-plus/icons-vue'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

type DepartmentStatus = 'online' | 'debugging' | 'offline'

interface ApiItem {
  code: string
  name: string
  method: 'GET' | 'POST' | 'PUT'
  path: string
  callCount: number
  successRate: number
  avgResponse: number
  status: 'active' | 'inactive'
}

interface HealthStats {
  successRate: number
  avgResponse: number
  errorCount: number
  errorRate: number
}

interface AdapterConfig {
  name: string
  version: string
  protocol: string
  format: string
  baseUrl: string
  appKey: string
  appSecret: string
  signType: string
  timeout: number
  retryCount: number
  rateLimit: number
  whitelistIps: string[]
}

interface Department {
  id: string
  name: string
  abbr: string
  category: string
  icon: any
  logoBg: string
  status: DepartmentStatus
  apiCount: number
  callCount7d: number
  callTrend: number[]
  healthScore: number
  lastHeartbeat: string
  connectDate: string
  owner: string
  phone: string
  apis: ApiItem[]
  apiSearch: string
  activeTab: string
  healthStats: HealthStats
  successRate7d: number[]
  responseTime7d: number[]
  callCount7dDaily: number[]
  errorCount7d: number[]
  adapter: AdapterConfig
}

const iconMap: Record<string, any> = {
  PoliceCar, User, FirstAidKit, House, School,
  Money, OfficeBuilding, Van, Guide, ShoppingCart,
  Place, DataBoard, Reading, SunnyFiles, Document,
  Lock, Lightning
}

const deptNames = [
  { name: '郑州市公安局', abbr: '公安局', category: '公安司法', icon: 'PoliceCar', logoBg: '#1E4FA5' },
  { name: '郑州市人力资源和社会保障局', abbr: '人社局', category: '社会保障', icon: 'User', logoBg: '#27AE60' },
  { name: '郑州市医疗保障局', abbr: '医保局', category: '医疗卫生', icon: 'FirstAidKit', logoBg: '#E74C3C' },
  { name: '郑州住房公积金管理中心', abbr: '公积金中心', category: '社会保障', icon: 'House', logoBg: '#F39C12' },
  { name: '郑州市教育局', abbr: '教育局', category: '教育文化', icon: 'School', logoBg: '#8E44AD' },
  { name: '郑州市卫生健康委员会', abbr: '卫健委', category: '医疗卫生', icon: 'FirstAidKit', logoBg: '#16A085' },
  { name: '国家税务总局郑州市税务局', abbr: '税务局', category: '财政税务', icon: 'Money', logoBg: '#2980B9' },
  { name: '郑州市自然资源和规划局', abbr: '自然资源和规划局', category: '城乡建设', icon: 'Place', logoBg: '#D35400' },
  { name: '郑州市住房保障和房地产管理局', abbr: '住建局', category: '城乡建设', icon: 'OfficeBuilding', logoBg: '#C0392B' },
  { name: '郑州市交通运输局', abbr: '交通局', category: '交通运输', icon: 'Van', logoBg: '#2C3E50' },
  { name: '郑州市民政局', abbr: '民政局', category: '民生保障', icon: 'Guide', logoBg: '#1ABC9C' },
  { name: '郑州市市场监督管理局', abbr: '市场监管局', category: '政务服务', icon: 'ShoppingCart', logoBg: '#E67E22' },
  { name: '郑州市公安局交通警察支队', abbr: '交警支队', category: '公安司法', icon: 'PoliceCar', logoBg: '#34495E' },
  { name: '郑州市不动产登记中心', abbr: '不动产登记中心', category: '城乡建设', icon: 'Document', logoBg: '#9B59B6' },
  { name: '郑州市公安局户政管理支队', abbr: '户政支队', category: '公安司法', icon: 'Lock', logoBg: '#7F8C8D' },
  { name: '郑州市政务服务和大数据管理局', abbr: '政务大数据局', category: '政务服务', icon: 'DataBoard', logoBg: '#0D3A7C' },
  { name: '郑州市文化广电和旅游局', abbr: '文旅局', category: '教育文化', icon: 'Reading', logoBg: '#E91E63' },
  { name: '郑州市生态环境局', abbr: '生态环境局', category: '生态环境', icon: 'SunnyFiles', logoBg: '#009688' },
  { name: '郑州市退役军人事务局', abbr: '退役军人事务局', category: '民生保障', icon: 'SunnyFiles', logoBg: '#5D4037' },
  { name: '郑州市应急管理局', abbr: '应急管理局', category: '应急管理', icon: 'Lightning', logoBg: '#FF5722' }
]

const apiTemplates = [
  { code: 'QUERY', name: '信息查询', method: 'GET' as const, path: '/api/query' },
  { code: 'CREATE', name: '业务办理', method: 'POST' as const, path: '/api/apply' },
  { code: 'UPDATE', name: '信息更新', method: 'PUT' as const, path: '/api/update' },
  { code: 'VERIFY', name: '身份核验', method: 'POST' as const, path: '/api/verify' },
  { code: 'LIST', name: '列表查询', method: 'GET' as const, path: '/api/list' },
  { code: 'DETAIL', name: '详情查询', method: 'GET' as const, path: '/api/detail' },
  { code: 'SUBMIT', name: '材料提交', method: 'POST' as const, path: '/api/submit' },
  { code: 'CANCEL', name: '业务撤销', method: 'POST' as const, path: '/api/cancel' },
  { code: 'EXPORT', name: '数据导出', method: 'GET' as const, path: '/api/export' },
  { code: 'NOTIFY', name: '通知推送', method: 'POST' as const, path: '/api/notify' },
  { code: 'UPLOAD', name: '文件上传', method: 'POST' as const, path: '/api/upload' },
  { code: 'DOWNLOAD', name: '文件下载', method: 'GET' as const, path: '/api/download' },
  { code: 'AUDIT', name: '审核接口', method: 'POST' as const, path: '/api/audit' },
  { code: 'PAY', name: '缴费接口', method: 'POST' as const, path: '/api/pay' },
  { code: 'PRINT', name: '打印接口', method: 'GET' as const, path: '/api/print' },
  { code: 'STATISTICS', name: '统计查询', method: 'GET' as const, path: '/api/statistics' },
  { code: 'AUTH', name: '认证授权', method: 'POST' as const, path: '/api/auth' },
  { code: 'SYNC', name: '数据同步', method: 'POST' as const, path: '/api/sync' },
  { code: 'VALIDATE', name: '数据校验', method: 'POST' as const, path: '/api/validate' },
  { code: 'BATCH', name: '批量操作', method: 'POST' as const, path: '/api/batch' }
]

const ownerPool = ['张建国', '李明华', '王志强', '刘淑芬', '赵文博', '陈晓燕', '周海涛', '吴慧敏', '郑伟东', '孙丽娟', '钱志宏', '冯晓光']

function generateApis(count: number, prefix: string): ApiItem[] {
  return apiTemplates.slice(0, count).map((tpl, i) => {
    const callCount = Math.floor(1000 + Math.random() * 80000)
    const successRate = Math.floor(95 + Math.random() * 5)
    const avgResponse = Math.floor(50 + Math.random() * 250)
    return {
      ...tpl,
      code: `${prefix}_${tpl.code}_${String(i + 1).padStart(3, '0')}`,
      path: `/dept/${prefix.toLowerCase()}${tpl.path}`,
      callCount,
      successRate: successRate > 100 ? 99 : successRate,
      avgResponse,
      status: Math.random() > 0.1 ? 'active' : 'inactive'
    }
  })
}

function generateDepartment(idx: number, info: typeof deptNames[0]): Department {
  const statuses: DepartmentStatus[] = ['online', 'online', 'online', 'online', 'online', 'online', 'online', 'online', 'debugging', 'offline']
  const apiCount = 3 + Math.floor(Math.random() * 18)
  const callTrend = Array.from({ length: 14 }, () => Math.floor(2000 + Math.random() * 15000))
  const call7d = callTrend.slice(-7).reduce((a, b) => a + b, 0)
  const successRate7d = Array.from({ length: 7 }, () => Math.floor(93 + Math.random() * 7))
  const responseTime7d = Array.from({ length: 7 }, () => Math.floor(60 + Math.random() * 200))
  const callCount7dDaily = callTrend.slice(-7)
  const errorCount7d = callCount7dDaily.map(c => Math.floor(c * (1 - Math.random() * 0.03 - 0.97)))
  const avgSuccess = Math.round(successRate7d.reduce((a, b) => a + b, 0) / 7)
  const avgResp = Math.round(responseTime7d.reduce((a, b) => a + b, 0) / 7)
  const totalError = errorCount7d.reduce((a, b) => a + b, 0)
  const totalCalls = callCount7dDaily.reduce((a, b) => a + b, 0)
  const errorRate = Math.round((totalError / Math.max(totalCalls, 1)) * 10000) / 100
  const connectDate = `202${2 + Math.floor(Math.random() * 3)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`
  const lastHeartbeatH = Math.floor(Math.random() * 24)
  const lastHeartbeatM = Math.floor(Math.random() * 60)
  const owner = ownerPool[idx % ownerPool.length]

  return {
    id: `dept_${String(idx + 1).padStart(3, '0')}`,
    name: info.name,
    abbr: info.abbr,
    category: info.category,
    icon: iconMap[info.icon] || OfficeBuilding,
    logoBg: info.logoBg,
    status: statuses[idx % statuses.length],
    apiCount,
    callCount7d: call7d,
    callTrend,
    healthScore: avgSuccess,
    lastHeartbeat: `${String(lastHeartbeatH).padStart(2, '0')}:${String(lastHeartbeatM).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    connectDate,
    owner,
    phone: `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
    apis: generateApis(apiCount, info.abbr),
    apiSearch: '',
    activeTab: 'apis',
    healthStats: {
      successRate: avgSuccess,
      avgResponse: avgResp,
      errorCount: totalError,
      errorRate
    },
    successRate7d,
    responseTime7d,
    callCount7dDaily,
    errorCount7d,
    adapter: {
      name: `${info.abbr}数据适配器`,
      version: `${1 + Math.floor(Math.random() * 3)}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      protocol: ['RESTful API', 'SOAP WebService', 'HTTP JSON', 'HTTPS POST'][idx % 4],
      format: ['JSON', 'XML', 'JSON/XML'][idx % 3],
      baseUrl: `https://api.zhengzhou.gov.cn/gateway/${info.abbr.toLowerCase()}/v1`,
      appKey: `ZZ_${info.abbr.toUpperCase()}_${String(Math.random().toString(36).slice(2, 10)).toUpperCase()}`,
      appSecret: '********************************',
      signType: ['MD5', 'SHA256', 'HMAC-SHA256', 'RSA2'][idx % 4],
      timeout: 3000 + Math.floor(Math.random() * 5) * 1000,
      retryCount: 1 + Math.floor(Math.random() * 3),
      rateLimit: 100 + Math.floor(Math.random() * 10) * 50,
      whitelistIps: [
        `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        `172.${16 + Math.floor(Math.random() * 16)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`
      ]
    }
  }
}

const departments = ref<Department[]>([])

onMounted(() => {
  departments.value = deptNames.map((info, idx) => generateDepartment(idx, info))
})

const filterForm = reactive({
  keyword: '',
  status: '',
  category: ''
})

const expandedId = ref<string | null>(null)

const onlineCount = computed(() => departments.value.filter(d => d.status === 'online').length)
const debuggingCount = computed(() => departments.value.filter(d => d.status === 'debugging').length)
const offlineCount = computed(() => departments.value.filter(d => d.status === 'offline').length)

const filteredDepartments = computed(() => {
  return departments.value.filter(d => {
    if (filterForm.status && d.status !== filterForm.status) return false
    if (filterForm.category && d.category !== filterForm.category) return false
    if (filterForm.keyword) {
      const kw = filterForm.keyword.toLowerCase()
      return (
        d.name.toLowerCase().includes(kw) ||
        d.abbr.toLowerCase().includes(kw) ||
        d.owner.toLowerCase().includes(kw)
      )
    }
    return true
  })
})

function statusText(s: DepartmentStatus) {
  return { online: '已接入', debugging: '调试中', offline: '已停用' }[s]
}

function statusTagType(s: DepartmentStatus) {
  return { online: 'success', debugging: 'warning', offline: 'info' }[s] as 'success' | 'warning' | 'info'
}

function statusIcon(s: DepartmentStatus) {
  return { online: CircleCheck, debugging: Timer, offline: SwitchButton }[s]
}

function healthColor(score: number) {
  if (score >= 95) return '#27AE60'
  if (score >= 85) return '#F39C12'
  return '#E74C3C'
}

function formatNum(n: number, digits = 0) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

function get7dLabels() {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
}

function getMiniChartOption(dept: Department) {
  const data = dept.callTrend.slice(-7)
  const max = Math.max(...data)
  const min = Math.min(...data)
  return {
    grid: { left: 0, right: 0, top: 2, bottom: 2 },
    xAxis: { type: 'category', show: false, data: data.map((_, i) => i) },
    yAxis: { type: 'value', show: false, min: min * 0.95, max: max * 1.05 },
    tooltip: { show: false },
    series: [{
      type: 'line',
      data,
      smooth: true,
      showSymbol: false,
      lineStyle: { color: '#1E4FA5', width: 2 },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(30,79,165,0.4)' },
            { offset: 1, color: 'rgba(30,79,165,0.05)' }
          ]
        }
      }
    }]
  }
}

function getSuccessRateOption(dept: Department) {
  return {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>成功率: {c}%' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: get7dLabels(),
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#EBEEF5' } }
    },
    yAxis: {
      type: 'value',
      min: 90,
      max: 100,
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } }
    },
    series: [{
      name: '成功率',
      type: 'line',
      data: dept.successRate7d,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#27AE60', width: 3 },
      itemStyle: { color: '#27AE60' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(39,174,96,0.35)' },
            { offset: 1, color: 'rgba(39,174,96,0.02)' }
          ]
        }
      }
    }]
  }
}

function getResponseTimeOption(dept: Department) {
  return {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>响应时间: {c}ms' },
    grid: { left: 50, right: 20, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: get7dLabels(),
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#EBEEF5' } }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } }
    },
    series: [{
      name: '响应时间',
      type: 'line',
      data: dept.responseTime7d,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#1E4FA5', width: 3 },
      itemStyle: { color: '#1E4FA5' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(30,79,165,0.35)' },
            { offset: 1, color: 'rgba(30,79,165,0.02)' }
          ]
        }
      }
    }]
  }
}

function getCallErrorOption(dept: Department) {
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['调用量', '错误数'], right: 10 },
    grid: { left: 50, right: 50, top: 30, bottom: 30 },
    xAxis: {
      type: 'category',
      data: get7dLabels(),
      axisLine: { lineStyle: { color: '#EBEEF5' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '调用量',
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } }
      },
      {
        type: 'value',
        name: '错误数',
        splitLine: { show: false }
      }
    ],
    series: [
      {
        name: '调用量',
        type: 'bar',
        data: dept.callCount7dDaily,
        barWidth: 24,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#79BBFF' },
              { offset: 1, color: '#1E4FA5' }
            ]
          }
        }
      },
      {
        name: '错误数',
        type: 'line',
        yAxisIndex: 1,
        data: dept.errorCount7d,
        smooth: true,
        symbol: 'circle',
        symbolSize: 8,
        lineStyle: { color: '#E74C3C', width: 3 },
        itemStyle: { color: '#E74C3C' }
      }
    ]
  }
}

function filterApis(dept: Department) {
  if (!dept.apiSearch) return dept.apis
  const kw = dept.apiSearch.toLowerCase()
  return dept.apis.filter(a =>
    a.code.toLowerCase().includes(kw) ||
    a.name.toLowerCase().includes(kw) ||
    a.path.toLowerCase().includes(kw)
  )
}

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function applyFilter() {
  // 响应式自动更新
}

function resetFilter() {
  filterForm.keyword = ''
  filterForm.status = ''
  filterForm.category = ''
}

function refreshData() {
  departments.value.forEach(d => {
    d.healthScore = Math.min(99, Math.max(85, d.healthScore + Math.floor(Math.random() * 7) - 3))
    const h = Math.floor(Math.random() * 24)
    const m = Math.floor(Math.random() * 60)
    d.lastHeartbeat = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`
  })
}

function handleAdd() {
  // 预留新增接入逻辑
}

function handleCall(dept: Department) {
  // 预留联系逻辑
}

function handleConfig(dept: Department) {
  expandedId.value = dept.id
  dept.activeTab = 'adapter'
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.departments-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 8px 0 20px;

  h2 {
    margin: 0 0 8px;
    font-size: 22px;
    color: $text-primary;
    font-weight: 700;
  }

  .header-sub {
    margin: 0;
    color: $text-secondary;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.filter-bar {
  display: flex;
  align-items: center;

  :deep(.el-form) {
    margin: 0;
  }

  :deep(.el-form-item) {
    margin-bottom: 0;
    margin-right: 16px;
  }
}

.departments-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 20px;
}

.dept-card {
  background: $bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;

  &:hover {
    box-shadow: $shadow-md;
    border-color: $primary-light;
    transform: translateY(-2px);
  }

  &.is-expanded {
    border-color: $primary-color;
    box-shadow: $shadow-lg;
  }
}

.card-top {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  margin-bottom: 16px;
  position: relative;
}

.dept-logo {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dept-basic {
  flex: 1;
  min-width: 0;
}

.dept-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.dept-name {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
}

.status-tag {
  flex-shrink: 0;
}

.dept-abbr {
  font-size: 12px;
  color: $text-secondary;
}

.expand-icon {
  color: $text-secondary;
  transition: transform 0.3s ease;
  font-size: 14px;

  &.rotated {
    transform: rotate(180deg);
    color: $primary-color;
  }
}

.card-metrics {
  display: flex;
  gap: 16px;
  padding: 12px;
  background: $border-extra-light;
  border-radius: $radius-sm;
  margin-bottom: 14px;
}

.metric-item {
  flex: 1;
  text-align: center;

  &.mini-chart-wrapper {
    flex: 0 0 auto;
    text-align: left;
    padding-left: 16px;
    border-left: 1px solid $border-lighter;
  }
}

.metric-label {
  font-size: 11px;
  color: $text-secondary;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: $primary-color;
}

.card-health {
  margin-bottom: 14px;
}

.health-row {
  display: flex;
  align-items: center;
}

.health-label {
  font-size: 12px;
  color: $text-secondary;
  width: 48px;
  flex-shrink: 0;
}

.health-score {
  font-size: 13px;
  font-weight: 600;
  width: 42px;
  text-align: right;
  flex-shrink: 0;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-top: 1px solid $border-lighter;
  border-bottom: 1px solid $border-lighter;
  margin-bottom: 12px;
}

.footer-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: $text-regular;
}

.card-contact {
  display: flex;
  align-items: center;
  gap: 12px;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.owner-name {
  font-size: 13px;
  font-weight: 500;
  color: $text-primary;
  margin-bottom: 2px;
}

.owner-phone {
  font-size: 12px;
  color: $text-secondary;
}

.contact-actions {
  display: flex;
  gap: 4px;
}

.card-detail {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 2px solid $primary-color;
  cursor: default;
}

.detail-tabs {
  :deep(.el-tabs__item) {
    font-weight: 500;
  }
}

.detail-section {
  padding-top: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: 6px;
}

.health-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.health-stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: $radius-md;
  background: $border-extra-light;

  &.success {
    background: linear-gradient(135deg, #d4f5e3 0%, #ffffff 100%);
    .hs-icon { color: $success-color; background: rgba(39, 174, 96, 0.15); }
    .hs-value { color: $success-color; }
  }

  &.primary {
    background: linear-gradient(135deg, #d4e4f7 0%, #ffffff 100%);
    .hs-icon { color: $primary-color; background: rgba(30, 79, 165, 0.15); }
    .hs-value { color: $primary-color; }
  }

  &.warning {
    background: linear-gradient(135deg, #fdecd4 0%, #ffffff 100%);
    .hs-icon { color: $warning-color; background: rgba(243, 156, 18, 0.15); }
    .hs-value { color: $warning-color; }
  }

  &.danger {
    background: linear-gradient(135deg, #fcd9d9 0%, #ffffff 100%);
    .hs-icon { color: $danger-color; background: rgba(231, 76, 60, 0.15); }
    .hs-value { color: $danger-color; }
  }
}

.hs-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.hs-value {
  font-size: 24px;
  font-weight: 700;
  line-height: 1.2;
}

.hs-label {
  font-size: 12px;
  color: $text-secondary;
}

.chart-wrapper {
  background: $border-extra-light;
  border-radius: $radius-md;
  padding: 16px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.adapter-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid $border-lighter;
  flex-wrap: wrap;
}
</style>
