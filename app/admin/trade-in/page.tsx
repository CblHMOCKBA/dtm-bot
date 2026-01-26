'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { isAdmin, getTelegramWebApp } from '@/lib/telegram';
import { ArrowRightLeft, Phone, Car, Calendar, Banknote, MessageSquare, Check, ArrowLeft, RefreshCw, Inbox, Trash2, RotateCcw } from 'lucide-react';
import { Car as CarType } from '@/types';
import Image from 'next/image';

interface TradeInRequest {
  id: string;
  phone: string;
  user_car: string;
  target_car_id: string | null;
  trade_in_amount: number | null;
  comment: string | null;
  status: 'active' | 'archived';
  created_at: string;
  archived_at: string | null;
  telegram_user_id: string | null;
  target_car?: CarType;
}

export default function TradeInAdminPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<TradeInRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      tg.BackButton.show();
      tg.BackButton.onClick(() => router.push('/admin'));
    }

    if (!isAdmin()) {
      router.push('/');
      return;
    }

    loadRequests();

    return () => {
      if (tg) {
        tg.BackButton.hide();
      }
    };
  }, [router]);

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('trade_in_requests')
        .select(`
          *,
          target_car:cars(*)
        `)
        .eq('status', activeTab)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error loading trade-in requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const archiveRequest = async (id: string) => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }
    
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('trade_in_requests')
        .update({ 
          status: 'archived',
          archived_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error archiving request:', error);
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const restoreRequest = async (id: string) => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('medium');
    }
    
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('trade_in_requests')
        .update({ 
          status: 'active',
          archived_at: null
        })
        .eq('id', id);

      if (error) throw error;
      
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error restoring request:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const deleteRequest = async (id: string) => {
    const tg = getTelegramWebApp();
    
    // Подтверждение удаления
    const confirmed = confirm('Удалить заявку навсегда?');
    if (!confirmed) return;
    
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('heavy');
    }
    
    setProcessingId(id);
    try {
      const { error } = await supabase
        .from('trade_in_requests')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      setRequests(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error('Error deleting request:', error);
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('error');
      }
    } finally {
      setProcessingId(null);
    }
  };

  const handleCall = (phone: string) => {
    const tg = getTelegramWebApp();
    if (tg?.HapticFeedback) {
      tg.HapticFeedback.impactOccurred('light');
    }
    window.location.href = `tel:${phone.replace(/\D/g, '')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 border-b border-white/10"
        style={{ background: 'linear-gradient(180deg, rgba(4, 3, 14, 0.98) 0%, rgba(4, 3, 14, 0.95) 100%)', backdropFilter: 'blur(20px)' }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => router.push('/admin')}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#CC003A] to-[#990029] flex items-center justify-center">
              <ArrowRightLeft className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-white">Trade-In заявки</h1>
          </div>
          
          <button
            onClick={loadRequests}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center transition-all active:scale-90"
          >
            <RefreshCw className={`w-5 h-5 text-white ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-3">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'active'
                ? 'bg-gradient-to-r from-[#DC0000] to-[#CC003A] text-white'
                : 'bg-white/5 text-white/60 border border-white/10'
            }`}
          >
            Активные
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`flex-1 py-2 px-4 rounded-xl font-bold text-sm transition-all ${
              activeTab === 'archived'
                ? 'bg-gradient-to-r from-[#DC0000] to-[#CC003A] text-white'
                : 'bg-white/5 text-white/60 border border-white/10'
            }`}
          >
            Архив
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 animate-pulse">
              <div className="h-5 w-1/3 bg-white/10 rounded mb-3" />
              <div className="h-4 w-2/3 bg-white/10 rounded mb-2" />
              <div className="h-4 w-1/2 bg-white/10 rounded" />
            </div>
          ))
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Inbox className="w-10 h-10 text-white/30" />
            </div>
            <p className="text-white/50 text-center">
              {activeTab === 'active' ? 'Нет активных заявок' : 'Архив пуст'}
            </p>
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="p-4 rounded-2xl border transition-all"
              style={{
                background: 'linear-gradient(135deg, rgba(15, 14, 24, 0.8), rgba(26, 25, 37, 0.6))',
                borderColor: 'rgba(204, 0, 58, 0.15)',
              }}
            >
              {/* Header заявки */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/50" />
                  <span className="text-xs text-white/50">{formatDate(request.created_at)}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  activeTab === 'active' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-white/10 text-white/50'
                }`}>
                  {activeTab === 'active' ? 'Новая' : 'В архиве'}
                </span>
              </div>

              {/* Телефон */}
              <button
                onClick={() => handleCall(request.phone)}
                className="flex items-center gap-2 mb-3 group"
              >
                <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-white font-bold group-hover:text-[#CC003A] transition-colors">
                  {request.phone}
                </span>
              </button>

              {/* Авто клиента */}
              <div className="flex items-start gap-2 mb-3 p-3 rounded-xl bg-white/5">
                <Car className="w-4 h-4 text-[#CC003A] mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-white/40 uppercase tracking-wide mb-0.5">Сдаёт</div>
                  <div className="text-sm text-white font-medium">{request.user_car}</div>
                </div>
              </div>

              {/* Целевое авто */}
              {request.target_car && (
                <div className="flex items-start gap-2 mb-3 p-3 rounded-xl bg-white/5">
                  <Car className="w-4 h-4 text-[#CC003A] mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-white/40 uppercase tracking-wide mb-1">Хочет</div>
                    <div className="flex items-center gap-3">
                      {request.target_car.photos?.[0] && (
                        <div className="w-16 h-11 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                          <Image
                            src={request.target_car.photos[0]}
                            alt=""
                            width={64}
                            height={44}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-white font-bold">
                          {request.target_car.brand} {request.target_car.model}
                        </div>
                        <div className="text-xs text-[#CC003A] font-bold">
                          {new Intl.NumberFormat('ru-RU').format(request.target_car.price)} ₽
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Доплата */}
              {request.trade_in_amount && (
                <div className="flex items-center gap-2 mb-3">
                  <Banknote className="w-4 h-4 text-amber-400" />
                  <span className="text-sm text-white/70">Доплата:</span>
                  <span className="text-sm text-white font-bold">
                    {new Intl.NumberFormat('ru-RU').format(request.trade_in_amount)} ₽
                  </span>
                </div>
              )}

              {/* Комментарий */}
              {request.comment && (
                <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-white/5">
                  <MessageSquare className="w-4 h-4 text-white/50 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-white/70">{request.comment}</p>
                </div>
              )}

              {/* Действия */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleCall(request.phone)}
                  className="flex-1 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Phone className="w-4 h-4" />
                  Позвонить
                </button>
                
                {activeTab === 'active' ? (
                  <button
                    onClick={() => archiveRequest(request.id)}
                    disabled={processingId === request.id}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    Отработана
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => restoreRequest(request.id)}
                      disabled={processingId === request.id}
                      className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <RotateCcw className="w-4 h-4" />
                      Вернуть
                    </button>
                    <button
                      onClick={() => deleteRequest(request.id)}
                      disabled={processingId === request.id}
                      className="py-2.5 px-4 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
