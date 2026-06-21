import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function Terms() {
  return (
    <div className="bg-paper min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-ink-gradient py-16 px-4">
          <div className="container text-center">
            <FileText className="w-12 h-12 text-gold-300 mx-auto mb-4" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gold-300 mb-4">
              服务协议
            </h1>
            <p className="text-jade-200">最后更新时间：2024年1月1日</p>
          </div>
        </div>

        <div className="container py-16 max-w-4xl">
          <Card>
            <Card.Content>
              <div className="prose prose-jade max-w-none">
                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-0">
                  一、协议的接受与修改
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  欢迎使用鉴真阁文玩艺术品鉴定平台（以下简称"本平台"）。本服务协议是您与鉴真阁之间就使用本平台服务所订立的协议。在使用本平台服务前，请您仔细阅读本协议的全部内容。一旦您注册或使用本平台服务，即表示您已充分理解并同意接受本协议的全部条款。
                </p>
                <p className="text-jade-600 leading-relaxed">
                  本平台有权根据需要随时修改本协议条款，修改后的协议将在本平台公布。您在修改后的协议公布后继续使用本平台服务，即表示您接受修改后的协议。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  二、服务内容
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  本平台为用户提供以下服务：
                </p>
                <ul className="list-disc list-inside text-jade-600 leading-relaxed space-y-2">
                  <li>文玩艺术品在线鉴定服务（AI初筛 + 专家鉴定）</li>
                  <li>鉴定证书查询与区块链存证验证</li>
                  <li>行家知识库内容浏览与分享</li>
                  <li>文玩艺术品价值评估参考</li>
                  <li>社区问答与藏友交流</li>
                  <li>API开放平台服务（需单独申请）</li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  三、用户注册与账号
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  用户在注册时应提供真实、准确、完整的个人信息，并对账号下的所有行为负责。用户应妥善保管账号密码，因用户自身原因导致的账号被盗用，本平台不承担责任。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  四、鉴定服务说明
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  本平台的鉴定结论基于用户提供的图像资料及专家经验判断，仅供参考。鉴定结果可能因图像质量、拍摄角度等因素存在偏差。对于高价值藏品，建议用户携带实物前往线下机构进行进一步鉴定。
                </p>
                <p className="text-jade-600 leading-relaxed">
                  本平台出具的电子鉴定证书采用区块链存证技术，可永久溯源验证。但证书仅对送检时的藏品状态负责，不构成对藏品市场价值的担保。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  五、用户行为规范
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  用户在使用本平台服务时，应遵守相关法律法规，不得发布违法违规内容，不得侵犯他人合法权益，不得利用本平台从事任何非法活动。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  六、知识产权
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  本平台的所有内容，包括但不限于文字、图片、Logo、软件等，均受知识产权法律法规保护，归鉴真阁或相关权利人所有。未经授权，任何人不得擅自使用。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  七、免责声明
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  在法律允许的最大范围内，本平台对因使用或无法使用本平台服务所造成的任何间接、附带、特殊、惩罚性或后果性损失不承担责任。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  八、协议终止
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  用户违反本协议条款的，本平台有权单方面终止服务。用户也可以随时申请注销账号终止本协议。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  九、争议解决
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  本协议的订立、执行和解释均适用中华人民共和国法律。如发生争议，双方应友好协商解决；协商不成的，任何一方均可向本平台所在地人民法院提起诉讼。
                </p>

                <div className="mt-10 pt-6 border-t border-gold-200/50">
                  <p className="text-jade-500 text-sm">
                    如有疑问，请通过 contact@jianzhenge.com 联系我们。
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
