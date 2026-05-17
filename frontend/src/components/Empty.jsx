import { Inbox } from 'lucide-react';

export default function Empty({ message = '暂无数据', type = 'default' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <Inbox className="w-16 h-16 text-neutral-300 mb-4" />
      <p className="text-neutral-500 text-sm">{message}</p>
    </div>
  );
}
