const palettes = [
  ['#0f766e', '#14b8a6', '#f59e0b'],
  ['#1d4ed8', '#38bdf8', '#f59e0b'],
  ['#7c3aed', '#a78bfa', '#14b8a6'],
  ['#be123c', '#fb7185', '#f59e0b'],
  ['#166534', '#22c55e', '#eab308'],
]

function hashText(value: string) {
  let hash = 0
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0
  }
  return hash
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function localImage(label = 'Jujie', width = 960, height = 640) {
  const hash = hashText(label)
  const [base, accent, warm] = palettes[hash % palettes.length]
  const title = escapeXml(label.slice(0, 14))
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${base}"/>
          <stop offset="0.58" stop-color="${accent}"/>
          <stop offset="1" stop-color="${warm}"/>
        </linearGradient>
        <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
          <path d="M72 0H0v72" fill="none" stroke="rgba(255,255,255,.16)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="${width}" height="${height}" rx="0" fill="url(#bg)"/>
      <rect width="${width}" height="${height}" fill="url(#grid)"/>
      <circle cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.22)}" r="${Math.round(width * 0.18)}" fill="rgba(255,255,255,.18)"/>
      <circle cx="${Math.round(width * 0.18)}" cy="${Math.round(height * 0.8)}" r="${Math.round(width * 0.14)}" fill="rgba(255,255,255,.12)"/>
      <path d="M0 ${Math.round(height * 0.72)}C${Math.round(width * 0.22)} ${Math.round(height * 0.56)} ${Math.round(width * 0.38)} ${Math.round(height * 0.88)} ${Math.round(width * 0.58)} ${Math.round(height * 0.7)}S${Math.round(width * 0.84)} ${Math.round(height * 0.48)} ${width} ${Math.round(height * 0.63)}V${height}H0Z" fill="rgba(15,23,42,.18)"/>
      <text x="56" y="${height - 76}" fill="white" font-family="Arial, sans-serif" font-size="44" font-weight="700">${title}</text>
      <text x="56" y="${height - 36}" fill="rgba(255,255,255,.82)" font-family="Arial, sans-serif" font-size="22">Real estate and renovation service</text>
    </svg>
  `
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export function stableImageUrl(src?: string | null, label = 'Jujie') {
  const value = String(src || '').trim()
  if (!value) return localImage(label)
  if (/^(data:|blob:|\/|\.\/|\.\.\/)/.test(value)) return value
  if (/^https?:\/\//i.test(value)) return localImage(label)
  return value
}
