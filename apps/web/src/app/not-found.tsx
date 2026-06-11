import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/lib/constants';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <div className="text-8xl">🐾</div>
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-lg text-muted-foreground">
        哎呀，这个页面好像走丢了...
      </p>
      <p className="text-sm text-muted-foreground">
        可能是小猫把页面叼走了，试试回到首页看看吧！
      </p>
      <Link href={ROUTES.HOME}>
        <Button size="lg">
          <Home className="mr-2 h-4 w-4" />
          返回首页
        </Button>
      </Link>
    </div>
  );
}
