'use client';

import { memo, useState } from 'react';
import { MapPin, Plus, Check, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OrderAddress } from '@pet/shared/types';

interface AddressSelectorProps {
  addresses: OrderAddress[];
  selectedId?: string;
  onSelect: (address: OrderAddress) => void;
  onAdd?: () => void;
  onEdit?: (address: OrderAddress) => void;
  onDelete?: (address: OrderAddress) => void;
}

export const AddressSelector = memo(function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}: AddressSelectorProps) {
  const [expanded, setExpanded] = useState(false);

  const selectedAddress = addresses.find(
    (a) => (a as OrderAddress & { id?: string }).id === selectedId,
  );
  const displayAddresses = expanded ? addresses : addresses.slice(0, 1);

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-pet-orange" />
          <h3 className="text-sm font-semibold text-foreground">收货地址</h3>
        </div>
        {onAdd && (
          <button
            className="flex items-center gap-1 text-xs text-pet-orange hover:text-pet-coral"
            onClick={onAdd}
          >
            <Plus className="h-3.5 w-3.5" />
            新增地址
          </button>
        )}
      </div>

      {!addresses.length ? (
        <div className="flex flex-col items-center py-6 text-muted-foreground">
          <MapPin className="mb-2 h-8 w-8" />
          <p className="text-sm">暂无收货地址</p>
          {onAdd && (
            <button
              className="mt-2 text-xs text-pet-orange hover:text-pet-coral"
              onClick={onAdd}
            >
              添加收货地址
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {(expanded ? addresses : displayAddresses).map((address, index) => {
            const addrId = (address as OrderAddress & { id?: string }).id;
            const isSelected = addrId === selectedId || (!selectedId && index === 0);

            return (
              <div
                key={addrId || index}
                className={cn(
                  'relative rounded-md border p-3 transition-colors cursor-pointer',
                  isSelected
                    ? 'border-pet-orange bg-pet-cream/50'
                    : 'hover:border-pet-orange/50',
                )}
                onClick={() => onSelect(address)}
              >
                {isSelected && (
                  <div className="absolute right-2 top-2">
                    <Check className="h-4 w-4 text-pet-orange" />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{address.name}</span>
                  <span className="text-sm text-muted-foreground">{address.phone}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {address.province}{address.city}{address.district} {address.detail}
                </p>
                <div className="mt-2 flex gap-2">
                  {onEdit && (
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(address);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      className="text-xs text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(address);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {addresses.length > 1 && (
            <button
              className="w-full py-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? '收起' : `查看全部${addresses.length}个地址`}
            </button>
          )}
        </div>
      )}
    </div>
  );
});
