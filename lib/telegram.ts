import { TelegramWebApp } from '@/types';

export const getTelegramWebApp = (): TelegramWebApp | null => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
};

export const initTelegramWebApp = () => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.ready();
    tg.expand();
    return tg;
  }
  return null;
};

export const getUserId = (): number | null => {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user?.id || null;
};

export const isAdmin = (): boolean => {
  // РЕЖИМ РАЗРАБОТКИ: На localhost с параметром ?admin=true
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    const urlParams = new URLSearchParams(window.location.search);
    
    if (urlParams.get('admin') === 'true') {
      sessionStorage.setItem('dev_admin', 'true');
      return true;
    }
    
    if (sessionStorage.getItem('dev_admin') === 'true') {
      return true;
    }
  }

  // СЕКРЕТНЫЙ КЛЮЧ - работает ВСЕГДА!
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const adminKey = urlParams.get('admin');
    
    // Проверяем секретный ключ
    if (adminKey === 'secret2025' || adminKey === 'топгир2025') {
      sessionStorage.setItem('admin_key', 'true');
      return true;
    }
    
    // Проверяем sessionStorage
    if (sessionStorage.getItem('admin_key') === 'true') {
      return true;
    }
  }
  
  // Проверка по Telegram ID
  const userId = getUserId();
  
  if (userId) {
    const adminIds = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.NEXT_PUBLIC_ADMIN_TELEGRAM_ID || '';
    const adminIdArray = adminIds.split(',').map(id => id.trim());
    
    if (adminIdArray.includes(userId.toString())) {
      return true;
    }
  }
  
  return false;
};

export const openTelegramChat = (botUsername: string) => {
  const tg = getTelegramWebApp();
  if (tg) {
    tg.openTelegramLink(`https://t.me/${botUsername}`);
  }
};

export const shareCarLink = (carId: string, carName: string) => {
  const tg = getTelegramWebApp();
  const shareUrl = `https://topgearmoscow-bot.vercel.app/car/${carId}`;
  
  if (tg) {
    const shareText = `Посмотри этот автомобиль: ${carName}`;
    
    try {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
    } catch (error) {
      console.error('Share error:', error);
      if (navigator.share) {
        navigator.share({
          title: carName,
          text: shareText,
          url: shareUrl,
        }).catch(err => console.error('Navigator share error:', err));
      } else {
        navigator.clipboard?.writeText(shareUrl);
        alert('Ссылка скопирована в буфер обмена!');
      }
    }
  } else if (navigator.share) {
    navigator.share({
      title: carName,
      url: shareUrl,
    }).catch(err => console.error('Navigator share error:', err));
  } else {
    navigator.clipboard?.writeText(shareUrl);
    alert('Ссылка скопирована в буфер обмена!');
  }
};
