import type { App } from 'vue'
import * as Icons from '@element-plus/icons-vue'

export function registerIcons(app: App) {
  for (const [name, component] of Object.entries(Icons)) {
    app.component(name, component as any)
  }
}

export { Icons }
