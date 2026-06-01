<template>
  <div>
    <div class="tabs">
      <button :class="{ active: activeTab === 'packages' }" @click="activeTab = 'packages'">课包管理</button>
      <button :class="{ active: activeTab === 'teachers' }" @click="activeTab = 'teachers'">教师管理</button>
      <button :class="{ active: activeTab === 'classrooms' }" @click="activeTab = 'classrooms'">教室管理</button>
      <button :class="{ active: activeTab === 'classes' }" @click="activeTab = 'classes'">班级管理</button>
    </div>

    <div v-if="activeTab === 'packages'" class="layout">
      <div class="panel">
        <div class="panel-head">
          <h2>课包列表</h2>
          <span>{{ packages?.length || 0 }} 个</span>
        </div>
        <div class="table-wrap">
          <table v-if="packages && packages.length">
            <thead>
              <tr>
                <th>课包名称</th>
                <th>总课时</th>
                <th>赠课时</th>
                <th>原价</th>
                <th>折扣</th>
                <th>折后价</th>
                <th>单价</th>
                <th>有效期</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in packages" :key="p.id">
                <td><strong>{{ p.name }}</strong></td>
                <td>{{ p.total_hours }}</td>
                <td>{{ p.gift_hours || 0 }}</td>
                <td>{{ currency(p.price || 0) }}</td>
                <td>{{ p.discount ? (p.discount * 10).toFixed(1) + '折' : '无' }}</td>
                <td class="hours">{{ currency(p.price * (p.discount || 1) || 0) }}</td>
                <td>{{ currency(Math.round(p.price / p.total_hours * 100) / 100) }}</td>
                <td>{{ p.valid_months || 12 }}个月</td>
                <td><span :class="['badge', p.status]">{{ p.status === 'active' ? '启用' : '停用' }}</span></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">暂无课包</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>新增课包</h2>
        </div>
        <div class="form-stack">
          <div class="form-group">
            <label>课包名称 *</label>
            <input v-model="packageForm.name" type="text" placeholder="例如：30课时基础包" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>总课时 *</label>
              <input v-model.number="packageForm.total_hours" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>赠课时</label>
              <input v-model.number="packageForm.gift_hours" type="number" min="0" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>原价（元）*</label>
              <input v-model.number="packageForm.price" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>折扣（0-1）</label>
              <input v-model.number="packageForm.discount" type="number" min="0" max="1" step="0.01" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>有效期（月）</label>
              <input v-model.number="packageForm.valid_months" type="number" min="1" />
            </div>
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea v-model="packageForm.description" rows="2" placeholder="课包描述"></textarea>
          </div>
          <button class="btn-primary" @click="submitPackage">新增课包</button>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'teachers'" class="layout">
      <div class="panel">
        <div class="panel-head">
          <h2>教师列表</h2>
          <span>{{ teachers?.length || 0 }} 人</span>
        </div>
        <div class="table-wrap">
          <table v-if="teachers && teachers.length">
            <thead>
              <tr>
                <th>姓名</th>
                <th>联系电话</th>
                <th>教授学科</th>
                <th>课时单价</th>
                <th>授课班级</th>
                <th>近期排课</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in teachers" :key="t.id">
                <td><strong>{{ t.name }}</strong></td>
                <td>{{ t.phone || '-' }}</td>
                <td>{{ t.subject || '-' }}</td>
                <td>{{ currency(t.hourly_rate || 0) }}/课时</td>
                <td>{{ t.class_count || 0 }}</td>
                <td>{{ t.upcoming_lessons || 0 }}</td>
                <td><span :class="['badge', t.status]">{{ t.status === 'active' ? '在职' : '离职' }}</span></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">暂无教师</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>新增教师</h2>
        </div>
        <div class="form-stack">
          <div class="form-group">
            <label>姓名 *</label>
            <input v-model="teacherForm.name" type="text" placeholder="教师姓名" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>联系电话</label>
              <input v-model="teacherForm.phone" type="tel" placeholder="手机号" />
            </div>
            <div class="form-group">
              <label>教授学科</label>
              <input v-model="teacherForm.subject" type="text" placeholder="例如：数学" />
            </div>
          </div>
          <div class="form-group">
            <label>课时单价（元）</label>
            <input v-model.number="teacherForm.hourly_rate" type="number" min="0" step="0.01" />
          </div>
          <button class="btn-primary" @click="submitTeacher">新增教师</button>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'classrooms'" class="layout">
      <div class="panel">
        <div class="panel-head">
          <h2>教室列表</h2>
          <span>{{ classrooms?.length || 0 }} 间</span>
        </div>
        <div class="table-wrap">
          <table v-if="classrooms && classrooms.length">
            <thead>
              <tr>
                <th>教室名称</th>
                <th>容量</th>
                <th>位置</th>
                <th>设备</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in classrooms" :key="r.id">
                <td><strong>{{ r.name }}</strong></td>
                <td>{{ r.capacity }}人</td>
                <td>{{ r.location || '-' }}</td>
                <td>{{ r.equipment || '-' }}</td>
                <td><span :class="['badge', r.status]">{{ r.status === 'active' ? '可用' : '停用' }}</span></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">暂无教室</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>新增教室</h2>
        </div>
        <div class="form-stack">
          <div class="form-group">
            <label>教室名称 *</label>
            <input v-model="classroomForm.name" type="text" placeholder="例如：A101" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>容量（人）</label>
              <input v-model.number="classroomForm.capacity" type="number" min="1" />
            </div>
            <div class="form-group">
              <label>位置</label>
              <input v-model="classroomForm.location" type="text" placeholder="例如：一层东区" />
            </div>
          </div>
          <div class="form-group">
            <label>设备</label>
            <textarea v-model="classroomForm.equipment" rows="2" placeholder="例如：投影仪、白板"></textarea>
          </div>
          <button class="btn-primary" @click="submitClassroom">新增教室</button>
        </div>
      </div>
    </div>

    <div v-if="activeTab === 'classes'" class="layout">
      <div class="panel">
        <div class="panel-head">
          <h2>班级列表</h2>
          <span>{{ classes?.length || 0 }} 个</span>
        </div>
        <div class="table-wrap">
          <table v-if="classes && classes.length">
            <thead>
              <tr>
                <th>班级名称</th>
                <th>学科</th>
                <th>授课教师</th>
                <th>上课教室</th>
                <th>容量</th>
                <th>已报名</th>
                <th>上课时间</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="c in classes" :key="c.id">
                <td><strong>{{ c.name }}</strong></td>
                <td>{{ c.subject || '-' }}</td>
                <td>{{ c.teacher_name || '-' }}</td>
                <td>{{ c.classroom_name || '-' }}</td>
                <td>{{ c.capacity }}人</td>
                <td><span class="badge">{{ c.enrolled_count || 0 }}/{{ c.capacity }}</span></td>
                <td>{{ c.schedule || '-' }}</td>
                <td><span :class="['badge', c.status]">{{ c.status === 'active' ? '进行中' : '已结课' }}</span></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty">暂无班级</div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>新增班级</h2>
        </div>
        <div class="form-stack">
          <div class="form-group">
            <label>班级名称 *</label>
            <input v-model="classForm.name" type="text" placeholder="例如：六年级数学A班" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>学科</label>
              <input v-model="classForm.subject" type="text" placeholder="例如：数学" />
            </div>
            <div class="form-group">
              <label>容量（人）</label>
              <input v-model.number="classForm.capacity" type="number" min="1" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>授课教师</label>
              <select v-model="classForm.teacher_id">
                <option :value="null">请选择</option>
                <option v-for="t in teachers" :key="t.id" :value="t.id">
                  {{ t.name }} ({{ t.subject }})
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>上课教室</label>
              <select v-model="classForm.classroom_id">
                <option :value="null">请选择</option>
                <option v-for="r in classrooms" :key="r.id" :value="r.id">
                  {{ r.name }} ({{ r.capacity }}人)
                </option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>开课日期</label>
              <input v-model="classForm.start_date" type="date" />
            </div>
            <div class="form-group">
              <label>结课日期</label>
              <input v-model="classForm.end_date" type="date" />
            </div>
          </div>
          <div class="form-group">
            <label>上课时间</label>
            <input v-model="classForm.schedule" type="text" placeholder="例如：周二/周四 18:30-20:00" />
          </div>
          <button class="btn-primary" @click="submitClass">新增班级</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const props = defineProps({
  packages: { type: Array, default: () => [] },
  teachers: { type: Array, default: () => [] },
  classrooms: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
  currency: { type: Function, required: true }
});

