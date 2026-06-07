export * from './client'
export * from './modules/auth'
export * from './modules/permit'
export * from './modules/violation'
export * from './modules/accident'
export * from './modules/ebike'
export * from './modules/appointment'
export * from './modules/chatbot'
export * from './modules/workflow'
export * from './modules/certificate'
export * from './modules/stats'
export * from './modules/upload'

import auth from './modules/auth'
import permit from './modules/permit'
import violation from './modules/violation'
import accident from './modules/accident'
import ebike from './modules/ebike'
import appointment from './modules/appointment'
import chatbot from './modules/chatbot'
import workflow from './modules/workflow'
import certificate from './modules/certificate'
import stats from './modules/stats'
import upload from './modules/upload'

const api = {
  auth,
  permit,
  violation,
  accident,
  ebike,
  appointment,
  chatbot,
  workflow,
  certificate,
  stats,
  upload
}

export default api
