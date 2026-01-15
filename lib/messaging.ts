import { getTelegramWebApp } from './telegram';

/**
 * Надёжная отправка сообщения в Telegram
 * Использует правильный метод в зависимости от контекста
 */
export function sendTelegramMessage(username: string, message: string): boolean {
  const tg = getTelegramWebApp();
  const encodedMessage = encodeURIComponent(message);
  const tgLink = `https://t.me/${username}?text=${encodedMessage}`;
  
  console.log('[TG Message] Отправка сообщения:', { username, messageLength: message.length });
  
  // Способ 1: Telegram WebApp API (предпочтительный)
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
    }
  }
  
  // Способ 2: Прямой переход (fallback)
  try {
    console.log('[TG Message] Fallback: location.href');
    window.location.href = tgLink;
    return true;
  } catch (error) {
    console.error('[TG Message] location.href failed:', error);
  }
  
  // Способ 3: window.open (последний резерв)
  try {
    console.log('[TG Message] Last resort: window.open');
    const newWindow = window.open(tgLink, '_blank');
    if (newWindow) {
      return true;
    }
  } catch (error) {
    console.error('[TG Message] window.open failed:', error);
  }
  
  console.error('[TG Message] Все методы отправки не сработали');
  return false;
}

/**
 * Открыть чат с пользователем без сообщения
 */
export function openTelegramChat(username: string): boolean {
  const tg = getTelegramWebApp();
  const tgLink = `https://t.me/${username}`;
  
  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(tgLink);
      return true;
    } catch (error) {
      console.error('[TG Chat] openTelegramLink failed:', error);
    }
  }
  
  try {
    window.location.href = tgLink;
    return true;
  } catch (error) {
    console.error('[TG Chat] location.href failed:', error);
  }
  
  return false;
}

/**
 * Позвонить по номеру
 */
export function makePhoneCall(phoneNumber: string): boolean {
  const phoneClean = phoneNumber.replace(/[\s()-]/g, '');
  const telLink = `tel:${phoneClean}`;
  
  try {
    window.location.href = telLink;
    return true;
  } catch (error) {
    console.error('[Phone] Call failed:', error);
    
    try {
      window.open(telLink, '_blank');
      return true;
    } catch (e) {
      console.error('[Phone] window.open failed:', e);
    }
  }
  
  return false;
}
