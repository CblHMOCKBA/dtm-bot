-- SQL Миграция для добавления поля status в таблицу cars
-- Выполни этот SQL в Supabase SQL Editor

-- 1. Добавляем колонку status с дефолтным значением 'available'
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'available';

-- 2. Создаем CHECK constraint для валидации значений (ИСПРАВЛЕНО: добавлен 'sold')
ALTER TABLE cars 
DROP CONSTRAINT IF EXISTS cars_status_check;

ALTER TABLE cars 
ADD CONSTRAINT cars_status_check 
CHECK (status IN ('available', 'order', 'inTransit', 'sold'));

-- 3. Обновляем существующие записи (если есть)
UPDATE cars 
SET status = 'available' 
WHERE status IS NULL;

-- 4. Создаем индекс для быстрой фильтрации по статусу
CREATE INDEX IF NOT EXISTS cars_status_idx ON cars(status);

-- 5. Добавляем комментарий к колонке
COMMENT ON COLUMN cars.status IS 'Статус автомобиля: available (в наличии), order (под заказ), inTransit (в пути), sold (продан)';

-- Проверка: просмотр структуры таблицы
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'cars';
