'use client';

import { useState } from 'react';
import { FilterParams } from '@/types';
import { X } from 'lucide-react';

interface FilterModalProps {
  filters: FilterParams;
  onApply: (filters: FilterParams) => void;
  onClose: () => void;
}

export default function FilterModal({ filters, onApply, onClose }: FilterModalProps) {
  const [localFilters, setLocalFilters] = useState<FilterParams>(filters);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    setLocalFilters({});
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-tg-bg w-full rounded-t-3xl max-h-[80vh] overflow-y-auto fade-in">
        {/* Шапка */}
        <div className="sticky top-0 bg-tg-bg border-b border-tg-hint/20 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Фильтры</h2>
          <button onClick={onClose} className="p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Фильтры */}
        <div className="p-4 space-y-4">
          {/* Бренд */}
          <div>
            <label className="block text-sm font-medium mb-2">Бренд</label>
            <input
              type="text"
              placeholder="Например: Toyota"
              value={localFilters.brand || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, brand: e.target.value })
              }
              className="tg-input"
            />
          </div>

          {/* Год */}
          <div>
            <label className="block text-sm font-medium mb-2">Год выпуска</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="От"
                value={localFilters.year_from || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    year_from: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="tg-input"
              />
              <input
                type="number"
                placeholder="До"
                value={localFilters.year_to || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    year_to: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="tg-input"
              />
            </div>
          </div>

          {/* Цена */}
          <div>
            <label className="block text-sm font-medium mb-2">Цена, ₽</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="От"
                value={localFilters.price_from || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    price_from: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="tg-input"
              />
              <input
                type="number"
                placeholder="До"
                value={localFilters.price_to || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    price_to: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="tg-input"
              />
            </div>
          </div>

          {/* Тип кузова */}
          <div>
            <label className="block text-sm font-medium mb-2">Тип кузова</label>
            <select
              value={localFilters.body_type || ''}
              onChange={(e) =>
                setLocalFilters({ ...localFilters, body_type: e.target.value || undefined })
              }
              className="tg-input"
            >
              <option value="">Любой</option>
              <option value="sedan">Седан</option>
              <option value="suv">Внедорожник</option>
              <option value="hatchback">Хэтчбек</option>
              <option value="wagon">Универсал</option>
              <option value="coupe">Купе</option>
              <option value="minivan">Минивэн</option>
            </select>
          </div>
        </div>

        {/* Кнопки */}
        <div className="sticky bottom-0 bg-tg-bg border-t border-tg-hint/20 p-4 space-y-2">
          <button onClick={handleApply} className="w-full tg-button">
            Применить
          </button>
          <button onClick={handleReset} className="w-full tg-button-secondary tg-button">
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>
  );
}
