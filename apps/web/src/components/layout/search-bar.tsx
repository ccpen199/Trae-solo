'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ROUTES } from '@/lib/constants';

export function SearchBar() {
  const [keyword, setKeyword] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    router.push(`${ROUTES.SEARCH}?q=${encodeURIComponent(keyword.trim())}`);
  };

  return (
    <form onSubmit={handleSearch} className="relative mx-auto max-w-md">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="搜索商品、品牌、话题..."
        className="h-9 pl-9 pr-4 text-sm"
      />
    </form>
  );
}
