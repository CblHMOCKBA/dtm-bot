import { getTelegramWebApp } from './telegram';

/**
 * Генерация короткого уникального ID для заявки
 * Формат: #DTM-XXXX (4 символа, легко читается и диктуется)
 */
function generateRequestId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Без похожих символов (0,O,1,I)
  let id = '';
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `#DTM-${id}`;
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
 * Простое логирование ошибок (только в dev режиме)
 */
function logError(action: string, error: string) {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[DTM ${action}]`, error);
  }
  
  // Сохраняем только ошибки (последние 10)
  try {
    const logs = JSON.parse(localStorage.getItem('dtm_errors') || '[]');
    logs.push({ 
      time: new Date().toISOString(), 
      action, 
      error 
    });
    localStorage.setItem('dtm_errors', JSON.stringify(logs.slice(-10)));
  } catch (e) {}
}

// Утилита для просмотра ошибок в консоли
if (typeof window !== 'undefined') {
  (window as any).getDTMErrors = () => {
    try {
      const logs = JSON.parse(localStorage.getItem('dtm_errors') || '[]');
      console.table(logs);
      return logs;
    } catch (e) {
      return [];
    }
  };
}

/**
 * Максимальная длина URL для Telegram (с запасом)
 */
const MAX_URL_LENGTH = 4000;

/**
 * Отправка сообщения в Telegram с уникальным ID заявки
 * 
 * Формат сообщения:
 * ━━━━━━━━━━━━━━━━━
 * 📋 Заявка #DTM-A7X9
 * 🕐 24.01 16:33
 * ━━━━━━━━━━━━━━━━━
 * [текст сообщения]
 */
export function sendTelegramMessage(username: string, message: string): boolean {
  const tg = getTelegramWebApp();
  
  if (!username || !message) {
    logError('sendMessage', !username ? 'username пустой' : 'message пустой');
    return false;
  }
  
  // Генерируем уникальный ID и добавляем заголовок
  const requestId = generateRequestId();
  const timestamp = getTimestamp();
  
  const formattedMessage = `━━━━━━━━━━━━━━━━━
📋 Заявка ${requestId}
🕐 ${timestamp}
━━━━━━━━━━━━━━━━━

${message}`;
  
  const encodedMessage = encodeURIComponent(formattedMessage);
  let tgLink = `https://t.me/${username}?text=${encodedMessage}`;
  
  // Проверка длины URL
  if (tgLink.length > MAX_URL_LENGTH) {
    // Обрезаем сообщение если слишком длинное
    const maxMessageLength = Math.floor((MAX_URL_LENGTH - 100) / 3); // ~3x при кодировании
    const truncatedMessage = message.substring(0, maxMessageLength) + '...\n\n[Сообщение обрезано]';
    
    const truncatedFormatted = `━━━━━━━━━━━━━━━━━
📋 Заявка ${requestId}
🕐 ${timestamp}
━━━━━━━━━━━━━━━━━

${truncatedMessage}`;
    
    tgLink = `https://t.me/${username}?text=${encodeURIComponent(truncatedFormatted)}`;
  }
  
  // Попытка отправить через Telegram API
  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(tgLink);
      
      if (tg.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
      
      return true;
    } catch (error) {
      logError('sendMessage', error instanceof Error ? error.message : String(error));
      
      // Fallback: пробуем открыть как обычную ссылку
      try {
        window.open(tgLink, '_blank');
        return true;
      } catch (e) {
        // Последний fallback: копируем в буфер
        copyToClipboardFallback(formattedMessage, username, tg);
        return false;
      }
    }
  }
  
  // Если нет TG API - пробуем открыть ссылку напрямую
  try {
    window.open(tgLink, '_blank');
    return true;
  } catch (e) {
    copyToClipboardFallback(formattedMessage, username, tg);
    return false;
  }
}

/**
 * Fallback: копирование в буфер обмена
 */
function copyToClipboardFallback(message: string, username: string, tg: any) {
  try {
    navigator.clipboard?.writeText(message);
    
    const alertText = `Не удалось открыть Telegram.\n\nСообщение скопировано в буфер обмена.\nОтправьте его вручную: @${username}`;
    
    if (tg?.showAlert) {
      tg.showAlert(alertText);
    } else {
      alert(alertText);
    }
  } catch (e) {
    logError('clipboard', 'Не удалось скопировать');
  }
}

/**
 * Открыть чат без сообщения
 */
export function openTelegramChat(username: string): boolean {
  const tg = getTelegramWebApp();
  
  if (!username) {
    logError('openChat', 'username пустой');
    return false;
  }
  
  const tgLink = `https://t.me/${username}`;
  
  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(tgLink);
      
      if (tg.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
      }
      
      return true;
    } catch (error) {
      logError('openChat', error instanceof Error ? error.message : String(error));
      
      // Fallback
      try {
        window.open(tgLink, '_blank');
        return true;
      } catch (e) {
        return false;
      }
    }
  }
  
  // Без TG API
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