const emit = defineEmits(['add-package', 'add-teacher', 'add-classroom', 'add-class']);

const activeTab = ref('packages');

const packageForm = reactive({
  name: '', total_hours: 0, gift_hours: 0, price: 0, discount: 1, valid_months: 12, description: ''
});

const teacherForm = reactive({
  name: '', phone: '', subject: '', hourly_rate: 0
});

const classroomForm = reactive({
  name: '', capacity: 10, location: '', equipment: ''
});

const classForm = reactive({
  name: '', subject: '', teacher_id: null, classroom_id: null, capacity: 10,
  start_date: '', end_date: '', schedule: ''
});

async function submitPackage() {
  if (!packageForm.name || !packageForm.total_hours || !packageForm.price) {
    alert('请填写必填项');
    return;
  }
  try {
    await emit('add-package', { ...packageForm });
    Object.assign(packageForm, { name: '', total_hours: 0, gift_hours: 0, price: 0, discount: 1, valid_months: 12, description: '' });
  } catch (e) {
    alert(e.message || '新增失败');
  }
}

async function submitTeacher() {
  if (!teacherForm.name) {
    alert('请填写姓名');
    return;
  }
  try {
    await emit('add-teacher', { ...teacherForm });
    Object.assign(teacherForm, { name: '', phone: '', subject: '', hourly_rate: 0 });
  } catch (e) {
    alert(e.message || '新增失败');
  }
}

