import { getTelegramWebApp } from './telegram';

/**
 * Генерация короткого уникального ID для заявки
 * Формат: DTM-XXXX (4 символа, легко читается и диктуется)
 */
function generateRequestId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Без похожих символов (0,O,1,I)
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DTM-${id}`;
}

/**
 * Получить текущую дату/время в формате для заявки
 */
function getTimestamp(): string {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${day}.${month} ${hours}:${minutes}`;
}

/**
 * Защита от повторных вызовов (debounce)
 */
let lastSendTime = 0;
const DEBOUNCE_MS = 2000; // 2 секунды

/**
 * Максимальная длина URL для Telegram
 */
const MAX_URL_LENGTH = 2000; // Уменьшили для надёжности на мобильных

/**
 * Отправка сообщения в Telegram с уникальным ID заявки
 * 
 * ИСПРАВЛЕНО для мобильных:
 * - Убраны спецсимволы Unicode (━)
 * - Упрощён формат
 * - Добавлен debounce
 */
export function sendTelegramMessage(username: string, message: string): boolean {
  const tg = getTelegramWebApp();
  
  // Защита от повторных нажатий
  const now = Date.now();
  if (now - lastSendTime < DEBOUNCE_MS) {
    console.log('[TG] Blocked: too fast');
    return false;
  }
  lastSendTime = now;
  
  if (!username || !message) {
    console.error('[TG] Error: empty username or message');
    return false;
  }
  
  // Генерируем уникальный ID
  const requestId = generateRequestId();
  const timestamp = getTimestamp();
  
  // ПРОСТОЙ формат без спецсимволов Unicode
  // Работает на всех платформах
  const formattedMessage = `[${requestId}] ${timestamp}

${message}`;
  
  const encodedMessage = encodeURIComponent(formattedMessage);
  let tgLink = `https://t.me/${username}?text=${encodedMessage}`;
  
  // Проверка длины URL
  if (tgLink.length > MAX_URL_LENGTH) {
    // Обрезаем если слишком длинное
    const maxMsgLen = 300;
    const shortMessage = message.substring(0, maxMsgLen) + '...';
    const shortFormatted = `[${requestId}] ${timestamp}

${shortMessage}`;
    tgLink = `https://t.me/${username}?text=${encodeURIComponent(shortFormatted)}`;
  }
  
  console.log('[TG] Sending:', { requestId, urlLen: tgLink.length });
  
  // Попытка отправить через Telegram API
  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(tgLink);
      
      if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      return true;
    } catch (error) {
      console.error('[TG] openTelegramLink failed:', error);
      
      // Fallback: window.open
      try {
        window.open(tgLink, '_blank');
        return true;
      } catch (e) {
        console.error('[TG] window.open failed:', e);
        return false;
      }
    }
  }
  
  // Без TG API - просто открываем ссылку
  try {
    window.open(tgLink, '_blank');
    return true;
  } catch (e) {
    console.error('[TG] All methods failed');
    return false;
  }
}

/**
 * Открыть чат без сообщения
 */
export function openTelegramChat(username: string): boolean {
  const tg = getTelegramWebApp();
  
  if (!username) return false;
  
  const tgLink = `https://t.me/${username}`;
  
  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(tgLink);
      
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
      
      return true;
    } catch (error) {
      try {
        window.open(tgLink, '_blank');
        return true;
      } catch (e) {
        return false;
      }
    }
  }
  
  try {
    window.open(tgLink, '_blank');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Позвонить
 */
export function makePhoneCall(phoneNumber: string): boolean {
  const phoneClean = phoneNumber.replace(/[\s()\-]/g, '');
  const telLink = `tel:${phoneClean}`;
  const tg = getTelegramWebApp();
  
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('medium');
  }
  
  try {
    window.location.href = telLink;
    return true;
  } catch (error) {
    try {
      window.open(telLink, '_self');
      return true;
    } catch (e) {
      if (tg?.showAlert) {
        tg.showAlert(`Позвоните: ${phoneNumber}`);
      } else {
        alert(`Позвоните: ${phoneNumber}`);
      }
      return false;
    }
  }
}
