/**
 * Утилиты для форматирования данных
 */

/**
 * Форматирует цену в российский формат с символом рубля
 * @param price - цена в рублях
 * @returns отформатированная строка, например "1 500 000 ₽"
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
};

/**
 * Форматирует пробег в российский формат с единицами измерения
 * @param mileage - пробег в километрах
 * @returns отформатированная строка, например "50 000 км"
 */
export const formatMileage = (mileage: number): string => {
  return new Intl.NumberFormat('ru-RU').format(mileage) + ' км';
};

/**
 * Форматирует число в российский формат (с пробелами)
 * @param value - число для форматирования
 * @returns отформатированная строка, например "1 500 000"
 */
export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('ru-RU').format(value);
};

/**
 * Форматирует дату в российский формат
 * @param date - дата в формате ISO string или Date object
 * @returns отформатированная строка, например "15 ноября 2024"
 */
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(dateObj);
};

/**
 * Форматирует дату и время в российский формат
 * @param date - дата в формате ISO string или Date object
 * @returns отформатированная строка, например "15 ноября 2024, 14:30"
 */
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
};

/**
 * Компактное форматирование больших чисел (для UI)
 * @param value - число для форматирования
 * @returns компактная строка, например "1.5М" для 1500000
 */
export const formatCompact = (value: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    notation: 'compact',
    compactDisplay: 'short'
  }).format(value);
};
