import router from './router'
import { useUserStore } from './store/user'
import { ElMessage } from 'element-plus'
import NProgress from 'nprogress'

const whiteList = ['/login', '/404']

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()
  const token = userStore.token

  if (token) {
    if (to.path === '/login') {
      next('/dashboard')
      NProgress.done()
    } else {
      if (!userStore.userInfo) {
        try {
          await userStore.fetchUserInfo()
        } catch (err) {
          await userStore.logout()
          ElMessage.error('登录状态失效，请重新登录')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
          return
        }
      }
      next()
    }
  } else {
    if (whiteList.includes(to.path) || to.meta.noAuth) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})
