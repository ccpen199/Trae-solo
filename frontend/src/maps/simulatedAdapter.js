import { BaseMapAdapter } from './baseAdapter'
import { MAP_CONFIG } from './config'

export class SimulatedMapAdapter extends BaseMapAdapter {
  constructor(container, options = {}) {
    super(container, options)
    this.config = { ...MAP_CONFIG.simulated, ...options }
    this.currentZoom = this.config.zoom
    this.currentCenter = this.config.center
    this.containerElement = null
  }

  async init() {
    this.containerElement = typeof this.container === 'string'
      ? document.getElementById(this.container)
      : this.container

    if (!this.containerElement) {
      throw new Error('Map container not found')
    }

    this.renderMap()
    this.bindEvents()
    this.map = true

    return this
  }

  renderMap() {
    this.containerElement.innerHTML = `
      <div class="simulated-map-container">
        <div class="simulated-map-bg">
          <div class="simulated-map-grid"></div>
        </div>
        <div class="simulated-map-layers"></div>
        <div class="simulated-map-controls">
          <button class="map-zoom-in">+</button>
          <button class="map-zoom-out">-</button>
        </div>
      </div>
    `

    this.containerElement.querySelector('.map-zoom-in').addEventListener('click', () => {
      this.setZoom(this.currentZoom + 1)
    })

    this.containerElement.querySelector('.map-zoom-out').addEventListener('click', () => {
      this.setZoom(this.currentZoom - 1)
    })
  }

