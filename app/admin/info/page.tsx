'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTelegramWebApp, isAdmin } from '@/lib/telegram';
import { ArrowLeft, Shield, Zap, Star, Award, Edit, Save, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface InfoPage {
  id: string;
  title: string;
  subtitle: string;
  items: string[];
  advantage: string;
}

const pageConfig = {
  check: { icon: Shield, label: 'Проверка', color: 'text-blue-500' },
  tradein: { icon: Zap, label: 'Trade-in', color: 'text-yellow-500' },
  documents: { icon: Star, label: 'Оформление', color: 'text-purple-500' },
  warranty: { icon: Award, label: 'Гарантия', color: 'text-green-500' },
};

export default function AdminInfoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [pages, setPages] = useState<InfoPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPage, setEditingPage] = useState<string | null>(null);
  const [editData, setEditData] = useState<InfoPage | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      router.push('/');
      return;
    }

    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => router.push('/admin'));
    }

    loadPages();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  const loadPages = async () => {
    try {
      const { data, error } = await supabase
        .from('info_pages')
        .select('*')
        .in('id', ['check', 'tradein', 'documents', 'warranty']);

      if (error) throw error;
      setPages(data || []);
    } catch (error) {
      console.error('Error loading pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (page: InfoPage) => {
    setEditingPage(page.id);
    setEditData({ ...page, items: [...page.items] });
  };

  const cancelEdit = () => {
    setEditingPage(null);
    setEditData(null);
  };

  const addItem = () => {
    if (!editData) return;
    setEditData({
      ...editData,
      items: [...editData.items, '']
    });
  };

  const removeItem = (index: number) => {
    if (!editData) return;
    setEditData({
      ...editData,
      items: editData.items.filter((_, i) => i !== index)
    });
  };

  const updateItem = (index: number, value: string) => {
    if (!editData) return;
    const newItems = [...editData.items];
    newItems[index] = value;
    setEditData({
      ...editData,
      items: newItems
    });
  };

  const saveChanges = async () => {
    if (!editData) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('info_pages')
        .update({
          title: editData.title,
          subtitle: editData.subtitle,
          items: editData.items.filter(item => item.trim() !== ''),
          advantage: editData.advantage,
        })
        .eq('id', editData.id);

      if (error) throw error;

      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }

      showToast('Изменения сохранены!', 'success');
      setEditingPage(null);
      setEditData(null);
      loadPages();
    } catch (error) {
      console.error('Error saving:', error);
      showToast('Ошибка сохранения', 'error');
    } finally {
      setSaving(false);
    }
  };

  const getPageData = (pageId: string) => {
    return pages.find(p => p.id === pageId);
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Шапка */}
      <div className="sticky top-0 bg-tg-bg/95 backdrop-blur-md z-10 border-b border-tg-hint/10">
        <div className="px-4 py-3">
          <button
            onClick={() => router.push('/admin')}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 pb-4">
          <h1 className="text-2xl font-bold text-gradient">Информация</h1>
          <p className="text-sm text-tg-hint mt-1">Редактирование информационных страниц</p>
        </div>
      </div>

      <div className="px-4 space-y-4 mt-4">
        {loading ? (
          <div className="text-center py-12 text-tg-hint">Загрузка...</div>
        ) : (
          Object.entries(pageConfig).map(([pageId, config]) => {
            const page = getPageData(pageId);
            const Icon = config.icon;
            const isEditing = editingPage === pageId;

            return (
              <div key={pageId} className="tg-card overflow-hidden">
                {/* Заголовок карточки */}
                <div className="p-4 border-b border-tg-hint/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl bg-tg-secondary-bg flex items-center justify-center ${config.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">{config.label}</h3>
                      <p className="text-xs text-tg-hint">/info/{pageId}</p>
                    </div>
                  </div>

                  {!isEditing && (
                    <button
                      onClick={() => page && startEdit(page)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-tg-accent/10 text-tg-accent text-sm font-medium"
                    >
                      <Edit className="w-4 h-4" />
                      Изменить
                    </button>
                  )}
                </div>

                {/* Контент */}
                {isEditing && editData ? (
                  <div className="p-4 space-y-4">
                    {/* Заголовок */}
                    <div>
                      <label className="text-xs text-tg-hint uppercase tracking-wider mb-2 block">
                        Заголовок
                      </label>
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                        className="w-full p-3 rounded-xl bg-tg-secondary-bg border border-tg-hint/20 focus:border-tg-accent outline-none"
                      />
                    </div>

                    {/* Подзаголовок */}
                    <div>
                      <label className="text-xs text-tg-hint uppercase tracking-wider mb-2 block">
                        Подзаголовок
                      </label>
                      <input
                        type="text"
                        value={editData.subtitle}
                        onChange={(e) => setEditData({ ...editData, subtitle: e.target.value })}
                        className="w-full p-3 rounded-xl bg-tg-secondary-bg border border-tg-hint/20 focus:border-tg-accent outline-none"
                      />
                    </div>

                    {/* Пункты */}
                    <div>
                      <label className="text-xs text-tg-hint uppercase tracking-wider mb-2 block">
                        Пункты списка
                      </label>
                      <div className="space-y-2">
                        {editData.items.map((item, index) => (
                          <div key={index} className="flex gap-2">
                            <input
                              type="text"
                              value={item}
                              onChange={(e) => updateItem(index, e.target.value)}
                              placeholder={`Пункт ${index + 1}`}
                              className="flex-1 p-3 rounded-xl bg-tg-secondary-bg border border-tg-hint/20 focus:border-tg-accent outline-none text-sm"
                            />
                            <button
                              onClick={() => removeItem(index)}
                              className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={addItem}
                        className="mt-2 flex items-center gap-2 px-4 py-2 rounded-xl bg-tg-accent/10 text-tg-accent text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Добавить пункт
                      </button>
                    </div>

                    {/* Преимущество */}
                    <div>
                      <label className="text-xs text-tg-hint uppercase tracking-wider mb-2 block">
                        Преимущество
                      </label>
                      <textarea
                        value={editData.advantage}
                        onChange={(e) => setEditData({ ...editData, advantage: e.target.value })}
                        rows={2}
                        className="w-full p-3 rounded-xl bg-tg-secondary-bg border border-tg-hint/20 focus:border-tg-accent outline-none resize-none"
                      />
                    </div>

                    {/* Кнопки */}
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={cancelEdit}
                        className="flex-1 py-3 rounded-xl bg-tg-secondary-bg text-tg-text font-medium flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Отмена
                      </button>
                      <button
                        onClick={saveChanges}
                        disabled={saving}
                        className="flex-1 py-3 rounded-xl bg-tg-accent text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        {saving ? 'Сохранение...' : 'Сохранить'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4">
                    {page ? (
                      <div className="space-y-2">
                        <p className="font-medium">{page.title}</p>
                        <p className="text-sm text-tg-hint">{page.items.length} пунктов</p>
                      </div>
                    ) : (
                      <p className="text-tg-hint text-sm">Данные не загружены</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
