-- Миграция для добавления поля hide_new_badge в таблицу cars
-- Выполните этот SQL в Supabase SQL Editor

-- 1. Добавляем колонку hide_new_badge с дефолтным значением false
ALTER TABLE cars 
ADD COLUMN IF NOT EXISTS hide_new_badge BOOLEAN DEFAULT FALSE;

-- 2. Добавляем комментарий к колонке
COMMENT ON COLUMN cars.hide_new_badge IS 'Флаг для ручного скрытия плашки "Новинка"';

-- 3. Создаем индекс для быстрой фильтрации (опционально)
CREATE INDEX IF NOT EXISTS cars_hide_new_badge_idx ON cars(hide_new_badge);

-- Проверка: просмотр структуры таблицы
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'cars'
-- ORDER BY ordinal_position;
