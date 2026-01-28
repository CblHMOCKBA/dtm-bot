'use client';

import { useCallback, useSyncExternalStore, useRef, useEffect } from 'react';

const FAVORITES_KEY = 'topgear_favorites';

export interface FavoriteItem {
  id: string;
  type: 'car' | 'plate' | 'tire';
  addedAt: number;
}

// Глобальное хранилище
let favorites: FavoriteItem[] = [];
let isInitialized = false;
const listeners = new Set<() => void>();

// ИСПРАВЛЕНО: Кэшированный пустой массив для серверного рендеринга
const EMPTY_FAVORITES: FavoriteItem[] = [];

// Инициализация из localStorage (синхронная, без side effects)
function initFavorites() {
  if (isInitialized || typeof window === 'undefined') return;
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    if (stored) {
      favorites = JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error loading favorites:', e);
  }
  isInitialized = true;
}

// Сохранение в localStorage
function saveFavorites() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  } catch (e) {
    console.error('Error saving favorites:', e);
  }
}

// Уведомление подписчиков
function notifyListeners() {
  listeners.forEach(listener => listener());
}

// Подписка на изменения
function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Получить текущий snapshot
function getSnapshot(): FavoriteItem[] {
  // ИСПРАВЛЕНО: Инициализируем синхронно при первом чтении
  if (!isInitialized && typeof window !== 'undefined') {
    initFavorites();
  }
  return favorites;
}

// Возвращаем кэшированный пустой массив для SSR
function getServerSnapshot(): FavoriteItem[] {
  return EMPTY_FAVORITES;
}

export function useFavorites() {
  // ИСПРАВЛЕНО: Убрали useEffect с notifyListeners
  // Это вызывало каскадные ре-рендеры всех компонентов!
  
  // Трекер первого рендера для избежания лишних уведомлений
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      // Не вызываем notifyListeners при первом рендере
      // Данные уже загружены синхронно в getSnapshot
    }
  }, []);

  // Подписка на изменения (реактивное состояние)
  const currentFavorites = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const addFavorite = useCallback((id: string, type: 'car' | 'plate' | 'tire') => {
    if (favorites.some(f => f.id === id && f.type === type)) return;
    favorites = [...favorites, { id, type, addedAt: Date.now() }];
    saveFavorites();
    notifyListeners();
  }, []);

  const removeFavorite = useCallback((id: string, type: 'car' | 'plate' | 'tire') => {
    favorites = favorites.filter(f => !(f.id === id && f.type === type));
    saveFavorites();
    notifyListeners();
  }, []);

  const toggleFavorite = useCallback((id: string, type: 'car' | 'plate' | 'tire') => {
    const exists = favorites.some(f => f.id === id && f.type === type);
    if (exists) {
      favorites = favorites.filter(f => !(f.id === id && f.type === type));
    } else {
      favorites = [...favorites, { id, type, addedAt: Date.now() }];
    }
    saveFavorites();
    notifyListeners();
    return !exists;
  }, []);

  // ИСПРАВЛЕНО: isFavorite теперь использует currentFavorites из useSyncExternalStore
  // а не глобальную переменную напрямую
  const isFavorite = useCallback((id: string, type: 'car' | 'plate' | 'tire') => {
    return currentFavorites.some(f => f.id === id && f.type === type);
  }, [currentFavorites]);

  const getFavoritesByType = useCallback((type: 'car' | 'plate' | 'tire') => {
    return currentFavorites.filter(f => f.type === type).map(f => f.id);
  }, [currentFavorites]);

  const clearFavorites = useCallback(() => {
    favorites = [];
    saveFavorites();
    notifyListeners();
  }, []);

  return {
    favorites: currentFavorites,
    isLoaded: isInitialized,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    getFavoritesByType,
    clearFavorites,
    count: currentFavorites.length,
  };
}
