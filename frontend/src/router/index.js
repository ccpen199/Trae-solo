import { createRouter, createWebHistory } from "vue-router"

const routes = [
  { path: "/", name: "Home", component: () => import("../views/Home.vue") },
  { path: "/patient-order", name: "PatientOrder", component: () => import("../views/PatientOrder.vue") },
  { path: "/escort-list", name: "EscortList", component: () => import("../views/EscortList.vue") },
  { path: "/order-list", name: "OrderList", component: () => import("../views/OrderList.vue") },
  { path: "/service-record", name: "ServiceRecord", component: () => import("../views/ServiceRecord.vue") },
  { path: "/settlement", name: "Settlement", component: () => import("../views/Settlement.vue") },
  { path: "/admin", name: "Admin", component: () => import("../views/Admin.vue") }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
