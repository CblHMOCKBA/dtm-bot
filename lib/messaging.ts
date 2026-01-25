import { getTelegramWebApp } from './telegram';

/**
 * Генерация короткого уникального ID для заявки
 */
function generateRequestId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `DTM-${id}`;
}

/**
 * Получить текущую дату/время
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
 * Проверка мобильной платформы
 */
function isMobile(): boolean {
  const tg = getTelegramWebApp();
  if (!tg?.platform) return false;
  const platform = tg.platform.toLowerCase();
  return platform === 'android' || platform === 'ios';
}

/**
 * Санитизация сообщения для URL (ES5 совместимо)
 */
function sanitizeMessage(msg: string): string {
  return msg
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/  +/g, ' ')
    .trim();
}

/**
 * Защита от повторных вызовов
 */
let lastSendTime = 0;
const DEBOUNCE_MS = 2000;

/**
 * Максимальная длина URL
 */
const MAX_URL_LENGTH = 1500;

/**
 * Отправка сообщения в Telegram
 * ИСПРАВЛЕНО: Добавлена задержка для мобильных
 */
export function sendTelegramMessage(username: string, message: string): boolean {
  const tg = getTelegramWebApp();
  
  // Защита от повторных нажатий
  const now = Date.now();
  if (now - lastSendTime < DEBOUNCE_MS) {
    return false;
  }
  lastSendTime = now;
  
  if (!username || !message) {
    return false;
  }
  
  // Генерируем ID и санитизируем сообщение
  const requestId = generateRequestId();
  const timestamp = getTimestamp();
  const cleanMessage = sanitizeMessage(message);
  
  // Простой формат
  const formattedMessage = `[${requestId}] ${timestamp}\n\n${cleanMessage}`;
  
  // Кодируем для URL
  const encodedMessage = encodeURIComponent(formattedMessage);
  let tgLink = `https://t.me/${username}?text=${encodedMessage}`;
  
  // Проверка длины
  if (tgLink.length > MAX_URL_LENGTH) {
    const shortMessage = cleanMessage.substring(0, 200) + '...';
    const shortFormatted = `[${requestId}] ${timestamp}\n\n${shortMessage}`;
    tgLink = `https://t.me/${username}?text=${encodeURIComponent(shortFormatted)}`;
  }
  
  // Haptic feedback сразу
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred('success');
  }
  
  // На мобильных используем задержку и location.href
  if (isMobile()) {
    setTimeout(() => {
      window.location.href = tgLink;
    }, 100);
    return true;
  }
  
  // На десктопе используем openTelegramLink
  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(tgLink);
      return true;
    } catch (error) {
      // Fallback
      window.location.href = tgLink;
      return true;
    }
  }
  
  // Fallback для всех остальных случаев
  window.location.href = tgLink;
  return true;
}

/**
 * Открыть чат без сообщения
 */
export function openTelegramChat(username: string): boolean {
  const tg = getTelegramWebApp();
  
  if (!username) return false;
  
  const tgLink = `https://t.me/${username}`;
  
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.impactOccurred('light');
  }
  
  if (isMobile()) {
    setTimeout(() => {
      window.location.href = tgLink;
    }, 100);
    return true;
  }
  
  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(tgLink);
      return true;
    } catch (error) {
      window.location.href = tgLink;
      return true;
    }
  }
  
  window.location.href = tgLink;
  return true;
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
  
  setTimeout(() => {
    window.location.href = telLink;
  }, 50);
  
  return true;
}
