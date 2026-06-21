import { motion } from 'framer-motion';
import { Award, Shield, Users, Target, Eye, Heart } from 'lucide-react';
import { Card } from '@/components/ui/Card';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function About() {
  const milestones = [
    { year: '2019', title: '平台成立', desc: '鉴真阁在北京琉璃厂正式成立，首批入驻国家级专家20位' },
    { year: '2020', title: 'AI初筛上线', desc: '联合故宫博物院技术团队，推出AI图像识别初筛系统' },
    { year: '2021', title: '区块链存证', desc: '接入国家文物局区块链平台，实现鉴定证书永久溯源' },
    { year: '2022', title: '专家破百', desc: '入驻认证专家突破100位，涵盖12大文玩品类' },
    { year: '2023', title: '社区开放', desc: '行家知识库与社区问答上线，注册用户突破50万' },
    { year: '2024', title: '开放平台', desc: 'API开放平台发布，赋能行业伙伴共建可信鉴定生态' },
  ];

  const values = [
    { icon: Target, title: '专业', desc: '只邀请国家级、省级权威专家入驻，每一份鉴定结论都经得起推敲' },
    { icon: Shield, title: '诚信', desc: '全流程区块链存证，鉴定结果公开透明，绝不弄虚作假' },
    { icon: Eye, title: '严谨', desc: '三重鉴定复核机制，多专家交叉验证，确保结论准确无误' },
    { icon: Heart, title: '传承', desc: '致力于让传统文化被看见、被珍视，让每件藏品都有序传承' },
  ];

  return (
    <div className="bg-paper min-h-screen">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-ink-gradient py-20 px-4">
          <div className="container text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-serif text-4xl md:text-5xl font-bold text-gold-300 mb-4"
            >
              关于鉴真阁
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-jade-200 text-lg max-w-2xl mx-auto"
            >
              汇聚名家，传承有序，让每一件文物都拥有可信的身份证明
            </motion.p>
          </div>
        </div>

        <div className="container py-16">
          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="max-w-4xl mx-auto mb-20"
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-jade-700 mb-4">我们的使命</h2>
              <div className="w-16 h-0.5 bg-gold-gradient mx-auto" />
            </motion.div>
            <motion.div variants={fadeInUp}>
              <Card>
                <Card.Content>
                  <p className="text-jade-600 leading-loose text-lg text-center">
                    鉴真阁致力于构建中国最专业、最可信的文玩艺术品在线鉴定平台。
                    我们汇聚国家级、省级权威鉴定专家，运用AI图像识别与区块链存证技术，
                    为藏家提供专业、便捷、可溯源的鉴定服务，让传统文化在数字时代有序传承。
                  </p>
                </Card.Content>
              </Card>
            </motion.div>
          </motion.section>

          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mb-20"
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-jade-700 mb-4">核心价值观</h2>
              <div className="w-16 h-0.5 bg-gold-gradient mx-auto" />
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div key={value.title} variants={fadeInUp}>
                    <Card hoverable className="h-full text-center">
                      <Card.Content>
                        <div className="w-16 h-16 rounded-full bg-ink-gradient flex items-center justify-center mx-auto mb-4 border-2 border-gold-400">
                          <Icon className="w-8 h-8 text-gold-300" />
                        </div>
                        <h3 className="font-serif text-xl font-semibold text-jade-700 mb-2">
                          {value.title}
                        </h3>
                        <p className="text-jade-500 text-sm leading-relaxed">{value.desc}</p>
                      </Card.Content>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-jade-700 mb-4">发展历程</h2>
              <div className="w-16 h-0.5 bg-gold-gradient mx-auto" />
            </motion.div>
            <div className="relative max-w-4xl mx-auto">
              <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gold-300/30 -translate-x-1/2 hidden md:block" />
              <div className="space-y-8">
                {milestones.map((milestone, index) => (
                  <motion.div
                    key={milestone.year}
                    variants={fadeInUp}
                    className={`flex items-center gap-6 ${
                      index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                    } flex-col`}
                  >
                    <div className="flex-1 w-full">
                      <Card>
                        <Card.Content>
                          <div className="flex items-center gap-3 mb-2">
                            <span className="seal-tag text-lg">{milestone.year}</span>
                            <h3 className="font-serif text-xl font-semibold text-jade-700">
                              {milestone.title}
                            </h3>
                          </div>
                          <p className="text-jade-500">{milestone.desc}</p>
                        </Card.Content>
                      </Card>
                    </div>
                    <div className="w-4 h-4 rounded-full bg-gold-gradient shrink-0 shadow-gold-glow hidden md:block" />
                    <div className="flex-1 hidden md:block" />
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="bg-ink-gradient rounded-2xl p-10 md:p-16 text-center">
              <motion.div variants={fadeInUp}>
                <Award className="w-16 h-16 text-gold-300 mx-auto mb-6" />
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-gold-300 mb-4">
                  携手共创可信鉴定生态
                </h2>
                <p className="text-jade-200 text-lg mb-8 max-w-2xl mx-auto">
                  无论您是资深藏家、业内专家，还是有志于文化传承的伙伴，
                  鉴真阁诚邀您共建可信、专业、透明的文玩鉴定新生态。
                </p>
              </motion.div>
            </div>
          </motion.section>
        </div>
      </motion.div>
    </div>
  );
}
