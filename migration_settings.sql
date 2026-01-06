-- Миграция для добавления таблицы settings
-- Выполни этот SQL в Supabase SQL Editor

-- Создаём таблицу настроек
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  manual_sold_count INTEGER DEFAULT 0,
  description TEXT,
  phone TEXT,
  telegram TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Вставляем первую запись с дефолтными значениями
INSERT INTO settings (id, manual_sold_count, description, phone, telegram)
VALUES (1, 0, 'Премиальные автомобили с пробегом', '+7 (999) 123-45-67', '@topgearmoscow')
ON CONFLICT (id) DO NOTHING;

-- RLS политики
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Разрешить всем читать
CREATE POLICY "Enable read access for all users" ON settings
  FOR SELECT USING (true);

-- Разрешить обновление только админам
CREATE POLICY "Enable update for authenticated users" ON settings
  FOR UPDATE USING (true);

-- Комментарий к таблице
COMMENT ON TABLE settings IS 'Глобальные настройки приложения';
COMMENT ON COLUMN settings.manual_sold_count IS 'Дополнительные проданные авто (до создания бота)';
COMMENT ON COLUMN settings.description IS 'Описание компании';
COMMENT ON COLUMN settings.phone IS 'Контактный телефон';
COMMENT ON COLUMN settings.telegram IS 'Telegram username';

-- Проверка
-- SELECT * FROM settings;
