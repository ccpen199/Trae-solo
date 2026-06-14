<template>
  <div>
    <div class="page-header">
      <h2>🏥 建筑企业健康度仪表盘</h2>
      <p style="color: #909399;">实时监控企业经营异常、围标串标行为与黑名单联动</p>
    </div>

    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="card-shadow" shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <p style="color: #909399; margin-bottom: 8px;">监控企业总数</p>
              <p style="font-size: 28px; font-weight: bold; color: #1e3a8a;">{{ overview.stats?.total_enterprises || 0 }}</p>
            </div>
            <el-icon :size="40" color="#1e3a8a"><OfficeBuilding /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="card-shadow" shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <p style="color: #909399; margin-bottom: 8px;">高风险企业</p>
              <p style="font-size: 28px; font-weight: bold; color: #f56c6c;">{{ highRiskCount }}</p>
            </div>
            <el-icon :size="40" color="#f56c6c"><Warning /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="card-shadow" shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <p style="color: #909399; margin-bottom: 8px;">待处理异常</p>
              <p style="font-size: 28px; font-weight: bold; color: #e6a23c;">{{ overview.stats?.pending_abnormalities || 0 }}</p>
            </div>
            <el-icon :size="40" color="#e6a23c"><Bell /></el-icon>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="card-shadow" shadow="hover">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <div>
              <p style="color: #909399; margin-bottom: 8px;">黑名单企业</p>
              <p style="font-size: 28px; font-weight: bold; color: #909399;">{{ overview.stats?.blacklist_count || 0 }}</p>
            </div>
            <el-icon :size="40" color="#909399"><CircleClose /></el-icon>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-card class="card-shadow" style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: bold;">风险等级分布</span>
          </template>
          <div style="height: 300px;">
            <Doughnut :data="riskDistributionData" :options="chartOptions" />
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="card-shadow" style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: bold;">风险趋势（近12个月）</span>
          </template>
          <div style="height: 300px;">
            <Line :data="riskTrendData" :options="lineChartOptions" />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="card-shadow" style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: bold; color: #e6a23c;">⚠️ 经营异常预警</span>
            <el-button type="primary" size="small" style="float: right;" @click="$router.push('/credit')">
              查看全部
            </el-button>
          </template>
          <div style="max-height: 400px; overflow-y: auto;">
            <div v-for="item in abnormalList" :key="item.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer;" @click="showEventDetail('abnormal', item)">
              <div style="font-weight: bold; color: #e6a23c;">{{ item.enterprise_name }}</div>
              <div style="font-size: 12px; color: #606266; margin: 4px 0;">
                [{{ item.abnormal_type }}] {{ item.abnormal_reason }}
              </div>
              <div style="font-size: 12px; color: #909399; display: flex; justify-content: space-between; align-items: center;">
                <span>决定机关：{{ item.decision_authority }} | {{ item.decision_date }}</span>
                <div>
                  <el-tag v-if="item.expiry_status === '即将到期'" type="warning" size="small">
                    倒计时 {{ item.countdown_days }} 天
                  </el-tag>
                  <el-tag v-else-if="item.expiry_status === '已到期'" type="danger" size="small">已到期</el-tag>
                  <el-tag v-else type="success" size="small">{{ item.expiry_status }}</el-tag>
                  <el-tag size="small" style="margin-left: 4px;">{{ item.processing_status }}</el-tag>
                </div>
              </div>
              <div style="font-size: 11px; color: #909399; margin-top: 4px;">
                数据源：{{ item.data_source }} | 更新：{{ formatDate(item.data_updated_at) }}
              </div>
            </div>
            <div v-if="abnormalList.length === 0" style="text-align: center; color: #909399; padding: 40px;">
              暂无经营异常预警
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card-shadow" style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: bold; color: #f56c6c;">🚨 围标串标嫌疑</span>
          </template>
          <div style="max-height: 400px; overflow-y: auto;">
            <div v-for="item in riggingList" :key="item.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer;" @click="showEventDetail('rigging', item)">
              <div style="font-weight: bold;">{{ item.enterprise_name }}</div>
              <div style="font-size: 12px; color: #f56c6c; margin: 4px 0;">
                {{ item.project_name }}
              </div>
              <div style="font-size: 12px; color: #606266;">
                {{ item.suspicion_reason }}
              </div>
              <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <el-tag :type="item.risk_level === '高风险' ? 'danger' : 'warning'">
                    {{ item.risk_level }}
                  </el-tag>
                  <el-tag size="small" style="margin-left: 8px;">{{ item.status }}</el-tag>
                  <el-tag v-if="item.expiry_status === '即将到期'" type="warning" size="small" style="margin-left: 8px;">
                    {{ item.countdown_days }}天后下架
                  </el-tag>
                </div>
              </div>
              <div style="font-size: 11px; color: #909399; margin-top: 4px;">
                数据源：{{ item.data_source }} | 更新：{{ formatDate(item.data_updated_at) }}
              </div>
            </div>
            <div v-if="riggingList.length === 0" style="text-align: center; color: #909399; padding: 40px;">
              暂无围标串标嫌疑
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card-shadow" style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: bold; color: #909399;">🚫 分包商黑名单</span>
          </template>
          <div style="max-height: 400px; overflow-y: auto;">
            <div v-for="item in blacklist" :key="item.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0; cursor: pointer;" @click="showEventDetail('blacklist', item)">
              <div style="font-weight: bold;">{{ item.enterprise_name }}</div>
              <div style="font-size: 12px; color: #606266; margin: 4px 0;">
                {{ item.reason }}
              </div>
              <div style="font-size: 12px; color: #909399;">
                列入日期：{{ item.inclusion_date }} | {{ item.countdown_days }}天后到期
              </div>
              <div style="margin-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                <div>
                  <el-tag type="danger">{{ item.risk_level }}</el-tag>
                  <el-tag v-if="item.expiry_status === '即将到期'" type="warning" size="small" style="margin-left: 8px;">即将到期</el-tag>
                  <el-tag v-else-if="item.expiry_status === '已到期'" type="info" size="small" style="margin-left: 8px;">已到期</el-tag>
                </div>
                <el-button v-if="item.can_apply_repair" type="primary" size="small" @click.stop="applyCreditRepair(item)">
                  信用修复
                </el-button>
              </div>
              <div style="font-size: 11px; color: #909399; margin-top: 4px;">
                数据源：{{ item.data_source }} | 更新：{{ formatDate(item.data_updated_at) }}
              </div>
            </div>
            <div v-if="blacklist.length === 0" style="text-align: center; color: #909399; padding: 40px;">
              暂无黑名单企业
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="card-shadow" style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: bold; color: #f56c6c;">🎯 自定义规则命中</span>
            <el-button type="primary" size="small" style="float: right;" @click="$router.push('/risk-rules')">
              规则配置
            </el-button>
          </template>
          <div style="max-height: 350px; overflow-y: auto;">
            <div v-for="item in ruleHits" :key="item.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-weight: bold; color: #f56c6c;">{{ item.rule_name }}</div>
                <el-tag size="small" :type="item.processing_status === '待处理' ? 'warning' : item.processing_status === '已处理' ? 'success' : 'info'">
                  {{ item.processing_status }}
                </el-tag>
              </div>
              <div style="font-size: 12px; color: #606266; margin: 4px 0;">
                <el-tag size="small" :type="item.rule_level === 'high' ? 'danger' : item.rule_level === 'medium' ? 'warning' : 'info'" style="margin-right: 8px;">
                  {{ item.rule_level_desc || (item.rule_level === 'high' ? '高风险' : item.rule_level === 'medium' ? '中风险' : '低风险') }}
                </el-tag>
                {{ item.enterprise_name || '全企业规则' }}
              </div>
              <div style="font-size: 12px; color: #909399; margin: 4px 0;">
                命中原因：{{ item.trigger_reason || item.hit_reason || '规则条件匹配' }}
              </div>
              <div v-if="item.action_type_desc" style="font-size: 12px; color: #e6a23c; margin: 4px 0;">
                执行动作：{{ item.action_type_desc }}
              </div>
              <div style="font-size: 11px; color: #909399; margin-top: 4px; display: flex; justify-content: space-between;">
                <span>累计命中 {{ item.hit_count }} 次</span>
                <span>命中时间：{{ formatDate(item.hit_time || item.last_hit_at) }}</span>
              </div>
            </div>
            <div v-if="ruleHits.length === 0" style="text-align: center; color: #909399; padding: 40px;">
              暂无规则命中记录
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card-shadow" style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: bold; color: #409eff;">📄 尽调报告状态</span>
            <el-button type="primary" size="small" style="float: right;" @click="$router.push('/reports')">
              全部报告
            </el-button>
          </template>
          <div style="max-height: 350px; overflow-y: auto;">
            <div v-for="item in reports" :key="item.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
              <div style="font-weight: bold;">{{ item.report_name }}</div>
              <div style="font-size: 12px; color: #606266; margin: 4px 0;">
                {{ item.enterprise_name }}
              </div>
              <div style="font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
                <el-tag :type="item.status === '已完成' ? 'success' : item.status === '生成中' ? 'warning' : 'danger'" size="small">
                  {{ item.status }}
                </el-tag>
                <span style="color: #909399;">{{ formatDate(item.created_at) }}</span>
              </div>
            </div>
            <div v-if="reports.length === 0" style="text-align: center; color: #909399; padding: 40px;">
              暂无尽调报告
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card class="card-shadow" style="margin-bottom: 20px;">
          <template #header>
            <span style="font-weight: bold; color: #67c23a;">📂 离线档案与扫码</span>
            <el-button type="primary" size="small" style="float: right;" @click="$router.push('/offline')">
              档案管理
            </el-button>
          </template>
          <div style="max-height: 350px; overflow-y: auto;">
            <div v-for="item in offlineArchives" :key="item.id" style="padding: 12px; border-bottom: 1px solid #f0f0f0;">
              <div style="font-weight: bold;">{{ item.enterprise_name }}</div>
              <div style="font-size: 12px; color: #606266; margin: 4px 0;">
                {{ item.unified_social_credit }}
              </div>
              <div style="font-size: 12px; color: #909399; display: flex; justify-content: space-between; align-items: center;">
                <span>同步时间：{{ formatDate(item.downloaded_at) }}</span>
                <el-button size="small" type="success" @click="showQRCode(item)">
                  扫码调取
                </el-button>
              </div>
            </div>
            <div v-if="offlineArchives.length === 0" style="text-align: center; color: #909399; padding: 40px;">
              暂无离线档案
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="card-shadow">
      <template #header>
        <span style="font-weight: bold;">📊 企业健康度评分排行（可追溯评分来源）</span>
      </template>
      <el-table :data="healthScores" stripe style="width: 100%;">
        <el-table-column prop="name" label="企业名称" min-width="200">
          <template #default="scope">
            <el-link type="primary" @click="$router.push(`/enterprise/${scope.row.enterprise_id}`)">
              {{ scope.row.name }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="unified_social_credit" label="统一社会信用代码" width="200" />
        <el-table-column label="综合评分" width="150">
          <template #default="scope">
            <el-progress
              :percentage="scope.row.total_score"
              :color="getScoreColor(scope.row.total_score)"
              :show-text="true"
            />
          </template>
        </el-table-column>
        <el-table-column prop="risk_level" label="风险等级" width="120">
          <template #default="scope">
            <span :class="`risk-${scope.row.risk_level === '高风险' ? 'high' : scope.row.risk_level === '中风险' ? 'medium' : 'low'}`">
              {{ scope.row.risk_level }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="六维评分（点击追溯来源）" min-width="400">
          <template #default="scope">
            <div style="display: flex; flex-direction: column; gap: 6px;">
              <div style="font-size: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="width: 60px;">工商：</span>
                <el-progress :percentage="scope.row.business_score * 4" :stroke-width="8" :show-text="false" />
                <span>{{ scope.row.business_score }}/25</span>
                <el-button v-if="scope.row.business_score_details" size="small" link type="primary" @click="showScoreTrace('business', scope.row)">
                  追溯
                </el-button>
              </div>
              <div style="font-size: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="width: 60px;">司法：</span>
                <el-progress :percentage="scope.row.judicial_score * 4" :stroke-width="8" :show-text="false" />
                <span>{{ scope.row.judicial_score }}/25</span>
                <el-button v-if="scope.row.judicial_score_details" size="small" link type="primary" @click="showScoreTrace('judicial', scope.row)">
                  追溯
                </el-button>
              </div>
              <div style="font-size: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="width: 60px;">招投标：</span>
                <el-progress :percentage="scope.row.bidding_score / 15 * 100" :stroke-width="8" :show-text="false" />
                <span>{{ scope.row.bidding_score }}/15</span>
              </div>
              <div style="font-size: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="width: 60px;">资质：</span>
                <el-progress :percentage="scope.row.qualification_score / 15 * 100" :stroke-width="8" :show-text="false" color="#67c23a" />
                <span>{{ scope.row.qualification_score }}/15</span>
              </div>
              <div style="font-size: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="width: 60px;">人员：</span>
                <el-progress :percentage="scope.row.personnel_score * 10" :stroke-width="8" :show-text="false" color="#e6a23c" />
                <span>{{ scope.row.personnel_score }}/10</span>
                <el-button v-if="scope.row.personnel_score_details" size="small" link type="primary" @click="showScoreTrace('personnel', scope.row)">
                  追溯
                </el-button>
              </div>
              <div style="font-size: 12px; display: flex; align-items: center; gap: 8px;">
                <span style="width: 60px;">信用：</span>
                <el-progress :percentage="scope.row.credit_score * 10" :stroke-width="8" :show-text="false" color="#909399" />
                <span>{{ scope.row.credit_score }}/10</span>
                <el-button v-if="scope.row.credit_score_details" size="small" link type="primary" @click="showScoreTrace('credit', scope.row)">
                  追溯
                </el-button>
              </div>
              <div style="font-size: 11px; color: #909399; margin-top: 4px; padding-top: 4px; border-top: 1px dashed #e4e7ed;">
                总分验证: {{ (scope.row.business_score||0) + (scope.row.judicial_score||0) + (scope.row.bidding_score||0) + (scope.row.qualification_score||0) + (scope.row.personnel_score||0) + (scope.row.credit_score||0) }} / 100
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="eventDetailVisible" title="风险事件详情" width="600px">
      <div v-if="currentEvent">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="企业名称">{{ currentEvent.enterprise_name }}</el-descriptions-item>
          <el-descriptions-item label="事件类型">
            {{ eventType === 'abnormal' ? currentEvent.abnormal_type : eventType === 'rigging' ? '围标串标嫌疑' : '黑名单记录' }}
          </el-descriptions-item>
          <el-descriptions-item label="事件描述">
            {{ eventType === 'abnormal' ? currentEvent.abnormal_reason : eventType === 'rigging' ? currentEvent.suspicion_reason : currentEvent.reason }}
          </el-descriptions-item>
          <el-descriptions-item label="原始出处URL">
            <el-link :href="currentEvent.source_url" type="primary" target="_blank">
              {{ currentEvent.source_url }}
            </el-link>
          </el-descriptions-item>
          <el-descriptions-item label="数据源">{{ currentEvent.data_source }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(currentEvent.data_updated_at) }}</el-descriptions-item>
          <el-descriptions-item label="展示期限">
            {{ currentEvent.display_deadline }}
            <el-tag v-if="currentEvent.expiry_status === '即将到期'" type="warning" size="small" style="margin-left: 8px;">
              倒计时 {{ currentEvent.countdown_days }} 天
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="到期下架状态">{{ currentEvent.expiry_status }}</el-descriptions-item>
          <el-descriptions-item label="责任处理状态">
            <el-tag :type="currentEvent.processing_status === '已处理' ? 'success' : currentEvent.processing_status === '处理中' ? 'warning' : 'info'">
              {{ currentEvent.processing_status }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="处理结果">{{ currentEvent.processing_result || '待处理' }}</el-descriptions-item>
          <el-descriptions-item label="处理时间">{{ currentEvent.processing_time || '待处理' }}</el-descriptions-item>
          <el-descriptions-item label="复查人">{{ currentEvent.reviewer || '待复查' }}</el-descriptions-item>
          <el-descriptions-item label="复查结果">{{ currentEvent.review_result || '待复查' }}</el-descriptions-item>
          <el-descriptions-item label="复查时间">{{ currentEvent.review_time || '待复查' }}</el-descriptions-item>
        </el-descriptions>
        <div v-if="eventType === 'blacklist' && currentEvent.can_apply_repair" style="margin-top: 20px; text-align: right;">
          <el-button type="primary" @click="applyCreditRepair(currentEvent)">申请信用修复</el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="scoreTraceVisible" title="评分追溯详情" width="600px">
      <div v-if="currentScore">
        <h3 style="margin-bottom: 16px;">{{ currentScore.name }} - {{ scoreTypeText }}评分追溯</h3>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="当前得分">
            {{ currentScore[scoreTypeMap[scoreType]] }} / {{ scoreTypeMax[scoreType] }} 分
          </el-descriptions-item>
        </el-descriptions>
        <el-table :data="currentScoreDetails" style="margin-top: 20px;" border>
          <el-table-column prop="source" label="数据来源" width="150" />
          <el-table-column prop="reason" label="评分原因" />
          <el-table-column prop="deduction" label="扣减分数" width="100">
            <template #default="scope">
              <span style="color: #f56c6c;">-{{ scope.row.deduction }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="record_id" label="记录编号" width="120" />
        </el-table>
        <div style="margin-top: 16px; text-align: right;">
          <el-button type="primary" @click="$router.push(`/enterprise/${currentScore.enterprise_id}`)">
            查看企业档案
          </el-button>
        </div>
      </div>
    </el-dialog>

    <el-dialog v-model="qrCodeVisible" title="移动端扫码调取资质" width="400px">
      <div v-if="currentArchive" style="text-align: center;">
        <div style="margin-bottom: 16px;">
          <h3>{{ currentArchive.enterprise_name }}</h3>
          <p style="color: #909399;">{{ currentArchive.unified_social_credit }}</p>
        </div>
        <div style="width: 250px; height: 250px; margin: 0 auto; border: 1px solid #e4e7ed; display: flex; align-items: center; justify-content: center; background: #fafafa;">
          <div style="text-align: center; color: #909399;">
            <el-icon :size="80"><Picture /></el-icon>
            <p>二维码</p>
          </div>
        </div>
        <p style="margin-top: 16px; color: #606266;">使用移动端APP扫码调取企业资质资料</p>
        <div style="margin-top: 16px;">
          <el-button type="primary" @click="downloadQRCode">下载二维码</el-button>
          <el-button @click="qrCodeVisible = false">关闭</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title } from 'chart.js';
import { Doughnut, Line } from 'vue-chartjs';
import { ElMessage, ElMessageBox } from 'element-plus';
import { dashboardApi } from '@/utils/api';
import { OfficeBuilding, Warning, Bell, CircleClose, Picture } from '@element-plus/icons-vue';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, Title);

const overview = ref({ stats: {}, riskDistribution: [] });
const healthScores = ref([]);
const abnormalList = ref([]);
const riggingList = ref([]);
const blacklist = ref([]);
const riskTrend = ref([]);
const ruleHits = ref([]);
const reports = ref([]);
const offlineArchives = ref([]);

const eventDetailVisible = ref(false);
const eventType = ref('');
const currentEvent = ref(null);

const scoreTraceVisible = ref(false);
const scoreType = ref('');
const currentScore = ref(null);
const currentScoreDetails = ref([]);

const qrCodeVisible = ref(false);
const currentArchive = ref(null);

const scoreTypeMap = {
  business: 'business_score',
  judicial: 'judicial_score',
  personnel: 'personnel_score',
  credit: 'credit_score'
};

const scoreTypeText = {
  business: '工商',
  judicial: '司法',
  personnel: '人员',
  credit: '信用'
};

const scoreTypeMax = {
  business: 25,
  judicial: 25,
  personnel: 10,
  credit: 10
};

const highRiskCount = computed(() => {
  return overview.value.riskDistribution?.find(r => r.risk_level === '高风险')?.count || 0;
});

const riskDistributionData = computed(() => ({
  labels: overview.value.riskDistribution?.map(r => r.risk_level) || [],
  datasets: [{
    data: overview.value.riskDistribution?.map(r => r.count) || [],
    backgroundColor: ['#f56c6c', '#e6a23c', '#67c23a']
  }]
}));

const riskTrendData = computed(() => ({
  labels: riskTrend.value.map(r => r.month?.slice(0, 7) || ''),
  datasets: [
    {
      label: '高风险',
      data: riskTrend.value.map(r => r.high_risk_count || 0),
      borderColor: '#f56c6c',
      backgroundColor: 'rgba(245, 108, 108, 0.1)',
      tension: 0.4
    },
    {
      label: '中风险',
      data: riskTrend.value.map(r => r.medium_risk_count || 0),
      borderColor: '#e6a23c',
      backgroundColor: 'rgba(230, 162, 60, 0.1)',
      tension: 0.4
    },
    {
      label: '低风险',
      data: riskTrend.value.map(r => r.low_risk_count || 0),
      borderColor: '#67c23a',
      backgroundColor: 'rgba(103, 194, 58, 0.1)',
      tension: 0.4
    }
  ]
}));

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } }
};

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom' } },
  scales: { y: { beginAtZero: true } }
};

