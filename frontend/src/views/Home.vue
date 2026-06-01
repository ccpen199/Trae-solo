<template>
  <div class="home">
    <el-row :gutter="20">
      <el-col :span="8" v-for="item in menuList" :key="item.path">
        <el-card class="menu-card" shadow="hover" @click="goToPage(item.path)">
          <div class="card-content">
            <el-icon :size="50" :color="item.color">
              <component :is="item.icon" />
            </el-icon>
            <div class="card-title">{{ item.title }}</div>
            <div class="card-desc">{{ item.desc }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { Calendar, User, List, Document, Money, Setting } from '@element-plus/icons-vue'

const router = useRouter()

const menuList = [
  {
    title: '患者预约',
    desc: '在线提交陪诊预约申请',
    icon: Calendar,
    path: '/patient-order',
    color: '#409EFF'
  },
  {
    title: '陪诊师列表',
    desc: '查看陪诊师资质与评价',
    icon: User,
    path: '/escort-list',
    color: '#67C23A'
  },
  {
    title: '订单管理',
    desc: '订单派单与改派处理',
    icon: List,
    path: '/order-list',
    color: '#E6A23C'
  },
  {
    title: '服务记录',
    desc: '服务过程节点记录',
    icon: Document,
    path: '/service-record',
    color: '#909399'
  },
  {
    title: '费用结算',
    desc: '费用核算与分账管理',
    icon: Money,
    path: '/settlement',
    color: '#F56C6C'
  },
  {
    title: '管理后台',
    desc: '系统运营数据管理',
    icon: Setting,
    path: '/admin',
    color: '#409EFF'
  }
]

const goToPage = (path) => {
  router.push(path)
}
</script>

<style scoped>
.home {
  padding: 40px;
}

.menu-card {
  margin-bottom: 20px;
  cursor: pointer;
  transition: transform 0.3s;
}

.menu-card:hover {
  transform: translateY(-5px);
}

.card-content {
  text-align: center;
  padding: 20px 0;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  margin-top: 15px;
  margin-bottom: 10px;
  color: #303133;
}

.card-desc {
  font-size: 14px;
  color: #909399;
}
</style>
