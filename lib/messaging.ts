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
 * Использует метод, который работает в Telegram Mini App
 */
export function makePhoneCall(phoneNumber: string): boolean {
  const phoneClean = phoneNumber.replace(/[\s()-]/g, '');
  const telLink = `tel:${phoneClean}`;
  const tg = getTelegramWebApp();
  
  console.log('[Phone] Звонок на номер:', phoneClean);
  
  // Способ 1: Telegram WebApp API для открытия внешних ссылок
  if (tg?.openLink) {
    try {
      console.log('[Phone] Используем openLink');
      tg.openLink(telLink);
      
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
      
      return true;
    } catch (error) {
      console.error('[Phone] openLink failed:', error);
    }
  }
  
  // Способ 2: window.open для non-Telegram окружения
  try {
    console.log('[Phone] Fallback: window.open');
    const callWindow = window.open(telLink, '_blank');
    if (callWindow || navigator.userAgent.includes('Mobile')) {
      // На мобильных устройствах window.open может вернуть null, но всё равно сработать
      return true;
    }
  } catch (error) {
    console.error('[Phone] window.open failed:', error);
  }
  
  console.error('[Phone] Не удалось совершить звонок');
  return false;
}
