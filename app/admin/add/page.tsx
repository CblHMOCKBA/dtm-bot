'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTelegramWebApp, isAdmin } from '@/lib/telegram';
import { CarSpecs, CarStatus } from '@/types';
import { X, ArrowLeft, Upload, Plus, Loader2 } from 'lucide-react';
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

const MAX_PHOTOS = 20;

interface PhotoItem {
  url: string;
  isUploading: boolean;
  localPreview?: string;
}

export default function AddCarPage() {
  const router = useRouter();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    mileage: 0,
    description: '',
    status: 'available' as CarStatus,
    specs: { engine: '', power: '', transmission: '', drive: '', color: '', body_type: '', fuel: '', interior_color: '' } as CarSpecs,
  });

  useEffect(() => {
    if (!isAdmin()) { router.push('/'); return; }
    const tg = getTelegramWebApp();
    if (tg) { tg.BackButton.show(); tg.BackButton.onClick(() => handleBackClick()); }
    return () => { if (tg) { tg.BackButton.hide(); } };
  }, [router]);

  const handleBackClick = () => {
    if (confirm('⚠️ Внимание!\n\nВсе несохраненные данные будут потеряны.\n\nВы уверены?')) {
      router.push('/admin');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) {
      toast.error(`Максимум ${MAX_PHOTOS} фото`);
      return;
    }
    
    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    if (filesToUpload.length < files.length) {
      toast.warning(`Добавлено только ${filesToUpload.length} из ${files.length} фото (лимит ${MAX_PHOTOS})`);
    }
    
    // Очищаем input сразу
    e.target.value = '';
    
    // Загружаем последовательно по 2 файла за раз чтобы не перегружать память
    const BATCH_SIZE = 2;
    let successCount = 0;
    
    for (let i = 0; i < filesToUpload.length; i += BATCH_SIZE) {
      const batch = filesToUpload.slice(i, i + BATCH_SIZE);
      
      // Создаём превью для текущего батча
      const batchPreviews: PhotoItem[] = batch.map(file => ({
        url: '',
        isUploading: true,
        localPreview: URL.createObjectURL(file)
      }));
      
      const startIndex = photos.length + i;
      setPhotos(prev => [...prev, ...batchPreviews]);
      
      // Загружаем батч параллельно
      const uploadPromises = batch.map(async (file, batchIdx) => {
        const globalIdx = startIndex + batchIdx;
        let localPreviewUrl: string | undefined;
        
        try {
          // Сжимаем изображение
          const compressedFile = await compressImage(file);
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const { error } = await supabase.storage.from('car-photos').upload(fileName, compressedFile);
          if (error) throw error;
          
          const { data: { publicUrl } } = supabase.storage.from('car-photos').getPublicUrl(fileName);
          
          // Сохраняем localPreview для очистки
          setPhotos(prev => {
            localPreviewUrl = prev[globalIdx]?.localPreview;
            return prev.map((p, idx) => 
              idx === globalIdx ? { url: publicUrl, isUploading: false } : p
            );
          });
          
          // Очищаем blob URL после успешной загрузки
          if (localPreviewUrl) {
            URL.revokeObjectURL(localPreviewUrl);
          }
          
          return true;
        } catch (error) {
          console.error('Upload error:', error);
          // Удаляем неудачное фото и очищаем blob URL
          setPhotos(prev => {
            const photo = prev[globalIdx];
            if (photo?.localPreview) {
              URL.revokeObjectURL(photo.localPreview);
            }
            return prev.filter((_, idx) => idx !== globalIdx);
          });
          return false;
        }
      });
      
      const results = await Promise.all(uploadPromises);
      successCount += results.filter(Boolean).length;
      
      // Небольшая пауза между батчами для освобождения памяти
      if (i + BATCH_SIZE < filesToUpload.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    if (successCount > 0) {
      toast.success(`Загружено ${successCount} фото`);
    } else if (filesToUpload.length > 0) {
      toast.error('Не удалось загрузить фото');
    }
  };

  // Оптимизированное сжатие с очисткой памяти
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Если файл маленький, не сжимаем
      if (file.size < 500000) { // меньше 500KB
        resolve(file);
        return;
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      
      img.onload = () => {
        // Сразу освобождаем blob URL
        URL.revokeObjectURL(objectUrl);
        
        // Максимум 1400px для мобильных устройств
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
        
        // Качество 0.75 - оптимально для мобильных
        canvas.toBlob((blob) => {
          // Очищаем canvas
          canvas.width = 0;
          canvas.height = 0;
          
          if (blob && blob.size < file.size) {
            resolve(blob);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.75);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(file);
      };
      
      img.src = objectUrl;
    });
  };

  const handleRemovePhoto = (index: number) => {
    // Освобождаем локальный URL если есть
    const photo = photos[index];
    if (photo.localPreview) {
      URL.revokeObjectURL(photo.localPreview);
    }
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Проверяем что все фото загружены
    const uploadingCount = photos.filter(p => p.isUploading).length;
    if (uploadingCount > 0) {
      toast.error(`Дождитесь загрузки ${uploadingCount} фото`);
      return;
    }
    
    const photoUrls = photos.map(p => p.url).filter(Boolean);
    const fullFormData = { ...formData, photos: photoUrls };
    
    const { isValid, errors } = validateCarForm(fullFormData);
    setValidationErrors(errors);
    if (!isValid) { toast.error('Исправьте ошибки'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.from('cars').insert([{ 
        brand: formData.brand, 
        model: formData.model, 
        year: formData.year, 
        price: formData.price, 
        mileage: formData.mileage, 
        description: formData.description, 
        photos: photoUrls, 
        status: formData.status, 
        specs: formData.specs 
      }]);
      if (error) throw error;
      toast.success('✅ Автомобиль добавлен!');
      router.push('/admin');
    } catch (error: any) {
      toast.error('Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadingCount = photos.filter(p => p.isUploading).length;

  return (
    <div className="min-h-screen pb-6" style={{ background: '#04030E' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.95), rgba(26, 25, 37, 0.85))', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(156, 163, 175, 0.1)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={handleBackClick} disabled={loading} style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))', border: '2px solid rgba(204, 0, 58, 0.3)', borderRadius: '12px', color: '#FFFFFF', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#CC003A', letterSpacing: '0.3em', fontFamily: 'Orbitron, sans-serif' }}>DTM</h1>
            <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase' }}>Добавить автомобиль</p>
          </div>
          <div style={{ width: '44px' }}></div>
        </div>
        <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(234, 179, 8, 0.1)', border: '2px solid rgba(234, 179, 8, 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'start', gap: '8px' }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div style={{ fontSize: '12px', color: '#EAB308' }}><strong>Внимание:</strong> Не забудьте сохранить!</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '16px', maxWidth: '768px', margin: '0 auto' }}>
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

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' }}>Статус *</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              {(['available', 'order', 'inTransit'] as CarStatus[]).map((status) => (
                <button key={status} type="button" onClick={() => setFormData({ ...formData, status })} style={{ padding: '12px', borderRadius: '8px', border: `2px solid ${formData.status === status ? '#CC003A' : 'rgba(156, 163, 175, 0.2)'}`, background: formData.status === status ? 'rgba(204, 0, 58, 0.2)' : 'rgba(15, 14, 24, 0.5)', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', color: '#FFFFFF' }}>
                  {status === 'available' ? 'В наличии' : status === 'order' ? 'Под заказ' : 'В пути'}
                </button>
              ))}
            </div>
          </div>
        </div>

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

        <div style={{ background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))', backdropFilter: 'blur(10px)', border: '1px solid rgba(204, 0, 58, 0.2)', borderRadius: '16px', padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <div style={{ width: '4px', height: '20px', background: '#CC003A', borderRadius: '2px' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>Фотографии * <span style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: 'normal' }}>({photos.length}/{MAX_PHOTOS})</span></h2>
          </div>
          {photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {photos.map((photo, index) => (
                <div key={index} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', border: `2px solid ${photo.isUploading ? 'rgba(234, 179, 8, 0.5)' : 'rgba(204, 0, 58, 0.3)'}` }}>
                  <img src={photo.localPreview || photo.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: photo.isUploading ? 0.6 : 1 }} />
                  {photo.isUploading ? (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)' }}>
                      <Loader2 style={{ width: '24px', height: '24px', color: '#EAB308', animation: 'spin 1s linear infinite' }} />
                    </div>
                  ) : (
                    <button type="button" onClick={() => handleRemovePhoto(index)} style={{ position: 'absolute', top: '6px', right: '6px', width: '28px', height: '28px', background: '#EF4444', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X style={{ width: '16px', height: '16px', color: 'white' }} />
                    </button>
                  )}
                  {index === 0 && !photo.isUploading && <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: '#CC003A', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>ГЛАВНАЯ</div>}
                </div>
              ))}
            </div>
          )}
          <label style={{ display: 'block' }}>
            <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} disabled={photos.length >= MAX_PHOTOS} style={{ display: 'none' }} />
            <div style={{ width: '100%', padding: '12px', background: 'rgba(15, 14, 24, 0.6)', border: '2px solid rgba(204, 0, 58, 0.3)', borderRadius: '12px', cursor: photos.length >= MAX_PHOTOS ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600, opacity: photos.length >= MAX_PHOTOS ? 0.5 : 1 }}>
              <Upload style={{ width: '16px', height: '16px' }} />
              {photos.length >= MAX_PHOTOS 
                ? `МАКСИМУМ ${MAX_PHOTOS} ФОТО` 
                : uploadingCount > 0 
                  ? `ЗАГРУЗКА ${uploadingCount} ФОТО...` 
                  : photos.length === 0 
                    ? 'ДОБАВИТЬ ФОТО' 
                    : `ДОБАВИТЬ ЕЩЁ (${photos.length}/${MAX_PHOTOS})`}
            </div>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            background: loading 
              ? 'rgba(107, 114, 128, 0.5)' 
              : 'linear-gradient(135deg, #DC0000, #CC003A, #990029)',
            border: '2px solid rgba(204, 0, 58, 0.8)',
            borderRadius: '12px',
            color: '#FFFFFF',
            fontSize: '16px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            boxShadow: loading 
              ? 'none' 
              : '0 0 30px rgba(204, 0, 58, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.1)',
            transition: 'all 0.3s ease',
            opacity: loading ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(204, 0, 58, 0.8), inset 0 2px 8px rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(204, 0, 58, 0.6), inset 0 2px 8px rgba(255, 255, 255, 0.1)';
            }
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '20px',
                height: '20px',
                border: '3px solid rgba(255, 255, 255, 0.3)',
                borderTop: '3px solid #FFFFFF',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span>{uploadingCount > 0 ? 'Загрузка фото...' : 'Добавление...'}</span>
            </>
          ) : (
            <>
              <Plus style={{ width: '24px', height: '24px' }} />
              <span>ДОБАВИТЬ АВТОМОБИЛЬ</span>
            </>
          )}
        </button>
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
          
          select option:hover {
            background: rgba(204, 0, 58, 0.2);
          }
        `}</style>
      </form>
    </div>
  );
}