  bindEvents() {
    const layers = this.containerElement.querySelector('.simulated-map-layers')
    
    layers.addEventListener('click', (e) => {
      const rect = layers.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const lngLat = this.screenToLngLat(x, y)
      this.emit('click', lngLat)
    })

    let isDragging = false
    let lastX = 0
    let lastY = 0

    layers.addEventListener('mousedown', (e) => {
      isDragging = true
      lastX = e.clientX
      lastY = e.clientY
      layers.style.cursor = 'grabbing'
    })

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return
      const dx = e.clientX - lastX
      const dy = e.clientY - lastY
      lastX = e.clientX
      lastY = e.clientY
      
      const lngPerPixel = (this.config.bounds.maxLng - this.config.bounds.minLng) / 500
      const latPerPixel = (this.config.bounds.maxLat - this.config.bounds.minLat) / 500
      
      this.currentCenter = [
        this.currentCenter[0] - dx * lngPerPixel,
        this.currentCenter[1] + dy * latPerPixel
      ]
      
      this.updateMarkersPosition()
    })

    document.addEventListener('mouseup', () => {
      isDragging = false
      const layers = this.containerElement?.querySelector('.simulated-map-layers')
      if (layers) layers.style.cursor = 'grab'
    })
  }

  screenToLngLat(x, y) {
    const rect = this.containerElement.querySelector('.simulated-map-layers').getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    const lngRange = (this.config.bounds.maxLng - this.config.bounds.minLng) / (this.currentZoom / 12)
    const latRange = (this.config.bounds.maxLat - this.config.bounds.minLat) / (this.currentZoom / 12)
    
    const lng = this.currentCenter[0] + (x - width / 2) * (lngRange / width)
    const lat = this.currentCenter[1] - (y - height / 2) * (latRange / height)
    
    return { lng, lat }
  }

  lngLatToScreen(lng, lat) {
    const layers = this.containerElement?.querySelector('.simulated-map-layers')
    if (!layers) return { x: 0, y: 0 }
    
    const rect = layers.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    
    const lngRange = (this.config.bounds.maxLng - this.config.bounds.minLng) / (this.currentZoom / 12)
    const latRange = (this.config.bounds.maxLat - this.config.bounds.minLat) / (this.currentZoom / 12)
    
    const x = width / 2 + (lng - this.currentCenter[0]) * (width / lngRange)
    const y = height / 2 - (lat - this.currentCenter[1]) * (height / latRange)
    
    return { x, y }
  }

  setCenter(lng, lat) {
    this.currentCenter = [lng, lat]
    this.updateMarkersPosition()
    this.updatePolylinesPosition()
  }

  getCenter() {
    return { lng: this.currentCenter[0], lat: this.currentCenter[1] }
  }

  setZoom(zoom) {
    this.currentZoom = Math.max(1, Math.min(18, zoom))
    this.updateMarkersPosition()
    this.updatePolylinesPosition()
  }

  getZoom() {
    return this.currentZoom
  }

  addMarker(lng, lat, options = {}) {
    const marker = {
      lng,
      lat,
      options,
      element: null,
      id: `marker-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    this.renderMarker(marker)
    this.markers.push(marker)

    return marker
  }

  renderMarker(marker) {
    const layers = this.containerElement?.querySelector('.simulated-map-layers')
    if (!layers) return

    const pos = this.lngLatToScreen(marker.lng, marker.lat)
    
    const markerEl = document.createElement('div')
    markerEl.className = `simulated-marker ${marker.options.className || ''}`
    markerEl.style.left = `${pos.x}px`
    markerEl.style.top = `${pos.y}px`
    markerEl.style.transform = 'translate(-50%, -100%)'
    markerEl.dataset.id = marker.id

    if (marker.options.html) {
      markerEl.innerHTML = marker.options.html
    } else {
      markerEl.innerHTML = `
        <div class="marker-icon ${marker.options.type || ''}">
          ${marker.options.content || '●'}
        </div>
        ${marker.options.label ? `<div class="marker-label">${marker.options.label}</div>` : ''}
      `
    }

    if (marker.options.onClick) {
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation()
        marker.options.onClick(marker)
      })
    }

    layers.appendChild(markerEl)
    marker.element = markerEl
  }

  updateMarkersPosition() {
    this.markers.forEach(marker => {
      if (!marker.element) return
      const pos = this.lngLatToScreen(marker.lng, marker.lat)
      marker.element.style.left = `${pos.x}px`
      marker.element.style.top = `${pos.y}px`
    })
  }

  removeMarker(marker) {
    if (marker.element && marker.element.parentNode) {
      marker.element.parentNode.removeChild(marker.element)
    }
    const index = this.markers.indexOf(marker)
    if (index > -1) {
      this.markers.splice(index, 1)
    }
  }

  addPolyline(path, options = {}) {
    const polyline = {
      path,
      options,
      element: null,
      id: `polyline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    this.renderPolyline(polyline)
    this.polylines.push(polyline)

    return polyline
  }

  renderPolyline(polyline) {
    const layers = this.containerElement?.querySelector('.simulated-map-layers')
    if (!layers) return

    const pathData = polyline.path.map((point, index) => {
      const pos = this.lngLatToScreen(point.lng, point.lat)
      return `${index === 0 ? 'M' : 'L'} ${pos.x} ${pos.y}`
    }).join(' ')

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.className = 'simulated-polyline'
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.pointerEvents = 'none'

    const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    pathEl.setAttribute('d', pathData)
    pathEl.setAttribute('fill', 'none')
    pathEl.setAttribute('stroke', polyline.options.strokeColor || '#409EFF')
    pathEl.setAttribute('stroke-width', polyline.options.strokeWidth || '3')
    pathEl.setAttribute('stroke-linecap', 'round')
    pathEl.setAttribute('stroke-linejoin', 'round')
    if (polyline.options.strokeDasharray) {
      pathEl.setAttribute('stroke-dasharray', polyline.options.strokeDasharray)
    }

    svg.appendChild(pathEl)
    layers.appendChild(svg)
    polyline.element = svg
  }

  updatePolylinesPosition() {
    this.polylines.forEach(polyline => {
      if (polyline.element && polyline.element.parentNode) {
        polyline.element.parentNode.removeChild(polyline.element)
      }
      this.renderPolyline(polyline)
    })
  }

  removePolyline(polyline) {
    if (polyline.element && polyline.element.parentNode) {
      polyline.element.parentNode.removeChild(polyline.element)
    }
    const index = this.polylines.indexOf(polyline)
    if (index > -1) {
      this.polylines.splice(index, 1)
    }
  }

  fitBounds(bounds) {
    if (!bounds || !bounds.length) return

    let minLng = Infinity, maxLng = -Infinity
    let minLat = Infinity, maxLat = -Infinity

    bounds.forEach(point => {
      minLng = Math.min(minLng, point.lng)
      maxLng = Math.max(maxLng, point.lng)
      minLat = Math.min(minLat, point.lat)
      maxLat = Math.max(maxLat, point.lat)
    })

    this.currentCenter = [(minLng + maxLng) / 2, (minLat + maxLat) / 2]
    this.updateMarkersPosition()
    this.updatePolylinesPosition()
  }

  destroy() {
    this.removeAllMarkers()
    this.removeAllPolylines()
    if (this.containerElement) {
      this.containerElement.innerHTML = ''
    }
    this.map = null
  }
}
