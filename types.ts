export type CarStatus = 'available' | 'order' | 'inTransit' | 'sold';

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  price: number;
  mileage: number;
  description: string;
  photos: string[];
  specs: CarSpecs;
  status: CarStatus;
  created_at: string;
  hide_new_badge?: boolean;
}

export interface CarSpecs {
  engine?: string;
  power?: string;
  transmission?: string;
  drive?: string;
  color?: string;
  body_type?: string;
  fuel?: string;
  interior_color?: string;
}

export interface FilterParams {
  brand?: string;
  year_from?: number;
  year_to?: number;
  price_from?: number;
  price_to?: number;
  body_type?: string;
}

// =====================================================
// TELEGRAM WEBAPP TYPES
// =====================================================

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
  };
  version: string;
  platform: string;
  colorScheme: 'light' | 'dark';
  themeParams: {
    bg_color?: string;
    text_color?: string;
    hint_color?: string;
    link_color?: string;
    button_color?: string;
    button_text_color?: string;
    secondary_bg_color?: string;
  };
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  BackButton: {
    isVisible: boolean;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
  };
  MainButton: {
    text: string;
    color: string;
    textColor: string;
    isVisible: boolean;
    isActive: boolean;
    isProgressVisible: boolean;
    setText(text: string): void;
    onClick(callback: () => void): void;
    offClick(callback: () => void): void;
    show(): void;
    hide(): void;
    enable(): void;
    disable(): void;
    showProgress(leaveActive?: boolean): void;
    hideProgress(): void;
    setParams(params: {
      text?: string;
      color?: string;
      text_color?: string;
      is_active?: boolean;
      is_visible?: boolean;
    }): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
  ready(): void;
  expand(): void;
  close(): void;
  sendData(data: string): void;
  openLink(url: string): void;
  openTelegramLink(url: string): void;
  showAlert(message: string): void;
  showConfirm(message: string, callback?: (confirmed: boolean) => void): void;
  showPopup(params: { title?: string; message: string; buttons?: Array<{ id?: string; type?: string; text: string }> }, callback?: (buttonId: string) => void): void;
  // Telegram API 7.7+
  disableVerticalSwipes?(): void;
  enableVerticalSwipes?(): void;
  // Telegram API 8.0+
  requestFullscreen?(): void;
  exitFullscreen?(): void;
  isFullscreen?: boolean;
  // Header/Background colors
  setHeaderColor?(color: string): void;
  setBackgroundColor?(color: string): void;
  // Events
  onEvent?(eventType: string, callback: () => void): void;
  offEvent?(eventType: string, callback: () => void): void;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp;
    };
  }
}
