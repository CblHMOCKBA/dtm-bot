'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Upload, X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getTelegramWebApp } from '@/lib/telegram';

export default function AddCarPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [price, setPrice] = useState('');
  const [mileage, setMileage] = useState('');
  const [description, setDescription] = useState('');
  const [engine, setEngine] = useState('');
  const [power, setPower] = useState('');
  const [transmission, setTransmission] = useState('');
  const [drive, setDrive] = useState('');
  const [bodyType, setBodyType] = useState('');
  const [color, setColor] = useState('');
  const [interiorColor, setInteriorColor] = useState('');
  const [status, setStatus] = useState('available');
  const [hideNewBadge, setHideNewBadge] = useState(false);
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const newPhotos = [...photos, ...files].slice(0, 10);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map(file => URL.createObjectURL(file)));
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
    setPhotoPreviews(photoPreviews.filter((_, i) => i !== index));
  };

  const uploadPhotos = async () => {
    const photoUrls: string[] = [];
    for (const photo of photos) {
      const fileExt = photo.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const { data } = await supabase.storage.from('car-photos').upload(fileName, photo);
      if (data) {
        const { data: { publicUrl } } = supabase.storage.from('car-photos').getPublicUrl(fileName);
        photoUrls.push(publicUrl);
      }
    }
    return photoUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brand || !model || !year || !price || !mileage || photos.length === 0) {
      alert('Заполните обязательные поля и добавьте фото');
      return;
    }
    try {
      setLoading(true);
      setUploading(true);
      const photoUrls = await uploadPhotos();
      setUploading(false);
      const specs: any = {};
      if (engine) specs.engine = engine;
      if (power) specs.power = power;
      if (transmission) specs.transmission = transmission;
      if (drive) specs.drive = drive;
      if (bodyType) specs.body_type = bodyType;
      if (color) specs.color = color;
      if (interiorColor) specs.interior_color = interiorColor;
      await supabase.from('cars').insert([{ brand, model, year: parseInt(year), price: parseInt(price), mileage: parseInt(mileage), description: description || null, photos: photoUrls, specs, status, hide_new_badge: hideNewBadge }]);
      alert('✅ Автомобиль добавлен!');
      router.push('/admin');
    } catch (error: any) { alert('Ошибка: ' + error.message); } finally { setLoading(false); setUploading(false); }
  };

  const inputStyle = { width: '100%', background: 'rgba(15, 14, 24, 0.8)', border: '2px solid rgba(204, 0, 58, 0.2)', borderRadius: '12px', color: '#FFFFFF', padding: '10px 16px', fontSize: '14px', outline: 'none' };
  const cardStyle = { background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))', backdropFilter: 'blur(10px)', border: '1px solid rgba(204, 0, 58, 0.2)', borderRadius: '16px', padding: '20px', marginBottom: '16px' };
  const labelStyle = { display: 'block', fontSize: '11px', fontWeight: 'bold', color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase' as const };

  return (
    <div className="min-h-screen pb-6" style={{ background: '#04030E' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 20, background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.95), rgba(26, 25, 37, 0.85))', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(156, 163, 175, 0.1)', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => router.back()} disabled={loading} style={{ width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))', backdropFilter: 'blur(10px)', border: '2px solid rgba(204, 0, 58, 0.3)', borderRadius: '12px', color: '#FFFFFF', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1 }}>
            <ArrowLeft style={{ width: '20px', height: '20px' }} />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#CC003A', letterSpacing: '0.3em', fontFamily: 'Orbitron, sans-serif' }}>DTM</h1>
            <p style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Добавить автомобиль</p>
          </div>
          <div style={{ width: '44px' }}></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ padding: '16px', maxWidth: '768px', margin: '0 auto' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '20px', background: '#CC003A', borderRadius: '2px' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Основная информация</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>Марка *</label><input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} required placeholder="Mercedes-Benz" style={inputStyle} onFocus={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.2)'} /></div>
            <div><label style={labelStyle}>Модель *</label><input type="text" value={model} onChange={(e) => setModel(e.target.value)} required placeholder="S-Class" style={inputStyle} onFocus={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.2)'} /></div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div><label style={labelStyle}>Год *</label><input type="number" value={year} onChange={(e) => setYear(e.target.value)} required placeholder="2024" min="1900" max="2030" style={inputStyle} onFocus={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.2)'} /></div>
            <div><label style={labelStyle}>Цена, ₽ *</label><input type="number" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="5000000" min="0" style={inputStyle} onFocus={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.2)'} /></div>
            <div><label style={labelStyle}>Пробег *</label><input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} required placeholder="50000" min="0" style={inputStyle} onFocus={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.2)'} /></div>
          </div>
          <div><label style={labelStyle}>Описание</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Подробное описание..." style={{ ...inputStyle, minHeight: '80px', resize: 'none' }} onFocus={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.2)'} /></div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '20px', background: '#CC003A', borderRadius: '2px' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Характеристики</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {[
              { label: 'Двигатель', value: engine, setValue: setEngine, placeholder: '3.0 л' },
              { label: 'Мощность', value: power, setValue: setPower, placeholder: '400 л.с.' },
              { label: 'КПП', value: transmission, setValue: setTransmission, placeholder: 'Автомат' },
              { label: 'Привод', value: drive, setValue: setDrive, placeholder: 'Полный' },
              { label: 'Кузов', value: bodyType, setValue: setBodyType, placeholder: 'Седан' },
              { label: 'Цвет', value: color, setValue: setColor, placeholder: 'Черный' }
            ].map((field, idx) => (
              <div key={idx}><label style={labelStyle}>{field.label}</label><input type="text" value={field.value} onChange={(e) => field.setValue(e.target.value)} placeholder={field.placeholder} style={inputStyle} onFocus={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.2)'} /></div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Цвет салона</label><input type="text" value={interiorColor} onChange={(e) => setInteriorColor(e.target.value)} placeholder="Бежевый" style={inputStyle} onFocus={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.8)'} onBlur={(e) => e.target.style.borderColor = 'rgba(204, 0, 58, 0.2)'} /></div>
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '20px', background: '#CC003A', borderRadius: '2px' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Фотографии *</h2>
          </div>
          {photoPreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
              {photoPreviews.map((preview, index) => (
                <div key={index} style={{ position: 'relative', aspectRatio: '16/9', borderRadius: '8px', overflow: 'hidden', border: '2px solid rgba(204, 0, 58, 0.3)' }}>
                  <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button type="button" onClick={() => removePhoto(index)} style={{ position: 'absolute', top: '6px', right: '6px', width: '28px', height: '28px', background: '#EF4444', borderRadius: '50%', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X style={{ width: '16px', height: '16px', color: 'white' }} />
                  </button>
                  {index === 0 && <div style={{ position: 'absolute', bottom: '6px', left: '6px', background: '#CC003A', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' }}>ГЛАВНАЯ</div>}
                </div>
              ))}
            </div>
          )}
          {photos.length < 10 && (
            <label style={{ display: 'block' }}>
              <input type="file" multiple accept="image/*" onChange={handlePhotoSelect} style={{ display: 'none' }} />
              <div style={{ width: '100%', padding: '12px', background: 'rgba(15, 14, 24, 0.6)', border: '2px solid rgba(204, 0, 58, 0.3)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '14px', fontWeight: 600 }}>
                <Upload style={{ width: '16px', height: '16px' }} />
                {photos.length === 0 ? 'ДОБАВИТЬ ФОТО' : `ДОБАВИТЬ ЕЩЁ (${photos.length}/10)`}
              </div>
            </label>
          )}
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <div style={{ width: '4px', height: '20px', background: '#CC003A', borderRadius: '2px' }}></div>
            <h2 style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Статус</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            {[
              { value: 'available', label: 'В наличии', color: '#CC003A' },
              { value: 'order', label: 'Под заказ', color: '#EAB308' },
              { value: 'inTransit', label: 'В пути', color: '#3B82F6' },
              { value: 'sold', label: 'Продано', color: '#6B7280' }
            ].map(s => (
              <button key={s.value} type="button" onClick={() => setStatus(s.value)} style={{ padding: '12px', borderRadius: '8px', border: `2px solid ${status === s.value ? s.color : 'rgba(156, 163, 175, 0.2)'}`, background: status === s.value ? `${s.color}33` : 'rgba(15, 14, 24, 0.5)', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase', cursor: 'pointer', color: '#FFFFFF' }}>
                {s.label}
              </button>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', borderRadius: '8px', background: 'rgba(15, 14, 24, 0.5)', border: '1px solid rgba(156, 163, 175, 0.2)', cursor: 'pointer' }}>
            <input type="checkbox" checked={hideNewBadge} onChange={(e) => setHideNewBadge(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: '#CC003A' }} />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>Скрыть бейдж "NEW"</span>
          </label>
        </div>

        <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px', background: loading ? '#666' : 'linear-gradient(135deg, #DC0000, #CC003A, #990029)', border: '1px solid rgba(220, 0, 0, 0.5)', borderRadius: '12px', color: '#FFFFFF', fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {loading ? (
            <>
              <Loader2 style={{ width: '20px', height: '20px', animation: 'spin 1s linear infinite' }} />
              {uploading ? 'Загрузка фото...' : 'Добавление...'}
            </>
          ) : (
            <>
              <Plus style={{ width: '20px', height: '20px' }} />
              ДОБАВИТЬ АВТОМОБИЛЬ
            </>
          )}
        </button>
      </form>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
