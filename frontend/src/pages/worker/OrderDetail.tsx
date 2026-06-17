import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  Star,
  Shield,
  Phone,
  MessageCircle,
  Tag as TagIcon,
  AlertCircle,
  ChevronRight,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

export default function WorkerOrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const skills = ['搬家搬运', '重型搬运', '家具拆装']

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>
          <h1 className="text-base font-bold text-gray-900">需求详情</h1>
          <Tag color="green" size="sm" className="ml-auto">招募中</Tag>
        </div>
      </header>

      <div className="flex-1 p-4 space-y-4 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-5 text-white shadow-xl shadow-emerald-500/30"
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 pr-3">
              <h2 className="text-xl font-bold mb-2">办公室搬迁需要3名搬运工</h2>
              <div className="flex items-center gap-2">
                <Tag color="green" size="sm" className="!bg-white/20 !text-white !border-white/30">搬家搬运</Tag>
                <Tag color="cyan" size="sm" className="!bg-white/20 !text-white !border-white/30">急单</Tag>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-2 pt-3 border-t border-white/20">
            <span className="text-white/80 text-sm">预计收入</span>
            <span className="text-4xl font-extrabold tracking-tight">¥320</span>
            <span className="text-white/70 text-sm mb-1">/人</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="!p-0 overflow-hidden">
            <div className="h-40 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center relative">
              <MapPin className="w-12 h-12 text-emerald-500" />
              <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 line-clamp-1">朝阳区望京SOHO T3 B座</span>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card>
            <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-emerald-500" />
              需求信息
            </h3>
            <div className="space-y-3.5">
              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">服务时间</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">今天 14:00 - 18:00（约4小时）</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">人员需求</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">共需 3 人，已报名 2 人</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-gray-500">技能要求</p>
                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                    {skills.map((s) => (
                      <Tag key={s} color="green" size="sm">{s}</Tag>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <h3 className="text-base font-bold text-gray-900 mb-3">需求详情</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              公司从望京SOHO搬迁至中关村软件园，需要搬运办公桌椅、文件柜、电脑设备等。
              无需拆装，主要是搬运上下楼和装车运输。物品约 20 件，有电梯。
              要求工人自备手套，着装整洁。
            </p>
            <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 rounded-xl p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>雇主已为该订单购买平台保险，最高赔付 5 万元</span>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-gray-900">雇主信息</h3>
              <Tag color="green" size="sm">已认证</Tag>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                张
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">张**</span>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs text-gray-700 font-medium">4.9</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">累计发布 68 单 · 好评率 99%</p>
              </div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"
                >
                  <Phone className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600"
                >
                  <MessageCircle className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="!p-0">
            <button className="w-full px-4 py-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span className="text-sm font-medium text-gray-900">服务保障</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span>工资担保 · 意外险</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </Card>
        </motion.div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 px-4 py-3 pb-safe-area-inset-bottom z-40">
        <div className="flex items-center gap-3">
          <Button size="lg" variant="secondary" fullWidth>
            还价
          </Button>
          <Button
            size="lg"
            fullWidth
            className="!bg-gradient-to-r !from-emerald-500 !to-teal-600 hover:!from-emerald-600 hover:!to-teal-700 shadow-emerald-500/30"
          >
            一键接单
          </Button>
        </div>
      </div>
    </div>
  )
}