const getScoreColor = (score) => {
  if (score >= 80) return '#67c23a';
  if (score >= 60) return '#e6a23c';
  return '#f56c6c';
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
};

const showEventDetail = (type, item) => {
  eventType.value = type;
  currentEvent.value = item;
  eventDetailVisible.value = true;
};

const showScoreTrace = (type, row) => {
  scoreType.value = type;
  currentScore.value = row;
  const detailKey = `${type}_score_details`;
  currentScoreDetails.value = row[detailKey] || [];
  scoreTraceVisible.value = true;
};

const showQRCode = (item) => {
  currentArchive.value = item;
  qrCodeVisible.value = true;
};

const applyCreditRepair = async (item) => {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入信用修复说明：',
      '信用修复申请',
      {
        confirmButtonText: '提交申请',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputValidator: (value) => {
          if (!value || value.trim().length < 10) {
            return '请输入至少10个字符的修复说明';
          }
          return true;
        }
      }
    );
    ElMessage.success('信用修复申请已提交，请等待人工复核');
    eventDetailVisible.value = false;
  } catch (e) {
    if (e !== 'cancel') {
      console.error('申请失败:', e);
    }
  }
};

const downloadQRCode = () => {
  ElMessage.success('二维码下载功能已触发');
};

const loadData = async () => {
  try {
    const [overviewData, scoresData, abnormalData, riggingData, blacklistData, trendData, hitsData, reportsData, archivesData] = await Promise.all([
      dashboardApi.overview(),
      dashboardApi.healthScores({ pageSize: 10 }),
      dashboardApi.abnormalAlerts({ pageSize: 5 }),
      dashboardApi.bidRigging({ pageSize: 5 }),
      dashboardApi.blacklist({ pageSize: 5 }),
      dashboardApi.riskTrend(),
      dashboardApi.riskRuleHits({ pageSize: 5 }),
      dashboardApi.dueDiligenceStatus(),
      dashboardApi.offlineArchivesStatus()
    ]);
    
    overview.value = overviewData;
    healthScores.value = scoresData.list;
    abnormalList.value = abnormalData.list;
    riggingList.value = riggingData.list;
    blacklist.value = blacklistData.list;
    riskTrend.value = trendData;
    ruleHits.value = hitsData.list || [];
    reports.value = reportsData || [];
    offlineArchives.value = archivesData || [];
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
    ElMessage.error('加载仪表盘数据失败');
  }
};

onMounted(loadData);
</script>

<style scoped>
.card-shadow {
  transition: all 0.3s ease;
}
.card-shadow:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.risk-high { color: #f56c6c; font-weight: bold; }
.risk-medium { color: #e6a23c; font-weight: bold; }
.risk-low { color: #67c23a; font-weight: bold; }
</style>
