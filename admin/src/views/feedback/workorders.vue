<template>
  <div class="workorders-container">
    <div class="page-header">
      <div>
        <h2>督办工单管理中心</h2>
        <p class="header-sub">
          差评闭环督办 · 工单全流程跟踪 · {{ currentTime }}
          <el-tag type="success" effect="dark" style="margin-left: 12px;" size="small">
            <el-icon><Odometer /></el-icon> 实时监控
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="timeRange" size="default">
          <el-radio-button label="today">今日</el-radio-button>
          <el-radio-button label="7d">近7天</el-radio-button>
          <el-radio-button label="30d">近30天</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Refresh" @click="refreshData">刷新数据</el-button>
        <el-button :icon="Download" @click="handleExport">导出工单</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="3">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><Clock /></div>
          <div class="stat-label">待处理</div>
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-sub"><el-icon class="up"><TrendCharts /></el-icon> 较昨日 +12%</div>
        </div>
      </el-col>
      <el-col :span="3">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><Setting /></div>
          <div class="stat-label">处理中</div>
          <div class="stat-value">{{ stats.inProgress }}</div>
          <div class="stat-sub"><el-icon class="up"><TrendCharts /></el-icon> 较昨日 +5%</div>
        </div>
      </el-col>
      <el-col :span="3">
        <div class="stat-card stat-success">
          <div class="stat-icon"><CircleCheck /></div>
          <div class="stat-label">已解决</div>
          <div class="stat-value">{{ stats.resolved }}</div>
          <div class="stat-sub"><el-icon class="up"><TrendCharts /></el-icon> 解决率 87.3%</div>
        </div>
      </el-col>
      <el-col :span="3">
        <div class="stat-card stat-danger">
          <div class="stat-icon"><Promotion /></div>
          <div class="stat-label">已升级</div>
          <div class="stat-value">{{ stats.escalated }}</div>
          <div class="stat-sub"><el-icon><TrendCharts /></el-icon> 升级率 8.2%</div>
        </div>
      </el-col>
      <el-col :span="3">
        <div class="stat-card stat-metric">
          <div class="metric-top">
            <el-icon color="#1E4FA5"><Timer /></el-icon>
            <span class="metric-label">平均响应时长</span>
          </div>
          <div class="metric-value"><span class="num">{{ metrics.avgResponse }}</span><span class="unit">分钟</span></div>
          <div class="metric-bar"><div class="bar-fill bar-blue" :style="{ width: '65%' }"></div></div>
          <div class="metric-trend good">同比 ↓ 12%</div>
        </div>
      </el-col>
      <el-col :span="3">
        <div class="stat-card stat-metric">
          <div class="metric-top">
            <el-icon color="#27AE60"><CircleCheckFilled /></el-icon>
            <span class="metric-label">平均解决时长</span>
          </div>
          <div class="metric-value"><span class="num">{{ metrics.avgResolve }}</span><span class="unit">小时</span></div>
          <div class="metric-bar"><div class="bar-fill bar-green" :style="{ width: '52%' }"></div></div>
          <div class="metric-trend good">同比 ↓ 8%</div>
        </div>
      </el-col>
      <el-col :span="3">
        <div class="stat-card stat-metric">
          <div class="metric-top">
            <el-icon color="#F39C12"><DataLine /></el-icon>
            <span class="metric-label">按时办结率</span>
          </div>
          <div class="metric-value"><span class="num">{{ metrics.onTimeRate }}</span><span class="unit">%</span></div>
          <div class="metric-bar"><div class="bar-fill bar-orange" :style="{ width: metrics.onTimeRate + '%' }"></div></div>
          <div class="metric-trend good">环比 ↑ 3.2%</div>
        </div>
      </el-col>
      <el-col :span="3">
        <div class="stat-card stat-metric">
          <div class="metric-top">
            <el-icon color="#E74C3C"><WarningFilled /></el-icon>
            <span class="metric-label">工单升级率</span>
          </div>
          <div class="metric-value"><span class="num">{{ metrics.escalateRate }}</span><span class="unit">%</span></div>
          <div class="metric-bar"><div class="bar-fill bar-red" :style="{ width: metrics.escalateRate * 5 + '%' }"></div></div>
          <div class="metric-trend bad">环比 ↑ 1.1%</div>
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper filter-card">
      <div class="filter-row">
        <div class="filter-item">
          <el-input
            v-model="filters.keyword"
            placeholder="搜索工单编号/标题/内容"
            :prefix-icon="Search"
            clearable
            style="width: 260px;"
            size="default"
          />
        </div>
        <div class="filter-item">
          <el-select v-model="filters.priority" placeholder="优先级" clearable size="default" style="width: 130px;">
            <el-option label="紧急" value="urgent" />
            <el-option label="高" value="high" />
            <el-option label="中" value="medium" />
            <el-option label="低" value="low" />
          </el-select>
        </div>
        <div class="filter-item">
          <el-select v-model="filters.status" placeholder="状态" clearable size="default" style="width: 130px;">
            <el-option label="待处理" value="pending" />
            <el-option label="处理中" value="in_progress" />
            <el-option label="已解决" value="resolved" />
            <el-option label="已升级" value="escalated" />
          </el-select>
        </div>
        <div class="filter-item">
          <el-select v-model="filters.department" placeholder="责任部门" clearable size="default" style="width: 180px;">
            <el-option v-for="d in departments" :key="d" :label="d" :value="d" />
          </el-select>
        </div>
        <div class="filter-item">
          <el-date-picker
            v-model="filters.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            size="default"
            style="width: 260px;"
          />
        </div>
        <div class="filter-item">
          <el-select v-model="filters.badCategory" placeholder="差评分类" clearable size="default" style="width: 160px;">
            <el-option v-for="c in badCategories" :key="c" :label="c" :value="c" />
          </el-select>
        </div>
        <div class="filter-item filter-actions">
          <el-button type="primary" :icon="Search" @click="applyFilter">查询</el-button>
          <el-button :icon="RefreshLeft" @click="resetFilter">重置</el-button>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="14">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">近7天工单数量趋势</div>
            <el-tag type="info" round size="small">按状态堆叠</el-tag>
          </div>
          <v-chart :option="trendChartOption" style="height: 340px;" autoresize />
        </div>
      </el-col>
      <el-col :span="10">
        <div class="card-wrapper">
          <div class="card-header">
            <div class="card-title">各部门工单对比</div>
            <el-tag type="primary" round size="small">工单量 + 解决时长</el-tag>
          </div>
          <v-chart :option="deptChartOption" style="height: 340px;" autoresize />
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">工单列表</div>
        <div>
          <el-tag type="danger" effect="plain" round style="margin-right: 8px;" size="small">
            超期工单 {{ overDueCount }} 件
          </el-tag>
          <el-tag type="warning" effect="plain" round size="small">
            共 {{ filteredWorkorders.length }} 条记录
          </el-tag>
        </div>
      </div>
      <el-table :data="pagedWorkorders" size="default" class="workorder-table" stripe>
        <el-table-column prop="id" label="工单编号" width="130" fixed="left">
          <template #default="{ row }">
            <span class="wo-id">{{ row.id }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="72" align="center">
          <template #default="{ row }">
            <el-tag :type="priorityTagType(row.priority)" effect="dark" round size="small" style="width: 44px;">
              {{ priorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="工单标题" min-width="220">
          <template #default="{ row }">
            <div class="wo-title" @click="openDetail(row)">{{ row.title }}</div>
            <div class="wo-summary">{{ row.summary }}</div>
          </template>
        </el-table-column>
        <el-table-column label="关联差评" width="160">
          <template #default="{ row }">
            <div class="review-info">
              <div class="review-stars">
                <el-icon v-for="i in 5" :key="i" :color="i <= row.reviewStars ? '#F39C12' : '#DCDFE6'">
                  <Star />
                </el-icon>
              </div>
              <div class="review-service">{{ row.serviceName }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="department" label="责任部门" width="110">
          <template #default="{ row }">
            <span class="dept-tag">{{ row.department }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="处理人" width="80" align="center" />
        <el-table-column prop="status" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" effect="plain" round size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="SLA进度" width="130">
          <template #default="{ row }">
            <el-progress
              :percentage="row.slaProgress"
              :stroke-width="8"
              :color="slaColor(row.slaProgress, row.isOverdue)"
              :text-inside="true"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="150" />
        <el-table-column label="剩余时长" width="100" align="center">
          <template #default="{ row }">
            <span :class="{ 'overdue': row.isOverdue, 'warning': !row.isOverdue && row.remainHours < 4 }">
              {{ row.isOverdue ? '超期' + row.overdueHours + 'h' : row.remainHours + 'h' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openDetail(row)">查看</el-button>
            <el-button type="warning" link size="small" @click="handleAction('assign', row)">派单</el-button>
            <el-button type="info" link size="small" @click="handleAction('transfer', row)">转办</el-button>
            <el-button type="danger" link size="small" @click="handleAction('supervise', row)">督办</el-button>
            <el-button type="success" link size="small" @click="handleAction('resolve', row)" :disabled="row.status === 'resolved'">
              标记解决
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="filteredWorkorders.length"
          layout="total, sizes, prev, pager, next, jumper"
          background
        />
      </div>
    </div>

    <el-drawer
      v-model="detailVisible"
      title="工单详情"
      direction="rtl"
      size="640px"
      :destroy-on-close="true"
    >
      <template v-if="currentWorkorder">
        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#1E4FA5"><Document /></el-icon> 基本信息
          </div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="工单编号">{{ currentWorkorder.id }}</el-descriptions-item>
            <el-descriptions-item label="优先级">
              <el-tag :type="priorityTagType(currentWorkorder.priority)" effect="dark" round size="small">
                {{ priorityText(currentWorkorder.priority) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="statusTagType(currentWorkorder.status)" effect="plain" round size="small">
                {{ statusText(currentWorkorder.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="责任部门">{{ currentWorkorder.department }}</el-descriptions-item>
            <el-descriptions-item label="处理人">{{ currentWorkorder.assignee }}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{ currentWorkorder.createdAt }}</el-descriptions-item>
            <el-descriptions-item label="关联服务" :span="2">
              <span class="dept-tag">{{ currentWorkorder.serviceName }}</span>
              <span style="margin-left: 12px;">
                <el-icon v-for="i in 5" :key="i" :color="i <= currentWorkorder.reviewStars ? '#F39C12' : '#DCDFE6'" size="14">
                  <Star />
                </el-icon>
                <span style="margin-left: 4px; color: #909399;">{{ currentWorkorder.reviewStars }}星差评</span>
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="差评分类" :span="2">
              <el-tag type="danger" effect="plain" round size="small">{{ currentWorkorder.badCategory }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#E74C3C"><ChatDotRound /></el-icon> 差评原文
          </div>
          <div class="review-content">
            {{ currentWorkorder.reviewContent }}
          </div>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#F39C12"><User /></el-icon> 用户信息（脱敏）
          </div>
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="用户昵称">{{ currentWorkorder.userMasked.name }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ currentWorkorder.userMasked.phone }}</el-descriptions-item>
            <el-descriptions-item label="身份证号" :span="2">{{ currentWorkorder.userMasked.idcard }}</el-descriptions-item>
            <el-descriptions-item label="所属区县">{{ currentWorkorder.userMasked.district }}</el-descriptions-item>
            <el-descriptions-item label="用户ID">{{ currentWorkorder.userMasked.uid }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#27AE60"><TimeLine /></el-icon> 处理流水
          </div>
          <el-timeline>
            <el-timeline-item
              v-for="(item, idx) in currentWorkorder.timeline"
              :key="idx"
              :timestamp="item.time"
              :type="item.type"
              :icon="timelineIcon(item.type)"
              size="large"
            >
              <div class="timeline-title">{{ item.title }}</div>
              <div class="timeline-desc">{{ item.desc }}</div>
              <div class="timeline-operator">操作人：{{ item.operator }}</div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div class="detail-section">
          <div class="section-title">
            <el-icon color="#8E44AD"><Histogram /></el-icon> 同类型问题聚类
            <el-tag type="info" round size="small" style="margin-left: 8px;">
              共 {{ currentWorkorder.sameTypeCount }} 件同类问题
            </el-tag>
          </div>
          <div class="cluster-info">
            <div class="cluster-tag-row">
              <span class="cluster-label">高频关键词：</span>
              <el-tag
                v-for="(kw, idx) in currentWorkorder.keywords"
                :key="idx"
                size="small"
                effect="plain"
                style="margin-right: 6px; margin-bottom: 4px;"
              >
                {{ kw }}
              </el-tag>
            </div>
            <div class="cluster-list">
              <div
                v-for="(w, idx) in currentWorkorder.similarWorkorders"
                :key="idx"
                class="cluster-item"
                @click="switchWorkorder(w)"
              >
                <div class="cluster-id">{{ w.id }}</div>
                <div class="cluster-title">{{ w.title }}</div>
                <el-tag :type="statusTagType(w.status)" size="small" effect="plain" round>
                  {{ statusText(w.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>

        <template #footer>
          <div style="display: flex; gap: 12px; justify-content: flex-end;">
            <el-button @click="detailVisible = false">关闭</el-button>
            <el-button type="warning" @click="handleAction('assign', currentWorkorder)">派单</el-button>
            <el-button type="danger" @click="handleAction('supervise', currentWorkorder)">发起督办</el-button>
            <el-button type="primary" @click="handleAction('resolve', currentWorkorder)">标记已解决</el-button>
          </div>
        </template>
      </template>
    </el-drawer>

    <el-dialog v-model="actionVisible" :title="actionDialogTitle" width="480px" destroy-on-close>
      <el-form :model="actionForm" label-width="90px" size="default">
        <el-form-item v-if="actionType === 'assign' || actionType === 'transfer'" label="分配给">
          <el-select v-model="actionForm.assignee" placeholder="选择处理人" style="width: 100%;">
            <el-option v-for="p in assigneeList" :key="p" :label="p" :value="p" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="actionType === 'supervise'" label="督办级别">
          <el-radio-group v-model="actionForm.level">
            <el-radio label="normal">普通督办</el-radio>
            <el-radio label="urgent">紧急督办</el-radio>
            <el-radio label="special">专项督办</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="actionType === 'resolve'" label="解决方式">
          <el-select v-model="actionForm.resolveType" placeholder="选择解决方式" style="width: 100%;">
            <el-option label="电话回呼道歉" value="phone" />
            <el-option label="重新办理业务" value="retry" />
            <el-option label="补偿服务" value="compensate" />
            <el-option label="系统优化修复" value="fix" />
            <el-option label="人员培训整改" value="train" />
          </el-select>
        </el-form-item>
        <el-form-item label="处理说明">
          <el-input
            v-model="actionForm.remark"
            type="textarea"
            :rows="4"
            placeholder="请填写处理说明，便于后续审计追溯"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="actionVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAction">确认提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, reactive } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage, ElNotification, type TagType } from 'element-plus'
import {
  Refresh, Download, Odometer, Clock, Setting, CircleCheck, Promotion,
  Timer, CircleCheckFilled, DataLine, WarningFilled, Search, RefreshLeft,
  Star, Document, User, ChatDotRound, TimeLine, Histogram, TrendCharts
} from '@element-plus/icons-vue'
import type { Component } from 'vue'

use([CanvasRenderer, LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent])

const currentTime = ref('')
const timeRange = ref('7d')

const departments = [
  '人社局', '医保局', '公安局', '教育局', '住建局', '自然资源局',
  '公积金中心', '税务局', '交警支队', '民政局', '卫健委', '市场监管局'
]

const badCategories = [
  '系统响应慢', '材料清单不清晰', '流程复杂', '窗口态度差',
  '功能故障', '数据不同步', '验证码问题', '支付失败',
  '预约无效', '信息不准确', '重复提交', '审核超时'
]

const assigneeList = [
  '张伟', '王芳', '李娜', '刘洋', '陈静', '杨帆',
  '赵磊', '孙丽', '周杰', '吴敏', '郑涛', '冯雪'
]

const services = [
  { name: '社保参保证明打印', dept: '人社局' },
  { name: '医保电子凭证激活', dept: '医保局' },
  { name: '户籍迁移办理', dept: '公安局' },
  { name: '义务教育入学报名', dept: '教育局' },
  { name: '不动产登记查询', dept: '自然资源局' },
  { name: '公积金提取申请', dept: '公积金中心' },
  { name: '个税纳税记录开具', dept: '税务局' },
  { name: '交通违法处理', dept: '交警支队' },
  { name: '结婚登记预约', dept: '民政局' },
  { name: '医疗机构执业许可', dept: '卫健委' },
  { name: '营业执照变更', dept: '市场监管局' },
  { name: '建设工程规划许可', dept: '住建局' }
]

const reviewTemplates = [
  { cat: '系统响应慢', contents: [
    '点了半天没反应，页面加载了好几分钟都出不来，急死人了！',
    '提交的时候一直转圈，等了十分钟还显示处理中，太耽误事了。',
    '高峰期根本用不了，服务器太慢，响应超时好几次。',
    '查个社保记录等了5分钟，比窗口排队还慢，无语。'
  ]},
  { cat: '材料清单不清晰', contents: [
    '材料清单写得太含糊了，去了窗口才知道少这少那，白跑两趟。',
    '网上写的要3份材料，实际要5份，来回折腾好几回。',
    '材料要求前后不一致，一会要原件一会要复印件，搞不懂。',
    '根本没说要盖章，跑过去又被打回来，办事效率太低。'
  ]},
  { cat: '流程复杂', contents: [
    '流程太繁琐了，填了十几个表，签了好几个字，太折腾。',
    '要跑好几个部门，每个部门都要重新排队，能不能简化一下？',
    '同样的信息重复填了三四遍，系统之间数据不通吗？',
    '环节太多了，光审核就有五六道，办一件事要一个星期。'
  ]},
  { cat: '窗口态度差', contents: [
    '窗口人员态度太差，问个问题爱理不理的，什么服务态度！',
    '工作人员语气很不耐烦，好像欠他钱似的，体验极差。',
    '多问两句就不耐烦了，说话冲得很，我们是来办事的不是来受气的。',
    '对老年人特别不耐心，说话快还不解释，差评！'
  ]},
  { cat: '功能故障', contents: [
    '提交按钮点了没反应，换了三个浏览器都不行，功能有bug吧？',
    '上传图片一直失败，明明是JPG格式却说格式不对。',
    '表单验证逻辑有问题，明明填对了还提示错误。',
    '保存草稿功能不能用，重新填了三遍，崩溃。'
  ]},
  { cat: '数据不同步', contents: [
    '明明已经在窗口办好了，网上状态还显示办理中，数据更新太慢。',
    '缴费成功了但是记录里查不到，跑了两趟才确认。',
    '两个系统数据对不上，一个显示已完成一个显示待审核。',
    '提交的信息后台没收到，说我没提交过，可是钱都扣了。'
  ]},
  { cat: '验证码问题', contents: [
    '验证码永远看不清，换了十几个还是认不出来，烦躁。',
    '短信验证码等了十分钟都没收到，试了N次。',
    '图形验证码太复杂了，眼睛都看花了还是输不对。',
    '滑块验证码滑了十几次都不通过，这是反人类设计吧？'
  ]},
  { cat: '支付失败', contents: [
    '支付了两次才成功，第一次钱扣了订单却显示未支付。',
    '支付宝微信都不能用，只支持银行卡，太不方便了。',
    '支付金额显示错误，本来是50元显示500元，吓死人。',
    '支付跳转失败，返回后订单就没了，还要重新填。'
  ]},
  { cat: '预约无效', contents: [
    '预约了今天上午十点，到了窗口说没我的预约记录。',
    '预约成功的短信收到了，系统里却说预约已取消。',
    '想取消预约找不到入口，白白浪费了一个号。',
    '预约号源秒没，放号时间也不透明，根本抢不到。'
  ]},
  { cat: '信息不准确', contents: [
    '办事指南写的地址早就搬家了，白跑了二十公里。',
    '联系电话是空号，打了好几次都打不通。',
    '网上写的工作时间是9点，实际8点半就下班了。',
    '收费标准和实际不符，多收了我两百块钱。'
  ]},
  { cat: '重复提交', contents: [
    '点了一次提交却生成了两个订单，还扣了两次费。',
    '表单重复验证，每次刷新都要重新提交一次。',
    '系统提示失败其实成功了，我又提交了一遍。',
    '重复收到审核通过短信，到底哪个是真的？'
  ]},
  { cat: '审核超时', contents: [
    '承诺3个工作日审核完，这都一周了还没动静。',
    '审核速度太慢了，别人的都过了我的还在等。',
    '催了好几次都说在处理，效率太低了吧。',
    '超过承诺时限也没个通知，就让人干等着。'
  ]}
]

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }
function pad(n: number): string { return String(n).padStart(2, '0') }

function generateId(i: number): string {
  return `WO-${24060}${pad(randInt(1, 28))}${pad(randInt(100, 999))}${pad(i)}`.slice(0, 14)
}

function generateDate(offsetHours: number): string {
  const d = new Date(Date.now() - offsetHours * 3600 * 1000)
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface Workorder {
  id: string
  title: string
  summary: string
  priority: 'urgent' | 'high' | 'medium' | 'low'
  status: 'pending' | 'in_progress' | 'resolved' | 'escalated'
  department: string
  assignee: string
  serviceName: string
  reviewStars: number
  reviewContent: string
  badCategory: string
  createdAt: string
  createdHoursAgo: number
  slaDeadline: number
  slaProgress: number
  remainHours: number
  isOverdue: boolean
  overdueHours: number
  userMasked: { name: string; phone: string; idcard: string; district: string; uid: string }
  timeline: Array<{ title: string; desc: string; time: string; operator: string; type: 'primary' | 'success' | 'warning' | 'danger' | 'info' }>
  keywords: string[]
  sameTypeCount: number
  similarWorkorders: Array<{ id: string; title: string; status: string }>
}

function generateOne(i: number): Workorder {
  const svc = rand(services)
  const tmpl = rand(reviewTemplates)
  const cat = tmpl.cat
  const content = rand(tmpl.contents)
  const priority: Workorder['priority'] = (['urgent', 'high', 'high', 'medium', 'medium', 'medium', 'low'] as const)[randInt(0, 6)]
  const statuses: Workorder['status'][] = ['pending', 'in_progress', 'in_progress', 'resolved', 'resolved', 'escalated']
  const status: Workorder['status'] = statuses[randInt(0, statuses.length - 1)]
  const createdHoursAgo = randInt(1, 240)
  const slaDeadline = priority === 'urgent' ? 4 : priority === 'high' ? 12 : priority === 'medium' ? 24 : 72
  const elapsed = createdHoursAgo
  const slaProgress = Math.min(100, Math.round(elapsed / slaDeadline * 100))
  const remainHours = Math.max(0, slaDeadline - elapsed)
  const isOverdue = elapsed > slaDeadline && status !== 'resolved'
  const overdueHours = isOverdue ? elapsed - slaDeadline : 0

  const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡']
  const givens = ['*', '**', '某', '*华', '*明', '*芳', '*伟', '*静']
  const districts = ['金水区', '二七区', '中原区', '管城回族区', '惠济区', '郑东新区', '上街区', '航空港区']

  const timelines: Workorder['timeline'] = []
  timelines.push({
    title: '差评工单自动生成',
    desc: `系统检测到${cat}类差评，自动创建督办工单`,
    time: generateDate(createdHoursAgo),
    operator: '系统自动',
    type: 'primary'
  })
  if (status !== 'pending' || randInt(0, 3) > 0) {
    timelines.push({
      title: '工单派发',
      desc: `已派单至${svc.dept}，责任人：${rand(assigneeList)}`,
      time: generateDate(Math.max(1, createdHoursAgo - randInt(1, 20))),
      operator: rand(assigneeList),
      type: 'info'
    })
  }
  if (status === 'in_progress' || status === 'resolved' || status === 'escalated') {
    timelines.push({
      title: '开始处理',
      desc: '已联系用户了解情况，正在核实差评原因并制定整改方案',
      time: generateDate(Math.max(1, createdHoursAgo - randInt(1, 10))),
      operator: rand(assigneeList),
      type: 'warning'
    })
  }
  if (status === 'escalated') {
    timelines.push({
      title: '工单升级',
      desc: '因涉及跨部门协调 / 技术复杂度高，升级至主管领导督办',
      time: generateDate(Math.max(1, createdHoursAgo - randInt(1, 5))),
      operator: '督办中心',
      type: 'danger'
    })
  }
  if (status === 'resolved') {
    timelines.push({
      title: '工单办结',
      desc: '已与用户沟通达成谅解，业务已重新办理/完成整改，用户确认满意',
      time: generateDate(Math.max(0, createdHoursAgo - randInt(0, 3))),
      operator: rand(assigneeList),
      type: 'success'
    })
  }

  const keywords = [cat, svc.dept].concat(cat.slice(0, 2)).filter((v, i, a) => a.indexOf(v) === i).slice(0, 4)

  return {
    id: generateId(i),
    title: `${svc.dept}：${cat}问题督办`,
    summary: `「${svc.name}」${content.slice(0, 28)}${content.length > 28 ? '...' : ''}`,
    priority,
    status,
    department: svc.dept,
    assignee: rand(assigneeList),
    serviceName: svc.name,
    reviewStars: randInt(1, 2),
    reviewContent: content,
    badCategory: cat,
    createdAt: generateDate(createdHoursAgo),
    createdHoursAgo,
    slaDeadline,
    slaProgress,
    remainHours,
    isOverdue,
    overdueHours,
    userMasked: {
      name: rand(surnames) + rand(givens),
      phone: `138****${pad(randInt(1000, 9999))}`,
      idcard: `41010${randInt(0, 9)}${randInt(1985, 2005)}${pad(randInt(1, 12))}${pad(randInt(1, 28))}****`,
      district: rand(districts),
      uid: `U${randInt(100000, 999999)}`
    },
    timeline: timelines,
    keywords,
    sameTypeCount: randInt(3, 35),
    similarWorkorders: Array.from({ length: randInt(2, 4) }, (_, j) => ({
      id: generateId(i * 100 + j),
      title: `${rand(services).dept}：${rand(badCategories)}问题`,
      status: rand(statuses as unknown as string[])
    }))
  }
}

const workorders = ref<Workorder[]>([])
for (let i = 0; i < 68; i++) workorders.value.push(generateOne(i))

const stats = computed(() => ({
  pending: workorders.value.filter(w => w.status === 'pending').length,
  inProgress: workorders.value.filter(w => w.status === 'in_progress').length,
  resolved: workorders.value.filter(w => w.status === 'resolved').length,
  escalated: workorders.value.filter(w => w.status === 'escalated').length
}))

const metrics = computed(() => {
  const resolved = workorders.value.filter(w => w.status === 'resolved')
  const total = workorders.value.length
  const avgRsp = (workorders.value.reduce((s, w) => s + (w.createdHoursAgo > 0.5 ? randInt(8, 45) : randInt(5, 15)), 0) / total).toFixed(1)
  const avgRsl = resolved.length > 0
    ? (resolved.reduce((s) => s + randInt(2, 48), 0) / resolved.length).toFixed(1)
    : '18.5'
  const onTime = (workorders.value.filter(w => !w.isOverdue || w.status === 'resolved').length / total * 100).toFixed(1)
  const esc = (stats.value.escalated / total * 100).toFixed(1)
  return { avgResponse: avgRsp, avgResolve: avgRsl, onTimeRate: onTime, escalateRate: esc }
})

const overDueCount = computed(() => workorders.value.filter(w => w.isOverdue).length)

const filters = reactive({
  keyword: '',
  priority: '',
  status: '',
  department: '',
  dateRange: null as Date[] | null,
  badCategory: ''
})

const filteredWorkorders = computed(() => {
  let list = [...workorders.value]
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase()
    list = list.filter(w =>
      w.id.toLowerCase().includes(kw) ||
      w.title.toLowerCase().includes(kw) ||
      w.summary.toLowerCase().includes(kw) ||
      w.reviewContent.toLowerCase().includes(kw)
    )
  }
  if (filters.priority) list = list.filter(w => w.priority === filters.priority)
  if (filters.status) list = list.filter(w => w.status === filters.status)
  if (filters.department) list = list.filter(w => w.department === filters.department)
  if (filters.badCategory) list = list.filter(w => w.badCategory === filters.badCategory)
  if (filters.dateRange && filters.dateRange.length === 2) {
    const start = filters.dateRange[0].getTime()
    const end = filters.dateRange[1].getTime() + 86400000
    list = list.filter(w => {
      const t = new Date(w.createdAt.replace(' ', 'T')).getTime()
      return t >= start && t <= end
    })
  }
  return list.sort((a, b) => {
    const pr = { urgent: 0, high: 1, medium: 2, low: 3 }
    if (pr[a.priority] !== pr[b.priority]) return pr[a.priority] - pr[b.priority]
    return b.createdHoursAgo - a.createdHoursAgo
  })
})

const currentPage = ref(1)
const pageSize = ref(10)
const pagedWorkorders = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredWorkorders.value.slice(start, start + pageSize.value)
})

const statusText = (s: string) => ({ pending: '待处理', in_progress: '处理中', resolved: '已解决', escalated: '已升级' }[s] || s)
const priorityText = (p: string) => ({ urgent: '紧急', high: '高', medium: '中', low: '低' }[p] || p)
const statusTagType = (s: string): TagType => ({ pending: 'warning', in_progress: 'primary', resolved: 'success', escalated: 'danger' }[s] as TagType || 'info')
const priorityTagType = (p: string): TagType => ({ urgent: 'danger', high: 'warning', medium: 'primary', low: 'info' }[p] as TagType || 'info')

const slaColor = (p: number, overdue: boolean) => {
  if (overdue) return '#E74C3C'
  if (p >= 85) return '#F39C12'
  if (p >= 60) return '#2980B9'
  return '#27AE60'
}

const timelineIcon = (t: string): Component => {
  const map: Record<string, Component> = {
    primary: Document, success: CircleCheck, warning: Setting, danger: WarningFilled, info: User
  }
  return map[t] || Document
}

const trendDates = computed(() => Array.from({ length: 7 }, (_, i) => {
  const d = new Date(); d.setDate(d.getDate() - (6 - i))
  return `${d.getMonth() + 1}/${d.getDate()}`
}))

const trendChartOption = computed(() => {
  const base = trendDates.value.map(() => 0)
  const pending = base.map(() => randInt(3, 12))
  const inProg = base.map(() => randInt(5, 18))
  const resolved = base.map((_, i) => randInt(8, 25) + i * 2)
  const escalated = base.map(() => randInt(0, 4))
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
    legend: { data: ['待处理', '处理中', '已解决', '已升级'], right: 10, top: 0 },
    grid: { left: 50, right: 20, top: 35, bottom: 30 },
    xAxis: { type: 'category', boundaryGap: false, data: trendDates.value, axisLine: { lineStyle: { color: '#E4E7ED' } } },
    yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed', opacity: 0.6 } } },
    series: [
      {
        name: '待处理', type: 'line', stack: 'total', smooth: true, data: pending,
        lineStyle: { color: '#F39C12', width: 2 }, itemStyle: { color: '#F39C12' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(243,156,18,0.5)' }, { offset: 1, color: 'rgba(243,156,18,0.05)' }] }
        }
      },
      {
        name: '处理中', type: 'line', stack: 'total', smooth: true, data: inProg,
        lineStyle: { color: '#1E4FA5', width: 2 }, itemStyle: { color: '#1E4FA5' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(30,79,165,0.5)' }, { offset: 1, color: 'rgba(30,79,165,0.05)' }] }
        }
      },
      {
        name: '已解决', type: 'line', stack: 'total', smooth: true, data: resolved,
        lineStyle: { color: '#27AE60', width: 2 }, itemStyle: { color: '#27AE60' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(39,174,96,0.5)' }, { offset: 1, color: 'rgba(39,174,96,0.05)' }] }
        }
      },
      {
        name: '已升级', type: 'line', stack: 'total', smooth: true, data: escalated,
        lineStyle: { color: '#E74C3C', width: 2 }, itemStyle: { color: '#E74C3C' },
        areaStyle: {
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: 'rgba(231,76,60,0.5)' }, { offset: 1, color: 'rgba(231,76,60,0.05)' }] }
        }
      }
    ]
  }
})

const deptChartOption = computed(() => {
  const deptShort = ['人社局', '医保局', '公安局', '教育局', '住建局', '自然资源局', '公积金', '税务局', '交警', '民政局']
  const counts = deptShort.map(() => randInt(15, 72))
  const resolveHours = deptShort.map(() => (randInt(5, 50) + Math.random()).toFixed(1))
  return {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['工单数量', '平均解决时长(h)'], right: 10, top: 0 },
    grid: { left: 70, right: 50, top: 35, bottom: 30 },
    xAxis: { type: 'category', data: deptShort, axisLine: { lineStyle: { color: '#E4E7ED' } } },
    yAxis: [
      { type: 'value', name: '工单量', splitLine: { lineStyle: { type: 'dashed', opacity: 0.6 } } },
      { type: 'value', name: '时长(h)', splitLine: { show: false } }
    ],
    series: [
      {
        name: '工单数量', type: 'bar', barWidth: 22, data: counts,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#3B7DD8' }, { offset: 1, color: '#1E4FA5' }] }
        }
      },
      {
        name: '平均解决时长(h)', type: 'line', yAxisIndex: 1, smooth: true,
        data: resolveHours,
        lineStyle: { color: '#E67E22', width: 3 },
        itemStyle: { color: '#E67E22' },
        symbol: 'circle', symbolSize: 8
      }
    ]
  }
})

const detailVisible = ref(false)
const currentWorkorder = ref<Workorder | null>(null)

function openDetail(row: Workorder) {
  currentWorkorder.value = row
  detailVisible.value = true
}

function switchWorkorder(w: { id: string; title: string; status: string }) {
  const found = workorders.value.find(x => x.id === w.id)
  if (found) {
    currentWorkorder.value = found
  } else {
    ElMessage.info('该同类工单仅为聚类演示数据，点击已生成的工单可查看详情')
  }
}

const actionVisible = ref(false)
const actionType = ref('')
const actionTarget = ref<Workorder | null>(null)
const actionForm = reactive({ assignee: '', level: 'normal', resolveType: '', remark: '' })

const actionDialogTitle = computed(() => ({
  assign: '工单派单',
  transfer: '工单转办',
  supervise: '发起督办',
  resolve: '标记工单已解决'
}[actionType.value] || '操作'))

function handleAction(type: string, row: Workorder) {
  actionType.value = type
  actionTarget.value = row
  actionForm.assignee = row.assignee
  actionForm.level = 'normal'
  actionForm.resolveType = ''
  actionForm.remark = ''
  actionVisible.value = true
}

function confirmAction() {
  if (!actionTarget.value) return
  const wo = actionTarget.value
  if ((actionType.value === 'assign' || actionType.value === 'transfer') && !actionForm.assignee) {
    ElMessage.warning('请选择处理人')
    return
  }
  if (actionType.value === 'resolve' && !actionForm.resolveType) {
    ElMessage.warning('请选择解决方式')
    return
  }
  if (!actionForm.remark.trim()) {
    ElMessage.warning('请填写处理说明')
    return
  }

  const map: Record<string, { type: any; title: string; msg: string }> = {
    assign: { type: 'info', title: '派单成功', msg: `工单 ${wo.id} 已派发给 ${actionForm.assignee}` },
    transfer: { type: 'info', title: '转办成功', msg: `工单 ${wo.id} 已转办至 ${actionForm.assignee}` },
    supervise: { type: 'warning', title: '督办已发起', msg: `工单 ${wo.id} 已按${{normal:'普通',urgent:'紧急',special:'专项'}[actionForm.level]}级别督办` },
    resolve: { type: 'success', title: '工单办结', msg: `工单 ${wo.id} 已标记为已解决` }
  }
  const cfg = map[actionType.value]
  if (actionType.value === 'assign' || actionType.value === 'transfer') wo.assignee = actionForm.assignee
  if (actionType.value === 'resolve') {
    wo.status = 'resolved'
    wo.isOverdue = false
    wo.slaProgress = 100
  }
  if (actionType.value === 'supervise') wo.status = 'escalated'

  ElNotification({ title: cfg.title, message: cfg.msg, type: cfg.type, duration: 3000 })
  actionVisible.value = false
}

function applyFilter() {
  currentPage.value = 1
  ElMessage.success(`查询完成，共 ${filteredWorkorders.value.length} 条记录`)
}

function resetFilter() {
  filters.keyword = ''
  filters.priority = ''
  filters.status = ''
  filters.department = ''
  filters.dateRange = null
  filters.badCategory = ''
  currentPage.value = 1
}

function refreshData() {
  workorders.value.forEach(w => {
    w.createdHoursAgo += randInt(0, 1)
    w.remainHours = Math.max(0, w.slaDeadline - w.createdHoursAgo)
    w.isOverdue = w.createdHoursAgo > w.slaDeadline && w.status !== 'resolved'
    w.overdueHours = w.isOverdue ? w.createdHoursAgo - w.slaDeadline : 0
    w.slaProgress = Math.min(100, Math.round(w.createdHoursAgo / w.slaDeadline * 100))
  })
  ElMessage.success('数据已刷新')
}

function handleExport() {
  ElMessage.info(`正在导出 ${filteredWorkorders.value.length} 条工单数据...`)
}

let timer: any
onMounted(() => {
  timer = setInterval(() => {
    const d = new Date()
    currentTime.value = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.workorders-container { padding: 0; }

.page-header {
  display: flex; justify-content: space-between; align-items: flex-end;
  padding: 8px 0 20px;
  h2 { margin: 0 0 8px; font-size: 22px; color: $text-primary; font-weight: 700; }
  .header-sub { margin: 0; color: $text-secondary; font-size: 13px; display: flex; align-items: center; }
  .header-actions { display: flex; gap: 12px; align-items: center; }
}

.stat-row { margin-bottom: 20px; }

.stat-card {
  border-radius: $radius-lg;
  padding: 18px;
  background: #fff;
  position: relative;
  overflow: hidden;
  border: 1px solid $border-lighter;
  box-shadow: $shadow-sm;
  transition: all 0.3s;
  &:hover { transform: translateY(-2px); box-shadow: $shadow-md; }

  .stat-icon {
    width: 42px; height: 42px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; color: #fff; margin-bottom: 12px;
  }
  .stat-label { font-size: 12px; color: $text-secondary; margin-bottom: 4px; }
  .stat-value { font-size: 28px; font-weight: 700; color: $text-primary; line-height: 1.2; margin-bottom: 6px; }
  .stat-sub { font-size: 11px; color: $text-secondary; display: flex; align-items: center; gap: 4px;
    .up { color: $success-color; }
  }

  &.stat-warning {
    .stat-icon { background: linear-gradient(135deg, #F5B971 0%, #F39C12 100%); }
    &::after { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; background: rgba(243,156,18,0.08); }
  }
  &.stat-primary {
    .stat-icon { background: linear-gradient(135deg, #5D9CEC 0%, #1E4FA5 100%); }
    &::after { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; background: rgba(30,79,165,0.08); }
  }
  &.stat-success {
    .stat-icon { background: linear-gradient(135deg, #6FCF97 0%, #27AE60 100%); }
    &::after { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; background: rgba(39,174,96,0.08); }
  }
  &.stat-danger {
    .stat-icon { background: linear-gradient(135deg, #F28B82 0%, #E74C3C 100%); }
    &::after { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; background: rgba(231,76,60,0.08); }
  }

  &.stat-metric {
    .metric-top { display: flex; align-items: center; gap: 6px; margin-bottom: 8px;
      .metric-label { font-size: 12px; color: $text-secondary; }
    }
    .metric-value { margin-bottom: 10px;
      .num { font-size: 26px; font-weight: 700; color: $text-primary; line-height: 1; }
      .unit { font-size: 12px; color: $text-secondary; margin-left: 4px; }
    }
    .metric-bar { height: 4px; background: $border-lighter; border-radius: 2px; overflow: hidden; margin-bottom: 6px;
      .bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }
      .bar-blue { background: linear-gradient(90deg, #3B7DD8, #1E4FA5); }
      .bar-green { background: linear-gradient(90deg, #6FCF97, #27AE60); }
      .bar-orange { background: linear-gradient(90deg, #F5B971, #F39C12); }
      .bar-red { background: linear-gradient(90deg, #F28B82, #E74C3C); }
    }
    .metric-trend { font-size: 11px;
      &.good { color: $success-color; }
      &.bad { color: $danger-color; }
    }
  }
}

.filter-card {
  margin-bottom: 20px;
  .filter-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center;
    .filter-item { display: flex; align-items: center; }
    .filter-actions { margin-left: auto; }
  }
}

.card-wrapper {
  background: $bg-card;
  border-radius: $radius-lg;
  padding: 18px;
  border: 1px solid $border-lighter;
  box-shadow: $shadow-sm;
  margin-bottom: 20px;
}
.card-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid $border-lighter;
  .card-title { font-size: 15px; font-weight: 600; color: $text-primary; display: flex; align-items: center; gap: 8px; }
}

.workorder-table {
  :deep(.el-table__cell) { padding: 10px 8px; font-size: 13px; }
  .wo-id { font-family: 'Courier New', monospace; font-size: 12px; color: $primary-color; font-weight: 600; }
  .wo-title { font-weight: 500; color: $text-primary; cursor: pointer; margin-bottom: 2px;
    &:hover { color: $primary-color; text-decoration: underline; }
  }
  .wo-summary { font-size: 11px; color: $text-secondary; line-height: 1.4; }
  .review-info {
    .review-stars { display: flex; gap: 1px; margin-bottom: 3px; }
    .review-service { font-size: 11px; color: $text-secondary; }
  }
  .dept-tag {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    background: $primary-color; color: #fff; font-size: 11px; font-weight: 500;
    opacity: 0.9;
  }
  .overdue { color: $danger-color; font-weight: 600; }
  .warning { color: $warning-color; font-weight: 500; }
}

.pagination-wrapper { display: flex; justify-content: flex-end; padding-top: 16px; }

.detail-section { margin-bottom: 22px;
  .section-title {
    font-size: 14px; font-weight: 600; color: $text-primary;
    display: flex; align-items: center; gap: 6px;
    margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dashed $border-light;
  }
}

.review-content {
  padding: 14px 16px; background: #FFF5F5; border: 1px solid #FADBD8;
  border-radius: 8px; color: #641E16; font-size: 13px; line-height: 1.7;
  position: relative;
  &::before {
    content: '"'; position: absolute; top: -8px; left: 10px;
    font-size: 32px; color: #F5B7B1; font-family: Georgia, serif;
  }
}

.timeline-title { font-weight: 600; color: $text-primary; font-size: 13px; margin-bottom: 4px; }
.timeline-desc { font-size: 12px; color: $text-regular; line-height: 1.5; margin-bottom: 2px; }
.timeline-operator { font-size: 11px; color: $text-secondary; }

.cluster-info {
  .cluster-tag-row { display: flex; flex-wrap: wrap; align-items: center; margin-bottom: 12px;
    .cluster-label { font-size: 12px; color: $text-secondary; margin-right: 6px; }
  }
  .cluster-list { display: flex; flex-direction: column; gap: 8px; }
  .cluster-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    background: $border-extra-light; border-radius: 8px; cursor: pointer;
    transition: all 0.2s;
    &:hover { background: #E8F0FE; transform: translateX(4px); }
    .cluster-id { font-family: monospace; font-size: 12px; color: $primary-color; font-weight: 600; flex-shrink: 0; }
    .cluster-title { flex: 1; font-size: 12px; color: $text-regular;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
}
</style>
