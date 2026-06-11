import { airPlaySend, airPlayGetDevices, airPlayGetStatus } from '../api/bridge.js'
import { isOnline } from './networkDetection.js'

class AirPlayBridge {
  constructor() {
    this.connected = false
    this.devices = []
    this.currentDevice = null
  }

  async connect() {
    try {
      const devices = await airPlayGetDevices()
      this.devices = devices
      this.connected = devices.length > 0
      return this.connected
    } catch (error) {
      console.warn('AirPlay bridge connection failed:', error)
      this.connected = false
      return false
    }
  }

  async getDevices() {
    try {
      const devices = await airPlayGetDevices()
      this.devices = devices
      return devices
    } catch (error) {
      console.error('Get AirPlay devices failed:', error)
      return this.devices
    }
  }

  async sendCommand(deviceId, command, params = {}) {
    if (!isOnline()) {
      const pending = JSON.parse(localStorage.getItem('pending_airplay_commands') || '[]')
      pending.push({
        id: Date.now().toString(),
        deviceId,
        command,
        params,
        timestamp: new Date().toISOString()
      })
      localStorage.setItem('pending_airplay_commands', JSON.stringify(pending))
      return { success: true, pending: true }
    }

    try {
      const result = await airPlaySend(deviceId, { command, params })
      return result
    } catch (error) {
      console.error('AirPlay command failed:', error)
      throw error
    }
  }

  async getDeviceStatus(deviceId) {
    try {
      const status = await airPlayGetStatus(deviceId)
      this.currentDevice = { deviceId, status }
      return status
    } catch (error) {
      console.error('Get AirPlay status failed:', error)
      return null
    }
  }

  async play(deviceId, url) {
    return this.sendCommand(deviceId, 'play', { url })
  }

  async pause(deviceId) {
    return this.sendCommand(deviceId, 'pause')
  }

  async stop(deviceId) {
    return this.sendCommand(deviceId, 'stop')
  }

  async setVolume(deviceId, volume) {
    return this.sendCommand(deviceId, 'volume', { volume: Math.max(0, Math.min(100, volume)) })
  }

  async setMute(deviceId, muted) {
    return this.sendCommand(deviceId, 'mute', { muted })
  }

  async syncPendingCommands() {
    const pending = JSON.parse(localStorage.getItem('pending_airplay_commands') || '[]')
    if (pending.length === 0) return { success: true, synced: 0 }

    const successIds = []
    for (const cmd of pending) {
      try {
        await airPlaySend(cmd.deviceId, { command: cmd.command, params: cmd.params })
        successIds.push(cmd.id)
      } catch (error) {
        break
      }
    }

    const remaining = pending.filter(cmd => !successIds.includes(cmd.id))
    localStorage.setItem('pending_airplay_commands', JSON.stringify(remaining))

    return {
      success: true,
      synced: successIds.length,
      remaining: remaining.length
    }
  }

  simulateSend(deviceId, command, params = {}) {
    console.log(`[Simulated AirPlay] Sending command '${command}' to device ${deviceId}`, params)
    return {
      success: true,
      simulated: true,
      deviceId,
      command,
      params,
      timestamp: new Date().toISOString()
    }
  }
}

const airPlayBridge = new AirPlayBridge()

export default airPlayBridge
export { AirPlayBridge }
