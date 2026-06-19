<template>
  <div class="clusters-container">
    <div class="page-header">
      <div>
        <h2>差评聚类分析</h2>
        <p class="header-sub">
          AI智能聚类 · 问题根因挖掘 · {{ currentTime }}
          <el-tag type="success" effect="dark" style="margin-left: 12px;" size="small">
            <el-icon><Odometer /></el-icon> 实时分析
          </el-tag>
        </p>
      </div>
      <div class="header-actions">
        <el-radio-group v-model="severityFilter" size="default">
          <el-radio-button label="all">全部</el-radio-button>
          <el-radio-button label="high">高优</el-radio-button>
          <el-radio-button label="medium">中等</el-radio-button>
          <el-radio-button label="low">低优</el-radio-button>
        </el-radio-group>
        <el-button type="primary" :icon="Refresh" @click="refreshData">重新聚类</el-button>
        <el-button :icon="Download" @click="handleExport">导出报告</el-button>
      </div>
    </div>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="6">
        <div class="stat-card stat-primary">
          <div class="stat-icon"><Collection /></div>
          <div class="stat-label">聚类总数</div>
          <div class="stat-value">{{ stats.totalClusters }}</div>
          <div class="stat-sub"><TrendCharts class="up" /> 较上周 +3</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-warning">
          <div class="stat-icon"><ChatDotRound /></div>
          <div class="stat-label">覆盖差评数</div>
          <div class="stat-value">{{ formatNum(stats.coveredReviews) }}</div>
          <div class="stat-sub">占比 {{ stats.coverageRate }}%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-success">
          <div class="stat-icon"><Cpu /></div>
          <div class="stat-label">自动识别率</div>
          <div class="stat-value">{{ stats.autoIdentifyRate }}<span style="font-size: 14px;">%</span></div>
          <div class="stat-sub"><TrendCharts class="up" /> 较上月 +2.3%</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card stat-danger">
          <div class="stat-icon"><Warning /></div>
          <div class="stat-label">高优聚类数</div>
          <div class="stat-value">{{ stats.highPriorityCount }}</div>
          <div class="stat-sub">需立即关注</div>
        </div>
      </el-col>
    </el-row>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">差评聚类可视化</div>
        <div>
          <el-tag type="info" round size="small" style="margin-right: 8px;">X轴-问题频率 · Y轴-影响程度 · 气泡-涉及人数</el-tag>
        </div>
      </div>
      <v-chart :option="scatterOption" style="height: 420px;" autoresize />
    </div>

    <div class="card-wrapper">
      <div class="card-header">
        <div class="card-title">聚类列表</div>
        <div>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索聚类名称/关键词"
            :prefix-icon="Search"
            clearable
            style="width: 240px; margin-right: 12px;"
            size="default"
          />
          <el-tag type="danger" effect="plain" round size="small">
            高优 {{ highPriorityClusters.length }}
          </el-tag>
        </div>
      </div>
      <div class="cluster-grid">
        <div
          v-for="cluster in filteredClusters"
          :key="cluster.id"
          class="cluster-card"
          :class="{ 'cluster-high': cluster.severity === 'high', 'cluster-expanded': expandedId === cluster.id }"
        >
          <div class="cluster-main" @click="toggleExpand(cluster.id)">
            <div class="cluster-top">
              <div class="cluster-name">{{ cluster.name }}</div>
              <el-tag
                :type="severityTagType(cluster.severity)"
                effect="dark"
                round
                size="small"
              >
                {{ severityText(cluster.severity) }}
              </el-tag>
            </div>
            <div class="cluster-keywords">
              <el-tag
                v-for="kw in cluster.keywords.slice(0, 4)"
                :key="kw"
                size="small"
                effect="plain"
                round
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ kw }}
              </el-tag>
              <el-tag v-if="cluster.keywords.length > 4" size="small" effect="plain" round type="info">
                +{{ cluster.keywords.length - 4 }}
              </el-tag>
            </div>
            <div class="cluster-metrics">
              <div class="metric-item">
                <span class="metric-label">差评数</span>
                <span class="metric-value">{{ cluster.reviewCount }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">涉及服务</span>
                <span class="metric-value">{{ cluster.services.length }}个</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">影响人数</span>
                <span class="metric-value">{{ formatNum(cluster.affectedUsers) }}</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">趋势</span>
                <span class="metric-value" :class="trendClass(cluster.trend)">
                  {{ trendText(cluster.trend) }}
                  <el-icon v-if="cluster.trend === 'up'"><Top /></el-icon>
                  <el-icon v-else-if="cluster.trend === 'down'"><Bottom /></el-icon>
                  <el-icon v-else><Minus /></el-icon>
                </span>
              </div>
            </div>
            <div class="cluster-services">
              <span v-for="svc in cluster.services.slice(0, 3)" :key="svc" class="svc-tag">{{ svc }}</span>
              <span v-if="cluster.services.length > 3" class="svc-tag svc-more">+{{ cluster.services.length - 3 }}</span>
            </div>
          </div>

          <el-collapse-transition>
            <div v-if="expandedId === cluster.id" class="cluster-detail">
              <el-divider style="margin: 12px 0;" />

              <div class="detail-section">
                <div class="section-title">
                  <el-icon color="#E74C3C"><ChatDotRound /></el-icon> 典型差评
                </div>
                <div class="review-list">
                  <div v-for="(review, idx) in cluster.sampleReviews" :key="idx" class="review-item">
                    <div class="review-header">
                      <el-rate v-model="review.stars" disabled :colors="['#E74C3C', '#E74C3C', '#E74C3C']" size="small" />
                      <span class="review-service">{{ review.service }}</span>
                      <span class="review-time">{{ review.time }}</span>
                    </div>
                    <div class="review-text">{{ review.content }}</div>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <div class="section-title">
                  <el-icon color="#1E4FA5"><Key /></el-icon> 关键词词云
                </div>
                <div class="word-cloud">
                  <span
                    v-for="w in cluster.wordCloud"
                    :key="w.word"
                    class="cloud-word"
                    :style="{ fontSize: w.size + 'px', color: w.color, opacity: 0.7 + w.weight * 0.3 }"
                  >
                    {{ w.word }}
                  </span>
                </div>
              </div>

              <div class="detail-section">
                <div class="section-title">
                  <el-icon color="#F39C12"><Link /></el-icon> 关联工单
                </div>
                <div class="related-orders">
                  <div v-for="order in cluster.relatedOrders" :key="order.id" class="order-item">
                    <span class="order-id">{{ order.id }}</span>
                    <span class="order-title">{{ order.title }}</span>
                    <el-tag :type="order.status === '已解决' ? 'success' : order.status === '处理中' ? 'primary' : 'warning'" size="small" effect="plain" round>
                      {{ order.status }}
                    </el-tag>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <div class="section-title">
                  <el-icon color="#27AE60"><Opportunity /></el-icon> 推荐改善措施
                </div>
                <div class="measures-list">
                  <div v-for="(measure, idx) in cluster.measures" :key="idx" class="measure-item">
                    <el-tag type="success" effect="plain" size="small" round>{{ idx + 1 }}</el-tag>
                    <span class="measure-text">{{ measure }}</span>
                  </div>
                </div>
              </div>
            </div>
          </el-collapse-transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { ScatterChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, VisualMapComponent } from 'echarts/components'
import VChart from 'vue-echarts'
import { ElMessage } from 'element-plus'
import {
  Refresh, Download, Odometer, Collection, ChatDotRound, Cpu, Warning,
  Search, TrendCharts, Top, Bottom, Minus, Key, Link, Opportunity
} from '@element-plus/icons-vue'

use([CanvasRenderer, ScatterChart, GridComponent, TooltipComponent, LegendComponent, VisualMapComponent])

const currentTime = ref('')
const severityFilter = ref('all')
const searchKeyword = ref('')
const expandedId = ref<number | null>(null)

interface WordItem {
  word: string
  size: number
  weight: number
  color: string
}

interface ReviewItem {
  stars: number
  service: string
  time: string
  content: string
}

interface OrderItem {
  id: string
  title: string
  status: string
}

interface ClusterItem {
  id: number
  name: string
  keywords: string[]
  reviewCount: number
  services: string[]
  affectedUsers: number
  severity: 'high' | 'medium' | 'low'
  trend: 'up' | 'down' | 'stable'
  frequency: number
  impact: number
  sampleReviews: ReviewItem[]
  wordCloud: WordItem[]
  relatedOrders: OrderItem[]
  measures: string[]
}

const clusters = ref<ClusterItem[]>([
  {
    id: 1, name: '系统响应慢', keywords: ['响应慢', '加载超时', '卡顿', '白屏', '转圈'],
    reviewCount: 342, services: ['社保查询', '医保凭证', '公积金提取', '不动产登记'],
    affectedUsers: 2891, severity: 'high', trend: 'up', frequency: 85, impact: 92,
    sampleReviews: [
      { stars: 1, service: '社保参保证明打印', time: '3天前', content: '点了半天没反应，页面加载了好几分钟都出不来，急死人了！' },
      { stars: 1, service: '医保电子凭证', time: '5天前', content: '高峰期根本用不了，服务器太慢，响应超时好几次。' },
      { stars: 2, service: '公积金账户查询', time: '1周前', content: '查个社保记录等了5分钟，比窗口排队还慢。' }
    ],
    wordCloud: [
      { word: '响应慢', size: 28, weight: 0.95, color: '#E74C3C' }, { word: '超时', size: 24, weight: 0.88, color: '#1E4FA5' },
      { word: '加载', size: 20, weight: 0.75, color: '#F39C12' }, { word: '卡顿', size: 22, weight: 0.82, color: '#E74C3C' },
      { word: '白屏', size: 18, weight: 0.65, color: '#8E44AD' }, { word: '转圈', size: 16, weight: 0.58, color: '#2980B9' },
      { word: '崩溃', size: 20, weight: 0.72, color: '#E74C3C' }, { word: '等待', size: 14, weight: 0.50, color: '#27AE60' }
    ],
    relatedOrders: [
      { id: 'WO-24060101', title: '社保系统高峰期响应超时', status: '处理中' },
      { id: 'WO-24060105', title: '医保凭证加载慢批量投诉', status: '待处理' },
      { id: 'WO-24060112', title: '公积金查询页面白屏问题', status: '已解决' }
    ],
    measures: ['优化数据库查询索引，减少接口响应时间', '部署CDN加速静态资源加载', '高峰期弹性扩容服务器资源']
  },
  {
    id: 2, name: '材料清单不清晰', keywords: ['材料不全', '白跑', '清单模糊', '前后不一致', '缺材料'],
    reviewCount: 287, services: ['户籍迁移', '社保办理', '不动产登记', '营业执照'],
    affectedUsers: 2156, severity: 'high', trend: 'up', frequency: 78, impact: 88,
    sampleReviews: [
      { stars: 1, service: '户籍迁移办理', time: '2天前', content: '材料清单写得太含糊了，去了窗口才知道少这少那，白跑两趟。' },
      { stars: 2, service: '不动产登记', time: '4天前', content: '网上写的要3份材料，实际要5份，来回折腾好几回。' },
      { stars: 1, service: '社保参保证明', time: '1周前', content: '根本没说要盖章，跑过去又被打回来，办事效率太低。' }
    ],
    wordCloud: [
      { word: '材料不全', size: 26, weight: 0.92, color: '#E74C3C' }, { word: '白跑', size: 24, weight: 0.87, color: '#F39C12' },
      { word: '清单', size: 20, weight: 0.73, color: '#1E4FA5' }, { word: '模糊', size: 18, weight: 0.65, color: '#8E44AD' },
      { word: '不一致', size: 16, weight: 0.58, color: '#E67E22' }, { word: '盖章', size: 14, weight: 0.50, color: '#2980B9' }
    ],
    relatedOrders: [
      { id: 'WO-24060201', title: '户籍迁移材料清单不明确', status: '处理中' },
      { id: 'WO-24060208', title: '不动产登记材料要求投诉', status: '待处理' }
    ],
    measures: ['完善线上材料清单，标注常见遗漏项', '增加材料预审功能，在线校验完整性', '窗口推行一次性告知制度']
  },
  {
    id: 3, name: '窗口态度差', keywords: ['态度差', '不耐烦', '冷漠', '服务意识', '傲慢'],
    reviewCount: 256, services: ['人社窗口', '医保窗口', '公安窗口', '民政窗口'],
    affectedUsers: 1834, severity: 'high', trend: 'stable', frequency: 70, impact: 95,
    sampleReviews: [
      { stars: 1, service: '人社局窗口', time: '1天前', content: '窗口人员态度太差，问个问题爱理不理的，什么服务态度！' },
      { stars: 1, service: '医保局窗口', time: '3天前', content: '工作人员语气很不耐烦，好像欠他钱似的，体验极差。' },
      { stars: 2, service: '公安局窗口', time: '5天前', content: '对老年人特别不耐心，说话快还不解释，差评！' }
    ],
    wordCloud: [
      { word: '态度差', size: 28, weight: 0.96, color: '#E74C3C' }, { word: '不耐烦', size: 24, weight: 0.88, color: '#F39C12' },
      { word: '冷漠', size: 20, weight: 0.72, color: '#8E44AD' }, { word: '傲慢', size: 18, weight: 0.65, color: '#E74C3C' },
      { word: '敷衍', size: 16, weight: 0.58, color: '#2980B9' }, { word: '服务意识', size: 14, weight: 0.50, color: '#27AE60' }
    ],
    relatedOrders: [
      { id: 'WO-24060301', title: '人社窗口服务态度投诉', status: '已升级' },
      { id: 'WO-24060305', title: '医保窗口冷漠对待市民', status: '处理中' }
    ],
    measures: ['开展窗口人员服务礼仪专项培训', '安装服务评价器，实时监控满意度', '建立窗口人员服务考核与绩效挂钩机制']
  },
  {
    id: 4, name: '流程复杂繁琐', keywords: ['流程繁琐', '跑多次', '重复填写', '环节多', '跨部门'],
    reviewCount: 231, services: ['户籍迁移', '企业开办', '工程建设', '不动产登记'],
    affectedUsers: 1672, severity: 'high', trend: 'down', frequency: 65, impact: 82,
    sampleReviews: [
      { stars: 1, service: '户籍迁移办理', time: '2天前', content: '流程太繁琐了，填了十几个表，签了好几个字，太折腾。' },
      { stars: 2, service: '企业开办', time: '4天前', content: '同样的信息重复填了三四遍，系统之间数据不通吗？' },
      { stars: 1, service: '不动产登记', time: '1周前', content: '要跑好几个部门，每个部门都要重新排队。' }
    ],
    wordCloud: [
      { word: '繁琐', size: 26, weight: 0.90, color: '#E74C3C' }, { word: '重复', size: 22, weight: 0.80, color: '#1E4FA5' },
      { word: '跑多次', size: 24, weight: 0.85, color: '#F39C12' }, { word: '环节多', size: 18, weight: 0.68, color: '#8E44AD' },
      { word: '跨部门', size: 16, weight: 0.60, color: '#E67E22' }
    ],
    relatedOrders: [
      { id: 'WO-24060401', title: '户籍迁移流程冗长优化', status: '处理中' },
      { id: 'WO-24060406', title: '企业开办重复填报问题', status: '已解决' }
    ],
    measures: ['推行一窗受理、集成服务改革', '实现跨部门数据共享，减少重复填报', '精简审批环节，压缩办理时限']
  },
  {
    id: 5, name: '功能故障缺陷', keywords: ['功能bug', '提交失败', '按钮无效', '上传失败', '报错'],
    reviewCount: 198, services: ['医保凭证', '社保查询', '公积金提取', '入学报名'],
    affectedUsers: 1523, severity: 'high', trend: 'up', frequency: 72, impact: 78,
    sampleReviews: [
      { stars: 1, service: '义务教育入学报名', time: '1天前', content: '提交按钮点了没反应，换了三个浏览器都不行。' },
      { stars: 1, service: '医保凭证', time: '3天前', content: '上传图片一直失败，明明是JPG格式却说格式不对。' },
      { stars: 2, service: '公积金提取', time: '5天前', content: '保存草稿功能不能用，重新填了三遍，崩溃。' }
    ],
    wordCloud: [
      { word: 'Bug', size: 26, weight: 0.92, color: '#E74C3C' }, { word: '提交失败', size: 24, weight: 0.86, color: '#1E4FA5' },
      { word: '报错', size: 20, weight: 0.74, color: '#F39C12' }, { word: '上传', size: 18, weight: 0.66, color: '#8E44AD' },
      { word: '无效', size: 16, weight: 0.58, color: '#2980B9' }
    ],
    relatedOrders: [
      { id: 'WO-24060501', title: '入学报名系统提交失败', status: '处理中' },
      { id: 'WO-24060503', title: '医保凭证上传功能异常', status: '待处理' }
    ],
    measures: ['建立自动化测试流水线，上线前全面回归', '增加前端异常监控和报警机制', '设立紧急修复通道，2小时内响应关键Bug']
  },
  {
    id: 6, name: '数据不同步', keywords: ['数据延迟', '状态不一致', '信息未更新', '数据对不上'],
    reviewCount: 176, services: ['社保查询', '医保结算', '公积金查询', '交通违法'],
    affectedUsers: 1345, severity: 'medium', trend: 'stable', frequency: 55, impact: 72,
    sampleReviews: [
      { stars: 1, service: '社保查询', time: '2天前', content: '明明已经在窗口办好了，网上状态还显示办理中。' },
      { stars: 2, service: '医保结算', time: '4天前', content: '缴费成功了但是记录里查不到，跑了两趟才确认。' },
      { stars: 1, service: '交通违法', time: '6天前', content: '两个系统数据对不上，一个显示已完成一个显示待审核。' }
    ],
    wordCloud: [
      { word: '不同步', size: 24, weight: 0.88, color: '#E74C3C' }, { word: '延迟', size: 22, weight: 0.80, color: '#1E4FA5' },
      { word: '不一致', size: 20, weight: 0.73, color: '#F39C12' }, { word: '未更新', size: 16, weight: 0.58, color: '#8E44AD' }
    ],
    relatedOrders: [
      { id: 'WO-24060602', title: '社保数据同步延迟问题', status: '处理中' }
    ],
    measures: ['建设统一数据中台，实现实时数据同步', '增加数据一致性校验机制', '缩短数据同步间隔至5分钟以内']
  },
  {
    id: 7, name: '验证码问题', keywords: ['验证码看不清', '短信收不到', '滑块失败', '图形码复杂'],
    reviewCount: 165, services: ['全平台通用', '社保登录', '医保登录', '公积金登录'],
    affectedUsers: 2890, severity: 'medium', trend: 'up', frequency: 82, impact: 45,
    sampleReviews: [
      { stars: 1, service: '社保登录', time: '1天前', content: '验证码永远看不清，换了十几个还是认不出来。' },
      { stars: 2, service: '医保登录', time: '3天前', content: '短信验证码等了十分钟都没收到，试了N次。' },
      { stars: 1, service: '公积金登录', time: '5天前', content: '滑块验证码滑了十几次都不通过，反人类设计。' }
    ],
    wordCloud: [
      { word: '验证码', size: 28, weight: 0.95, color: '#E74C3C' }, { word: '看不清', size: 22, weight: 0.82, color: '#F39C12' },
      { word: '收不到', size: 20, weight: 0.75, color: '#1E4FA5' }, { word: '滑块', size: 18, weight: 0.68, color: '#8E44AD' },
      { word: '失败', size: 16, weight: 0.60, color: '#E67E22' }
    ],
    relatedOrders: [
      { id: 'WO-24060701', title: '验证码识别率低优化', status: '待处理' }
    ],
    measures: ['优化图形验证码清晰度和可辨识度', '更换短信通道，提升送达率至99%', '引入行为验证替代传统验证码']
  },
  {
    id: 8, name: '支付失败异常', keywords: ['支付失败', '重复扣款', '支付跳转', '金额错误'],
    reviewCount: 143, services: ['交通罚款', '社保缴费', '不动产缴费', '医保缴费'],
    affectedUsers: 987, severity: 'high', trend: 'stable', frequency: 48, impact: 90,
    sampleReviews: [
      { stars: 1, service: '交通罚款缴纳', time: '2天前', content: '支付了两次才成功，第一次钱扣了订单却显示未支付。' },
      { stars: 1, service: '社保缴费', time: '4天前', content: '支付金额显示错误，本来是50元显示500元。' },
      { stars: 2, service: '不动产缴费', time: '1周前', content: '支付宝微信都不能用，只支持银行卡。' }
    ],
    wordCloud: [
      { word: '支付失败', size: 24, weight: 0.90, color: '#E74C3C' }, { word: '重复扣款', size: 22, weight: 0.84, color: '#F39C12' },
      { word: '跳转', size: 18, weight: 0.66, color: '#1E4FA5' }, { word: '金额', size: 16, weight: 0.58, color: '#8E44AD' }
    ],
    relatedOrders: [
      { id: 'WO-24060801', title: '交通罚款支付重复扣款', status: '已升级' },
      { id: 'WO-24060804', title: '社保缴费金额异常', status: '处理中' }
    ],
    measures: ['完善支付幂等机制，杜绝重复扣款', '扩展支付渠道，支持主流第三方支付', '加强支付金额校验逻辑']
  },
  {
    id: 9, name: '预约无效', keywords: ['预约失效', '无记录', '取消不了', '号源不足'],
    reviewCount: 132, services: ['不动产预约', '婚姻登记', '出入境预约', '车管所预约'],
    affectedUsers: 876, severity: 'medium', trend: 'down', frequency: 45, impact: 68,
    sampleReviews: [
      { stars: 1, service: '不动产预约', time: '3天前', content: '预约了今天上午十点，到了窗口说没我的预约记录。' },
      { stars: 2, service: '婚姻登记', time: '5天前', content: '预约成功的短信收到了，系统里却说预约已取消。' },
      { stars: 1, service: '车管所', time: '1周前', content: '预约号源秒没，放号时间也不透明，根本抢不到。' }
    ],
    wordCloud: [
      { word: '无效', size: 22, weight: 0.85, color: '#E74C3C' }, { word: '无记录', size: 20, weight: 0.78, color: '#1E4FA5' },
      { word: '号源', size: 18, weight: 0.70, color: '#F39C12' }, { word: '取消', size: 16, weight: 0.60, color: '#8E44AD' }
    ],
    relatedOrders: [
      { id: 'WO-24060901', title: '不动产预约系统故障', status: '已解决' }
    ],
    measures: ['修复预约数据同步机制', '增加号源释放和回收规则', '优化预约确认通知流程']
  },
  {
    id: 10, name: '信息不准确', keywords: ['地址错误', '电话空号', '时间不对', '收费标准错'],
    reviewCount: 121, services: ['办事指南', '窗口信息', '在线咨询', '公告通知'],
    affectedUsers: 756, severity: 'medium', trend: 'down', frequency: 40, impact: 62,
    sampleReviews: [
      { stars: 1, service: '办事指南', time: '2天前', content: '办事指南写的地址早就搬家了，白跑了二十公里。' },
      { stars: 2, service: '窗口信息', time: '5天前', content: '联系电话是空号，打了好几次都打不通。' },
      { stars: 1, service: '公告通知', time: '1周前', content: '收费标准和实际不符，多收了我两百块钱。' }
    ],
    wordCloud: [
      { word: '不准确', size: 22, weight: 0.82, color: '#E74C3C' }, { word: '地址', size: 20, weight: 0.76, color: '#1E4FA5' },
      { word: '空号', size: 16, weight: 0.60, color: '#F39C12' }, { word: '收费', size: 18, weight: 0.68, color: '#8E44AD' }
    ],
    relatedOrders: [
      { id: 'WO-24061002', title: '办事指南信息过时', status: '处理中' }
    ],
    measures: ['建立信息定期巡检更新机制', '开通信息纠错反馈通道', '与部门业务系统联动，自动同步变更']
  },
  {
    id: 11, name: '审核超时', keywords: ['审核慢', '超时限', '无通知', '催办无果'],
    reviewCount: 115, services: ['企业审批', '工程建设', '环保审批', '食品许可'],
    affectedUsers: 689, severity: 'medium', trend: 'stable', frequency: 42, impact: 70,
    sampleReviews: [
      { stars: 1, service: '企业开办审批', time: '2天前', content: '承诺3个工作日审核完，这都一周了还没动静。' },
      { stars: 2, service: '工程建设审批', time: '4天前', content: '审核速度太慢了，别人的都过了我的还在等。' },
      { stars: 1, service: '食品经营许可', time: '1周前', content: '超过承诺时限也没个通知，就让人干等着。' }
    ],
    wordCloud: [
      { word: '超时', size: 24, weight: 0.88, color: '#E74C3C' }, { word: '慢', size: 22, weight: 0.82, color: '#F39C12' },
      { word: '无通知', size: 18, weight: 0.66, color: '#1E4FA5' }, { word: '催办', size: 16, weight: 0.58, color: '#8E44AD' }
    ],
    relatedOrders: [
      { id: 'WO-24061101', title: '企业审批审核超时', status: '待处理' }
    ],
    measures: ['推行审核限时办结制度', '超时自动预警和升级督办', '增加审核进度实时查询和推送通知']
  },
  {
    id: 12, name: '重复提交', keywords: ['重复订单', '多次扣费', '重复短信', '重复审核'],
    reviewCount: 98, services: ['社保缴费', '交通罚款', '公积金提取', '入学报名'],
    affectedUsers: 578, severity: 'medium', trend: 'down', frequency: 35, impact: 58,
    sampleReviews: [
      { stars: 1, service: '社保缴费', time: '3天前', content: '点了一次提交却生成了两个订单，还扣了两次费。' },
      { stars: 2, service: '入学报名', time: '5天前', content: '系统提示失败其实成功了，我又提交了一遍。' },
      { stars: 1, service: '交通罚款', time: '1周前', content: '重复收到审核通过短信，到底哪个是真的？' }
    ],
    wordCloud: [
      { word: '重复', size: 24, weight: 0.88, color: '#E74C3C' }, { word: '多次', size: 20, weight: 0.75, color: '#1E4FA5' },
      { word: '扣费', size: 18, weight: 0.68, color: '#F39C12' }, { word: '订单', size: 16, weight: 0.60, color: '#8E44AD' }
    ],
    relatedOrders: [
      { id: 'WO-24061201', title: '社保缴费重复扣款', status: '已解决' }
    ],
    measures: ['增加提交防抖和幂等校验', '优化网络异常重试机制', '增加重复操作二次确认提示']
  },
  {
    id: 13, name: '人脸识别失败', keywords: ['识别失败', '活体检测', '光线问题', '反复验证'],
    reviewCount: 87, services: ['社保认证', '医保激活', '公积金提取', '实名认证'],
    affectedUsers: 1234, severity: 'medium', trend: 'up', frequency: 60, impact: 52,
    sampleReviews: [
      { stars: 1, service: '社保认证', time: '1天前', content: '人脸识别怎么都过不了，试了二十几次，眼睛都看花了。' },
      { stars: 2, service: '医保激活', time: '3天前', content: '光线稍微暗一点就识别不了，白天室外也经常失败。' },
      { stars: 1, service: '实名认证', time: '5天前', content: '活体检测一直提示动作不标准，到底是怎样才算标准？' }
    ],
    wordCloud: [
      { word: '识别失败', size: 24, weight: 0.90, color: '#E74C3C' }, { word: '活体', size: 20, weight: 0.75, color: '#1E4FA5' },
      { word: '光线', size: 18, weight: 0.68, color: '#F39C12' }, { word: '反复', size: 16, weight: 0.60, color: '#8E44AD' }
    ],
    relatedOrders: [
      { id: 'WO-24061301', title: '人脸识别通过率低', status: '处理中' }
    ],
    measures: ['升级人脸识别算法模型，提升暗光环境识别率', '增加光线检测提示引导', '提供替代认证方式（如人工审核）']
  },
  {
    id: 14, name: '隐私安全担忧', keywords: ['隐私泄露', '信息收集', '权限过多', '数据安全'],
    reviewCount: 76, services: ['全平台通用', '社保认证', '医保授权', '公积金授权'],
    affectedUsers: 2345, severity: 'low', trend: 'up', frequency: 52, impact: 35,
    sampleReviews: [
      { stars: 2, service: '社保认证', time: '2天前', content: '为什么要获取我的通讯录权限？社保认证跟通讯录有什么关系？' },
      { stars: 1, service: '医保授权', time: '4天前', content: '授权页面看不懂，不知道数据会被谁看到，不敢点同意。' },
      { stars: 2, service: '公积金', time: '1周前', content: '每次登录都要重新授权，感觉个人信息被反复收集。' }
    ],
    wordCloud: [
      { word: '隐私', size: 22, weight: 0.85, color: '#E74C3C' }, { word: '泄露', size: 20, weight: 0.78, color: '#F39C12' },
      { word: '权限', size: 18, weight: 0.70, color: '#1E4FA5' }, { word: '安全', size: 16, weight: 0.62, color: '#8E44AD' }
    ],
    relatedOrders: [
      { id: 'WO-24061401', title: '用户隐私授权流程优化', status: '待处理' }
    ],
    measures: ['精简权限申请，遵循最小必要原则', '优化授权说明文案，让用户明确知情', '通过隐私安全认证，公示安全报告']
  },
  {
    id: 15, name: '通知推送不合理', keywords: ['推送过多', '无关通知', '重要通知漏发', '无法关闭'],
    reviewCount: 68, services: ['全平台通用', '社保通知', '医保通知', '公积金通知'],
    affectedUsers: 3456, severity: 'low', trend: 'stable', frequency: 38, impact: 28,
    sampleReviews: [
      { stars: 2, service: '社保通知', time: '3天前', content: '天天推无关的广告通知，重要的审核结果倒是不推。' },
      { stars: 1, service: '全平台', time: '5天前', content: '通知无法关闭，设置了免打扰还是每天收到好几条。' },
      { stars: 2, service: '医保通知', time: '1周前', content: '医保到账了没通知，错过缴费时间才来催缴通知。' }
    ],
    wordCloud: [
      { word: '推送', size: 22, weight: 0.82, color: '#F39C12' }, { word: '过多', size: 20, weight: 0.76, color: '#E74C3C' },
      { word: '漏发', size: 18, weight: 0.68, color: '#1E4FA5' }, { word: '无关', size: 16, weight: 0.60, color: '#8E44AD' }
    ],
    relatedOrders: [
      { id: 'WO-24061501', title: '通知推送策略优化', status: '处理中' }
    ],
    measures: ['优化通知分级策略，重要通知优先推送', '提供通知偏好设置，允许用户自定义', '减少营销类推送，提升通知精准度']
  }
])

const stats = computed(() => {
  const total = clusters.value.length
  const covered = clusters.value.reduce((s, c) => s + c.reviewCount, 0)
  const highCount = clusters.value.filter(c => c.severity === 'high').length
  return {
    totalClusters: total,
    coveredReviews: covered,
    coverageRate: 87.6,
    autoIdentifyRate: 91.3,
    highPriorityCount: highCount
  }
})

const highPriorityClusters = computed(() => clusters.value.filter(c => c.severity === 'high'))

const filteredClusters = computed(() => {
  let list = [...clusters.value]
  if (severityFilter.value !== 'all') {
    list = list.filter(c => c.severity === severityFilter.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(c =>
      c.name.toLowerCase().includes(kw) ||
      c.keywords.some(k => k.toLowerCase().includes(kw))
    )
  }
  return list.sort((a, b) => {
    const sv = { high: 0, medium: 1, low: 2 }
    if (sv[a.severity] !== sv[b.severity]) return sv[a.severity] - sv[b.severity]
    return b.reviewCount - a.reviewCount
  })
})

const scatterOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    formatter: (params: any) => {
      const d = params.data
      return `<strong>${d.name}</strong><br/>问题频率：${d.value[0]}<br/>影响程度：${d.value[1]}<br/>涉及人数：${d.affected}人<br/>差评数：${d.reviewCount}`
    }
  },
  grid: { left: 60, right: 40, top: 40, bottom: 50 },
  xAxis: {
    name: '问题频率',
    type: 'value',
    min: 25, max: 95,
    splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } },
    nameTextStyle: { fontSize: 12, color: '#909399' }
  },
  yAxis: {
    name: '影响程度',
    type: 'value',
    min: 20, max: 100,
    splitLine: { lineStyle: { type: 'dashed', opacity: 0.5 } },
    nameTextStyle: { fontSize: 12, color: '#909399' }
  },
  series: [{
    type: 'scatter',
    data: clusters.value.map(c => ({
      name: c.name,
      value: [c.frequency, c.impact],
      affected: c.affectedUsers,
      reviewCount: c.reviewCount,
      symbolSize: Math.max(20, Math.min(60, c.affectedUsers / 50)),
      itemStyle: {
        color: c.severity === 'high' ? '#E74C3C' : c.severity === 'medium' ? '#F39C12' : '#27AE60',
        shadowBlur: 10,
        shadowColor: c.severity === 'high' ? 'rgba(231,76,60,0.3)' : c.severity === 'medium' ? 'rgba(243,156,18,0.3)' : 'rgba(39,174,96,0.3)'
      },
      label: {
        show: c.severity === 'high',
        formatter: '{b}',
        position: 'top',
        fontSize: 11,
        color: '#303133'
      }
    })),
    emphasis: {
      itemStyle: { shadowBlur: 20, borderColor: '#1E4FA5', borderWidth: 2 }
    }
  }],
  visualMap: {
    show: false,
    dimension: 2,
    min: 200,
    max: 3500,
    inRange: { symbolSize: [20, 60] }
  }
}))

