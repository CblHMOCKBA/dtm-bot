'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTelegramWebApp, isAdmin } from '@/lib/telegram';
import { Car, CarSpecs, CarStatus } from '@/types';
import { X, ArrowLeft, Upload, Save, Trash2, Link } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { validateCarForm, ValidationErrors } from '@/lib/validation';

const DARK_INPUT_STYLE = {
  width: '100%' as const,
  background: 'rgba(15, 14, 24, 0.8)',
  border: '2px solid rgba(204, 0, 58, 0.2)',
  borderRadius: '12px',
  color: '#FFFFFF',
  padding: '10px 16px',
  fontSize: '14px',
  outline: 'none',
  transition: 'all 0.3s ease'
};

export default function EditCarPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    mileage: 0,
    description: '',
    photos: [] as string[],
    status: 'available' as CarStatus,
    hide_new_badge: false,
    post_url: '',
    specs: { engine: '', power: '', transmission: '', drive: '', color: '', body_type: '', fuel: '', interior_color: '' } as CarSpecs,
  });

  useEffect(() => {
    if (!isAdmin()) { router.push('/'); return; }
    const tg = getTelegramWebApp();
    if (tg) { tg.BackButton.show(); tg.BackButton.onClick(() => handleBackClick()); }
    loadCar();
    return () => { if (tg) { tg.BackButton.hide(); } };
  }, [router, params.id]);

  const handleBackClick = () => {
    if (confirm('⚠️ Внимание!\n\nВсе несохраненные данные будут потеряны.\n\nВы уверены?')) {
      router.push('/admin');
    }
  };

  const loadCar = async () => {
    try {
      const { data, error } = await supabase.from('cars').select('*').eq('id', params.id).single();
      if (error) throw error;
      if (!data) { toast.error('Автомобиль не найден'); router.push('/admin'); return; }
      setFormData({
        brand: data.brand,
        model: data.model,
        year: data.year,
        price: data.price,
        mileage: data.mileage,
        description: data.description || '',
        photos: data.photos || [],
        status: data.status || 'available',
        hide_new_badge: data.hide_new_badge || false,
        post_url: data.post_url || '',
        specs: data.specs || {},
      });
    } catch (error: any) {
      console.error('Error:', error);
      toast.error('Ошибка загрузки');
      router.push('/admin');
    } finally {
      setLoadingData(false);
    }
  };

  const MAX_PHOTOS = 20;

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = MAX_PHOTOS - formData.photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Максимум ${MAX_PHOTOS} фото`);
      e.target.value = '';
      return;
    }
    
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    if (filesToUpload.length < files.length) {
      toast.warning(`Добавлено только ${filesToUpload.length} из ${files.length} фото (лимит ${MAX_PHOTOS})`);
    }
    
    e.target.value = '';
    setUploadingPhoto(true);
    
    try {
      const photoUrls: string[] = [];
      
      // Загружаем последовательно по 2 файла
      const BATCH_SIZE = 2;
      for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
        const batch = filesToUpload.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (file) => {
          // Сжимаем если файл большой
          const processedFile = file.size > 500000 ? await compressImage(file) : file;
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          const { error } = await supabase.storage.from('car-photos').upload(fileName, processedFile);
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage.from('car-photos').getPublicUrl(fileName);
          return publicUrl;
        });
        
        const batchUrls = await Promise.all(batchPromises);
        photoUrls.push(...batchUrls);
        
        // Пауза между батчами
        if (i + BATCH_SIZE < filesToUpload.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...photoUrls].slice(0, MAX_PHOTOS) }));
      toast.success(`Загружено ${photoUrls.length} фото`);
    } catch (error: any) {
      toast.error('Ошибка: ' + error.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Сжатие изображения
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const maxSize = 1400;
        let { width, height } = img;
        
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          canvas.width = 0;
          canvas.height = 0;
          resolve(blob && blob.size < file.size ? blob : file);
        }, 'image/jpeg', 0.75);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      
      img.src = objectUrl;
    });
  };

  // Извлекаем имя файла из URL Supabase
  const getFileNameFromUrl = (url: string): string | null => {
    try {
      // URL: https://xxx.supabase.co/storage/v1/object/public/car-photos/filename.jpg
      const parts = url.split('/car-photos/');
      if (parts.length > 1) {
        return parts[1].split('?')[0]; // убираем query параметры если есть
      }
      return null;
    } catch {
      return null;
    }
  };

  // Удаление фото из Storage
  const deletePhotoFromStorage = async (photoUrl: string): Promise<boolean> => {
    const fileName = getFileNameFromUrl(photoUrl);
    if (!fileName) return false;
    
    try {
      const { error } = await supabase.storage.from('car-photos').remove([fileName]);
      if (error) {
        console.error('Error deleting photo from storage:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error deleting photo:', error);
      return false;
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const photoUrl = formData.photos[index];
    
    // Удаляем из Storage
    const deleted = await deletePhotoFromStorage(photoUrl);
    if (deleted) {
      toast.success('Фото удалено');
    }
    
    // Удаляем из формы (даже если из Storage не удалилось)
    setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { isValid, errors } = validateCarForm(formData);
    setValidationErrors(errors);
    if (!isValid) { toast.error('Исправьте ошибки'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('cars').update({
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        price: formData.price,
        mileage: formData.mileage,
        description: formData.description,
        photos: formData.photos,
        status: formData.status,
        hide_new_badge: formData.hide_new_badge,
        post_url: formData.post_url || null,
        specs: formData.specs,
      }).eq('id', params.id);
      if (error) throw error;
      toast.success('✅ Изменения сохранены!');
      router.push('/admin');
    } catch (error: any) {
      toast.error('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('⚠️ ВНИМАНИЕ!\n\nВы действительно хотите УДАЛИТЬ этот автомобиль?\n\nВсе фотографии также будут удалены.\n\nЭто действие НЕОБРАТИМО!')) return;
    setDeleting(true);
    try {
      // Сначала удаляем все фото из Storage
      if (formData.photos && formData.photos.length > 0) {
        const fileNames = formData.photos
          .map(url => getFileNameFromUrl(url))
          .filter((name): name is string => name !== null);
        
        if (fileNames.length > 0) {
          await supabase.storage.from('car-photos').remove(fileNames);
        }
      }
      
      // Затем удаляем запись из БД
      const { error } = await supabase.from('cars').delete().eq('id', params.id);
      if (error) throw error;
      toast.success('Автомобиль и все фото удалены');
      router.push('/admin');
    } catch (error: any) {
      toast.error('Ошибка: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#04030E' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid rgba(204, 0, 58, 0.2)', borderTop: '4px solid #CC003A', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-6" style={{ background: '#04030E' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.95), rgba(26, 25, 37, 0.85))', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(156, 163, 175, 0.1)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleBackClick} disabled={loading || deleting} style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))', border: '2px solid rgba(204, 0, 58, 0.3)', borderRadius: '12px', color: '#FFFFFF', cursor: (loading || deleting) ? 'not-allowed' : 'pointer', opacity: (loading || deleting) ? 0.5 : 1 }}>
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#CC003A', letterSpacing: '0.3em', fontFamily: 'Orbitron, sans-serif' }}>DTM</h1>
            <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Редактировать автомобиль</p>
          </div>
          <div style={{ width: '44px' }}></div>
        </div>
        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(234, 179, 8, 0.1)', border: '2px solid rgba(234, 179, 8, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'start', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div style={{ fontSize: '12px', color: '#EAB308' }}><strong>Внимание:</strong> Не забудьте сохранить изменения!</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '16px', maxWidth: '768px', margin: '0 auto' }}>
        {/* Основная информация */}
        <div style={{ background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))', backdropFilter: 'blur(10px)', border: '1px solid rgba(204, 0, 58, 0.2)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '4px', height: '20px', background: '#CC003A', borderRadius: '2px' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Основная информация</h2>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Марка *</label>
            <input type="text" required value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="Mercedes-Benz" style={{ ...DARK_INPUT_STYLE, borderColor: validationErrors.brand ? '#EF4444' : 'rgba(204, 0, 58, 0.2)' }} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = validationErrors.brand ? '#EF4444' : 'rgba(204, 0, 58, 0.2)'} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Модель *</label>
            <input type="text" required value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} placeholder="S-Class" style={{ ...DARK_INPUT_STYLE, borderColor: validationErrors.model ? '#EF4444' : 'rgba(204, 0, 58, 0.2)' }} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = validationErrors.model ? '#EF4444' : 'rgba(204, 0, 58, 0.2)'} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Год *</label>
              <input type="number" required value={formData.year} onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })} min="1900" max="2030" style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Цена *</label>
              <input type="number" required value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })} min="0" placeholder="5000000" style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Пробег *</label>
              <input type="number" required value={formData.mileage || ''} onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })} min="0" placeholder="50000" style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'} />
            </div>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Описание</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Подробное описание..." style={{ ...DARK_INPUT_STYLE, minHeight: '80px', resize: 'none' }} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'} />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Статус *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(['available', 'order', 'inTransit'] as CarStatus[]).map((status) => (
                <button key={status} type="button" onClick={() => setFormData({ ...formData, status })} style={{ padding: '12px', borderRadius: '8px', border: `2px solid ${formData.status === status ? '#CC003A' : 'rgba(156, 163, 175, 0.2)'}`, background: formData.status === status ? 'rgba(204, 0, 58, 0.2)' : 'rgba(15, 14, 24, 0.5)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', color: '#FFFFFF' }}>
                  {status === 'available' ? 'В наличии' : status === 'order' ? 'Под заказ' : 'В пути'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: 'rgba(15, 14, 24, 0.5)', borderRadius: '8px', border: '2px solid rgba(204, 0, 58, 0.2)' }}>
              <input type="checkbox" checked={formData.hide_new_badge} onChange={(e) => setFormData({ ...formData, hide_new_badge: e.target.checked })} style={{ width: '18px', height: '18px', accentColor: '#CC003A' }} />
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>Скрыть бейдж "NEW"</span>
            </label>
          </div>
        </div>

        {/* Ссылка на пост */}
        <div style={{ background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))', backdropFilter: 'blur(10px)', border: '1px solid rgba(204, 0, 58, 0.2)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '4px', height: '20px', background: '#CC003A', borderRadius: '2px' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Ссылка на пост</h2>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#CC003A' }}>
              <Link style={{ width: '18px', height: '18px' }} />
            </div>
            <input 
              type="url" 
              value={formData.post_url} 
              onChange={(e) => setFormData({ ...formData, post_url: e.target.value })} 
              placeholder="https://t.me/dtm_auto/123" 
              style={{ ...DARK_INPUT_STYLE, paddingLeft: '40px' }} 
              onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} 
              onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'} 
            />
          </div>
          <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '8px' }}>
            Скопируйте ссылку на пост в канале DTM (необязательно)
          </p>
        </div>

        {/* Характеристики */}
        <div style={{ background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))', backdropFilter: 'blur(10px)', border: '1px solid rgba(204, 0, 58, 0.2)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '4px', height: '20px', background: '#CC003A', borderRadius: '2px' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Характеристики</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Двигатель</label>
              <input type="text" value={formData.specs.engine || ''} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, engine: e.target.value } })} placeholder="3.0 л" style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Мощность</label>
              <input type="text" value={formData.specs.power || ''} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, power: e.target.value } })} placeholder="400 л.с." style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>КПП</label>
              <select value={formData.specs.transmission || ''} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, transmission: e.target.value } })} style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'}>
                <option value="">Выберите КПП</option>
                <option value="АКП">АКП (Автомат)</option>
                <option value="МКП">МКП (Механика)</option>
                <option value="Робот">Робот</option>
                <option value="Вариатор">Вариатор</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Привод</label>
              <select value={formData.specs.drive || ''} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, drive: e.target.value } })} style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'}>
                <option value="">Выберите привод</option>
                <option value="Передний">Передний</option>
                <option value="Задний">Задний</option>
                <option value="Полный">Полный (4WD)</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Кузов</label>
              <select value={formData.specs.body_type || ''} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, body_type: e.target.value } })} style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'}>
                <option value="">Выберите кузов</option>
                <option value="Седан">Седан</option>
                <option value="Хэтчбек">Хэтчбек</option>
                <option value="Универсал">Универсал</option>
                <option value="Внедорожник">Внедорожник</option>
                <option value="Кроссовер">Кроссовер</option>
                <option value="Купе">Купе</option>
                <option value="Кабриолет">Кабриолет</option>
                <option value="Минивэн">Минивэн</option>
                <option value="Пикап">Пикап</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Цвет</label>
              <input type="text" value={formData.specs.color || ''} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, color: e.target.value } })} placeholder="Черный" style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Топливо</label>
              <select value={formData.specs.fuel || ''} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, fuel: e.target.value } })} style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'}>
                <option value="">Выберите топливо</option>
                <option value="Бензин">Бензин</option>
                <option value="Дизель">Дизель</option>
                <option value="Гибрид">Гибрид</option>
                <option value="Электро">Электро</option>
                <option value="Газ">Газ</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Цвет салона</label>
              <input type="text" value={formData.specs.interior_color || ''} onChange={(e) => setFormData({ ...formData, specs: { ...formData.specs, interior_color: e.target.value } })} placeholder="Бежевый" style={DARK_INPUT_STYLE} onFocus={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(204, 0, 58, 0.2)'} />
            </div>
          </div>
        </div>

        {/* Фотографии */}
        <div style={{ background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))', backdropFilter: 'blur(10px)', border: '1px solid rgba(204, 0, 58, 0.2)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '4px', height: '20px', background: '#CC003A', borderRadius: '2px' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Фотографии * <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 'normal' }}>({formData.photos.length}/{MAX_PHOTOS})</span></h2>
          </div>
          {formData.photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {formData.photos.map((photo, index) => (
                <div key={index} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(204, 0, 58, 0.3)' }}>
                  <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => handleRemovePhoto(index)} style={{ position: 'absolute', top: '6px', right: '6px', width: '28px', height: '28px', background: '#EF4444', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X style={{ width: '16px', height: '16px', color: 'white' }} />
                  </button>
                  {index === 0 && <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: '#CC003A', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>ГЛАВНАЯ</div>}
                </div>
              ))}
            </div>
          )}
          {formData.photos.length < MAX_PHOTOS && (
            <label style={{ display: 'block' }}>
              <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} disabled={uploadingPhoto} style={{ display: 'none' }} />
              <div style={{ width: '100%', padding: '12px', background: 'rgba(15, 14, 24, 0.6)', border: '2px solid rgba(204, 0, 58, 0.3)', borderRadius: '12px', cursor: uploadingPhoto ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, opacity: uploadingPhoto ? 0.5 : 1 }}>
                <Upload style={{ width: '16px', height: '16px' }} />
                {uploadingPhoto ? 'Загрузка...' : (formData.photos.length === 0 ? 'ДОБАВИТЬ ФОТО' : `ДОБАВИТЬ ЕЩЁ (${formData.photos.length}/${MAX_PHOTOS})`)}
              </div>
            </label>
          )}
        </div>

        {/* Кнопки */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <button type="submit" disabled={loading || deleting} style={{ width: '100%', padding: '16px', background: loading ? '#666' : 'linear-gradient(135deg, #DC0000, #CC003A, #990029)', border: '2px solid #CC003A', borderRadius: '12px', color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', cursor: (loading || deleting) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(204, 0, 58, 0.4)', transition: 'all 0.3s ease' }}>
            {loading ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid #FFFFFF', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <span>СОХРАНЕНИЕ...</span>
              </>
            ) : (
              <>
                <Save style={{ width: '18px', height: '18px' }} />
                <span>СОХРАНИТЬ</span>
              </>
            )}
          </button>

          <button type="button" onClick={handleDelete} disabled={loading || deleting} style={{ width: '100%', padding: '16px', background: deleting ? '#666' : 'linear-gradient(135deg, #7F1D1D, #991B1B, #7F1D1D)', border: '2px solid #991B1B', borderRadius: '12px', color: '#FFFFFF', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', cursor: (loading || deleting) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 4px 20px rgba(153, 27, 27, 0.4)', transition: 'all 0.3s ease' }}>
            {deleting ? (
              <>
                <div style={{ width: '16px', height: '16px', border: '2px solid #FFFFFF', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                <span>УДАЛЕНИЕ...</span>
              </>
            ) : (
              <>
                <Trash2 style={{ width: '18px', height: '18px' }} />
                <span>УДАЛИТЬ</span>
              </>
            )}
          </button>
        </div>

        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          select option {
            background: rgba(15, 14, 24, 0.95);
            color: #FFFFFF;
            padding: 10px;
          }
        `}</style>
      </form>
    </div>
  );
}
