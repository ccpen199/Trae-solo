'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ImagePlus, X, MapPin } from 'lucide-react';
import type { PetType } from '@pet/shared/types';
import { PET_TYPE_LABELS } from '@pet/shared/constants';

const petOptions: { value: PetType; label: string }[] = [
  { value: 'cat', label: '🐱 猫咪' },
  { value: 'dog', label: '🐶 狗狗' },
  { value: 'fish', label: '🐟 水族' },
  { value: 'bird', label: '🐦 鸟类' },
  { value: 'hamster', label: '🐹 仓鼠' },
  { value: 'rabbit', label: '🐰 兔子' },
];

export default function CreateMomentPage() {
  const [content, setContent] = useState('');
  const [selectedPet, setSelectedPet] = useState<string>('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');

  const handleSubmit = () => {
    if (!content.trim()) return;
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl py-4">
        <div className="flex items-center justify-between mb-6">
          <Link href="/social" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            取消
          </Link>
          <button
            onClick={handleSubmit}
            disabled={!content.trim()}
            className="rounded-full bg-pet-orange px-5 py-2 text-sm font-medium text-white hover:bg-pet-coral transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            发布
          </button>
        </div>

        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="分享你和宠物的日常..."
            rows={6}
            className="w-full rounded-lg border bg-card px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-pet-orange/50 placeholder:text-muted-foreground resize-none"
          />

          <div className="flex flex-wrap gap-2">
            {images.map((img, i) => (
              <div key={i} className="relative h-20 w-20 rounded-md bg-muted">
                <img src={img} alt="" className="h-full w-full object-cover rounded-md" />
                <button
                  onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                  className="absolute -top-1.5 -right-1.5 rounded-full bg-destructive p-0.5 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button className="flex h-20 w-20 items-center justify-center rounded-md border-2 border-dashed text-muted-foreground hover:border-pet-orange hover:text-pet-orange transition-colors">
                <ImagePlus className="h-6 w-6" />
              </button>
            )}
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">关联宠物</h3>
              <div className="flex flex-wrap gap-2">
                {petOptions.map((pet) => (
                  <button
                    key={pet.value}
                    onClick={() => setSelectedPet(selectedPet === pet.value ? '' : pet.value)}
                    className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                      selectedPet === pet.value
                        ? 'bg-pet-orange text-white'
                        : 'border text-muted-foreground hover:border-pet-orange hover:text-pet-orange'
                    }`}
                  >
                    {pet.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">位置</h3>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="添加位置"
                  className="flex-1 border-b bg-transparent py-1 text-sm outline-none focus:border-pet-orange"
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">可见范围</h3>
              <div className="flex gap-2">
                {([
                  { value: 'public' as const, label: '公开' },
                  { value: 'friends' as const, label: '好友可见' },
                  { value: 'private' as const, label: '仅自己' },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setVisibility(opt.value)}
                    className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                      visibility === opt.value
                        ? 'bg-pet-orange text-white'
                        : 'border text-muted-foreground hover:border-pet-orange hover:text-pet-orange'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
