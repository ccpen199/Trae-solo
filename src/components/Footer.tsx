import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, Heart, Sparkles } from "lucide-react";
import BilingualText from "./BilingualText";

const quickLinks = [
  { path: "/", zh: "首页", it: "Home" },
  { path: "/translate", zh: "智能互译", it: "Traduzione" },
  { path: "/projects", zh: "项目库", it: "Progetti" },
  { path: "/pocket", zh: "随身翻译", it: "Tascabile" },
  { path: "/news", zh: "资讯聚合", it: "Notizie" },
  { path: "/about", zh: "关于我们", it: "Chi Siamo" },
];

const serviceLinks = [
  { path: "/projects", zh: "中意合作项目", it: "Progetti di Cooperazione" },
  { path: "/translate", zh: "专业翻译服务", it: "Servizi di Traduzione" },
  { path: "/news", zh: "政策资讯", it: "Notizie e Politiche" },
  { path: "/contact", zh: "联系我们", it: "Contattaci" },
];

export default function Footer() {
  return (
    <footer className="relative bg-charcoal-700 text-charcoal-100 overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-30" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-cn-red-500 via-warm-gold-500 to-it-green-500" />

      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-cn-red-500/10 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-it-green-500/10 blur-3xl" />

      <div className="relative container mx-auto px-4 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center">
                <span className="text-2xl">🇨🇳</span>
                <div className="w-0.5 h-5 mx-0.5 bg-gradient-to-b from-cn-red-500 via-warm-gold-500 to-it-green-500 rounded-full" />
                <span className="text-2xl">🇮🇹</span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display-zh text-lg font-bold bg-clip-text text-transparent bg-text-gradient-cnit">
                  中意桥
                </span>
                <span className="font-display-it text-xs text-charcoal-300 -mt-0.5">
                  Ponte Cina-Italia
                </span>
              </div>
            </div>

            <p className="text-charcoal-300 text-sm leading-relaxed mb-4 font-sans-zh">
              <BilingualText
                zh="连接中意文化与商务的桥梁，提供专业翻译、项目合作、资讯聚合等一体化服务。"
                it="Un ponte tra cultura e affari Cina-Italia, offrendo traduzioni professionali, collaborazione su progetti e aggregazione di notizie."
              />
            </p>

            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-warm-gold-400" />
              <div className="flex gap-1">
                <div className="w-8 h-1.5 rounded-full bg-cn-red-500" />
                <div className="w-8 h-1.5 rounded-full bg-warm-gold-500" />
                <div className="w-8 h-1.5 rounded-full bg-it-green-500" />
              </div>
              <Sparkles className="w-4 h-4 text-warm-gold-400" />
            </div>
          </div>

          <div>
            <h4 className="font-display-zh font-semibold text-white mb-5 text-base">
              <BilingualText zh="快速导航" it="Navigazione Rapida" />
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-charcoal-300 hover:text-warm-gold-400 transition-colors duration-200"
                  >
                    <BilingualText zh={link.zh} it={link.it} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display-zh font-semibold text-white mb-5 text-base">
              <BilingualText zh="服务项目" it="Servizi" />
            </h4>
            <ul className="space-y-3">
              {serviceLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-charcoal-300 hover:text-warm-gold-400 transition-colors duration-200"
                  >
                    <BilingualText zh={link.zh} it={link.it} />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display-zh font-semibold text-white mb-5 text-base">
              <BilingualText zh="联系方式" it="Contatti" />
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-warm-gold-400 mt-0.5 shrink-0" />
                <div className="text-sm text-charcoal-300 leading-relaxed">
                  <BilingualText
                    zh="北京市朝阳区 & 罗马市中央区"
                    it="Pechino, Chaoyang & Roma, Centro"
                  />
                </div>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-warm-gold-400 shrink-0" />
                <a
                  href="mailto:contact@ponte-cina-italia.it"
                  className="text-sm text-charcoal-300 hover:text-warm-gold-400 transition-colors duration-200"
                >
                  contact@ponte-cina-italia.it
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-warm-gold-400 shrink-0" />
                <div className="text-sm text-charcoal-300">
                  +86 010-XXXX-XXXX / +39 06-XXXXXXX
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="divider-gold my-10" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap justify-center md:justify-start">
            <span className="text-2xl">🏛️</span>
            <span className="text-xl">🎨</span>
            <span className="text-2xl">🍝</span>
            <span className="text-xl">🍵</span>
            <span className="text-2xl">🏺</span>
          </div>

          <p className="text-sm text-charcoal-400 flex items-center gap-1.5 text-center md:text-right">
            <BilingualText
              zh="© 2025 中意桥. 保留所有权利. 用"
              it="© 2025 Ponte Cina-Italia. Tutti i diritti riservati. Fatto con"
            />
            <Heart className="w-3.5 h-3.5 text-cn-red-400 fill-cn-red-400" />
            <BilingualText zh="于北京与罗马" it="a Pechino e Roma" />
          </p>
        </div>
      </div>
    </footer>
  );
}
