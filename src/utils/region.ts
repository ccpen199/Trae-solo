export interface Region {
  code: string
  name: string
  level: 'province' | 'city' | 'district'
  parentCode?: string
  children?: Region[]
}

export const province: Region = {
  code: '370000',
  name: '山东省',
  level: 'province'
}

export const cities: Region[] = [
  { code: '370100', name: '济南市', level: 'city', parentCode: '370000' },
  { code: '370200', name: '青岛市', level: 'city', parentCode: '370000' },
  { code: '370300', name: '淄博市', level: 'city', parentCode: '370000' },
  { code: '370400', name: '枣庄市', level: 'city', parentCode: '370000' },
  { code: '370500', name: '东营市', level: 'city', parentCode: '370000' },
  { code: '370600', name: '烟台市', level: 'city', parentCode: '370000' },
  { code: '370700', name: '潍坊市', level: 'city', parentCode: '370000' },
  { code: '370800', name: '济宁市', level: 'city', parentCode: '370000' },
  { code: '370900', name: '泰安市', level: 'city', parentCode: '370000' },
  { code: '371000', name: '威海市', level: 'city', parentCode: '370000' },
  { code: '371100', name: '日照市', level: 'city', parentCode: '370000' },
  { code: '371300', name: '临沂市', level: 'city', parentCode: '370000' },
  { code: '371400', name: '德州市', level: 'city', parentCode: '370000' },
  { code: '371500', name: '聊城市', level: 'city', parentCode: '370000' },
  { code: '371600', name: '滨州市', level: 'city', parentCode: '370000' },
  { code: '371700', name: '菏泽市', level: 'city', parentCode: '370000' }
]

