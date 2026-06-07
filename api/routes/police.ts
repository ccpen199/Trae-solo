import { Router, type Request, type Response } from 'express'

const router = Router()

router.get('/guides', (_req: Request, res: Response): void => {
  try {
    const guides = [
      { id: 1, title: '户口迁入办理指南', category: '户口迁移', content: '南京户口迁入分为人才落户、积分落户、投靠落户等方式。人才落户需提供学历证书或职称证书；积分落户需满足社保缴纳年限等条件。' },
      { id: 2, title: '户口迁出办理指南', category: '户口迁移', content: '户口迁出需携带身份证、户口簿、迁入地公安机关签发的准予迁入证明，到户籍地派出所办理。' },
      { id: 3, title: '身份证换领指南', category: '身份证业务', content: '身份证有效期满或损坏的，可携带旧身份证到户籍地派出所或指定的身份证受理点办理换领。制证周期约20个工作日。' },
      { id: 4, title: '身份证补领指南', category: '身份证业务', content: '身份证遗失的，应及时到派出所办理挂失和补领。可携带户口簿到户籍地或居住地派出所办理，也可通过"我的南京"APP在线申请。' },
      { id: 5, title: '居住证申领指南', category: '居住证', content: '在南京居住满6个月即可申领居住证。需提供身份证、居住证明、就业证明或就读证明等材料。办理地点为居住地派出所或社区服务中心。' },
      { id: 6, title: '无犯罪记录证明办理指南', category: '证明开具', content: '可通过"我的南京"APP或江苏政务服务网在线申请，也可到户籍地派出所办理。一般3个工作日内完成。' },
      { id: 7, title: '出生登记办理指南', category: '户口登记', content: '新生儿出生后应在一个月内到父亲或母亲户籍所在地派出所办理出生登记。需提供出生医学证明、父母结婚证、户口簿等。' },
      { id: 8, title: '死亡注销户口指南', category: '户口登记', content: '公民死亡后，户主或亲属应在一个月内到户籍地派出所办理注销户口。需提供死亡证明、户口簿等材料。' },
    ]
    res.json({ code: 0, message: 'success', data: guides })
  } catch (error: any) {
    res.json({ code: -1, message: error.message })
  }
})

export default router
