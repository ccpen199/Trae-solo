'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
      <AlertCircle className="h-16 w-16 text-destructive" />
      <h1 className="text-2xl font-bold">出错了</h1>
      <p className="text-muted-foreground">
        页面加载遇到了一些问题，请稍后重试
      </p>
      <Button onClick={reset} size="lg">
        <RefreshCw className="mr-2 h-4 w-4" />
        重新加载
      </Button>
    </div>
  );
}
