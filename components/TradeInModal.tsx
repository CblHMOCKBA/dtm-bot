'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Car, Phone, Search, ArrowRightLeft, Banknote, MessageSquare, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Car as CarType } from '@/types';
import { getTelegramWebApp } from '@/lib/telegram';
import Image from 'next/image';

interface TradeInModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: CarType[];
}

export default function TradeInModal({ isOpen, onClose, cars }: TradeInModalProps) {
  const [phone, setPhone] = useState('');
  const [userCar, setUserCar] = useState('');
  const [targetCarId, setTargetCarId] = useState<string | null>(null);
  const [targetCar, setTargetCar] = useState<CarType | null>(null);
  const [tradeInAmount, setTradeInAmount] = useState('');
  const [comment, setComment] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CarType[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Сброс формы при закрытии
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setPhone('');
        setUserCar('');
        setTargetCarId(null);
        setTargetCar(null);
        setTradeInAmount('');
        setComment('');
        setSearchQuery('');
        setSearchResults([]);
        setShowSearch(false);
        setIsSuccess(false);
        setError('');
      }, 300);
    }
  }, [isOpen]);

  // Поиск авто
  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const results = cars
        .filter(car => car.status !== 'sold')
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
    setTradeInAmount(formatted);
  };

  // Отправка заявки
  const handleSubmit = async () => {
    setError('');
    
    // Валидация
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
      const amountDigits = tradeInAmount.replace(/\D/g, '');
      
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
      
      // Закрыть через 2 секунды
      setTimeout(() => {
        onClose();
      }, 2000);
      
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

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.2s ease-out' }}
      />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl"
        style={{
          background: 'linear-gradient(180deg, #0F0E18 0%, #04030E 100%)',
          animation: 'slideUp 0.3s ease-out',
        }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10"
          style={{ background: 'linear-gradient(180deg, #0F0E18 0%, rgba(15, 14, 24, 0.95) 100%)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#CC003A] to-[#990029] flex items-center justify-center">
              <ArrowRightLeft className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Trade-In</h2>
              <p className="text-xs text-white/50">Обмен вашего автомобиля</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90"
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center min-h-[300px]">
            <div 
              className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mb-6"
              style={{ animation: 'scaleIn 0.3s ease-out' }}
            >
              <Check className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Заявка отправлена!</h3>
            <p className="text-white/60 text-center">
              Менеджер свяжется с вами<br />в ближайшее время
            </p>
          </div>
        ) : (
          /* Form */
          <div className="p-4 space-y-4">
            {/* Телефон */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Phone className="w-4 h-4 text-[#CC003A]" />
                Ваш телефон *
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

            {/* Желаемый автомобиль */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Search className="w-4 h-4 text-[#CC003A]" />
                Желаемый автомобиль
              </label>
              
              {targetCar ? (
                /* Выбранное авто */
                <div className="relative p-3 rounded-xl bg-white/5 border border-[#CC003A]/30">
                  <button
                    onClick={clearTargetCar}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                  <div className="flex gap-3">
                    <div className="w-20 h-14 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                      {targetCar.photos?.[0] ? (
                        <Image
                          src={targetCar.photos[0]}
                          alt={targetCar.brand}
                          width={80}
                          height={56}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Car className="w-6 h-6 text-white/30" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate">
                        {targetCar.brand} {targetCar.model}
                      </div>
                      <div className="text-xs text-white/50">
                        {targetCar.year} • {targetCar.mileage?.toLocaleString('ru-RU')} км
                      </div>
                      <div className="text-sm font-bold text-[#CC003A]">
                        {new Intl.NumberFormat('ru-RU').format(targetCar.price)} ₽
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Поиск */
                <div className="relative">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSearch(true);
                    }}
                    onFocus={() => setShowSearch(true)}
                    placeholder="Поиск из каталога DTM"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#CC003A]/50 focus:bg-white/10 transition-all"
                  />
                  
                  {/* Результаты поиска */}
                  {showSearch && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden border border-white/10 z-20"
                      style={{ background: 'linear-gradient(180deg, #1A1925 0%, #0F0E18 100%)' }}
                    >
                      {searchResults.map((car) => (
                        <button
                          key={car.id}
                          onClick={() => selectCar(car)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0"
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
                </div>
              )}
            </div>

            {/* Сумма доплаты */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-white/80 mb-2">
                <Banknote className="w-4 h-4 text-[#CC003A]" />
                Сумма доплаты
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tradeInAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 outline-none focus:border-[#CC003A]/50 focus:bg-white/10 transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50">₽</span>
              </div>
            </div>

            {/* Комментарий */}
            <div>
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
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm text-center">
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

            {/* Безопасный отступ снизу */}
            <div className="h-4" />
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { transform: scale(0); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
