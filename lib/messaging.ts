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
 * Санитизация сообщения для URL
 * Убирает эмодзи и проблемные символы
 */
function sanitizeMessage(msg: string): string {
  return msg
    // Убираем эмодзи (могут ломать URL на мобильных)
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    // Убираем специальные символы Unicode
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    // Заменяем множественные пробелы/переносы
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
const MAX_URL_LENGTH = 1500; // Ещё меньше для надёжности

/**
 * Отправка сообщения в Telegram
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
  
  console.log('[TG] Sending:', { requestId, urlLen: tgLink.length, platform: tg?.platform });
  
  // Отправка
  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(tgLink);
      
      if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      return true;
    } catch (error) {
      console.error('[TG] openTelegramLink failed:', error);
    }
  }
  
  // Fallback
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
      // Fallback
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
