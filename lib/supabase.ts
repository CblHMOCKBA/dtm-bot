import { createClient } from '@supabase/supabase-js';

// Временно хардкодим значения для отладки
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykvgoyjgkdvqhnosfmcx.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrdmdveWpna2R2cWhub3NmbWN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5ODI4MTAsImV4cCI6MjA3OTU1ODgxMH0.SQEdeuPLgby_5i1oAP3vyI77Ik4XFStyp7fSCuZAUKg';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file:\n' +
    '- NEXT_PUBLIC_SUPABASE_URL\n' +
    '- NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Инициализация таблиц (выполнить в Supabase SQL Editor):
/*
CREATE TABLE cars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  price INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  description TEXT,
  photos TEXT[] DEFAULT '{}',
  specs JSONB DEFAULT '{}',
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'order', 'inTransit', 'sold')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Индексы для быстрого поиска
CREATE INDEX idx_cars_brand ON cars(brand);
CREATE INDEX idx_cars_year ON cars(year);
CREATE INDEX idx_cars_price ON cars(price);
CREATE INDEX idx_cars_status ON cars(status);

-- RLS политики (Row Level Security)
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Разрешить всем читать
CREATE POLICY "Enable read access for all users" ON cars
  FOR SELECT USING (true);

-- Разрешить вставку/обновление/удаление только админам (настройте по вашим требованиям)
CREATE POLICY "Enable insert for authenticated users" ON cars
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" ON cars
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete for authenticated users" ON cars
  FOR DELETE USING (true);
*/
