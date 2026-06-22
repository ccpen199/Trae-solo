import type { Certificate } from '../types'
import { generateId } from './crypto'

const OCR_TEMPLATES: Record<string, string> = {
  '电工': '电工特种作业操作证，证号：T{random}，作业类别：电工作业，准操项目：低压电工作业，初领日期：{date}，有效期至：{date6}',
  '焊工': '焊接与热切割作业操作证，证号：T{random}，作业类别：焊接与热切割作业，初领日期：{date}，有效期至：{date6}',
  '高处': '高处作业操作证，证号：T{random}，作业类别：高处作业，准操项目：登高架设作业，初领日期：{date}，有效期至：{date6}',
  '制冷': '制冷与空调作业操作证，证号：T{random}，作业类别：制冷与空调作业，初领日期：{date}，有效期至：{date6}',
  '维修': '家用电器维修职业资格证书，证书编号：{random}，职业：家用电器产品维修工，等级：中级，发证日期：{date}',
  '管道': '管道工职业技能等级证书，证书编号：{random}，职业：管道工，等级：高级，发证日期：{date}',
}

const generateRandomDigits = (len: number): string => {
  let result = ''
  for (let i = 0; i < len; i++) {
    result += Math.floor(Math.random() * 10)
  }
  return result
}

const formatDate = (d: Date): string => {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const simulateOCR = async (imageName: string): Promise<{ name: string; ocrData: string }> => {
  await new Promise(resolve => setTimeout(resolve, 1500))

  let matchedName = '职业资格证书'
  let template = '职业技能证书，证书编号：{random}，发证日期：{date}，有效期至：{date6}'

  for (const key of Object.keys(OCR_TEMPLATES)) {
    if (imageName.includes(key)) {
      matchedName = key + '操作证'
      template = OCR_TEMPLATES[key]
      break
    }
  }

  const now = new Date()
  const sixYearsLater = new Date(now)
  sixYearsLater.setFullYear(sixYearsLater.getFullYear() + 6)

  const ocrData = template
    .replace(/\{random\}/g, generateRandomDigits(18))
    .replace(/\{date\}/g, formatDate(now))
    .replace(/\{date6\}/g, formatDate(sixYearsLater))

  return { name: matchedName, ocrData }
}

export const createCertificateFromImage = async (
  imageUrl: string,
  imageName: string = '证书'
): Promise<Certificate> => {
  const ocrResult = await simulateOCR(imageName)

  return {
    id: generateId('cert'),
    name: ocrResult.name,
    imageUrl,
    ocrData: ocrResult.ocrData,
    verified: false,
  }
}