export const districts: Record<string, Region[]> = {
  '370100': [
    { code: '370102', name: '历下区', level: 'district', parentCode: '370100' },
    { code: '370103', name: '市中区', level: 'district', parentCode: '370100' },
    { code: '370104', name: '槐荫区', level: 'district', parentCode: '370100' },
    { code: '370105', name: '天桥区', level: 'district', parentCode: '370100' },
    { code: '370112', name: '历城区', level: 'district', parentCode: '370100' },
    { code: '370113', name: '长清区', level: 'district', parentCode: '370100' },
    { code: '370114', name: '章丘区', level: 'district', parentCode: '370100' },
    { code: '370115', name: '济阳区', level: 'district', parentCode: '370100' },
    { code: '370116', name: '莱芜区', level: 'district', parentCode: '370100' },
    { code: '370117', name: '钢城区', level: 'district', parentCode: '370100' },
    { code: '370124', name: '平阴县', level: 'district', parentCode: '370100' },
    { code: '370126', name: '商河县', level: 'district', parentCode: '370100' }
  ],
  '370200': [
    { code: '370202', name: '市南区', level: 'district', parentCode: '370200' },
    { code: '370203', name: '市北区', level: 'district', parentCode: '370200' },
    { code: '370211', name: '黄岛区', level: 'district', parentCode: '370200' },
    { code: '370212', name: '崂山区', level: 'district', parentCode: '370200' },
    { code: '370213', name: '李沧区', level: 'district', parentCode: '370200' },
    { code: '370214', name: '城阳区', level: 'district', parentCode: '370200' },
    { code: '370215', name: '即墨区', level: 'district', parentCode: '370200' },
    { code: '370281', name: '胶州市', level: 'district', parentCode: '370200' },
    { code: '370283', name: '平度市', level: 'district', parentCode: '370200' },
    { code: '370285', name: '莱西市', level: 'district', parentCode: '370200' }
  ],
  '370300': [
    { code: '370302', name: '淄川区', level: 'district', parentCode: '370300' },
    { code: '370303', name: '张店区', level: 'district', parentCode: '370300' },
    { code: '370304', name: '博山区', level: 'district', parentCode: '370300' },
    { code: '370305', name: '临淄区', level: 'district', parentCode: '370300' },
    { code: '370306', name: '周村区', level: 'district', parentCode: '370300' },
    { code: '370321', name: '桓台县', level: 'district', parentCode: '370300' },
    { code: '370322', name: '高青县', level: 'district', parentCode: '370300' },
    { code: '370323', name: '沂源县', level: 'district', parentCode: '370300' }
  ],
  '370400': [
    { code: '370402', name: '市中区', level: 'district', parentCode: '370400' },
    { code: '370403', name: '薛城区', level: 'district', parentCode: '370400' },
    { code: '370404', name: '峄城区', level: 'district', parentCode: '370400' },
    { code: '370405', name: '台儿庄区', level: 'district', parentCode: '370400' },
    { code: '370406', name: '山亭区', level: 'district', parentCode: '370400' },
    { code: '370481', name: '滕州市', level: 'district', parentCode: '370400' }
  ],
  '370500': [
    { code: '370502', name: '东营区', level: 'district', parentCode: '370500' },
    { code: '370503', name: '河口区', level: 'district', parentCode: '370500' },
    { code: '370505', name: '垦利区', level: 'district', parentCode: '370500' },
    { code: '370522', name: '利津县', level: 'district', parentCode: '370500' },
    { code: '370523', name: '广饶县', level: 'district', parentCode: '370500' }
  ],
  '370600': [
    { code: '370602', name: '芝罘区', level: 'district', parentCode: '370600' },
    { code: '370611', name: '福山区', level: 'district', parentCode: '370600' },
    { code: '370612', name: '牟平区', level: 'district', parentCode: '370600' },
    { code: '370613', name: '莱山区', level: 'district', parentCode: '370600' },
    { code: '370614', name: '蓬莱区', level: 'district', parentCode: '370600' },
    { code: '370681', name: '龙口市', level: 'district', parentCode: '370600' },
    { code: '370682', name: '莱阳市', level: 'district', parentCode: '370600' },
    { code: '370683', name: '莱州市', level: 'district', parentCode: '370600' },
    { code: '370684', name: '招远市', level: 'district', parentCode: '370600' },
    { code: '370685', name: '栖霞市', level: 'district', parentCode: '370600' },
    { code: '370686', name: '海阳市', level: 'district', parentCode: '370600' }
  ],
  '370700': [
    { code: '370702', name: '潍城区', level: 'district', parentCode: '370700' },
    { code: '370703', name: '寒亭区', level: 'district', parentCode: '370700' },
    { code: '370704', name: '坊子区', level: 'district', parentCode: '370700' },
    { code: '370705', name: '奎文区', level: 'district', parentCode: '370700' },
    { code: '370706', name: '临朐县', level: 'district', parentCode: '370700' },
    { code: '370724', name: '昌乐县', level: 'district', parentCode: '370700' },
    { code: '370725', name: '青州市', level: 'district', parentCode: '370700' },
    { code: '370781', name: '诸城市', level: 'district', parentCode: '370700' },
    { code: '370782', name: '寿光市', level: 'district', parentCode: '370700' },
    { code: '370783', name: '安丘市', level: 'district', parentCode: '370700' },
    { code: '370784', name: '高密市', level: 'district', parentCode: '370700' },
    { code: '370785', name: '昌邑市', level: 'district', parentCode: '370700' },
    { code: '370786', name: '高新技术产业开发区', level: 'district', parentCode: '370700' }
  ],
  '370800': [
    { code: '370811', name: '任城区', level: 'district', parentCode: '370800' },
    { code: '370826', name: '微山县', level: 'district', parentCode: '370800' },
    { code: '370827', name: '鱼台县', level: 'district', parentCode: '370800' },
    { code: '370828', name: '金乡县', level: 'district', parentCode: '370800' },
    { code: '370829', name: '嘉祥县', level: 'district', parentCode: '370800' },
    { code: '370830', name: '汶上县', level: 'district', parentCode: '370800' },
    { code: '370831', name: '泗水县', level: 'district', parentCode: '370800' },
    { code: '370832', name: '梁山县', level: 'district', parentCode: '370800' },
    { code: '370881', name: '曲阜市', level: 'district', parentCode: '370800' },
    { code: '370882', name: '兖州区', level: 'district', parentCode: '370800' },
    { code: '370883', name: '邹城市', level: 'district', parentCode: '370800' }
  ],
  '370900': [
    { code: '370902', name: '泰山区', level: 'district', parentCode: '370900' },
    { code: '370911', name: '岱岳区', level: 'district', parentCode: '370900' },
    { code: '370921', name: '宁阳县', level: 'district', parentCode: '370900' },
    { code: '370923', name: '东平县', level: 'district', parentCode: '370900' },
    { code: '370982', name: '新泰市', level: 'district', parentCode: '370900' },
    { code: '370983', name: '肥城市', level: 'district', parentCode: '370900' }
  ],
  '371000': [
    { code: '371002', name: '环翠区', level: 'district', parentCode: '371000' },
    { code: '371003', name: '文登区', level: 'district', parentCode: '371000' },
    { code: '371082', name: '荣成市', level: 'district', parentCode: '371000' },
    { code: '371083', name: '乳山市', level: 'district', parentCode: '371000' }
  ],
  '371100': [
    { code: '371102', name: '东港区', level: 'district', parentCode: '371100' },
    { code: '371103', name: '岚山区', level: 'district', parentCode: '371100' },
    { code: '371121', name: '五莲县', level: 'district', parentCode: '371100' },
    { code: '371122', name: '莒县', level: 'district', parentCode: '371100' }
  ],
  '371300': [
    { code: '371302', name: '兰山区', level: 'district', parentCode: '371300' },
    { code: '371311', name: '罗庄区', level: 'district', parentCode: '371300' },
    { code: '371312', name: '河东区', level: 'district', parentCode: '371300' },
    { code: '371321', name: '沂南县', level: 'district', parentCode: '371300' },
    { code: '371322', name: '郯城县', level: 'district', parentCode: '371300' },
    { code: '371323', name: '沂水县', level: 'district', parentCode: '371300' },
    { code: '371324', name: '兰陵县', level: 'district', parentCode: '371300' },
    { code: '371325', name: '费县', level: 'district', parentCode: '371300' },
    { code: '371326', name: '平邑县', level: 'district', parentCode: '371300' },
    { code: '371327', name: '莒南县', level: 'district', parentCode: '371300' },
    { code: '371328', name: '蒙阴县', level: 'district', parentCode: '371300' },
    { code: '371329', name: '临沭县', level: 'district', parentCode: '371300' }
  ],
  '371400': [
    { code: '371402', name: '德城区', level: 'district', parentCode: '371400' },
    { code: '371403', name: '陵城区', level: 'district', parentCode: '371400' },
    { code: '371422', name: '宁津县', level: 'district', parentCode: '371400' },
    { code: '371423', name: '庆云县', level: 'district', parentCode: '371400' },
    { code: '371424', name: '临邑县', level: 'district', parentCode: '371400' },
    { code: '371425', name: '齐河县', level: 'district', parentCode: '371400' },
    { code: '371426', name: '平原县', level: 'district', parentCode: '371400' },
    { code: '371427', name: '夏津县', level: 'district', parentCode: '371400' },
    { code: '371428', name: '武城县', level: 'district', parentCode: '371400' },
    { code: '371481', name: '乐陵市', level: 'district', parentCode: '371400' },
    { code: '371482', name: '禹城市', level: 'district', parentCode: '371400' }
  ],
  '371500': [
    { code: '371502', name: '东昌府区', level: 'district', parentCode: '371500' },
    { code: '371521', name: '阳谷县', level: 'district', parentCode: '371500' },
    { code: '371522', name: '莘县', level: 'district', parentCode: '371500' },
    { code: '371523', name: '茌平区', level: 'district', parentCode: '371500' },
    { code: '371524', name: '东阿县', level: 'district', parentCode: '371500' },
    { code: '371525', name: '冠县', level: 'district', parentCode: '371500' },
    { code: '371526', name: '高唐县', level: 'district', parentCode: '371500' },
    { code: '371581', name: '临清市', level: 'district', parentCode: '371500' }
  ],
  '371600': [
    { code: '371602', name: '滨城区', level: 'district', parentCode: '371600' },
    { code: '371603', name: '沾化区', level: 'district', parentCode: '371600' },
    { code: '371621', name: '惠民县', level: 'district', parentCode: '371600' },
    { code: '371622', name: '阳信县', level: 'district', parentCode: '371600' },
    { code: '371623', name: '无棣县', level: 'district', parentCode: '371600' },
    { code: '371625', name: '博兴县', level: 'district', parentCode: '371600' },
    { code: '371626', name: '邹平市', level: 'district', parentCode: '371600' }
  ],
  '371700': [
    { code: '371702', name: '牡丹区', level: 'district', parentCode: '371700' },
    { code: '371703', name: '定陶区', level: 'district', parentCode: '371700' },
    { code: '371721', name: '曹县', level: 'district', parentCode: '371700' },
    { code: '371722', name: '单县', level: 'district', parentCode: '371700' },
    { code: '371723', name: '成武县', level: 'district', parentCode: '371700' },
    { code: '371724', name: '巨野县', level: 'district', parentCode: '371700' },
    { code: '371725', name: '郓城县', level: 'district', parentCode: '371700' },
    { code: '371726', name: '鄄城县', level: 'district', parentCode: '371700' },
    { code: '371728', name: '东明县', level: 'district', parentCode: '371700' }
  ]
}