async function submitClassroom() {
  if (!classroomForm.name) {
    alert('请填写教室名称');
    return;
  }
  try {
    await emit('add-classroom', { ...classroomForm });
    Object.assign(classroomForm, { name: '', capacity: 10, location: '', equipment: '' });
  } catch (e) {
    alert(e.message || '新增失败');
  }
}

async function submitClass() {
  if (!classForm.name) {
    alert('请填写班级名称');
    return;
  }
  try {
    await emit('add-class', { ...classForm });
    Object.assign(classForm, { name: '', subject: '', teacher_id: null, classroom_id: null, capacity: 10, start_date: '', end_date: '', schedule: '' });
  } catch (e) {
    alert(e.message || '新增失败');
  }
}
</script>

<style scoped>
.tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  border-bottom: 2px solid #edf1f5;
}
.tabs button {
  background: none;
  border: none;
  padding: 12px 20px;
  cursor: pointer;
  font-weight: 600;
  color: #687789;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
}
.tabs button.active {
  color: #1677ff;
  border-bottom-color: #1677ff;
}
.form-stack { display: grid; gap: 12px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.form-group { display: grid; gap: 6px; }
.form-group label { font-size: 13px; color: #657789; font-weight: 600; }
.form-group input, .form-group select, .form-group textarea {
  padding: 9px 12px; border: 1px solid #dce3ea; border-radius: 6px; font-size: 14px; background: white;
}
.form-group input:focus, .form-group select:focus, .form-group textarea:focus {
  outline: none; border-color: #1677ff;
}
.btn-primary {
  margin-top: 8px; padding: 11px 16px; background: #1677ff; color: white;
  border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 14px;
}
.btn-primary:hover { background: #0958d9; }
.hours { color: #1677ff; font-weight: 800; }
</style>
