-- SQL Миграция для добавления статуса 'sold' (продано)
-- Выполни этот SQL в Supabase SQL Editor

-- 1. Удаляем старый constraint
ALTER TABLE cars 
DROP CONSTRAINT IF EXISTS cars_status_check;

-- 2. Создаем новый constraint с добавленным статусом 'sold'
ALTER TABLE cars 
ADD CONSTRAINT cars_status_check 
CHECK (status IN ('available', 'order', 'inTransit', 'sold'));

-- 3. Обновляем комментарий к колонке
COMMENT ON COLUMN cars.status IS 'Статус автомобиля: available (в наличии), order (под заказ), inTransit (в пути), sold (продано)';

-- Проверка: просмотр структуры таблицы
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'cars';
