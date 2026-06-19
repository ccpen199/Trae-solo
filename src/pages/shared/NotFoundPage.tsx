import { motion } from "framer-motion";
import { Home, ArrowLeft, Search, Compass } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-neutral-warm flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
        >
          <div className="relative mb-8">
            <motion.h1
              className="font-serif text-[140px] md:text-[180px] font-bold leading-none"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <span className="text-primary-700">4</span>
              <motion.span
                className="inline-block text-gradient-gold"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              >
                0
              </motion.span>
              <span className="text-primary-700">4</span>
            </motion.h1>

            <motion.div
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.6 }}
            >
              <div className="w-40 h-40 md:w-52 md:h-52 rounded-full bg-gold-gradient opacity-10 blur-3xl" />
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h2 className="font-serif text-2xl md:text-3xl font-semibold text-primary-800 mb-3">
              页面走丢了
            </h2>
            <p className="text-primary-500 mb-8 max-w-md mx-auto">
              抱歉，您访问的页面不存在或已被移除。请检查URL是否正确，或返回首页继续浏览。
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
          >
            <button
              onClick={() => navigate("/")}
              className="btn-gold px-6 py-3"
            >
              <Home className="w-4 h-4 mr-2" />
              返回首页
            </button>
            <button
              onClick={() => navigate(-1)}
              className="btn-outline px-6 py-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回上一页
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {[
              {
                icon: Home,
                title: "首页",
                desc: "浏览平台功能和律师",
                path: "/",
              },
              {
                icon: Search,
                title: "提交咨询",
                desc: "免费获取法律帮助",
                path: "/submit",
              },
              {
                icon: Compass,
                title: "我的咨询",
                desc: "查看历史咨询记录",
                path: "/consultations",
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <motion.button
                  key={item.title}
                  onClick={() => navigate(item.path)}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="card card-hover p-5 text-left group"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent-gold/10 flex items-center justify-center mb-3 group-hover:bg-gold-gradient transition-colors">
                    <Icon className="w-5 h-5 text-accent-gold group-hover:text-primary-900 transition-colors" />
                  </div>
                  <h3 className="font-serif text-base font-semibold text-primary-800 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-primary-500">{item.desc}</p>
                </motion.button>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
