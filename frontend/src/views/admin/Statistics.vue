<template>
  <div class="admin-statistics">
    <div class="page-header mb-24">
      <h2 class="page-title">统计分析</h2>
      <p class="text-gray-500 mt-8">多维度数据统计与可视化分析复盘</p>
    </div>

    <el-card class="filter-card mb-24" shadow="never">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 280px"
          />
        </el-form-item>
        <el-form-item label="部门">
          <el-select v-model="filterForm.departmentId" placeholder="全部部门" clearable style="width: 180px">
            <el-option v-for="dept in departments" :key="dept.id" :label="dept.name" :value="dept.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域">
          <el-tree-select
            v-model="filterForm.regionId"
            :data="regionTree"
            check-strictly
            show-checkbox
            placeholder="全部区域"
            clearable
            style="width: 180px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchAllData">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="resetFilter">重置</el-button>
          <el-button type="success" @click="exportData">
            <el-icon><Download /></el-icon>
            导出
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-tabs v-model="activeTab" class="statistics-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="总览" name="overview">
        <div class="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
          <div class="stat-card card p-24">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-14 text-gray-500">总办件量</div>
                <div class="text-32 font-bold mt-12 text-blue-500">{{ summaryData.totalApplications }}</div>
                <div class="flex items-center gap-8 mt-12 text-13">
                  <el-icon color="#67c23a"><ArrowUp /></el-icon>
                  <span class="text-green-500">{{ summaryData.totalGrowth }}%</span>
                  <span class="text-gray-400">较上期</span>
                </div>
              </div>
              <div class="stat-icon bg-blue-500">
                <el-icon :size="32" color="#fff"><Document /></el-icon>
              </div>
            </div>
          </div>
          <div class="stat-card card p-24">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-14 text-gray-500">办结率</div>
                <div class="text-32 font-bold mt-12 text-green-500">{{ summaryData.completionRate }}%</div>
                <div class="flex items-center gap-8 mt-12 text-13">
                  <el-icon color="#67c23a"><ArrowUp /></el-icon>
                  <span class="text-green-500">{{ summaryData.completionGrowth }}%</span>
                  <span class="text-gray-400">较上期</span>
                </div>
              </div>
              <div class="stat-icon bg-green-500">
                <el-icon :size="32" color="#fff"><CircleCheck /></el-icon>
              </div>
            </div>
          </div>
          <div class="stat-card card p-24">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-14 text-gray-500">平均办理时长</div>
                <div class="text-32 font-bold mt-12 text-orange-500">{{ summaryData.avgDuration }}天</div>
                <div class="flex items-center gap-8 mt-12 text-13">
                  <el-icon color="#f56c6c"><ArrowDown /></el-icon>
                  <span class="text-red-500">{{ summaryData.durationReduction }}%</span>
                  <span class="text-gray-400">较上期</span>
                </div>
              </div>
              <div class="stat-icon bg-orange-500">
                <el-icon :size="32" color="#fff"><Clock /></el-icon>
              </div>
            </div>
          </div>
          <div class="stat-card card p-24">
            <div class="flex justify-between items-start">
              <div>
                <div class="text-14 text-gray-500">群众满意度</div>
                <div class="text-32 font-bold mt-12 text-purple-500">{{ summaryData.satisfaction }}%</div>
                <div class="flex items-center gap-8 mt-12 text-13">
                  <el-icon color="#67c23a"><ArrowUp /></el-icon>
                  <span class="text-green-500">{{ summaryData.satisfactionGrowth }}%</span>
                  <span class="text-gray-400">较上期</span>
                </div>
              </div>
              <div class="stat-icon bg-purple-500">
                <el-icon :size="32" color="#fff"><Star /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-24">
          <div class="card p-24">
            <div class="flex justify-between items-center mb-20">
              <h3 class="text-18 font-semibold">办件趋势</h3>
              <el-radio-group v-model="trendPeriod" size="small" @change="fetchTrendData">
                <el-radio-button value="week">周</el-radio-button>
                <el-radio-button value="month">月</el-radio-button>
                <el-radio-button value="quarter">季度</el-radio-button>
                <el-radio-button value="year">年</el-radio-button>
              </el-radio-group>
            </div>
            <div class="chart-container" style="height: 320px">
              <v-chart :option="trendChartOption" autoresize />
            </div>
          </div>

          <div class="card p-24">
            <div class="flex justify-between items-center mb-20">
              <h3 class="text-18 font-semibold">事项类型分布</h3>
            </div>
            <div class="chart-container" style="height: 320px">
              <v-chart :option="typeChartOption" autoresize />
            </div>
          </div>
        </div>

        <div class="card p-24">
          <div class="flex justify-between items-center mb-20">
            <h3 class="text-18 font-semibold">热门服务事项 TOP10</h3>
          </div>
          <el-table :data="hotServices" size="small">
            <el-table-column type="index" label="排名" width="80" align="center">
              <template #default="{ $index }">
                <span :class="getRankClass($index)">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="服务事项" min-width="200" />
            <el-table-column prop="department" label="所属部门" width="180" />
            <el-table-column prop="region" label="所属区域" width="140" />
            <el-table-column prop="count" label="办件量" width="120" align="center">
              <template #default="{ row }">
                <span class="font-semibold text-blue-500">{{ row.count }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="avgDuration" label="平均时长" width="120" align="center">
              <template #default="{ row }">{{ row.avgDuration }}天</template>
            </el-table-column>
            <el-table-column prop="satisfaction" label="满意度" width="140" align="center">
              <template #default="{ row }">
                <el-rate v-model="row.satisfaction" disabled :max="5" size="small" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="区域分析" name="region">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-20 mb-24">
          <div class="card p-24">
            <h3 class="text-18 font-semibold mb-16">各层级办件量</h3>
            <div class="chart-container" style="height: 300px">
              <v-chart :option="regionLevelChartOption" autoresize />
            </div>
          </div>
          <div class="card p-24 lg:col-span-2">
            <h3 class="text-18 font-semibold mb-16">各市州办件分布</h3>
            <div class="chart-container" style="height: 300px">
              <v-chart :option="regionCityChartOption" autoresize />
            </div>
          </div>
        </div>

        <div class="card p-24">
          <div class="flex justify-between items-center mb-20">
            <h3 class="text-18 font-semibold">区县办件排行</h3>
            <el-select v-model="selectedCity" placeholder="选择市州" clearable style="width: 180px" @change="fetchCountyRank">
              <el-option v-for="city in cities" :key="city.code" :label="city.name" :value="city.code" />
            </el-select>
          </div>
          <el-table :data="countyRank" size="small">
            <el-table-column type="index" label="排名" width="80" align="center">
              <template #default="{ $index }">
                <span :class="getRankClass($index)">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="区县名称" min-width="180" />
            <el-table-column prop="city_name" label="所属市州" width="140" />
            <el-table-column prop="total_count" label="总办件量" width="120" align="center">
              <template #default="{ row }">
                <span class="font-semibold text-blue-500">{{ row.total_count }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="completed_count" label="已办结" width="100" align="center" />
            <el-table-column prop="completion_rate" label="办结率" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.completion_rate >= 95 ? 'success' : row.completion_rate >= 85 ? 'warning' : 'danger'" size="small">
                  {{ row.completion_rate }}%
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="avg_duration" label="平均时长" width="100" align="center">
              <template #default="{ row }">{{ row.avg_duration }}天</template>
            </el-table-column>
            <el-table-column prop="satisfaction" label="满意度" width="140" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.satisfaction" :stroke-width="12" size="small" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="事项分析" name="service">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-24">
          <div class="card p-24">
            <h3 class="text-18 font-semibold mb-16">部门办件量排行</h3>
            <div class="chart-container" style="height: 320px">
              <v-chart :option="deptChartOption" autoresize />
            </div>
          </div>
          <div class="card p-24">
            <h3 class="text-18 font-semibold mb-16">办理时长分布</h3>
            <div class="chart-container" style="height: 320px">
              <v-chart :option="durationChartOption" autoresize />
            </div>
          </div>
        </div>

        <div class="card p-24">
          <h3 class="text-18 font-semibold mb-16">事项效能对比</h3>
          <el-table :data="serviceEfficiency" size="small">
            <el-table-column prop="name" label="服务事项" min-width="200" />
            <el-table-column prop="department" label="所属部门" width="180" />
            <el-table-column prop="region_level" label="办理层级" width="100" align="center">
              <template #default="{ row }">
                <el-tag size="small" :type="row.region_level === 'province' ? 'primary' : row.region_level === 'city' ? 'success' : 'warning'">
                  {{ { province: '省级', city: '市级', county: '区县级' }[row.region_level] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="total_count" label="办件量" width="100" align="center" />
            <el-table-column prop="avg_duration" label="平均时长" width="100" align="center">
              <template #default="{ row }">
                <span :class="row.avg_duration > 7 ? 'text-red-500' : row.avg_duration > 3 ? 'text-orange-500' : 'text-green-500'">
                  {{ row.avg_duration }}天
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="promised_duration" label="承诺时限" width="100" align="center">
              <template #default="{ row }">{{ row.promised_duration }}天</template>
            </el-table-column>
            <el-table-column prop="timely_rate" label="按时办结率" width="120" align="center">
              <template #default="{ row }">
                <el-progress :percentage="row.timely_rate" :stroke-width="12" size="small"
                  :color="row.timely_rate >= 98 ? '#67c23a' : row.timely_rate >= 90 ? '#e6a23c' : '#f56c6c'" />
              </template>
            </el-table-column>
            <el-table-column prop="satisfaction" label="满意度" width="120" align="center">
              <template #default="{ row }">{{ row.satisfaction }}%</template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="角色分析" name="role">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-20 mb-24">
          <div class="card p-24">
            <h3 class="text-18 font-semibold mb-16">角色办件量分布</h3>
            <div class="chart-container" style="height: 300px">
              <v-chart :option="rolePieChartOption" autoresize />
            </div>
          </div>
          <div class="card p-24 lg:col-span-2">
            <h3 class="text-18 font-semibold mb-16">岗位效能雷达图</h3>
            <div class="chart-container" style="height: 300px">
              <v-chart :option="roleRadarChartOption" autoresize />
            </div>
          </div>
        </div>

        <div class="card p-24">
          <h3 class="text-18 font-semibold mb-16">工作人员效能排行</h3>
          <el-table :data="staffRank" size="small">
            <el-table-column type="index" label="排名" width="80" align="center">
              <template #default="{ $index }">
                <span :class="getRankClass($index)">{{ $index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="department" label="所属部门" width="180" />
            <el-table-column prop="role" label="角色" width="120" align="center">
              <template #default="{ row }">
                <el-tag size="small">{{ row.role }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="region" label="所属区域" width="140" />
            <el-table-column prop="handled_count" label="处理办件" width="100" align="center" />
            <el-table-column prop="avg_handle_time" label="平均处理时长" width="140" align="center">
              <template #default="{ row }">{{ row.avg_handle_time }}小时</template>
            </el-table-column>
            <el-table-column prop="timely_rate" label="及时率" width="120" align="center">
              <template #default="{ row }">{{ row.timely_rate }}%</template>
            </el-table-column>
            <el-table-column prop="satisfaction" label="群众评价" width="140" align="center">
              <template #default="{ row }">
                <el-rate v-model="row.satisfaction" disabled :max="5" size="small" />
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="异常预警" name="alert">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24">
          <div class="stat-card card p-24 border-l-4 border-l-red-500">
            <div class="text-14 text-gray-500">超期预警</div>
            <div class="text-32 font-bold mt-12 text-red-500">{{ alertStats.overdue }}</div>
            <div class="text-12 text-gray-400 mt-8">办件即将超期</div>
          </div>
          <div class="stat-card card p-24 border-l-4 border-l-orange-500">
            <div class="text-14 text-gray-500">差评预警</div>
            <div class="text-32 font-bold mt-12 text-orange-500">{{ alertStats.negative }}</div>
            <div class="text-12 text-gray-400 mt-8">1-2星差评未整改</div>
          </div>
          <div class="stat-card card p-24 border-l-4 border-l-yellow-500">
            <div class="text-14 text-gray-500">材料缺失</div>
            <div class="text-32 font-bold mt-12 text-yellow-600">{{ alertStats.material }}</div>
            <div class="text-12 text-gray-400 mt-8">关键材料缺失</div>
          </div>
          <div class="stat-card card p-24 border-l-4 border-l-purple-500">
            <div class="text-14 text-gray-500">流程异常</div>
            <div class="text-32 font-bold mt-12 text-purple-500">{{ alertStats.flow }}</div>
            <div class="text-12 text-gray-400 mt-8">流程跳转异常</div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-20 mb-24">
          <div class="card p-24">
            <h3 class="text-18 font-semibold mb-16">预警类型分布</h3>
            <div class="chart-container" style="height: 300px">
              <v-chart :option="alertTypeChartOption" autoresize />
            </div>
          </div>
          <div class="card p-24">
            <h3 class="text-18 font-semibold mb-16">预警趋势（近30天）</h3>
            <div class="chart-container" style="height: 300px">
              <v-chart :option="alertTrendChartOption" autoresize />
            </div>
          </div>
        </div>

        <div class="card p-24">
          <div class="flex justify-between items-center mb-20">
            <h3 class="text-18 font-semibold">预警列表</h3>
            <el-select v-model="alertFilter" size="small" style="width: 140px">
              <el-option label="全部预警" value="" />
              <el-option label="超期预警" value="overdue" />
              <el-option label="差评预警" value="negative" />
              <el-option label="材料缺失" value="material" />
              <el-option label="流程异常" value="flow" />
            </el-select>
          </div>
          <el-table :data="alertList" size="small">
            <el-table-column prop="alert_time" label="预警时间" width="160">
              <template #default="{ row }">
                {{ dayjs(row.alert_time).format('YYYY-MM-DD HH:mm') }}
              </template>
            </el-table-column>
            <el-table-column prop="type" label="预警类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag :type="getAlertTypeTag(row.type)" size="small">
                  {{ getAlertTypeText(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="level" label="级别" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.level === 'high' ? 'danger' : row.level === 'medium' ? 'warning' : 'info'" size="small">
                  {{ { high: '高', medium: '中', low: '低' }[row.level] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="title" label="预警内容" min-width="220" show-overflow-tooltip />
            <el-table-column prop="related_application_no" label="关联办件" width="160" />
            <el-table-column prop="handler" label="责任人" width="100" />
            <el-table-column prop="status" label="处理状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'pending' ? 'warning' : row.status === 'processing' ? 'primary' : 'success'" size="small">
                  {{ { pending: '待处理', processing: '处理中', resolved: '已解决' }[row.status] }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="handleViewAlert(row)">处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <el-tab-pane label="审计日志" name="audit">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-20 mb-24">
          <div class="card p-24">
            <h3 class="text-18 font-semibold mb-16">操作类型分布</h3>
            <div class="chart-container" style="height: 300px">
              <v-chart :option="auditTypeChartOption" autoresize />
            </div>
          </div>
          <div class="card p-24 lg:col-span-2">
            <h3 class="text-18 font-semibold mb-16">操作趋势（按角色）</h3>
            <div class="chart-container" style="height: 300px">
              <v-chart :option="auditRoleTrendChartOption" autoresize />
            </div>
          </div>
        </div>

        <div class="card p-24">
          <div class="flex justify-between items-center mb-20">
            <h3 class="text-18 font-semibold">审计日志详情</h3>
            <div class="flex gap-12">
              <el-select v-model="auditFilter.operation" placeholder="操作类型" clearable size="small" style="width: 140px">
                <el-option label="登录" value="login" />
                <el-option label="查询" value="query" />
                <el-option label="新增" value="create" />
                <el-option label="修改" value="update" />
                <el-option label="删除" value="delete" />
                <el-option label="审批" value="approve" />
                <el-option label="导出" value="export" />
              </el-select>
              <el-select v-model="auditFilter.role" placeholder="角色" clearable size="small" style="width: 140px">
                <el-option label="系统管理员" value="super_admin" />
                <el-option label="省级管理员" value="province_admin" />
                <el-option label="市级管理员" value="city_admin" />
                <el-option label="区县级管理员" value="county_admin" />
                <el-option label="审批人员" value="approver" />
                <el-option label="经办人员" value="staff" />
              </el-select>
            </div>
          </div>
          <el-table :data="auditLogs" size="small">
            <el-table-column prop="operation_time" label="操作时间" width="160">
              <template #default="{ row }">
                {{ dayjs(row.operation_time).format('YYYY-MM-DD HH:mm:ss') }}
              </template>
            </el-table-column>
            <el-table-column prop="user_name" label="操作人" width="100" />
            <el-table-column prop="role_name" label="角色" width="120" align="center">
              <template #default="{ row }">
                <el-tag size="small">{{ row.role_name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="department" label="所属部门" width="140" />
            <el-table-column prop="region" label="所属区域" width="120" />
            <el-table-column prop="operation" label="操作类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getAuditTypeTag(row.operation)" size="small">
                  {{ row.operation_name }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="module" label="操作模块" width="120" />
            <el-table-column prop="description" label="操作描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="ip_address" label="IP地址" width="120" />
            <el-table-column prop="status" label="状态" width="80" align="center">
              <template #default="{ row }">
                <el-icon :color="row.status === 'success' ? '#67c23a' : '#f56c6c'" size="16">
                  <component :is="row.status === 'success' ? 'CircleCheck' : 'CircleClose'" />
                </el-icon>
              </template>
            </el-table-column>
          </el-table>
          <div class="flex justify-end mt-20">
            <el-pagination
              v-model:current-page="auditPagination.page"
              v-model:page-size="auditPagination.pageSize"
              :page-sizes="[10, 20, 50]"
              :total="auditPagination.total"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="fetchAuditLogs"
              @current-change="fetchAuditLogs"
            />
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { statisticsApi, departmentApi, regionApi, alertApi, auditLogApi } from '@/api'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import * as echarts from 'echarts'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart, BarChart, RadarChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent
} from 'echarts/components'

use([
  CanvasRenderer,
  LineChart,
  PieChart,
  BarChart,
  RadarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent
])

const loading = ref(false)
const activeTab = ref('overview')
const trendPeriod = ref('month')
const departments = ref([])
const regionTree = ref([])
const selectedCity = ref('')
const alertFilter = ref('')

const filterForm = reactive({
  dateRange: [],
  departmentId: '',
  regionId: ''
})

const auditFilter = reactive({
  operation: '',
  role: ''
})

const auditPagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const summaryData = ref({
  totalApplications: 12586,
  totalGrowth: 12.5,
  completionRate: 94.2,
  completionGrowth: 2.1,
  avgDuration: 3.5,
  durationReduction: 15.3,
  satisfaction: 96.8,
  satisfactionGrowth: 1.2
})

const alertStats = ref({
  overdue: 23,
  negative: 8,
  material: 15,
  flow: 5
})

const cities = ref([
  { code: '5101', name: '成都市' },
  { code: '5103', name: '自贡市' },
  { code: '5104', name: '攀枝花市' },
  { code: '5105', name: '泸州市' },
  { code: '5106', name: '德阳市' },
  { code: '5107', name: '绵阳市' },
  { code: '5108', name: '广元市' },
  { code: '5109', name: '遂宁市' },
  { code: '5110', name: '内江市' },
  { code: '5111', name: '乐山市' },
  { code: '5113', name: '南充市' },
  { code: '5114', name: '眉山市' },
  { code: '5115', name: '宜宾市' },
  { code: '5116', name: '广安市' },
  { code: '5117', name: '达州市' },
  { code: '5118', name: '雅安市' },
  { code: '5119', name: '巴中市' },
  { code: '5120', name: '资阳市' }
])

const hotServices = ref([])
const countyRank = ref([])
const serviceEfficiency = ref([])
const staffRank = ref([])
const alertList = ref([])
const auditLogs = ref([])

const trendChartOption = ref({
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.95)', borderColor: '#ebeef5', borderWidth: 1, textStyle: { color: '#303133' } },
  legend: { data: ['办件量', '办结量'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: [] },
  yAxis: { type: 'value' },
  series: [
    { name: '办件量', type: 'line', smooth: true, data: [], lineStyle: { color: '#1e88e5', width: 3 }, itemStyle: { color: '#1e88e5' },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(30, 136, 229, 0.3)' }, { offset: 1, color: 'rgba(30, 136, 229, 0.05)' }]) } },
    { name: '办结量', type: 'line', smooth: true, data: [], lineStyle: { color: '#67c23a', width: 3 }, itemStyle: { color: '#67c23a' },
      areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(103, 194, 58, 0.3)' }, { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }]) } }
  ]
})

const typeChartOption = ref({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', right: '5%', top: 'center', itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12 } },
  series: [{ type: 'pie', radius: ['45%', '75%'], center: ['35%', '50%'], itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
    label: { show: false }, emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    data: [
      { value: 335, name: '行政许可', itemStyle: { color: '#1e88e5' } },
      { value: 310, name: '公共服务', itemStyle: { color: '#67c23a' } },
      { value: 234, name: '行政确认', itemStyle: { color: '#e6a23c' } },
      { value: 135, name: '行政给付', itemStyle: { color: '#909399' } },
      { value: 148, name: '其他', itemStyle: { color: '#9c27b0' } }
    ] }]
})

const deptChartOption = ref({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: [] },
  series: [{ type: 'bar', data: [],
    itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#1e88e5' }, { offset: 1, color: '#64b5f6' }]), borderRadius: [0, 4, 4, 0] }, barWidth: 20 }]
})

const regionLevelChartOption = ref({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  xAxis: { type: 'category', data: ['省级', '市级', '区县级'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [1258, 4523, 6805], barWidth: 40,
    itemStyle: { color: (params) => ['#1e88e5', '#67c23a', '#e6a23c'][params.dataIndex], borderRadius: [4, 4, 0, 0] } }]
})

const regionCityChartOption = ref({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  xAxis: { type: 'value' },
  yAxis: { type: 'category', data: ['成都', '绵阳', '德阳', '宜宾', '南充', '乐山', '泸州', '达州', '内江', '自贡'] },
  series: [{ type: 'bar', data: [1856, 986, 856, 723, 658, 589, 523, 486, 412, 356],
    itemStyle: { color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [{ offset: 0, color: '#1e88e5' }, { offset: 1, color: '#90caf9' }]), borderRadius: [0, 4, 4, 0] }, barWidth: 16 }]
})

const durationChartOption = ref({
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
  xAxis: { type: 'category', data: ['当天', '1-3天', '4-7天', '8-15天', '16-30天', '30天以上'] },
  yAxis: { type: 'value' },
  series: [{ type: 'bar', data: [420, 680, 320, 180, 85, 25],
    itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#1e88e5' }, { offset: 1, color: '#90caf9' }]), borderRadius: [4, 4, 0, 0] }, barWidth: 40 }]
})

const rolePieChartOption = ref({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', right: '5%', top: 'center', itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12 } },
  series: [{ type: 'pie', radius: ['45%', '75%'], center: ['35%', '50%'], itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
    label: { show: false }, emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    data: [
      { value: 3256, name: '审批人员', itemStyle: { color: '#1e88e5' } },
      { value: 2845, name: '经办人员', itemStyle: { color: '#67c23a' } },
      { value: 1523, name: '省级管理员', itemStyle: { color: '#e6a23c' } },
      { value: 1856, name: '市级管理员', itemStyle: { color: '#f56c6c' } },
      { value: 2103, name: '区县级管理员', itemStyle: { color: '#909399' } },
      { value: 856, name: '系统管理员', itemStyle: { color: '#9c27b0' } }
    ] }]
})

const roleRadarChartOption = ref({
  tooltip: {},
  legend: { data: ['系统管理员', '省级管理员', '市级管理员', '区县级管理员', '审批人员', '经办人员'], bottom: 0 },
  radar: {
    indicator: [
      { name: '办件量', max: 100 },
      { name: '及时率', max: 100 },
      { name: '准确率', max: 100 },
      { name: '满意度', max: 100 },
      { name: '响应速度', max: 100 },
      { name: '工作时长', max: 100 }
    ]
  },
  series: [{
    type: 'radar',
    data: [
      { value: [85, 98, 95, 92, 88, 90], name: '系统管理员', itemStyle: { color: '#9c27b0' }, areaStyle: { opacity: 0.3 } },
      { value: [90, 95, 92, 94, 85, 92], name: '省级管理员', itemStyle: { color: '#e6a23c' }, areaStyle: { opacity: 0.3 } },
      { value: [88, 93, 90, 91, 82, 88], name: '市级管理员', itemStyle: { color: '#f56c6c' }, areaStyle: { opacity: 0.3 } },
      { value: [92, 90, 88, 89, 80, 85], name: '区县级管理员', itemStyle: { color: '#909399' }, areaStyle: { opacity: 0.3 } },
      { value: [95, 96, 94, 93, 90, 86], name: '审批人员', itemStyle: { color: '#1e88e5' }, areaStyle: { opacity: 0.3 } },
      { value: [98, 92, 91, 90, 92, 95], name: '经办人员', itemStyle: { color: '#67c23a' }, areaStyle: { opacity: 0.3 } }
    ]
  }]
})

const alertTypeChartOption = ref({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', right: '5%', top: 'center', itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12 } },
  series: [{ type: 'pie', radius: ['45%', '75%'], center: ['35%', '50%'], itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
    label: { show: false }, emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    data: [
      { value: 23, name: '超期预警', itemStyle: { color: '#f56c6c' } },
      { value: 8, name: '差评预警', itemStyle: { color: '#e6a23c' } },
      { value: 15, name: '材料缺失', itemStyle: { color: '#f0a020' } },
      { value: 5, name: '流程异常', itemStyle: { color: '#909399' } }
    ] }]
})

const alertTrendChartOption = ref({
  tooltip: { trigger: 'axis' },
  legend: { data: ['超期预警', '差评预警', '材料缺失', '流程异常'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
  xAxis: { type: 'category', data: Array.from({ length: 30 }, (_, i) => `${i + 1}日`) },
  yAxis: { type: 'value' },
  series: [
    { name: '超期预警', type: 'line', data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 3) + 1), itemStyle: { color: '#f56c6c' } },
    { name: '差评预警', type: 'line', data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 2)), itemStyle: { color: '#e6a23c' } },
    { name: '材料缺失', type: 'line', data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 2) + 1), itemStyle: { color: '#f0a020' } },
    { name: '流程异常', type: 'line', data: Array.from({ length: 30 }, () => Math.floor(Math.random() * 2)), itemStyle: { color: '#909399' } }
  ]
})

const auditTypeChartOption = ref({
  tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
  legend: { orient: 'vertical', right: '5%', top: 'center', itemWidth: 12, itemHeight: 12, textStyle: { fontSize: 12 } },
  series: [{ type: 'pie', radius: ['45%', '75%'], center: ['35%', '50%'], itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
    label: { show: false }, emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    data: [
      { value: 1256, name: '登录', itemStyle: { color: '#1e88e5' } },
      { value: 3520, name: '查询', itemStyle: { color: '#67c23a' } },
      { value: 856, name: '新增', itemStyle: { color: '#e6a23c' } },
      { value: 923, name: '修改', itemStyle: { color: '#f56c6c' } },
      { value: 156, name: '删除', itemStyle: { color: '#909399' } },
      { value: 625, name: '审批', itemStyle: { color: '#9c27b0' } },
      { value: 230, name: '导出', itemStyle: { color: '#00bcd4' } }
    ] }]
})

const auditRoleTrendChartOption = ref({
  tooltip: { trigger: 'axis' },
  legend: { data: ['系统管理员', '省级管理员', '市级管理员', '审批人员', '经办人员'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value' },
  series: [
    { name: '系统管理员', type: 'bar', data: [120, 132, 101, 134, 90, 230, 210], itemStyle: { color: '#9c27b0' } },
    { name: '省级管理员', type: 'bar', data: [220, 182, 191, 234, 290, 330, 310], itemStyle: { color: '#e6a23c' } },
    { name: '市级管理员', type: 'bar', data: [150, 232, 201, 154, 190, 330, 410], itemStyle: { color: '#f56c6c' } },
    { name: '审批人员', type: 'bar', data: [320, 332, 301, 334, 390, 330, 320], itemStyle: { color: '#1e88e5' } },
    { name: '经办人员', type: 'bar', data: [820, 932, 901, 934, 1290, 1330, 1320], itemStyle: { color: '#67c23a' } }
  ]
})

const getRankClass = (index) => {
  if (index === 0) return 'rank-first'
  if (index === 1) return 'rank-second'
  if (index === 2) return 'rank-third'
  return ''
}

const getAlertTypeTag = (type) => {
  const types = { overdue: 'danger', negative: 'warning', material: 'warning', flow: 'info' }
  return types[type] || 'info'
}

const getAlertTypeText = (type) => {
  const texts = { overdue: '超期预警', negative: '差评预警', material: '材料缺失', flow: '流程异常' }
  return texts[type] || type
}

const getAuditTypeTag = (type) => {
  const types = { login: 'primary', query: 'info', create: 'success', update: 'warning', delete: 'danger', approve: 'primary', export: 'info' }
  return types[type] || 'info'
}

const handleTabChange = (tab) => {
  if (tab === 'region') {
    fetchRegionData()
    fetchCountyRank()
  } else if (tab === 'service') {
    fetchServiceData()
  } else if (tab === 'role') {
    fetchRoleData()
  } else if (tab === 'alert') {
    fetchAlertData()
  } else if (tab === 'audit') {
    fetchAuditLogs()
  }
}

const handleViewAlert = (row) => {
  ElMessage.info(`处理预警：${row.title}`)
}

const fetchDepartments = async () => {
  try {
    const res = await departmentApi.list()
    if (res.code === 200) {
      departments.value = res.data?.list || res.data || []
    }
  } catch (e) {
    departments.value = [
      { id: 1, name: '市场监督管理局' },
      { id: 2, name: '人力资源和社会保障厅' },
      { id: 3, name: '公安厅' },
      { id: 4, name: '自然资源厅' },
      { id: 5, name: '住房和城乡建设厅' }
    ]
  }
}

const fetchRegionTree = async () => {
  try {
    const res = await regionApi.tree()
    if (res.code === 200) {
      regionTree.value = res.data || []
    }
  } catch (e) {
    regionTree.value = [
      { id: 1, name: '四川省', children: [{ id: 11, name: '成都市' }, { id: 12, name: '绵阳市' }, { id: 13, name: '德阳市' }] }
    ]
  }
}

const fetchSummaryData = async () => {
  try {
    const res = await statisticsApi.overview()
    if (res.code === 200 && res.data) {
      const data = res.data
      summaryData.value = {
        totalApplications: data.total_applications || 12586,
        totalGrowth: data.total_growth || 12.5,
        completionRate: data.completion_rate || 94.2,
        completionGrowth: data.completion_growth || 2.1,
        avgDuration: data.avg_duration || 3.5,
        durationReduction: data.duration_reduction || 15.3,
        satisfaction: data.satisfaction || 96.8,
        satisfactionGrowth: data.satisfaction_growth || 1.2
      }
    }
  } catch (e) {}
}

const fetchTrendData = async () => {
  try {
    const res = await statisticsApi.trend({ period: trendPeriod.value, ...filterForm })
    if (res.code === 200 && res.data) {
      const data = res.data
      trendChartOption.value.xAxis.data = data.dates
      trendChartOption.value.series[0].data = data.applications
      trendChartOption.value.series[1].data = data.completed
    }
  } catch (e) {
    const mockDates = trendPeriod.value === 'week' ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      : trendPeriod.value === 'month' ? Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
      : Array.from({ length: 12 }, (_, i) => `${i + 1}月`)
    trendChartOption.value.xAxis.data = mockDates
    trendChartOption.value.series[0].data = mockDates.map(() => Math.floor(Math.random() * 200) + 100)
    trendChartOption.value.series[1].data = mockDates.map(() => Math.floor(Math.random() * 180) + 80)
  }
}

const fetchByServiceData = async () => {
  try {
    const res = await statisticsApi.byService(filterForm)
    if (res.code === 200 && res.data) {
      const data = res.data
      hotServices.value = data.hot || mockHotServices
    }
  } catch (e) {
    hotServices.value = mockHotServices
  }
}

const fetchByRegionData = async () => {
  try {
    const res = await statisticsApi.byRegion(filterForm)
    if (res.code === 200 && res.data) {
      const data = res.data
      deptChartOption.value.yAxis.data = data.depts.map(d => d.name)
      deptChartOption.value.series[0].data = data.depts.map(d => d.value)
    }
  } catch (e) {
    const mockDepts = [{ name: '市场监管局', value: 486 }, { name: '人社厅', value: 382 }, { name: '公安厅', value: 298 }, { name: '自然资源厅', value: 245 }, { name: '住建厅', value: 198 }]
    deptChartOption.value.yAxis.data = mockDepts.map(d => d.name)
    deptChartOption.value.series[0].data = mockDepts.map(d => d.value)
  }
}

const fetchRegionData = async () => {}

const fetchCountyRank = async () => {
  countyRank.value = mockCountyRank
}

const fetchServiceData = async () => {
  serviceEfficiency.value = mockServiceEfficiency
}

const fetchRoleData = async () => {
  staffRank.value = mockStaffRank
}

const fetchAlertData = async () => {
  try {
    const res = await alertApi.list({ page: 1, pageSize: 100 })
    if (res.code === 200 && res.data) {
      alertList.value = res.data?.list || res.data || mockAlertList
    } else {
      alertList.value = mockAlertList
    }
  } catch (e) {
    alertList.value = mockAlertList
  }
}

const fetchAuditLogs = async () => {
  try {
    const res = await auditLogApi.list({ ...auditFilter, page: auditPagination.page, pageSize: auditPagination.pageSize })
    if (res.code === 200 && res.data) {
      auditLogs.value = res.data?.list || res.data || mockAuditLogs
      auditPagination.total = res.data?.total || mockAuditLogs.length
    } else {
      auditLogs.value = mockAuditLogs
      auditPagination.total = mockAuditLogs.length
    }
  } catch (e) {
    auditLogs.value = mockAuditLogs
    auditPagination.total = mockAuditLogs.length
  }
}

const fetchAllData = () => {
  loading.value = true
  Promise.all([
    fetchSummaryData(),
    fetchTrendData(),
    fetchByServiceData(),
    fetchByRegionData()
  ]).finally(() => {
    loading.value = false
  })
}

const resetFilter = () => {
  filterForm.dateRange = []
  filterForm.departmentId = ''
  filterForm.regionId = ''
  fetchAllData()
}

const exportData = () => {
  ElMessage.success('正在生成导出文件...')
}

const mockHotServices = [
  { id: 1, name: '个体工商户营业执照办理', department: '市场监督管理局', region: '四川省', count: 856, avgDuration: 1.5, satisfaction: 4.9 },
  { id: 2, name: '社保卡申领', department: '人力资源和社会保障厅', region: '成都市', count: 723, avgDuration: 3.2, satisfaction: 4.7 },
  { id: 3, name: '身份证补办', department: '公安厅', region: '四川省', count: 658, avgDuration: 5.0, satisfaction: 4.5 },
  { id: 4, name: '不动产权证办理', department: '自然资源厅', region: '绵阳市', count: 542, avgDuration: 7.5, satisfaction: 4.6 },
  { id: 5, name: '驾驶证换证', department: '公安厅', region: '德阳市', count: 486, avgDuration: 2.0, satisfaction: 4.8 },
  { id: 6, name: '公积金提取', department: '住房和城乡建设厅', region: '成都市', count: 428, avgDuration: 1.0, satisfaction: 4.9 },
  { id: 7, name: '养老保险缴纳', department: '人力资源和社会保障厅', region: '宜宾市', count: 395, avgDuration: 0.5, satisfaction: 4.7 },
  { id: 8, name: '医保报销', department: '医疗保障局', region: '南充市', count: 362, avgDuration: 10.0, satisfaction: 4.3 },
  { id: 9, name: '企业注册登记', department: '市场监督管理局', region: '四川省', count: 328, avgDuration: 2.5, satisfaction: 4.6 },
  { id: 10, name: '税务登记', department: '税务局', region: '泸州市', count: 296, avgDuration: 1.0, satisfaction: 4.8 }
]

const mockCountyRank = [
  { name: '武侯区', city_name: '成都市', total_count: 1256, completed_count: 1198, completion_rate: 95.4, avg_duration: 2.1, satisfaction: 97.2 },
  { name: '锦江区', city_name: '成都市', total_count: 1123, completed_count: 1085, completion_rate: 96.6, avg_duration: 1.8, satisfaction: 96.8 },
  { name: '青羊区', city_name: '成都市', total_count: 986, completed_count: 935, completion_rate: 94.8, avg_duration: 2.3, satisfaction: 95.6 },
  { name: '高新区', city_name: '成都市', total_count: 956, completed_count: 912, completion_rate: 95.4, avg_duration: 1.5, satisfaction: 98.2 },
  { name: '金牛区', city_name: '成都市', total_count: 878, completed_count: 832, completion_rate: 94.8, avg_duration: 2.5, satisfaction: 94.8 },
  { name: '成华区', city_name: '成都市', total_count: 765, completed_count: 723, completion_rate: 94.5, avg_duration: 2.2, satisfaction: 95.2 },
  { name: '龙泉驿区', city_name: '成都市', total_count: 658, completed_count: 612, completion_rate: 93.0, avg_duration: 3.1, satisfaction: 94.5 },
  { name: '双流区', city_name: '成都市', total_count: 589, completed_count: 556, completion_rate: 94.4, avg_duration: 2.8, satisfaction: 95.8 },
  { name: '新都区', city_name: '成都市', total_count: 523, completed_count: 489, completion_rate: 93.5, avg_duration: 3.0, satisfaction: 94.2 },
  { name: '郫都区', city_name: '成都市', total_count: 456, completed_count: 423, completion_rate: 92.8, avg_duration: 3.2, satisfaction: 93.8 }
]

const mockServiceEfficiency = [
  { name: '个体工商户营业执照办理', department: '市场监督管理局', region_level: 'county', total_count: 856, avg_duration: 1.5, promised_duration: 3, timely_rate: 99.2, satisfaction: 98 },
  { name: '公积金提取', department: '住房和城乡建设厅', region_level: 'city', total_count: 428, avg_duration: 1.0, promised_duration: 3, timely_rate: 99.8, satisfaction: 98 },
  { name: '社保卡申领', department: '人力资源和社会保障厅', region_level: 'county', total_count: 723, avg_duration: 3.2, promised_duration: 5, timely_rate: 96.5, satisfaction: 94 },
  { name: '身份证补办', department: '公安厅', region_level: 'province', total_count: 658, avg_duration: 5.0, promised_duration: 7, timely_rate: 92.3, satisfaction: 90 },
  { name: '不动产权证办理', department: '自然资源厅', region_level: 'city', total_count: 542, avg_duration: 7.5, promised_duration: 15, timely_rate: 88.6, satisfaction: 92 },
  { name: '医保报销', department: '医疗保障局', region_level: 'county', total_count: 362, avg_duration: 10.0, promised_duration: 15, timely_rate: 85.2, satisfaction: 86 },
  { name: '企业注册登记', department: '市场监督管理局', region_level: 'province', total_count: 328, avg_duration: 2.5, promised_duration: 5, timely_rate: 97.8, satisfaction: 92 },
  { name: '税务登记', department: '税务局', region_level: 'county', total_count: 296, avg_duration: 1.0, promised_duration: 1, timely_rate: 100, satisfaction: 96 }
]

const mockStaffRank = [
  { name: '张三', department: '市场监督管理局', role: '审批人员', region: '成都市武侯区', handled_count: 356, avg_handle_time: 1.2, timely_rate: 99.5, satisfaction: 4.9 },
  { name: '李四', department: '人力资源和社会保障厅', role: '经办人员', region: '四川省', handled_count: 328, avg_handle_time: 0.8, timely_rate: 99.8, satisfaction: 4.8 },
  { name: '王五', department: '公安厅', role: '市级管理员', region: '绵阳市', handled_count: 286, avg_handle_time: 2.1, timely_rate: 98.2, satisfaction: 4.7 },
  { name: '赵六', department: '自然资源厅', role: '审批人员', region: '德阳市', handled_count: 256, avg_handle_time: 3.5, timely_rate: 95.6, satisfaction: 4.5 },
  { name: '钱七', department: '住房和城乡建设厅', role: '经办人员', region: '宜宾市', handled_count: 234, avg_handle_time: 0.5, timely_rate: 99.9, satisfaction: 4.9 },
  { name: '孙八', department: '市场监督管理局', role: '区县级管理员', region: '南充市顺庆区', handled_count: 212, avg_handle_time: 1.8, timely_rate: 97.5, satisfaction: 4.6 },
  { name: '周九', department: '人力资源和社会保障厅', role: '省级管理员', region: '四川省', handled_count: 198, avg_handle_time: 2.5, timely_rate: 96.8, satisfaction: 4.4 },
  { name: '吴十', department: '公安厅', role: '系统管理员', region: '四川省', handled_count: 176, avg_handle_time: 1.0, timely_rate: 99.2, satisfaction: 4.7 }
]

const mockAlertList = [
  { id: 1, alert_time: '2026-06-07 10:30:00', type: 'overdue', level: 'high', title: '办件SC2026060100015即将超期，剩余1天', related_application_no: 'SC2026060100015', handler: '李科员', status: 'pending' },
  { id: 2, alert_time: '2026-06-07 09:15:00', type: 'negative', level: 'high', title: '收到1星差评，用户对办理速度不满', related_application_no: 'SC2026060500008', handler: '张主管', status: 'processing' },
  { id: 3, alert_time: '2026-06-07 08:45:00', type: 'material', level: 'medium', title: '办件缺少关键材料：身份证复印件', related_application_no: 'SC2026060600023', handler: '王窗口', status: 'pending' },
  { id: 4, alert_time: '2026-06-06 17:20:00', type: 'flow', level: 'low', title: '流程跳转异常：从受理直接跳转到办结', related_application_no: 'SC2026060300012', handler: '系统管理员', status: 'resolved' },
  { id: 5, alert_time: '2026-06-06 15:30:00', type: 'overdue', level: 'high', title: '办件SC2026060200008已超期2天', related_application_no: 'SC2026060200008', handler: '刘主任', status: 'processing' },
  { id: 6, alert_time: '2026-06-06 14:10:00', type: 'negative', level: 'medium', title: '收到2星差评，用户反映材料要求不清晰', related_application_no: 'SC2026060400018', handler: '陈科长', status: 'pending' }
]

const mockAuditLogs = [
  { id: 1, operation_time: '2026-06-07 10:35:22', user_name: 'admin', role_name: '系统管理员', department: '省政务服务中心', region: '四川省', operation: 'login', operation_name: '登录', module: '系统', description: '用户登录系统', ip_address: '127.0.0.1', status: 'success' },
  { id: 2, operation_time: '2026-06-07 10:32:15', user_name: '李科员', role_name: '审批人员', department: '市场监督管理局', region: '成都市', operation: 'approve', operation_name: '审批', module: '办件管理', description: '审批办件SC2026060500003', ip_address: '10.0.0.23', status: 'success' },
  { id: 3, operation_time: '2026-06-07 10:28:45', user_name: '王窗口', role_name: '经办人员', department: '人力资源和社会保障厅', region: '四川省', operation: 'update', operation_name: '修改', module: '事项管理', description: '修改服务事项"社保卡申领"办理指南', ip_address: '10.0.0.45', status: 'success' },
  { id: 4, operation_time: '2026-06-07 10:25:10', user_name: '张主管', role_name: '市级管理员', department: '自然资源厅', region: '绵阳市', operation: 'create', operation_name: '新增', module: '事项管理', description: '新增服务事项"不动产权证查询"', ip_address: '10.0.1.12', status: 'success' },
  { id: 5, operation_time: '2026-06-07 10:20:33', user_name: '刘主任', role_name: '省级管理员', department: '公安厅', region: '四川省', operation: 'export', operation_name: '导出', module: '统计分析', description: '导出2026年5月办件统计报表', ip_address: '10.0.0.8', status: 'success' },
  { id: 6, operation_time: '2026-06-07 10:15:08', user_name: '陈科长', role_name: '区县级管理员', department: '医疗保障局', region: '南充市顺庆区', operation: 'query', operation_name: '查询', module: '办件管理', description: '查询医保报销办件列表', ip_address: '10.0.2.56', status: 'success' },
  { id: 7, operation_time: '2026-06-07 10:10:25', user_name: '赵六', role_name: '审批人员', department: '住房和城乡建设厅', region: '德阳市', operation: 'delete', operation_name: '删除', module: '政策管理', description: '删除过期政策文件', ip_address: '10.0.1.34', status: 'success' },
  { id: 8, operation_time: '2026-06-07 10:05:42', user_name: 'user01', role_name: '普通用户', department: '', region: '成都市', operation: 'query', operation_name: '查询', module: '办件查询', description: '查询办件进度', ip_address: '117.136.82.45', status: 'success' }
]

onMounted(() => {
  fetchDepartments()
  fetchRegionTree()
  fetchAllData()
})
</script>

<style lang="scss" scoped>
.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.text-18 {
  font-size: 18px;
}

.filter-card {
  :deep(.el-card__body) {
    padding: 16px 24px;
  }
}

.filter-form {
  margin: 0;
}

.stat-card {
  transition: all 0.3s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-32 {
  font-size: 32px;
}

.text-yellow-600 {
  color: #d4981f;
}

.border-l-4 {
  border-left-width: 4px;
  border-left-style: solid;
}

.border-l-red-500 {
  border-left-color: #f56c6c;
}

.border-l-orange-500 {
  border-left-color: #e6a23c;
}

.border-l-yellow-500 {
  border-left-color: #f0c020;
}

.border-l-purple-500 {
  border-left-color: #9c27b0;
}

.rank-first {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: linear-gradient(135deg, #ffd700, #ffb700);
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
}

.rank-second {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: linear-gradient(135deg, #c0c0c0, #a8a8a8);
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
}

.rank-third {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: linear-gradient(135deg, #cd7f32, #b87333);
  color: #fff;
  border-radius: 50%;
  font-weight: bold;
  font-size: 14px;
}

.statistics-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}
</style>