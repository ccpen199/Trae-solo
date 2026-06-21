import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';
import { Card } from '@/components/ui/Card';

export default function Privacy() {
  return (
    <div className="bg-paper min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-ink-gradient py-16 px-4">
          <div className="container text-center">
            <Shield className="w-12 h-12 text-gold-300 mx-auto mb-4" />
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-gold-300 mb-4">
              隐私政策
            </h1>
            <p className="text-jade-200">最后更新时间：2024年1月1日</p>
          </div>
        </div>

        <div className="container py-16 max-w-4xl">
          <Card>
            <Card.Content>
              <div className="prose prose-jade max-w-none">
                <p className="text-jade-600 leading-relaxed">
                  鉴真阁非常重视您的个人信息和隐私安全。本隐私政策将帮助您了解我们如何收集、使用、存储和保护您的个人信息。请您在使用本平台前仔细阅读本政策。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  一、信息收集
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  我们会收集以下类型的信息：
                </p>
                <ul className="list-disc list-inside text-jade-600 leading-relaxed space-y-2">
                  <li><strong>注册信息：</strong>手机号、昵称、密码等账号信息</li>
                  <li><strong>身份信息：</strong>实名认证所需的真实姓名、身份证号等（可选）</li>
                  <li><strong>业务数据：</strong>您上传的藏品图片、鉴定申请、交易记录等</li>
                  <li><strong>设备信息：</strong>设备型号、操作系统、浏览器类型等技术信息</li>
                  <li><strong>日志信息：</strong>浏览记录、搜索记录、点击记录等使用行为</li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  二、信息使用
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  我们收集的信息将用于以下目的：
                </p>
                <ul className="list-disc list-inside text-jade-600 leading-relaxed space-y-2">
                  <li>为您提供鉴定、证书、社区等核心服务</li>
                  <li>进行AI图像识别模型训练（您上传的图片将进行脱敏处理）</li>
                  <li>改进和优化平台功能与用户体验</li>
                  <li>向您推送相关服务信息（您可随时取消）</li>
                  <li>保障账号安全与平台风控</li>
                  <li>遵守法律法规要求</li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  三、信息共享
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  我们不会向第三方出售您的个人信息。仅在以下情况下，我们可能会共享您的信息：
                </p>
                <ul className="list-disc list-inside text-jade-600 leading-relaxed space-y-2">
                  <li>事先获得您的明确同意</li>
                  <li>为完成鉴定服务向相关专家共享必要的藏品信息</li>
                  <li>与受信任的合作伙伴共享用于数据统计分析（已脱敏）</li>
                  <li>根据法律法规或司法机关要求</li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  四、信息存储与保护
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  您的个人信息存储于中华人民共和国境内。我们采用行业标准的安全技术和管理措施保护您的信息安全，包括数据加密、访问控制、安全审计等。鉴定证书相关数据采用区块链存证技术，确保不可篡改、永久可溯。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  五、您的权利
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  您对您的个人信息享有以下权利：
                </p>
                <ul className="list-disc list-inside text-jade-600 leading-relaxed space-y-2">
                  <li>访问、更正您的个人信息</li>
                  <li>删除您的个人信息或注销账号</li>
                  <li>撤回您的授权同意</li>
                  <li>获取您的个人信息副本</li>
                  <li>投诉举报我们的隐私合规问题</li>
                </ul>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  六、未成年人保护
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  本平台主要面向成年用户。如果您是未满18周岁的未成年人，请在监护人的陪同下阅读本政策并使用本平台服务。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  七、政策更新
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  我们可能会适时更新本隐私政策。更新后的政策将在本平台公布，重大变更将通过站内通知或邮件方式告知您。
                </p>

                <h2 className="font-serif text-2xl font-bold text-jade-700 mt-8">
                  八、联系我们
                </h2>
                <p className="text-jade-600 leading-relaxed">
                  如您对本隐私政策有任何疑问、意见或建议，或希望行使您的权利，请通过以下方式联系我们：
                </p>
                <ul className="list-disc list-inside text-jade-600 leading-relaxed space-y-2">
                  <li>邮箱：privacy@jianzhenge.com</li>
                  <li>电话：400-888-8888</li>
                  <li>地址：北京市东城区琉璃厂文化街鉴真阁大厦</li>
                </ul>
              </div>
            </Card.Content>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}
