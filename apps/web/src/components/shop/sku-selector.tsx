'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ProductAttribute, ProductSKU } from '@pet/shared/types';

interface SkuSelectorProps {
  attributes: ProductAttribute[];
  skus: ProductSKU[];
  onSkuChange: (sku: ProductSKU | null) => void;
}

export function SkuSelector({ attributes, skus, onSkuChange }: SkuSelectorProps) {
  const [selected, setSelected] = useState<Record<string, string>>({});

  const variantAttributes = useMemo(
    () => attributes.filter((attr) => attr.isVariant),
    [attributes],
  );

  const currentSku = useMemo(() => {
    if (!variantAttributes.length) return skus[0] || null;
    const allSelected = variantAttributes.every((attr) => selected[attr.name]);
    if (!allSelected) return null;
    return (
      skus.find((sku) =>
        variantAttributes.every((attr) => sku.attributes[attr.name] === selected[attr.name]),
      ) || null
    );
  }, [selected, variantAttributes, skus]);

  const isValueAvailable = useCallback(
    (attrName: string, value: string): boolean => {
      const otherSelected = { ...selected };
      delete otherSelected[attrName];

      return skus.some((sku) => {
        const matchesOther = Object.entries(otherSelected).every(
          ([key, val]) => sku.attributes[key] === val,
        );
        return matchesOther && sku.attributes[attrName] === value && sku.stock > 0;
      });
    },
    [selected, skus],
  );

  const handleSelect = useCallback(
    (attrName: string, value: string) => {
      const next = { ...selected, [attrName]: value };
      setSelected(next);

      const allSelected = variantAttributes.every((attr) => next[attr.name]);
      if (allSelected) {
        const matched = skus.find((sku) =>
          variantAttributes.every((attr) => sku.attributes[attr.name] === next[attr.name]),
        );
        onSkuChange(matched || null);
      } else {
        onSkuChange(null);
      }
    },
    [selected, skus, variantAttributes, onSkuChange],
  );

  return (
    <div className="space-y-4">
      {variantAttributes.map((attr) => (
        <div key={attr.name}>
          <p className="mb-2 text-sm font-medium text-foreground">
            {attr.name}
            {selected[attr.name] && (
              <span className="ml-2 text-pet-orange">已选：{selected[attr.name]}</span>
            )}
          </p>
          <div className="flex flex-wrap gap-2">
            {attr.values.map((value) => {
              const available = isValueAvailable(attr.name, value);
              const isSelected = selected[attr.name] === value;

              return (
                <button
                  key={value}
                  disabled={!available}
                  className={cn(
                    'rounded-md border px-3 py-1.5 text-sm transition-colors',
                    isSelected
                      ? 'border-pet-orange bg-pet-cream text-pet-orange'
                      : available
                        ? 'border-border hover:border-pet-orange hover:text-pet-orange'
                        : 'cursor-not-allowed border-border bg-muted text-muted-foreground line-through',
                  )}
                  onClick={() => handleSelect(attr.name, value)}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {currentSku && (
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">库存</span>
            <span className={currentSku.stock > 0 ? 'text-foreground' : 'text-destructive'}>
              {currentSku.stock > 0 ? `${currentSku.stock}件` : '已售罄'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
