function svgToDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function escapeSvgText(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export const heroBannerImage = svgToDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" fill="none">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop stop-color="#EDF4EF"/>
        <stop offset="0.55" stop-color="#C8D7D2"/>
        <stop offset="1" stop-color="#1A3C34"/>
      </linearGradient>
      <linearGradient id="ground" x1="0" y1="0" x2="1" y2="1">
        <stop stop-color="#274E45"/>
        <stop offset="1" stop-color="#102822"/>
      </linearGradient>
    </defs>
    <rect width="1600" height="900" fill="url(#sky)"/>
    <rect y="620" width="1600" height="280" fill="url(#ground)"/>
    <circle cx="1230" cy="180" r="72" fill="#E6C98F" fill-opacity="0.72"/>
    <path d="M0 560C158 505 294 482 409 492C541 503 648 566 793 566C943 566 1049 472 1209 470C1364 468 1492 547 1600 585V900H0V560Z" fill="#2D5C51" fill-opacity="0.34"/>
    <g fill="#133129" fill-opacity="0.95">
      <rect x="150" y="345" width="120" height="275" rx="4"/>
      <rect x="300" y="275" width="148" height="345" rx="4"/>
      <rect x="485" y="225" width="108" height="395" rx="4"/>
      <rect x="632" y="305" width="160" height="315" rx="4"/>
      <rect x="835" y="248" width="138" height="372" rx="4"/>
      <rect x="1008" y="198" width="175" height="422" rx="4"/>
      <rect x="1224" y="298" width="108" height="322" rx="4"/>
    </g>
    <g fill="#F4E7C5" fill-opacity="0.22">
      <rect x="336" y="308" width="14" height="18"/>
      <rect x="366" y="308" width="14" height="18"/>
      <rect x="396" y="308" width="14" height="18"/>
      <rect x="336" y="342" width="14" height="18"/>
      <rect x="366" y="342" width="14" height="18"/>
      <rect x="396" y="342" width="14" height="18"/>
      <rect x="1038" y="238" width="14" height="18"/>
      <rect x="1068" y="238" width="14" height="18"/>
      <rect x="1098" y="238" width="14" height="18"/>
      <rect x="1038" y="272" width="14" height="18"/>
      <rect x="1068" y="272" width="14" height="18"/>
      <rect x="1098" y="272" width="14" height="18"/>
      <rect x="1038" y="306" width="14" height="18"/>
      <rect x="1068" y="306" width="14" height="18"/>
      <rect x="1098" y="306" width="14" height="18"/>
    </g>
  </svg>
`)

export function getBuildingCoverImage(building: {
  name?: string
  district?: string
  images?: string[]
}) {
  const preferredImage = Array.isArray(building.images)
    ? building.images.find((item) => typeof item === 'string' && item.trim() && !item.includes('trae-api-cn.mchost.guru'))
    : undefined

  if (preferredImage) {
    return preferredImage
  }

  const name = escapeSvgText(building.name || '示范楼盘')
  const district = escapeSvgText(building.district || '核心住区')

  return svgToDataUri(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 720" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#EEF3EE"/>
          <stop offset="0.48" stop-color="#D5E1DB"/>
          <stop offset="1" stop-color="#335E54"/>
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
          <stop stop-color="#FFF4D1" stop-opacity="0.52"/>
          <stop offset="1" stop-color="#FFF4D1" stop-opacity="0.08"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="720" fill="url(#bg)"/>
      <circle cx="950" cy="140" r="70" fill="#E3C07A" fill-opacity="0.72"/>
      <path d="M0 470C126 438 246 430 362 442C507 457 615 529 756 520C880 512 1006 430 1200 422V720H0V470Z" fill="#2A5249" fill-opacity="0.28"/>
      <g fill="#17362E">
        <rect x="188" y="208" width="210" height="372" rx="10"/>
        <rect x="432" y="148" width="160" height="432" rx="10"/>
        <rect x="620" y="96" width="188" height="484" rx="10"/>
        <rect x="850" y="214" width="138" height="366" rx="10"/>
      </g>
      <g fill="url(#glass)">
        <rect x="224" y="252" width="28" height="36"/>
        <rect x="278" y="252" width="28" height="36"/>
        <rect x="332" y="252" width="28" height="36"/>
        <rect x="224" y="316" width="28" height="36"/>
        <rect x="278" y="316" width="28" height="36"/>
        <rect x="332" y="316" width="28" height="36"/>
        <rect x="464" y="190" width="24" height="34"/>
        <rect x="512" y="190" width="24" height="34"/>
        <rect x="464" y="244" width="24" height="34"/>
        <rect x="512" y="244" width="24" height="34"/>
        <rect x="658" y="146" width="26" height="36"/>
        <rect x="706" y="146" width="26" height="36"/>
        <rect x="658" y="202" width="26" height="36"/>
        <rect x="706" y="202" width="26" height="36"/>
        <rect x="888" y="258" width="22" height="30"/>
        <rect x="928" y="258" width="22" height="30"/>
        <rect x="888" y="308" width="22" height="30"/>
        <rect x="928" y="308" width="22" height="30"/>
      </g>
      <rect x="74" y="516" width="390" height="122" rx="26" fill="#123229" fill-opacity="0.82"/>
      <text x="112" y="568" fill="#F6E6BC" font-size="48" font-family="Georgia, 'Times New Roman', serif">${name}</text>
      <text x="112" y="607" fill="#E8F0EC" font-size="24" font-family="Arial, sans-serif">${district} Real Estate Showcase</text>
    </svg>
  `)
}
