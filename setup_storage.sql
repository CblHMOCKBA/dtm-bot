-- SQL для настройки Supabase Storage
-- Выполни этот SQL в Supabase SQL Editor

-- 1. Создаем bucket для хранения фото автомобилей
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Настраиваем политики доступа (разрешаем всем читать, только админам загружать)

-- Разрешаем всем читать фото
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Разрешаем всем загружать фото (можно ограничить только админами если нужно)
CREATE POLICY "Allow Upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos');

-- Разрешаем удалять загруженные файлы
CREATE POLICY "Allow Delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'photos');

-- Готово! Теперь можно загружать фото в Supabase Storage
