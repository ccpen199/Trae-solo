export class BaseMapAdapter {
  constructor(container, options = {}) {
    this.container = container
    this.options = options
    this.map = null
    this.markers = []
    this.polylines = []
    this.listeners = {}
  }

  async init() {
    throw new Error('init() must be implemented by subclass')
  }

  destroy() {
    this.removeAllMarkers()
    this.removeAllPolylines()
    this.map = null
  }

  setCenter(lng, lat) {
    throw new Error('setCenter() must be implemented by subclass')
  }

  getCenter() {
    throw new Error('getCenter() must be implemented by subclass')
  }

  setZoom(zoom) {
    throw new Error('setZoom() must be implemented by subclass')
  }

  getZoom() {
    throw new Error('getZoom() must be implemented by subclass')
  }

  addMarker(lng, lat, options = {}) {
    throw new Error('addMarker() must be implemented by subclass')
  }

  removeMarker(marker) {
    throw new Error('removeMarker() must be implemented by subclass')
  }

  removeAllMarkers() {
    this.markers.forEach(m => this.removeMarker(m))
    this.markers = []
  }

  addPolyline(path, options = {}) {
    throw new Error('addPolyline() must be implemented by subclass')
  }

  removePolyline(polyline) {
    throw new Error('removePolyline() must be implemented by subclass')
  }

  removeAllPolylines() {
    this.polylines.forEach(p => this.removePolyline(p))
    this.polylines = []
  }

  fitBounds(bounds) {
    throw new Error('fitBounds() must be implemented by subclass')
  }

  on(eventName, callback) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = []
    }
    this.listeners[eventName].push(callback)
  }

  off(eventName, callback) {
    if (!this.listeners[eventName]) return
    if (!callback) {
      delete this.listeners[eventName]
    } else {
      this.listeners[eventName] = this.listeners[eventName].filter(cb => cb !== callback)
    }
  }

  emit(eventName, ...args) {
    if (!this.listeners[eventName]) return
    this.listeners[eventName].forEach(callback => callback(...args))
  }
}
