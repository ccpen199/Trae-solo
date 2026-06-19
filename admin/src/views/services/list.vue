<template>
  <div class="services-container">
    <div class="page-header">
      <div>
        <h2>办事服务管理</h2>
        <p class="header-sub">
          <el-icon><Service /></el-icon>
          共 {{ filteredServices.length }} 项服务 · 在线 {{ onlineCount }} · 维护中 {{ maintainingCount }} · 已下线 {{ offlineCount }}
          <el-tag type="success" effect="dark" style="margin-left: 12px;" size="small">
            <el-icon><Odometer /></el-icon> 实时监控
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-button type="primary" :icon="Plus">新增服务</el-button>
        <el-button :icon="Refresh" @click="refreshData">刷新数据</el-button>
        <el-button :icon="Download">批量导出</el-button>
      </div>
    </div>

    <div class="card-wrapper filter-bar">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="关键词">
          <el-input
            v-model="filterForm.keyword"
            placeholder="搜索服务名称/编码/委办局"
            :prefix-icon="Search"
            clearable
            style="width: 260px;"
          />
        </el-form-item>
        <el-form-item label="服务类别">
          <el-select v-model="filterForm.category" placeholder="全部类别" clearable style="width: 160px;">
            <el-option v-for="c in categoryOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="委办局">
          <el-select v-model="filterForm.department" placeholder="全部部门" clearable style="width: 180px;">
            <el-option v-for="d in departmentOptions" :key="d" :label="d" :value="d" />
          </el-select>
        </el-form-item>
        <el-form-item label="上线状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" clearable style="width: 140px;">
            <el-option label="已上线" value="online" />
            <el-option label="维护中" value="maintaining" />
            <el-option label="已下线" value="offline" />
          </el-select>
        </el-form-item>
        <el-form-item label="办理渠道">
          <el-select v-model="filterForm.channel" placeholder="全部渠道" clearable style="width: 140px;">
            <el-option label="APP" value="APP" />
            <el-option label="小程序" value="小程序" />
            <el-option label="PC端" value="PC端" />
            <el-option label="窗口办理" value="窗口办理" />
            <el-option label="自助终端" value="自助终端" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Filter" @click="applyFilter">筛选</el-button>
          <el-button :icon="RefreshLeft" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-row :gutter="20" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><Document /></div>
          <div class="stat-label">服务总数</div>
          <div class="stat-value">{{ services.length }} <span style="font-size: 14px;">项</span></div>
          <div class="stat-sub"><TrendCharts class="up" />较上月 +{{ Math.floor(Math.random() * 8 + 3) }} 项</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-icon"><Tickets /></div>
          <div class="stat-label">今日办件量</div>
          <div class="stat-value">{{ formatNum(summary.todayApplications, 0) }}</div>
          <div class="stat-sub"><TrendCharts class="up" />较昨日 +{{ Math.floor(Math.random() * 15 + 5) }}%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><Timer /></div>
          <div class="stat-label">平均办理时长</div>
          <div class="stat-value">{{ summary.avgHandleTime }} <span style="font-size: 14px;">分钟</span></div>
          <div class="stat-sub"><TrendCharts class="down" />较上周 -{{ Math.floor(Math.random() * 8 + 2) }}%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-info">
          <div class="stat-icon"><Star /></div>
          <div class="stat-label">群众满意度</div>
          <div class="stat-value">{{ summary.satisfaction }} <span style="font-size: 14px;">分</span></div>
          <div class="stat-sub"><TrendCharts class="up" />较上月 +0.{{ Math.floor(Math.random() * 6 + 2) }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title"><el-icon><Histogram /></el-icon> 各类别服务办件量</div>
            <el-tag type="primary" effect="plain" round size="small">近7天</el-tag>
          </div>
          <v-chart :option="categoryBarOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title"><el-icon><DataLine /></el-icon> 近7天办件量与满意度趋势</div>
            <el-tag type="info" effect="plain" round size="small">双Y轴对比</el-tag>
          </div>
          <v-chart :option="trendLineOption" style="height: 320px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title"><el-icon><List /></el-icon> 办事服务列表</div>
        <div class="table-tools">
          <el-input
            v-model="tableSearch"
            placeholder="在结果中搜索..."
            :prefix-icon="Search"
            size="small"
            clearable
            style="width: 220px; margin-right: 12px;"
          />
          <el-button-group>
            <el-button size="small" :type="viewMode === 'table' ? 'primary' : ''" @click="viewMode = 'table'" :icon="Grid">列表</el-button>
            <el-button size="small" :type="viewMode === 'card' ? 'primary' : ''" @click="viewMode = 'card'" :icon="Menu">卡片</el-button>
          </el-button-group>
        </div>
      </div>

      <el-table
        v-if="viewMode === 'table'"
        :data="pagedServices"
        size="default"
        :expand-row-keys="expandRowKeys"
        @expand-change="handleExpandChange"
        stripe
        border
      >
        <el-table-column type="expand">
          <template #default="{ row }">
            <div class="expand-detail">
              <el-tabs v-model="row.activeTab">
                <el-tab-pane label="材料清单" name="materials">
                  <div class="detail-section">
                    <div class="section-tag">共 {{ row.materials.length }} 项材料</div>
                    <div class="materials-grid">
                      <div v-for="(m, idx) in row.materials" :key="idx" class="material-item">
                        <div class="material-header">
                          <el-tag size="small" :type="m.required ? 'danger' : 'info'" round>
                            {{ m.required ? '必填' : '选填' }}
                          </el-tag>
                          <span class="material-name">{{ m.name }}</span>
                        </div>
                        <div class="material-meta">
                          <span>份数：{{ m.copies }}份</span>
                          <span>形式：{{ m.form }}</span>
                        </div>
                        <div class="material-remark">{{ m.remark }}</div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="办理流程" name="process">
                  <div class="detail-section">
                    <el-steps :active="row.processSteps.length" finish-status="success" process-status="primary" simple>
                      <el-step v-for="(step, idx) in row.processSteps" :key="idx" :title="step.title" :description="step.desc" />
                    </el-steps>
                    <div class="process-detail">
                      <div v-for="(step, idx) in row.processSteps" :key="idx" class="process-step">
                        <div class="step-num">{{ idx + 1 }}</div>
                        <div class="step-content">
                          <div class="step-title">{{ step.title }} <span class="step-duration">{{ step.duration }}</span></div>
                          <div class="step-desc">{{ step.desc }}</div>
                          <div v-if="step.department" class="step-dept">办理部门：{{ step.department }}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="关联政策" name="policies">
                  <div class="detail-section">
                    <div class="section-tag">相关政策法规 {{ row.policies.length }} 条</div>
                    <div class="policy-list">
                      <div v-for="(p, idx) in row.policies" :key="idx" class="policy-item">
                        <el-icon class="policy-icon"><Document /></el-icon>
                        <div class="policy-info">
                          <div class="policy-title">{{ p.title }}</div>
                          <div class="policy-meta">
                            <el-tag size="small" effect="plain">{{ p.type }}</el-tag>
                            <span>文号：{{ p.code }}</span>
                            <span>发布日期：{{ p.date }}</span>
                          </div>
                        </div>
                        <el-button type="primary" link size="small">查看原文</el-button>
                      </div>
                    </div>
                  </div>
                </el-tab-pane>

                <el-tab-pane label="常见问题" name="faq">
                  <div class="detail-section">
                    <div class="section-tag">FAQ 共 {{ row.faqs.length }} 条</div>
                    <el-collapse>
                      <el-collapse-item v-for="(faq, idx) in row.faqs" :key="idx" :title="'Q' + (idx + 1) + '. ' + faq.q" :name="idx">
                        <div class="faq-answer">
                          <strong>A：</strong>{{ faq.a }}
                        </div>
                      </el-collapse-item>
                    </el-collapse>
                  </div>
                </el-tab-pane>
              </el-tabs>
            </div>
          </template>
        </el-table-column>

        <el-table-column type="index" label="#" width="55" align="center" />

        <el-table-column label="服务信息" min-width="220">
          <template #default="{ row }">
            <div class="service-info-cell">
              <div class="service-icon" :style="{ background: row.iconBg }">
                <el-icon :size="18" :color="'#fff'"><component :is="row.icon" /></el-icon>
              </div>
              <div class="service-text">
                <div class="service-name">{{ row.name }}</div>
                <div class="service-code">编码：{{ row.code }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="category" label="所属类别" width="110" align="center">
          <template #default="{ row }">
            <el-tag size="small" :color="categoryColor(row.category)" effect="light" style="border: none;">
              {{ row.category }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="department" label="委办局" width="130" show-overflow-tooltip />

        <el-table-column label="办理形式" width="130" align="center">
          <template #default="{ row }">
            <el-tag
              v-for="f in row.handleForms"
              :key="f"
              size="small"
              :type="formTagType(f)"
              effect="plain"
              style="margin-right: 4px;"
            >{{ f }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column label="办件量" width="160" align="center">
          <template #default="{ row }">
            <div class="applications-cell">
              <div class="app-num">近7天 <strong>{{ formatNum(row.weekApplications, 0) }}</strong></div>
              <div class="app-total">累计 {{ formatNum(row.totalApplications) }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="avgHandleTime" label="平均时长" width="100" align="center">
          <template #default="{ row }">
            <span>{{ row.avgHandleTime }}分钟</span>
          </template>
        </el-table-column>

        <el-table-column label="满意度" width="110" align="center">
          <template #default="{ row }">
            <el-rate v-model="row.rateStar" disabled size="small" :max="5" />
            <div class="rate-text">{{ row.satisfaction }}分</div>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="dark" round size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="lastUpdate" label="最后更新" width="110" align="center" />

        <el-table-column label="操作" width="260" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" :icon="Edit">编辑</el-button>
            <el-button
              :type="row.status === 'online' ? 'warning' : 'success'"
              link
              size="small"
              @click="toggleServiceStatus(row)"
            >
              {{ row.status === 'online' ? '下线' : '上线' }}
            </el-button>
            <el-button type="info" link size="small" :icon="DataAnalysis">数据</el-button>
            <el-button type="primary" link size="small" :icon="View">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-row v-else :gutter="16" class="card-view-grid">
        <el-col v-for="row in pagedServices" :key="row.id" :span="8">
          <div class="service-card">
            <div class="sc-top">
              <div class="service-icon" :style="{ background: row.iconBg }">
                <el-icon :size="22" :color="'#fff'"><component :is="row.icon" /></el-icon>
              </div>
              <div class="sc-info">
                <div class="sc-name">{{ row.name }}</div>
                <div class="sc-meta">
                  <el-tag size="small" :color="categoryColor(row.category)" effect="light" style="border: none;">
                    {{ row.category }}
                  </el-tag>
                  <el-tag size="small" :type="statusTagType(row.status)" effect="dark" round>
                    {{ statusText(row.status) }}
                  </el-tag>
                </div>
              </div>
            </div>
            <div class="sc-stats">
              <div class="sc-stat">
                <div class="sc-stat-num">{{ formatNum(row.weekApplications, 0) }}</div>
                <div class="sc-stat-label">7天办件</div>
              </div>
              <div class="sc-stat">
                <div class="sc-stat-num">{{ row.avgHandleTime }}分</div>
                <div class="sc-stat-label">平均时长</div>
              </div>
              <div class="sc-stat">
                <div class="sc-stat-num">{{ row.satisfaction }}</div>
                <div class="sc-stat-label">满意度</div>
              </div>
            </div>
            <div class="sc-footer">
              <span class="sc-dept">{{ row.department }}</span>
              <div class="sc-actions">
                <el-button type="primary" link size="small" :icon="Edit">编辑</el-button>
                <el-button type="info" link size="small" :icon="View">详情</el-button>
              </div>
            </div>
          </div>
        </el-col>
      </el-row>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="searchedServices.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Search, Refresh, Download, Plus, Filter, RefreshLeft, Service, Odometer,
  Document, Tickets, Timer, Star, TrendCharts, Histogram, DataLine, List,
  Grid, Menu, Edit, DataAnalysis, View, CircleCheck, Warning, SwitchButton,
  User, FirstAidKit, House, School, Money, OfficeBuilding, Van, PoliceCar,
  Place, Lock, SunnyFiles, Lightning, Reading, Guide, CreditCard, Car,
  Avatar, Coin, DataBoard, Connection, Medal, Paperclip, Phone, Management, Heart
} from '@element-plus/icons-vue'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent])

type ServiceStatus = 'online' | 'maintaining' | 'offline'

interface Material {
  name: string
  required: boolean
  copies: string
  form: string
  remark: string
}

interface ProcessStep {
  title: string
  desc: string
  duration: string
  department?: string
}

interface Policy {
  title: string
  type: string
  code: string
  date: string
}

interface FAQ {
  q: string
  a: string
}

interface ServiceItem {
  id: string
  code: string
  name: string
  icon: any
  iconBg: string
  category: string
  department: string
  handleForms: string[]
  channels: string[]
  weekApplications: number
  totalApplications: number
  avgHandleTime: number
  satisfaction: number
  rateStar: number
  status: ServiceStatus
  lastUpdate: string
  materials: Material[]
  processSteps: ProcessStep[]
  policies: Policy[]
  faqs: FAQ[]
  activeTab: string
}

const iconMap: Record<string, any> = {
  User, FirstAidKit, House, School, Money, OfficeBuilding, Van, PoliceCar,
  Place, Lock, SunnyFiles, Lightning, Reading, Guide, CreditCard, Car,
  Avatar, Coin, DataBoard, Connection, Medal, Paperclip, Phone, Management,
  Service, Tickets, Timer, Star, TrendCharts, Document, Heart
}

const categoryOptions = [
  { label: '社会保障', value: '社会保障' },
  { label: '医疗保障', value: '医疗保障' },
  { label: '户籍证件', value: '户籍证件' },
  { label: '住房公积金', value: '住房公积金' },
  { label: '教育服务', value: '教育服务' },
  { label: '不动产登记', value: '不动产登记' },
  { label: '交通出行', value: '交通出行' },
  { label: '税务服务', value: '税务服务' },
  { label: '民生服务', value: '民生服务' },
  { label: '企业服务', value: '企业服务' }
]

const departmentOptions = [
  '郑州市公安局', '郑州市人社局', '郑州市医保局', '郑州住房公积金管理中心',
  '郑州市教育局', '郑州市卫健委', '郑州市税务局', '郑州市自然资源和规划局',
  '郑州市住建局', '郑州市交通局', '郑州市民政局', '郑州市市场监管局',
  '郑州市交警支队', '郑州市不动产登记中心', '郑州市户政支队',
  '郑州市政务大数据局', '郑州市文旅局', '郑州市退役军人事务局'
]

const serviceTemplates = [
  { name: '社保参保证明打印', category: '社会保障', dept: '郑州市人社局', icon: 'User', iconBg: '#1E4FA5' },
  { name: '养老保险转移接续', category: '社会保障', dept: '郑州市人社局', icon: 'User', iconBg: '#1E4FA5' },
  { name: '失业保险金申领', category: '社会保障', dept: '郑州市人社局', icon: 'Money', iconBg: '#1E4FA5' },
  { name: '工伤认定申请', category: '社会保障', dept: '郑州市人社局', icon: 'Medal', iconBg: '#1E4FA5' },
  { name: '社保卡挂失补办', category: '社会保障', dept: '郑州市人社局', icon: 'CreditCard', iconBg: '#1E4FA5' },
  { name: '退休待遇资格认证', category: '社会保障', dept: '郑州市人社局', icon: 'Avatar', iconBg: '#1E4FA5' },
  { name: '灵活就业人员参保', category: '社会保障', dept: '郑州市人社局', icon: 'User', iconBg: '#1E4FA5' },
  { name: '医保电子凭证激活', category: '医疗保障', dept: '郑州市医保局', icon: 'FirstAidKit', iconBg: '#27AE60' },
  { name: '异地就医备案', category: '医疗保障', dept: '郑州市医保局', icon: 'FirstAidKit', iconBg: '#27AE60' },
  { name: '门诊慢特病认定', category: '医疗保障', dept: '郑州市医保局', icon: 'FirstAidKit', iconBg: '#27AE60' },
  { name: '医保账户余额查询', category: '医疗保障', dept: '郑州市医保局', icon: 'Coin', iconBg: '#27AE60' },
  { name: '生育津贴申领', category: '医疗保障', dept: '郑州市医保局', icon: 'FirstAidKit', iconBg: '#27AE60' },
  { name: '医疗费用手工报销', category: '医疗保障', dept: '郑州市医保局', icon: 'Tickets', iconBg: '#27AE60' },
  { name: '新生儿落户登记', category: '户籍证件', dept: '郑州市户政支队', icon: 'Lock', iconBg: '#E74C3C' },
  { name: '市内户口迁移', category: '户籍证件', dept: '郑州市户政支队', icon: 'Lock', iconBg: '#E74C3C' },
  { name: '居民身份证补办', category: '户籍证件', dept: '郑州市公安局', icon: 'CreditCard', iconBg: '#E74C3C' },
  { name: '临时身份证明开具', category: '户籍证件', dept: '郑州市公安局', icon: 'Document', iconBg: '#E74C3C' },
  { name: '人才引进落户', category: '户籍证件', dept: '郑州市户政支队', icon: 'Medal', iconBg: '#E74C3C' },
  { name: '居住证办理', category: '户籍证件', dept: '郑州市公安局', icon: 'CreditCard', iconBg: '#E74C3C' },
  { name: '户籍证明开具', category: '户籍证件', dept: '郑州市户政支队', icon: 'Document', iconBg: '#E74C3C' },
  { name: '公积金提取申请', category: '住房公积金', dept: '郑州住房公积金管理中心', icon: 'House', iconBg: '#F39C12' },
  { name: '公积金账户余额查询', category: '住房公积金', dept: '郑州住房公积金管理中心', icon: 'Coin', iconBg: '#F39C12' },
  { name: '公积金贷款申请', category: '住房公积金', dept: '郑州住房公积金管理中心', icon: 'House', iconBg: '#F39C12' },
  { name: '租房提取公积金', category: '住房公积金', dept: '郑州住房公积金管理中心', icon: 'House', iconBg: '#F39C12' },
  { name: '公积金账户转移', category: '住房公积金', dept: '郑州住房公积金管理中心', icon: 'Connection', iconBg: '#F39C12' },
  { name: '购房提取公积金', category: '住房公积金', dept: '郑州住房公积金管理中心', icon: 'House', iconBg: '#F39C12' },
  { name: '公积金缴存证明', category: '住房公积金', dept: '郑州住房公积金管理中心', icon: 'Document', iconBg: '#F39C12' },
  { name: '义务教育入学报名', category: '教育服务', dept: '郑州市教育局', icon: 'School', iconBg: '#8E44AD' },
  { name: '中小学转学办理', category: '教育服务', dept: '郑州市教育局', icon: 'School', iconBg: '#8E44AD' },
  { name: '教师资格认定', category: '教育服务', dept: '郑州市教育局', icon: 'Medal', iconBg: '#8E44AD' },
  { name: '学生资助申请', category: '教育服务', dept: '郑州市教育局', icon: 'Money', iconBg: '#8E44AD' },
  { name: '成人高考报名', category: '教育服务', dept: '郑州市教育局', icon: 'Reading', iconBg: '#8E44AD' },
  { name: '学历认证报告', category: '教育服务', dept: '郑州市教育局', icon: 'Document', iconBg: '#8E44AD' },
  { name: '不动产登记查询', category: '不动产登记', dept: '郑州市不动产登记中心', icon: 'Place', iconBg: '#2980B9' },
  { name: '房屋所有权登记', category: '不动产登记', dept: '郑州市不动产登记中心', icon: 'OfficeBuilding', iconBg: '#2980B9' },
  { name: '不动产抵押登记', category: '不动产登记', dept: '郑州市不动产登记中心', icon: 'Place', iconBg: '#2980B9' },
  { name: '不动产预告登记', category: '不动产登记', dept: '郑州市不动产登记中心', icon: 'Document', iconBg: '#2980B9' },
  { name: '不动产权证补办', category: '不动产登记', dept: '郑州市不动产登记中心', icon: 'Paperclip', iconBg: '#2980B9' },
  { name: '不动产查封登记', category: '不动产登记', dept: '郑州市不动产登记中心', icon: 'Lock', iconBg: '#2980B9' },
  { name: '交通违法查询处理', category: '交通出行', dept: '郑州市交警支队', icon: 'Car', iconBg: '#16A085' },
  { name: '机动车六年免检', category: '交通出行', dept: '郑州市交警支队', icon: 'Car', iconBg: '#16A085' },
  { name: '驾驶证补换领', category: '交通出行', dept: '郑州市交警支队', icon: 'CreditCard', iconBg: '#16A085' },
  { name: '车辆行驶证补办', category: '交通出行', dept: '郑州市交警支队', icon: 'CreditCard', iconBg: '#16A085' },
  { name: '机动车过户登记', category: '交通出行', dept: '郑州市交警支队', icon: 'Car', iconBg: '#16A085' },
  { name: '新车选号上牌', category: '交通出行', dept: '郑州市交警支队', icon: 'Car', iconBg: '#16A085' },
  { name: '道路运输证办理', category: '交通出行', dept: '郑州市交通局', icon: 'Van', iconBg: '#16A085' },
  { name: '个税纳税记录开具', category: '税务服务', dept: '郑州市税务局', icon: 'Money', iconBg: '#D35400' },
  { name: '个人所得税申报', category: '税务服务', dept: '郑州市税务局', icon: 'Money', iconBg: '#D35400' },
  { name: '房产交易契税申报', category: '税务服务', dept: '郑州市税务局', icon: 'House', iconBg: '#D35400' },
  { name: '增值税发票代开', category: '税务服务', dept: '郑州市税务局', icon: 'Paperclip', iconBg: '#D35400' },
  { name: '税务登记变更', category: '税务服务', dept: '郑州市税务局', icon: 'Management', iconBg: '#D35400' },
  { name: '税收优惠备案', category: '税务服务', dept: '郑州市税务局', icon: 'Document', iconBg: '#D35400' },
  { name: '婚姻登记预约', category: '民生服务', dept: '郑州市民政局', icon: 'Heart', iconBg: '#E91E63' },
  { name: '城乡低保申请', category: '民生服务', dept: '郑州市民政局', icon: 'User', iconBg: '#E91E63' },
  { name: '高龄津贴申领', category: '民生服务', dept: '郑州市民政局', icon: 'Avatar', iconBg: '#E91E63' },
  { name: '残疾人证办理', category: '民生服务', dept: '郑州市民政局', icon: 'Medal', iconBg: '#E91E63' },
  { name: '儿童收养登记', category: '民生服务', dept: '郑州市民政局', icon: 'User', iconBg: '#E91E63' },
  { name: '特困人员救助供养', category: '民生服务', dept: '郑州市民政局', icon: 'User', iconBg: '#E91E63' },
  { name: '营业执照办理', category: '企业服务', dept: '郑州市市场监管局', icon: 'OfficeBuilding', iconBg: '#2C3E50' },
  { name: '企业变更登记', category: '企业服务', dept: '郑州市市场监管局', icon: 'Management', iconBg: '#2C3E50' },
  { name: '食品经营许可证', category: '企业服务', dept: '郑州市市场监管局', icon: 'Document', iconBg: '#2C3E50' },
  { name: '特种设备使用登记', category: '企业服务', dept: '郑州市市场监管局', icon: 'SunnyFiles', iconBg: '#2C3E50' },
  { name: '建设工程规划许可', category: '企业服务', dept: '郑州市自然资源和规划局', icon: 'OfficeBuilding', iconBg: '#2C3E50' },
  { name: '施工许可证办理', category: '企业服务', dept: '郑州市住建局', icon: 'OfficeBuilding', iconBg: '#2C3E50' }
]

const materialTemplates = [
  { name: '申请人居民身份证', form: '原件+复印件', required: true },
  { name: '户口簿', form: '原件+复印件', required: true },
  { name: '近期免冠照片', form: '电子版', required: true },
  { name: '收入证明', form: '原件', required: false },
  { name: '婚姻状况证明', form: '原件+复印件', required: false },
  { name: '工作证明', form: '原件', required: true },
  { name: '房产证/购房合同', form: '原件+复印件', required: true },
  { name: '社保缴纳证明', form: '打印件', required: false },
  { name: '学历证书', form: '原件+复印件', required: false },
  { name: '申请表（签字）', form: '纸质版', required: true }
]

const policyTemplates = [
  { type: '法律', code: '主席令第35号', title: '中华人民共和国社会保险法', date: '2018-12-29' },
  { type: '法规', code: '国务院令第710号', title: '住房公积金管理条例（2019修订）', date: '2019-03-24' },
  { type: '规章', code: '人社部令第13号', title: '社会保险个人权益记录管理办法', date: '2011-06-29' },
  { type: '规范性文件', code: '豫政办〔2022〕55号', title: '河南省人民政府办公厅关于加快推进政务服务标准化的实施意见', date: '2022-08-15' },
  { type: '规范性文件', code: '郑政〔2023〕12号', title: '郑州市人民政府关于优化政务服务环境的若干措施', date: '2023-03-10' }
]

const faqTemplates: FAQ[] = [
  { q: '办理此项服务需要多长时间？', a: '一般情况下，线上申请1-3个工作日内办结，窗口办理即时办结或5个工作日内办结，具体以实际办理流程为准。' },
  { q: '可以委托他人代办吗？', a: '可以，需提供双方有效身份证件原件及经公证的授权委托书。线上办理可通过实名认证账号进行授权代办。' },
  { q: '申请材料不全怎么办？', a: '我们会通过短信、APP推送一次性告知需要补正的全部材料，补正后重新提交即可，补正期限一般为5个工作日。' },
  { q: '办理进度如何查询？', a: '可在APP"我的办件"中实时查看进度，也可拨打12345政务服务热线查询，或携带身份证到政务大厅自助终端查询。' },
  { q: '对办理结果不满意怎么办？', a: '可在APP评价页面提交差评，我们会在24小时内由专人联系处理；也可通过12345热线进行投诉举报。' }
]

function genMaterials(): Material[] {
  const count = 3 + Math.floor(Math.random() * 5)
  const shuffled = [...materialTemplates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(m => ({
    ...m,
    copies: `${1 + Math.floor(Math.random() * 3)}`,
    remark: m.required ? '请确保材料在有效期内，复印件需加盖单位公章或本人签字确认' : '如无法提供，可签署容缺受理承诺书后先行办理'
  }))
}

function genProcessSteps(category: string): ProcessStep[] {
  const baseSteps = [
    [
      { title: '线上/窗口提交申请', desc: '填写申请表并上传所需材料', duration: '10分钟' },
      { title: '材料初审', desc: '工作人员对提交材料进行形式审查', duration: '1-2工作日' },
      { title: '业务审核', desc: '主管部门进行实质性审核，必要时现场核查', duration: '2-5工作日' },
      { title: '结果反馈', desc: '短信通知办理结果，可选择邮寄或自取', duration: '即时' }
    ],
    [
      { title: '实名认证', desc: '完成人脸识别及身份信息核验', duration: '5分钟' },
      { title: '在线填表', desc: '根据引导填写申报信息', duration: '15分钟' },
      { title: '材料上传', desc: '拍照或扫描上传所需材料', duration: '10分钟' },
      { title: '系统审核', desc: '自动比对政务数据共享库信息', duration: '即时' },
      { title: '人工复核', desc: '业务人员复核并出具结果', duration: '1-3工作日' },
      { title: '电子证照签发', desc: '生成电子证照并推送至个人空间', duration: '即时' }
    ]
  ]
  const steps = [...baseSteps[category === '医疗保障' || category === '税务服务' ? 1 : 0]]
  const depts = ['受理窗口', '业务科室', '审核中心', '分管领导']
  return steps.map((s, i) => ({ ...s, department: depts[i] || '综合窗口' }))
}

function genPolicies(category: string): Policy[] {
  const count = 2 + Math.floor(Math.random() * 3)
  const shuffled = [...policyTemplates].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count).map(p => ({
    ...p,
    title: `${category}相关｜${p.title}`,
    date: `202${Math.floor(Math.random() * 3 + 1)}-${String(1 + Math.floor(Math.random() * 12)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')}`
  }))
}

function genFaqs(): FAQ[] {
  return [...faqTemplates].sort(() => Math.random() - 0.5).slice(0, 3 + Math.floor(Math.random() * 3))
}

function generateService(idx: number, tpl: typeof serviceTemplates[0]): ServiceItem {
  const statuses: ServiceStatus[] = ['online', 'online', 'online', 'online', 'online', 'online', 'maintaining', 'offline']
  const forms = ['线上', '线下', '联办']
  const allChannels = ['APP', '小程序', 'PC端', '窗口办理', '自助终端']
  const pickChannels = () => {
    const count = 2 + Math.floor(Math.random() * 4)
    return [...allChannels].sort(() => Math.random() - 0.5).slice(0, count)
  }
  const formsForService = () => {
    const r = Math.random()
    if (r < 0.5) return ['线上', '线下']
    if (r < 0.8) return ['联办']
    return ['线上', '线下', '联办']
  }
  const weekApps = Math.floor(200 + Math.random() * 8000)
  const satisfaction = Math.round((4.2 + Math.random() * 0.7) * 10) / 10

  return {
    id: `srv_${String(idx + 1).padStart(4, '0')}`,
    code: `ZZ${tpl.category === '社会保障' ? 'SB' : tpl.category === '医疗保障' ? 'YB' : tpl.category === '户籍证件' ? 'HJ' : tpl.category === '住房公积金' ? 'GJJ' : tpl.category === '教育服务' ? 'JY' : tpl.category === '不动产登记' ? 'BDC' : tpl.category === '交通出行' ? 'JT' : tpl.category === '税务服务' ? 'SW' : tpl.category === '民生服务' ? 'MS' : 'QY'}${String(idx + 1).padStart(4, '0')}`,
    name: tpl.name,
    icon: iconMap[tpl.icon] || Service,
    iconBg: tpl.iconBg,
    category: tpl.category,
    department: tpl.dept,
    handleForms: formsForService(),
    channels: pickChannels(),
    weekApplications: weekApps,
    totalApplications: weekApps * (50 + Math.floor(Math.random() * 200)),
    avgHandleTime: Math.floor(5 + Math.random() * 55),
    satisfaction,
    rateStar: Math.round(satisfaction / 2),
    status: statuses[idx % statuses.length],
    lastUpdate: `2024-${String(1 + Math.floor(Math.random() * 5)).padStart(2, '0')}-${String(1 + Math.floor(Math.random() * 28)).padStart(2, '0')} ${String(8 + Math.floor(Math.random() * 10)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    materials: genMaterials(),
    processSteps: genProcessSteps(tpl.category),
    policies: genPolicies(tpl.category),
    faqs: genFaqs(),
    activeTab: 'materials'
  }
}

const services = ref<ServiceItem[]>([])

onMounted(() => {
  services.value = serviceTemplates.map((tpl, idx) => generateService(idx, tpl))
})

const filterForm = reactive({
  keyword: '',
  category: '',
  department: '',
  status: '',
  channel: ''
})

const tableSearch = ref('')
const viewMode = ref<'table' | 'card'>('table')
const currentPage = ref(1)
const pageSize = ref(10)
const expandRowKeys = ref<string[]>([])

const summary = reactive({
  todayApplications: 32876,
  avgHandleTime: 18,
  satisfaction: 94.6
})

const onlineCount = computed(() => services.value.filter(s => s.status === 'online').length)
const maintainingCount = computed(() => services.value.filter(s => s.status === 'maintaining').length)
const offlineCount = computed(() => services.value.filter(s => s.status === 'offline').length)

const filteredServices = computed(() => {
  return services.value.filter(s => {
    if (filterForm.keyword) {
      const kw = filterForm.keyword.toLowerCase()
      if (!s.name.toLowerCase().includes(kw) && !s.code.toLowerCase().includes(kw) && !s.department.toLowerCase().includes(kw)) {
        return false
      }
    }
    if (filterForm.category && s.category !== filterForm.category) return false
    if (filterForm.department && s.department !== filterForm.department) return false
    if (filterForm.status && s.status !== filterForm.status) return false
    if (filterForm.channel && !s.channels.includes(filterForm.channel)) return false
    return true
  })
})

const searchedServices = computed(() => {
  if (!tableSearch.value) return filteredServices.value
  const kw = tableSearch.value.toLowerCase()
  return filteredServices.value.filter(s =>
    s.name.toLowerCase().includes(kw) ||
    s.code.toLowerCase().includes(kw) ||
    s.department.toLowerCase().includes(kw)
  )
})

const pagedServices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return searchedServices.value.slice(start, start + pageSize.value)
})

const categoryBarOption = computed(() => {
  const catData = categoryOptions.map(c => {
    const items = services.value.filter(s => s.category === c.value)
    return {
      name: c.label,
      value: items.reduce((sum, s) => sum + s.weekApplications, 0)
    }
  }).filter(c => c.value > 0)

  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}<br/>办件量：{c}' },
    grid: { left: 60, right: 20, top: 30, bottom: 50 },
    xAxis: {
      type: 'category',
      data: catData.map(c => c.name),
      axisLabel: { interval: 0, rotate: 30, fontSize: 11 },
      axisLine: { lineStyle: { color: '#EBEEF5' } }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } }
    },
    series: [{
      type: 'bar',
      data: catData.map(c => c.value),
      barWidth: 36,
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#79BBFF' },
            { offset: 1, color: '#1E4FA5' }
          ]
        }
      },
      label: { show: true, position: 'top', fontSize: 11, color: '#606266' }
    }]
  }
})

const trendLineOption = computed(() => {
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    return `${d.getMonth() + 1}/${d.getDate()}`
  })
  const appsData = labels.map(() => 25000 + Math.floor(Math.random() * 15000))
  const satData = labels.map(() => Math.round((92 + Math.random() * 6) * 10) / 10)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    legend: { data: ['办件量', '满意度'], right: 10 },
    grid: { left: 60, right: 60, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: labels,
      boundaryGap: false,
      axisLine: { lineStyle: { color: '#EBEEF5' } }
    },
    yAxis: [
      {
        type: 'value',
        name: '办件量',
        splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } }
      },
      {
        type: 'value',
        name: '满意度',
        min: 85,
        max: 100,
        splitLine: { show: false },
        axisLabel: { formatter: '{value}分' }
      }
    ],
    series: [
      {
        name: '办件量',
        type: 'bar',
        data: appsData,
        barWidth: 20,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#A7CBF7' },
              { offset: 1, color: '#3B7DD8' }
            ]
          }
        }
      },
      {
        name: '满意度',
        type: 'line',
        yAxisIndex: 1,
        data: satData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 10,
        lineStyle: { color: '#27AE60', width: 3 },
        itemStyle: { color: '#27AE60' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(39,174,96,0.25)' },
              { offset: 1, color: 'rgba(39,174,96,0.02)' }
            ]
          }
        }
      }
    ]
  }
})

function formatNum(n: number, digits = 0) {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN', { maximumFractionDigits: digits })
}

function statusText(s: ServiceStatus) {
  return { online: '已上线', maintaining: '维护中', offline: '已下线' }[s]
}

function statusTagType(s: ServiceStatus) {
  return { online: 'success', maintaining: 'warning', offline: 'info' }[s] as 'success' | 'warning' | 'info'
}

function formTagType(f: string) {
  return { '线上': 'primary', '线下': 'success', '联办': 'warning' }[f] as 'primary' | 'success' | 'warning' || 'info'
}

function categoryColor(cat: string) {
  const map: Record<string, string> = {
    '社会保障': '#E4EEFB', '医疗保障': '#D8F2E4', '户籍证件': '#FBE1E1',
    '住房公积金': '#FEF1D9', '教育服务': '#EEE2F6', '不动产登记': '#DDEBF8',
    '交通出行': '#D4F1EC', '税务服务': '#FBE4D0', '民生服务': '#FBDBE9', '企业服务': '#E1E3E6'
  }
  return map[cat] || '#EBEEF5'
}

function handleExpandChange(row: ServiceItem, expanded: boolean) {
  if (expanded) {
    expandRowKeys.value = [row.id]
  } else {
    expandRowKeys.value = []
  }
}

function toggleServiceStatus(row: ServiceItem) {
  if (row.status === 'online') {
    row.status = 'offline'
  } else {
    row.status = 'online'
  }
}

function applyFilter() {
  currentPage.value = 1
}

function resetFilter() {
  filterForm.keyword = ''
  filterForm.category = ''
  filterForm.department = ''
  filterForm.status = ''
  filterForm.channel = ''
  currentPage.value = 1
}

function refreshData() {
  services.value.forEach(s => {
    s.weekApplications = Math.floor(200 + Math.random() * 8000)
    s.totalApplications += Math.floor(Math.random() * 500)
  })
  summary.todayApplications = 32000 + Math.floor(Math.random() * 2000)
  summary.satisfaction = Math.round((94 + Math.random()) * 10) / 10
}
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.page-header {
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

.card-wrapper {
  background: $bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
  padding: 20px;
  margin-bottom: 20px;
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

.stat-row {
  margin-bottom: 20px;
}

.stat-card {
  background: $bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
  padding: 20px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: $shadow-md;
  }

  &.stat-primary::before { background: $primary-color; }
  &.stat-success::before { background: $success-color; }
  &.stat-warning::before { background: $warning-color; }
  &.stat-info::before { background: $info-color; }
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  margin-bottom: 12px;

  .stat-primary & { background: rgba(30,79,165,0.12); color: $primary-color; }
  .stat-success & { background: rgba(39,174,96,0.12); color: $success-color; }
  .stat-warning & { background: rgba(243,156,18,0.12); color: $warning-color; }
  .stat-info & { background: rgba(41,128,185,0.12); color: $info-color; }
}

.stat-label {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: 6px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: $text-primary;
  line-height: 1.2;
  margin-bottom: 6px;
}

.stat-sub {
  font-size: 12px;
  color: $text-secondary;
  display: flex;
  align-items: center;
  gap: 4px;

  .up { color: $success-color; }
  .down { color: $danger-color; }
}

.chart-row {
  margin-bottom: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  display: flex;
  align-items: center;
  gap: 6px;
}

.table-tools {
  display: flex;
  align-items: center;
}

.service-info-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.service-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.service-text {
  min-width: 0;
  .service-name {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 3px;
  }
  .service-code {
    font-size: 11px;
    color: $text-secondary;
    font-family: 'Consolas', monospace;
  }
}

.applications-cell {
  text-align: center;
  .app-num {
    font-size: 13px;
    color: $text-regular;
    strong {
      color: $primary-color;
      font-size: 14px;
      margin-left: 4px;
    }
  }
  .app-total {
    font-size: 11px;
    color: $text-secondary;
    margin-top: 2px;
  }
}

.rate-text {
  font-size: 12px;
  color: $text-secondary;
  margin-top: 2px;
}

.expand-detail {
  padding: 8px 12px 12px 48px;
}

.detail-section {
  padding: 4px 0;
}

.section-tag {
  display: inline-block;
  padding: 4px 12px;
  background: $primary-color;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  margin-bottom: 16px;
}

.materials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.material-item {
  padding: 14px;
  background: $border-extra-light;
  border-radius: $radius-sm;
  border: 1px solid $border-lighter;

  .material-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
  }

  .material-name {
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;
  }

  .material-meta {
    display: flex;
    gap: 14px;
    font-size: 12px;
    color: $text-secondary;
    margin-bottom: 6px;
  }

  .material-remark {
    font-size: 11px;
    color: $text-secondary;
    line-height: 1.5;
  }
}

.process-detail {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px dashed $border-light;
}

.process-step {
  display: flex;
  gap: 14px;
  padding: 14px 0;
  border-bottom: 1px solid $border-lighter;

  &:last-child { border-bottom: none; }
}

.step-num {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: $primary-color;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}

.step-content {
  flex: 1;
  .step-title {
    font-size: 14px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 4px;
    .step-duration {
      font-weight: 400;
      font-size: 12px;
      color: $primary-color;
      margin-left: 10px;
      background: rgba(30,79,165,0.1);
      padding: 2px 8px;
      border-radius: 10px;
    }
  }
  .step-desc {
    font-size: 12px;
    color: $text-regular;
    margin-bottom: 4px;
    line-height: 1.6;
  }
  .step-dept {
    font-size: 11px;
    color: $text-secondary;
  }
}

.policy-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.policy-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px;
  background: $border-extra-light;
  border-radius: $radius-sm;
  transition: all 0.2s;

  &:hover {
    background: #E4EEFB;
    border-color: $primary-light;
  }
}

.policy-icon {
  font-size: 28px;
  color: $primary-color;
  flex-shrink: 0;
}

.policy-info {
  flex: 1;
  min-width: 0;

  .policy-title {
    font-size: 13px;
    font-weight: 600;
    color: $text-primary;
    margin-bottom: 6px;
  }

  .policy-meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 11px;
    color: $text-secondary;
  }
}

.faq-answer {
  padding: 10px 16px;
  background: $border-extra-light;
  border-radius: $radius-sm;
  line-height: 1.8;
  font-size: 13px;
  color: $text-regular;
}

.card-view-grid {
  margin: 0;
}

.service-card {
  background: $bg-card;
  border-radius: $radius-md;
  box-shadow: $shadow-sm;
  padding: 18px;
  margin-bottom: 16px;
  border: 1px solid transparent;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-3px);
    box-shadow: $shadow-md;
    border-color: $primary-light;
  }
}

.sc-top {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 14px;
  border-bottom: 1px solid $border-lighter;
}

.sc-info {
  flex: 1;
  min-width: 0;
}

.sc-name {
  font-size: 15px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8px;
}

.sc-meta {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.sc-stats {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.sc-stat {
  flex: 1;
  text-align: center;
  padding: 10px 6px;
  background: $border-extra-light;
  border-radius: $radius-sm;
}

.sc-stat-num {
  font-size: 18px;
  font-weight: 700;
  color: $primary-color;
  margin-bottom: 2px;
}

.sc-stat-label {
  font-size: 11px;
  color: $text-secondary;
}

.sc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid $border-lighter;
}

.sc-dept {
  font-size: 12px;
  color: $text-secondary;
}

.sc-actions {
  display: flex;
  gap: 4px;
}

.pagination-wrapper {
  display: flex;
  justify-content: center;
  padding-top: 20px;
}
</style>
