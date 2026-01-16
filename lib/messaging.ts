import { getTelegramWebApp } from './telegram';

/**
 * Отправка сообщения в Telegram
 * Использует ТОЛЬКО методы, которые не закрывают Mini App
 */
export function sendTelegramMessage(username: string, message: string): boolean {
  const tg = getTelegramWebApp();
  const encodedMessage = encodeURIComponent(message);
  const tgLink = `https://t.me/${username}?text=${encodedMessage}`;
  
  console.log('[TG Message] Отправка сообщения:', { username, messageLength: message.length });
  
  // ОСНОВНОЙ способ: Telegram WebApp API
  // Это единственный надёжный метод, который не закрывает Mini App
  if (tg?.openTelegramLink) {
    try {
      console.log('[TG Message] Используем openTelegramLink');
      tg.openTelegramLink(tgLink);
      
      // Haptic feedback
      if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      return true;
    } catch (error) {
      console.error('[TG Message] openTelegramLink failed:', error);
      // Если не удалось, показываем пользователю ошибку
      if (tg.showAlert) {
        tg.showAlert('Не удалось открыть чат. Попробуйте позже.');
      }
      return false;
    }
  }
  
  console.error('[TG Message] Telegram WebApp API недоступен');
  return false;
}

/**
 * Открыть чат с пользователем без сообщения
 */
export function openTelegramChat(username: string): boolean {
  const tg = getTelegramWebApp();
  const tgLink = `https://t.me/${username}`;
  
  console.log('[TG Chat] Открытие чата:', username);
  
  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(tgLink);
      
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
      
      return true;
    } catch (error) {
      console.error('[TG Chat] openTelegramLink failed:', error);
      if (tg.showAlert) {
        tg.showAlert('Не удалось открыть чат. Попробуйте позже.');
      }
      return false;
    }
  }
  
  console.error('[TG Chat] Telegram WebApp API недоступен');
  return false;
}

/**
 * Позвонить по номеру телефона
 * ИСПРАВЛЕНО: Использует более надежный метод для Telegram Mini App
 */
export function makePhoneCall(phoneNumber: string): boolean {
  // Очищаем номер от всех символов кроме цифр и +
  const phoneClean = phoneNumber.replace(/[\s()-]/g, '');
  const telLink = `tel:${phoneClean}`;
  const tg = getTelegramWebApp();
  
  console.log('[Phone] Звонок на номер:', phoneClean);
  
  // Haptic feedback при нажатии
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('medium');
  }
  
  // ИСПРАВЛЕНИЕ: Используем location.href напрямую
  // Это самый надежный способ для звонков в Telegram Mini App
  try {
    console.log('[Phone] Используем location.href');
    window.location.href = telLink;
    return true;
  } catch (error) {
    console.error('[Phone] location.href failed:', error);
    
    // Fallback: пробуем window.open
    try {
      console.log('[Phone] Fallback: window.open');
      window.open(telLink, '_self');
      return true;
    } catch (error2) {
      console.error('[Phone] window.open failed:', error2);
      
      // Последний fallback: показываем алерт с номером
      if (tg?.showAlert) {
        tg.showAlert(`Позвоните на номер: ${phoneNumber}`);
      }
      return false;
    }
  }
}
