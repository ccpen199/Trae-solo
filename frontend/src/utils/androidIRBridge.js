import { androidIRSend, androidIRLearn, androidGetStatus } from '../api/bridge.js'
import { getIRCodeCache, setIRCodeCache } from './offlineCache.js'
import { isOnline, isWeakNetwork } from './networkDetection.js'

class AndroidIRBridge {
  constructor() {
    this.connected = false
    this.deviceInfo = null
    this.learningSession = null
  }

  async connect() {
    try {
      const status = await androidGetStatus()
      this.connected = status.connected
      this.deviceInfo = status.device
      return this.connected
    } catch (error) {
      console.warn('Android IR bridge connection failed:', error)
      this.connected = false
      return false
    }
  }

  async sendIRCode(deviceId, command, irCode) {
    const cachedCode = getIRCodeCache(deviceId, command)
    const codeToSend = irCode || cachedCode

    if (!codeToSend) {
      throw new Error(`No IR code found for command: ${command}`)
    }

    if (!isOnline()) {
      const pending = JSON.parse(localStorage.getItem('pending_ir_commands') || '[]')
      pending.push({
        id: Date.now().toString(),
        deviceId,
        command,
        irCode: codeToSend,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('pending_ir_commands', JSON.stringify(pending))
      return { success: true, cached: true, pending: true }
    }

    try {
      const result = await androidIRSend(deviceId, codeToSend)
      if (result.success) {
        setIRCodeCache(deviceId, command, codeToSend)
      }
      return result
    } catch (error) {
      if (isWeakNetwork() && cachedCode) {
        const pending = JSON.parse(localStorage.getItem('pending_ir_commands') || '[]')
        pending.push({
          id: Date.now().toString(),
          deviceId,
          command,
          irCode: codeToSend,
          timestamp: new Date().toISOString()
        })
        localStorage.setItem('pending_ir_commands', JSON.stringify(pending))
        return { success: true, cached: true, pending: true }
      }
      throw error
    }
  }

  async startLearning(deviceId) {
    if (!this.connected) {
      const connected = await this.connect()
      if (!connected) {
        throw new Error('Android IR bridge not connected')
      }
    }

    try {
      const result = await androidIRLearn(deviceId)
      this.learningSession = result.sessionId
      return result
    } catch (error) {
      console.error('Learning start failed:', error)
      throw error
    }
  }

  async stopLearning() {
    this.learningSession = null
    return { success: true }
  }

  async getStatus() {
    try {
      const status = await androidGetStatus()
      this.connected = status.connected
      return status
    } catch (error) {
      this.connected = false
      return { connected: false, error: error.message }
    }
  }

  async syncPendingCommands() {
    const pending = JSON.parse(localStorage.getItem('pending_ir_commands') || '[]')
    if (pending.length === 0) return { success: true, synced: 0 }

    const successIds = []
    for (const cmd of pending) {
      try {
        await androidIRSend(cmd.deviceId, cmd.irCode)
        successIds.push(cmd.id)
      } catch (error) {
        break
      }
    }

    const remaining = pending.filter(cmd => !successIds.includes(cmd.id))
    localStorage.setItem('pending_ir_commands', JSON.stringify(remaining))

    return {
      success: true,
      synced: successIds.length,
      remaining: remaining.length
    }
  }

  simulateSend(deviceId, command) {
    console.log(`[Simulated] Sending IR command '${command}' to device ${deviceId}`)
    return {
      success: true,
      simulated: true,
      deviceId,
      command,
      timestamp: new Date().toISOString()
    }
  }

  simulateLearn(deviceId, commandName) {
    const mockRawCode = '0001 0001 0020 0020 0040 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0040 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0020 0400'

    console.log(`[Simulated] Learning command '${commandName}' for device ${deviceId}`)
    return {
      success: true,
      simulated: true,
      deviceId,
      commandName,
      rawCode: mockRawCode,
      format: 'NEC',
      frequency: 38000,
      timestamp: new Date().toISOString()
    }
  }
}

const androidBridge = new AndroidIRBridge()

export default androidBridge
export { AndroidIRBridge }