export const getRegionTree = (): Region => {
  return {
    ...province,
    children: cities.map(city => ({
      ...city,
      children: districts[city.code] || []
    }))
  }
}

export const getCityList = (): Region[] => {
  return cities
}

export const getDistrictList = (cityCode: string): Region[] => {
  return districts[cityCode] || []
}

export const getRegionName = (code: string): string => {
  if (code === province.code) return province.name
  
  const city = cities.find(c => c.code === code)
  if (city) return city.name
  
  for (const cityCode of Object.keys(districts)) {
    const district = districts[cityCode].find(d => d.code === code)
    if (district) return district.name
  }
  
  return ''
}

export const getRegionPath = (code: string): Region[] => {
  const result: Region[] = []
  
  for (const cityCode of Object.keys(districts)) {
    const district = districts[cityCode].find(d => d.code === code)
    if (district) {
      const city = cities.find(c => c.code === cityCode)
      if (city) {
        result.push(province, city, district)
      }
      return result
    }
  }
  
  const city = cities.find(c => c.code === code)
  if (city) {
    result.push(province, city)
    return result
  }
  
  if (code === province.code) {
    result.push(province)
  }
  
  return result
}

export const getRegionPathName = (code: string, separator: string = ' '): string => {
  return getRegionPath(code).map(r => r.name).join(separator)
}

export const getCityByCode = (code: string): Region | undefined => {
  return cities.find(c => c.code === code)
}

export const getDistrictByCode = (code: string): Region | undefined => {
  for (const cityCode of Object.keys(districts)) {
    const district = districts[cityCode].find(d => d.code === code)
    if (district) return district
  }
  return undefined
}

export default {
  province,
  cities,
  districts,
  getRegionTree,
  getCityList,
  getDistrictList,
  getRegionName,
  getRegionPath,
  getRegionPathName,
  getCityByCode,
  getDistrictByCode
}
