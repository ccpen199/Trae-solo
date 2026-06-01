<template>
  <div v-if="task">
    <div class="card">
      <h2 class="mb-20">续期任务详情</h2>
      <div class="grid grid-3">
        <div class="form-group">
          <label>保单号</label>
          <div class="form-value">{{ task.policy_no }}</div>
        </div>
        <div class="form-group">
          <label>险种</label>
          <div><span class="tag tag-purple">{{ task.product_type }}</span></div>
        </div>
        <div class="form-group">
          <label>保费金额</label>
          <div class="form-value">¥{{ task.premium_amount?.toLocaleString() }}</div>
        </div>
        <div class="form-group">
          <label>客户姓名</label>
          <div class="form-value">{{ task.customer_name }}</div>
        </div>
        <div class="form-group">
          <label>代理人</label>
          <div class="form-value">{{ task.agent_name }}</div>
        </div>
        <div class="form-group">
          <label>状态</label>
          <div>
            <span class="badge" :class="getTaskBadgeClass(task.status)">
              {{ getTaskLabel(task.status) }}
            </span>
          </div>
        </div>
        <div class="form-group">
          <label>提醒次数</label>
          <div class="form-value">{{ task.reminder_count || 0 }}次</div>
        </div>
        <div class="form-group">
          <label>下次跟进</label>
          <div class="form-value">{{ task.next_follow_up || '-' }}</div>
        </div>
        <div class="form-group">
          <label>客户反馈</label>
          <div class="form-value">{{ task.customer_feedback || '-' }}</div>
        </div>
      </div>
    </div>

    <div class="card mt-20">
      <h3 class="mb-20">操作记录</h3>
      <table class="table">
        <thead>
          <tr>
            <th>时间</th>
            <th>操作类型</th>
            <th>内容</th>
            <th>操作人</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in task.follow_ups || []" :key="record.id">
            <td>{{ record.follow_up_at || record.created_at }}</td>
            <td><span class="tag tag-blue">{{ record.result || '跟进' }}</span></td>
            <td>{{ record.content || '-' }}</td>
            <td>{{ record.follow_up_by || '-' }}</td>
          </tr>
        </tbody>
      </table>
      <div v-if="!task.follow_ups?.length" class="empty-state">
        <div class="empty-state-icon">📝</div>
        <p>暂无操作记录</p>
      </div>
    </div>

    <div class="card mt-20" v-if="task.reassignments?.length">
      <h3 class="mb-20">改派记录</h3>
      <table class="table">
        <thead>
          <tr>
            <th>时间</th>
            <th>原代理人</th>
            <th>新代理人</th>
            <th>改派原因</th>
            <th>操作人</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in task.reassignments || []" :key="record.id">
            <td>{{ record.created_at }}</td>
            <td>{{ record.old_agent_name }}</td>
            <td>{{ record.new_agent_name }}</td>
            <td>{{ record.reason || '-' }}</td>
            <td>{{ record.reassigned_by || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <div v-else class="card">
    <div class="empty-state">
      <div class="empty-state-icon">✅</div>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { tasks } from '../api';
import { useRoute } from 'vue-router';

const route = useRoute();

const task = ref(null);

const loadTask = async () => {
  try {
    const data = await tasks.getDetail(route.params.id);
    task.value = data;
  } catch (error) {
    console.error('加载任务详情失败:', error);
  }
};

const getTaskLabel = (status) => {
  const labels = { pending: '待处理', processing: '处理中', completed: '已完成' };
  return labels[status] || status;
};

const getTaskBadgeClass = (status) => {
  const classes = { pending: 'badge-warning', processing: 'badge-info', completed: 'badge-success' };
  return classes[status] || 'badge-default';
};

onMounted(() => {
  loadTask();
});
</script>

<style scoped>
.mt-20 {
  margin-top: 20px;
}

.form-value {
  font-size: 16px;
  color: #333;
  padding: 8px 0;
}
</style>