function toggleExpand(id: number) {
  expandedId.value = expandedId.value === id ? null : id
}

const severityText = (s: string) => ({ high: '高优', medium: '中等', low: '低优' }[s] || s)
const severityTagType = (s: string) => ({ high: 'danger', medium: 'warning', low: 'success' }[s] || 'info') as any
const trendText = (t: string) => ({ up: '上升', down: '下降', stable: '平稳' }[t] || t)
const trendClass = (t: string) => ({ up: 'trend-up', down: 'trend-down', stable: 'trend-stable' }[t] || '')

const formatNum = (n: number) => {
  if (n >= 10000) return (n / 10000).toFixed(1) + '万'
  return n.toLocaleString('zh-CN')
}

function refreshData() {
  ElMessage.success('聚类分析已重新执行，结果已更新')
}

function handleExport() {
  ElMessage.info('正在导出聚类分析报告...')
}

let timer: any
onMounted(() => {
  timer = setInterval(() => {
    const d = new Date()
    currentTime.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  }, 1000)
})
onUnmounted(() => clearInterval(timer))
</script>

<style lang="scss" scoped>
@use '@/styles/variables.scss' as *;

.clusters-container { padding: 0; }

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

  &.stat-primary {
    .stat-icon { background: linear-gradient(135deg, #5D9CEC 0%, #1E4FA5 100%); }
    &::after { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; background: rgba(30,79,165,0.08); }
  }
  &.stat-warning {
    .stat-icon { background: linear-gradient(135deg, #F5B971 0%, #F39C12 100%); }
    &::after { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; background: rgba(243,156,18,0.08); }
  }
  &.stat-success {
    .stat-icon { background: linear-gradient(135deg, #6FCF97 0%, #27AE60 100%); }
    &::after { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; background: rgba(39,174,96,0.08); }
  }
  &.stat-danger {
    .stat-icon { background: linear-gradient(135deg, #F28B82 0%, #E74C3C 100%); }
    &::after { content: ''; position: absolute; top: -30px; right: -30px; width: 100px; height: 100px; border-radius: 50%; background: rgba(231,76,60,0.08); }
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

.cluster-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
  gap: 16px;
}

.cluster-card {
  background: #fff;
  border: 1px solid $border-lighter;
  border-radius: $radius-lg;
  padding: 18px;
  transition: all 0.3s;
  cursor: pointer;
  &:hover { box-shadow: $shadow-md; transform: translateY(-1px); }
  &.cluster-high { border-left: 4px solid $danger-color; }
  &.cluster-expanded { box-shadow: $shadow-lg; border-color: $primary-light; }
}

.cluster-top {
  display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
  .cluster-name { font-size: 15px; font-weight: 600; color: $text-primary; }
}

.cluster-keywords { margin-bottom: 12px; }

.cluster-metrics {
  display: flex; gap: 16px; margin-bottom: 10px;
  .metric-item { flex: 1; }
  .metric-label { display: block; font-size: 11px; color: $text-secondary; margin-bottom: 2px; }
  .metric-value { display: flex; align-items: center; gap: 2px; font-size: 14px; font-weight: 600; color: $text-primary; }
  .trend-up { color: $danger-color; }
  .trend-down { color: $success-color; }
  .trend-stable { color: $text-secondary; }
}

.cluster-services {
  display: flex; flex-wrap: wrap; gap: 6px;
  .svc-tag {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    background: $border-extra-light; color: $text-regular; font-size: 11px;
  }
  .svc-more { background: $primary-color; color: #fff; }
}

.cluster-detail {
  .detail-section { margin-bottom: 16px; }
  .section-title {
    font-size: 13px; font-weight: 600; color: $text-primary;
    display: flex; align-items: center; gap: 6px;
    margin-bottom: 10px;
  }
}

.review-list {
  .review-item {
    padding: 10px 12px; background: #FFF5F5; border: 1px solid #FADBD8;
    border-radius: 8px; margin-bottom: 8px;
    .review-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .review-service { font-size: 11px; color: $text-secondary; }
    .review-time { font-size: 11px; color: $text-placeholder; margin-left: auto; }
    .review-text { font-size: 12px; color: #641E16; line-height: 1.6; }
  }
}

.word-cloud {
  display: flex; flex-wrap: wrap; gap: 8px 14px; padding: 8px;
  .cloud-word {
    display: inline-block; font-weight: 600; cursor: default; transition: all 0.2s;
    &:hover { transform: scale(1.15); }
  }
}

.related-orders {
  .order-item {
    display: flex; align-items: center; gap: 10px; padding: 8px 12px;
    background: $border-extra-light; border-radius: 8px; margin-bottom: 6px;
    .order-id { font-family: monospace; font-size: 12px; color: $primary-color; font-weight: 600; flex-shrink: 0; }
    .order-title { flex: 1; font-size: 12px; color: $text-regular; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  }
}

.measures-list {
  .measure-item {
    display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px;
    .measure-text { font-size: 12px; color: $text-regular; line-height: 1.6; }
  }
}
</style>
