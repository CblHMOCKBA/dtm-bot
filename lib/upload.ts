import { supabase } from './supabase';

/**
 * Загружает изображение в Supabase Storage
 * @param file - Файл изображения
 * @param folder - Папка для сохранения (по умолчанию 'cars')
 * @returns URL загруженного изображения или null в случае ошибки
 */
export async function uploadImage(
  file: File,
  folder: string = 'cars'
): Promise<string | null> {
  try {
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      throw new Error('Файл должен быть изображением');
    }

    // Проверяем размер (максимум 5 МБ)
    const maxSize = 5 * 1024 * 1024; // 5 MB
    if (file.size > maxSize) {
      throw new Error('Размер файла не должен превышать 5 МБ');
    }

    // Генерируем уникальное имя файла
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    // Загружаем файл в Supabase Storage
    const { data, error } = await supabase.storage
      .from('photos')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    // Получаем публичный URL
    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

/**
 * Загружает несколько изображений
 * @param files - Массив файлов
 * @param folder - Папка для сохранения
 * @returns Массив URL загруженных изображений
 */
export async function uploadImages(
  files: FileList | File[],
  folder: string = 'cars'
): Promise<string[]> {
  const uploadPromises = Array.from(files).map(file => uploadImage(file, folder));
  const results = await Promise.all(uploadPromises);
  
  // Фильтруем null значения (ошибки загрузки)
  return results.filter((url): url is string => url !== null);
}

/**
 * Удаляет изображение из Supabase Storage
 * @param imageUrl - URL изображения
 * @returns true если успешно, false если ошибка
 */
export async function deleteImage(imageUrl: string): Promise<boolean> {
  try {
    // Извлекаем путь файла из URL
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/photos/');
    
    if (pathParts.length < 2) {
      console.error('Invalid image URL');
      return false;
    }
    
    const filePath = pathParts[1];

    const { error } = await supabase.storage
      .from('photos')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
}
