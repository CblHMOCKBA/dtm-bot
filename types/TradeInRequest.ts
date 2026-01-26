// Добавить в существующий types/index.ts

export interface TradeInRequest {
  id: string;
  phone: string;
  user_car: string;
  target_car_id: string | null;
  trade_in_amount: number | null;
  comment: string | null;
  status: 'active' | 'archived';
  created_at: string;
  archived_at: string | null;
  telegram_user_id: string | null;
  // Связанные данные (при join)
  target_car?: Car;
}
