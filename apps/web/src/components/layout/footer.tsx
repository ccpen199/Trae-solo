import Link from 'next/link';
import { ROUTES, APP_NAME } from '@/lib/constants';
import { Separator } from '@/components/ui/separator';

const footerLinks = {
  shop: {
    title: '购物',
    links: [
      { name: '猫粮', href: `${ROUTES.PRODUCTS}?category=cat_food` },
      { name: '狗粮', href: `${ROUTES.PRODUCTS}?category=dog_food` },
      { name: '水族用品', href: `${ROUTES.PRODUCTS}?category=aquarium` },
      { name: '洗护美容', href: `${ROUTES.PRODUCTS}?category=grooming` },
      { name: '医疗健康', href: `${ROUTES.PRODUCTS}?category=medical` },
    ],
  },
  community: {
    title: '社区',
    links: [
      { name: '话题广场', href: ROUTES.COMMUNITY },
      { name: '宠物领养', href: ROUTES.ADOPTION },
      { name: '在线问诊', href: ROUTES.DOCTOR },
      { name: '限时秒杀', href: ROUTES.FLASH_SALE },
      { name: '会员中心', href: ROUTES.MEMBERSHIP },
    ],
  },
  support: {
    title: '服务支持',
    links: [
      { name: '帮助中心', href: '#' },
      { name: '售后保障', href: '#' },
      { name: '配送说明', href: '#' },
      { name: '退换政策', href: '#' },
      { name: '商家入驻', href: '#' },
    ],
  },
  about: {
    title: '关于我们',
    links: [
      { name: '关于宠趣', href: '#' },
      { name: '联系我们', href: '#' },
      { name: '用户协议', href: '#' },
      { name: '隐私政策', href: '#' },
    ],
  },
};

export function Footer() {
  return (
    <footer className="border-t bg-background">
      <div className="container py-10">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              <span className="text-xl font-bold text-primary">{APP_NAME}</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              爱宠生活，从这里开始。为每一位宠物主人提供优质商品和专业服务。
            </p>
            <div className="mt-4 flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                微
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                博
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                抖
              </div>
            </div>
          </div>
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold">{section.title}</h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <Separator className="my-8" />
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2024 {APP_NAME}. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>客服热线：400-888-6666</span>
            <span>服务时间：9:00-21:00</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
