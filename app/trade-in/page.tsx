'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Phone, Search, ArrowRightLeft, Banknote, MessageSquare, Check, Loader2, Calculator, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Car as CarType } from '@/types';
import { getTelegramWebApp } from '@/lib/telegram';
import { useNavigation } from '@/components/NavigationProvider';
import BottomNavigation from '@/components/BottomNavigation';
import Image from 'next/image';

export default function TradeInPage() {
  const router = useRouter();
  const { navigateBack } = useNavigation();
  
  const [cars, setCars] = useState<CarType[]>([]);
  const [phone, setPhone] = useState('');
  const [userCar, setUserCar] = useState('');
  const [userCarPrice, setUserCarPrice] = useState('');
  const [targetCarId, setTargetCarId] = useState<string | null>(null);
  const [targetCar, setTargetCar] = useState<CarType | null>(null);
  const [comment, setComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CarType[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => {
        navigateBack();
        router.push('/');
      });
    }

    loadCars();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router, navigateBack]);

  const loadCars = async () => {
    const { data } = await supabase
      .from('cars')
      .select('*')
      .neq('status', 'sold')
      .order('created_at', { ascending: false });
    
    if (data) setCars(data);
  };

  // Поиск авто
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const results = cars
        .filter(car =>
          car.brand.toLowerCase().includes(query) ||
          car.model.toLowerCase().includes(query) ||
          `${car.brand} ${car.model}`.toLowerCase().includes(query)
        )
        .slice(0, 5);
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, cars]);

  // Форматирование телефона
  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 0) return '';
    if (digits.length <= 1) return `+7`;
    if (digits.length <= 4) return `+7 (${digits.slice(1)}`;
    if (digits.length <= 7) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4)}`;
    if (digits.length <= 9) return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  // Выбор авто из поиска
  const selectCar = (car: CarType) => {
    setTargetCarId(car.id);
    setTargetCar(car);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
  };

  // Удалить выбранное авто
  const clearTargetCar = () => {
    setTargetCarId(null);
    setTargetCar(null);
  };

  // Форматирование суммы
  const formatAmount = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (!digits) return '';
    return new Intl.NumberFormat('ru-RU').format(parseInt(digits));
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatAmount(e.target.value);
    setUserCarPrice(formatted);
  };

  // Расчёт доплаты
  const calculateDifference = () => {
    if (!targetCar || !userCarPrice) return null;
    const userPrice = parseInt(userCarPrice.replace(/\D/g, '')) || 0;
    const diff = targetCar.price - userPrice;
    return diff;
  };

  const difference = calculateDifference();

  // Отправка заявки
  const handleSubmit = async () => {
    setError('');
    
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 11) {
      setError('Введите корректный номер телефона');
      return;
    }
    
    if (!userCar.trim()) {
      setError('Укажите ваш автомобиль');
      return;
    }
    
    setIsSubmitting(true);
    
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }
    
    try {
      const amountDigits = userCarPrice.replace(/\D/g, '');
      
      const { error: insertError } = await supabase
        .from('trade_in_requests')
        .insert({
          phone: phone,
          user_car: userCar.trim(),
          target_car_id: targetCarId,
          trade_in_amount: amountDigits ? parseInt(amountDigits) : null,
          comment: comment.trim() || null,
          telegram_user_id: tg?.initDataUnsafe?.user?.id?.toString() || null,
        });
      
      if (insertError) throw insertError;
      
      setIsSuccess(true);
      
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
    } catch (err) {
      console.error('Error submitting trade-in:', err);
      setError('Ошибка отправки. Попробуйте позже.');
      
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Успешная отправка
  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 pb-20" style={{ background: '#04030E' }}>
        <div className="text-center">
          <div 
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              boxShadow: '0 0 40px rgba(34, 197, 94, 0.4)',
              animation: 'scaleIn 0.5s ease-out'
            }}
          >
            <Check className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Заявка отправлена!</h2>
          <p className="text-white/60 mb-6">Мы свяжемся с вами в ближайшее время</p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 rounded-xl font-bold text-white transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #DC0000, #CC003A)',
            }}
          >
            В каталог
          </button>
        </div>
        <BottomNavigation />
        
        <style jsx>{`
          @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: '#04030E' }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-20 px-4 py-4 border-b border-white/10"
        style={{ 
          background: 'linear-gradient(180deg, rgba(15, 14, 24, 0.98) 0%, rgba(4, 3, 14, 0.95) 100%)',
          backdropFilter: 'blur(10px)'
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #DC0000, #CC003A, #990029)',
              boxShadow: '0 4px 15px rgba(204, 0, 58, 0.4)'
            }}
          >
            <ArrowRightLeft className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Trade-In</h1>
            <p className="text-xs text-white/50">Обменяйте ваш автомобиль</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        
        {/* Калькулятор - показывается если выбрана целевая машина */}
        {targetCar && userCarPrice && difference !== null && (
          <div 
            className="p-4 rounded-2xl border border-[#CC003A]/30"
            style={{
              background: 'linear-gradient(135deg, rgba(204, 0, 58, 0.1), rgba(153, 0, 41, 0.05))',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="w-5 h-5 text-[#CC003A]" />
              <span className="font-bold text-white">Калькулятор Trade-In</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Стоимость {targetCar.brand} {targetCar.model}</span>
                <span className="text-white font-medium">{new Intl.NumberFormat('ru-RU').format(targetCar.price)} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Стоимость вашего авто</span>
                <span className="text-white font-medium">- {userCarPrice} ₽</span>
              </div>
              <div className="border-t border-white/10 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-white font-bold">
                    {difference > 0 ? 'Доплата:' : 'К возврату:'}
                  </span>
                  <span 
                    className="text-xl font-bold"
                    style={{ color: difference > 0 ? '#CC003A' : '#22c55e' }}
                  >
                    {difference > 0 ? '' : '+'}{new Intl.NumberFormat('ru-RU').format(Math.abs(difference))} ₽
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Форма */}
        <div 
          className="rounded-2xl p-4 space-y-4"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Телефон */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
              <Phone className="w-4 h-4 text-[#CC003A]" />
              Телефон *
            </label>
            <input
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="+7 (___) ___-__-__"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#CC003A]/50 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Ваш автомобиль */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
              <Car className="w-4 h-4 text-[#CC003A]" />
              Ваш автомобиль *
            </label>
            <input
              type="text"
              value={userCar}
              onChange={(e) => setUserCar(e.target.value)}
              placeholder="Марка, модель, год, пробег"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#CC003A]/50 focus:bg-white/10 transition-all"
            />
          </div>

          {/* Оценка стоимости вашего авто */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
              <Banknote className="w-4 h-4 text-[#CC003A]" />
              Оценка вашего авто
            </label>
            <div className="relative">
              <input
                type="text"
                value={userCarPrice}
                onChange={handleAmountChange}
                placeholder="0"
                className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#CC003A]/50 focus:bg-white/10 transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">₽</span>
            </div>
          </div>
        </div>

        {/* Желаемый автомобиль */}
        <div 
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-3">
            <Sparkles className="w-4 h-4 text-[#CC003A]" />
            Желаемый автомобиль из каталога
          </label>
          
          {targetCar ? (
            /* Выбранное авто */
            <div className="relative p-3 rounded-xl bg-white/5 border border-[#CC003A]/30">
              <button
                onClick={clearTargetCar}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center active:scale-90 transition-transform"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>
              <div className="flex gap-3">
                <div className="w-24 h-16 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                  {targetCar.photos?.[0] ? (
                    <Image
                      src={targetCar.photos[0]}
                      alt={targetCar.brand}
                      width={96}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="w-8 h-8 text-white/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white truncate">
                    {targetCar.brand} {targetCar.model}
                  </div>
                  <div className="text-xs text-white/50 mt-0.5">
                    {targetCar.year} • {targetCar.mileage?.toLocaleString('ru-RU')} км
                  </div>
                  <div className="text-lg font-bold text-[#CC003A] mt-1">
                    {new Intl.NumberFormat('ru-RU').format(targetCar.price)} ₽
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Поиск */
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearch(true);
                  }}
                  onFocus={() => setShowSearch(true)}
                  placeholder="Поиск из каталога DTM..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#CC003A]/50 focus:bg-white/10 transition-all"
                />
              </div>
              
              {/* Результаты поиска */}
              {showSearch && searchResults.length > 0 && (
                <div 
                  className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden border border-white/10 z-20"
                  style={{ background: 'linear-gradient(180deg, #1A1925 0%, #0F0E18 100%)' }}
                >
                  {searchResults.map((car) => (
                    <button
                      key={car.id}
                      onClick={() => selectCar(car)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-white/5 active:bg-white/10 transition-colors border-b border-white/5 last:border-b-0"
                    >
                      <div className="w-16 h-11 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                        {car.photos?.[0] ? (
                          <Image
                            src={car.photos[0]}
                            alt={car.brand}
                            width={64}
                            height={44}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-5 h-5 text-white/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-bold text-white text-sm truncate">
                          {car.brand} {car.model}
                        </div>
                        <div className="text-xs text-white/50">
                          {car.year} • {new Intl.NumberFormat('ru-RU').format(car.price)} ₽
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              
              {/* Подсказка если нет результатов */}
              {showSearch && searchQuery && searchResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 p-4 rounded-xl border border-white/10 text-center text-white/50 text-sm"
                  style={{ background: 'linear-gradient(180deg, #1A1925 0%, #0F0E18 100%)' }}
                >
                  Ничего не найдено
                </div>
              )}
            </div>
          )}
        </div>

        {/* Комментарий */}
        <div 
          className="rounded-2xl p-4"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
            <MessageSquare className="w-4 h-4 text-[#CC003A]" />
            Комментарий
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Дополнительная информация..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#CC003A]/50 focus:bg-white/10 transition-all resize-none"
          />
        </div>

        {/* Ошибка */}
        {error && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Кнопка отправки */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 rounded-xl font-bold text-white text-base uppercase tracking-wide transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #DC0000, #CC003A, #990029)',
            boxShadow: '0 4px 20px rgba(204, 0, 58, 0.4)',
          }}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Отправка...
            </>
          ) : (
            <>
              <ArrowRightLeft className="w-5 h-5" />
              Отправить заявку
            </>
          )}
        </button>

        {/* Инфо */}
        <p className="text-center text-white/40 text-xs">
          Нажимая кнопку, вы соглашаетесь на обработку персональных данных
        </p>
      </div>

      <BottomNavigation />
    </div>
  );
}
