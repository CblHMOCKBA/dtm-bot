'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTelegramWebApp, isAdmin } from '@/lib/telegram';
import { ArrowLeft, Send, Image as ImageIcon, X, Users } from 'lucide-react';

export default function PostsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [text, setText] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [usersCount, setUsersCount] = useState(0);

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

    loadUsersCount();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  const loadUsersCount = async () => {
    try {
      const { count } = await supabase
        .from('bot_users')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      
      setUsersCount(count || 0);
    } catch (error) {
      console.error('Error loading users count:', error);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `post_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `posts/${fileName}`;

      const { data, error } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      setPhotoUrl(publicUrl);

      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      alert('Фото загружено!');
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      alert(error.message || 'Ошибка загрузки фото');
      
      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setPhotoUrl('');
    alert('Фото удалено');
  };

  const handleSend = async () => {
    if (!text.trim()) {
      alert('Введите текст поста');
      return;
    }

    if (!confirm(`Отправить пост ${usersCount} пользователям?`)) {
      return;
    }

    setLoading(true);

    try {
      // Сохраняем пост в БД
      const { error: dbError } = await supabase
        .from('posts')
        .insert({
          text: text.trim(),
          photo_url: photoUrl || null,
        });

      if (dbError) throw dbError;

      // Отправляем через API
      const response = await fetch('/api/telegram/send-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text.trim(),
          photo_url: photoUrl || null,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка отправки');
      }

      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('success');
      }

      alert(`Пост отправлен! Успешно: ${result.success}, Ошибок: ${result.failed}`);

      // Очищаем форму
      setText('');
      setPhotoUrl('');

      // Возвращаемся в админку через 2 секунды
      setTimeout(() => {
        router.push('/admin');
      }, 2000);
    } catch (error: any) {
      console.error('Error sending post:', error);
      alert(error.message || 'Ошибка отправки поста');
      
      const tg = getTelegramWebApp();
      if (tg) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-6">
      {/* Шапка */}
      <div className="sticky top-0 bg-tg-bg z-10 border-b border-tg-hint/10">
        <div className="px-4 py-3">
          <button
            onClick={() => router.push('/admin')}
            className="premium-back-button"
            aria-label="Назад"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          <h1 className="text-2xl font-bold">Создать пост</h1>
          
          {/* Счетчик пользователей */}
          <div className="flex items-center gap-2 text-sm text-tg-hint">
            <Users className="w-4 h-4" />
            <span>Получат: {usersCount} пользователей</span>
          </div>
        </div>
      </div>

      {/* Форма */}
      <div className="px-4 space-y-4">
        {/* Текст поста */}
        <div className="tg-card">
          <label className="block text-sm font-medium mb-2">
            Текст поста
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите текст поста...&#10;&#10;Можно использовать HTML:&#10;• <b>жирный</b>&#10;• <i>курсив</i>&#10;• <u>подчеркнутый</u>"
            className="w-full bg-tg-secondary-bg border border-tg-hint/20 rounded-lg px-4 py-3 text-tg-text placeholder-tg-hint focus:border-tg-button focus:ring-1 focus:ring-tg-button min-h-[200px] resize-y"
            disabled={loading}
          />
          <div className="text-xs text-tg-hint mt-2">
            {text.length} символов
          </div>
        </div>

        {/* Фото */}
        <div className="tg-card">
          <label className="block text-sm font-medium mb-2">
            Фото (необязательно)
          </label>
          
          {photoUrl ? (
            <div className="relative">
              <img
                src={photoUrl}
                alt="Превью"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                onClick={handleRemovePhoto}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white"
                disabled={loading}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <label className="block">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto || loading}
              />
              <div className="border-2 border-dashed border-tg-hint/30 rounded-lg p-8 text-center cursor-pointer hover:border-tg-button/50 transition-colors">
                <ImageIcon className="w-12 h-12 mx-auto mb-3 text-tg-hint" />
                <div className="text-sm text-tg-hint">
                  {uploadingPhoto ? 'Загрузка...' : 'Нажмите для загрузки фото'}
                </div>
              </div>
            </label>
          )}
        </div>

        {/* Превью */}
        {(text || photoUrl) && (
          <div className="tg-card">
            <div className="text-sm font-medium mb-3">Превью поста:</div>
            <div className="bg-tg-secondary-bg rounded-lg p-4 space-y-3">
              {photoUrl && (
                <img
                  src={photoUrl}
                  alt="Превью"
                  className="w-full rounded-lg"
                />
              )}
              {text && (
                <div 
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: text }}
                />
              )}
            </div>
          </div>
        )}

        {/* Кнопка отправки */}
        <button
          onClick={handleSend}
          disabled={loading || !text.trim()}
          className="w-full tg-button flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-5 h-5" />
          {loading ? 'Отправка...' : `Отправить ${usersCount} пользователям`}
        </button>
      </div>
    </div>
  );
}
