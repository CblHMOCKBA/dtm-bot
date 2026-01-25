'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';

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
// Это предотвращает infinite loop в useSyncExternalStore
const EMPTY_FAVORITES: FavoriteItem[] = [];

// Инициализация из localStorage
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
  return favorites;
}

// ИСПРАВЛЕНО: Возвращаем КЭШИРОВАННЫЙ пустой массив
// Раньше возвращался новый [] каждый раз → infinite loop
function getServerSnapshot(): FavoriteItem[] {
  return EMPTY_FAVORITES;
}

export function useFavorites() {
  // Инициализация при первом рендере
  useEffect(() => {
    initFavorites();
    notifyListeners();
  }, []);

  // Подписка на изменения
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

  const isFavorite = useCallback((id: string, type: 'car' | 'plate' | 'tire') => {
    return favorites.some(f => f.id === id && f.type === type);
  }, []);

  const getFavoritesByType = useCallback((type: 'car' | 'plate' | 'tire') => {
    return favorites.filter(f => f.type === type).map(f => f.id);
  }, []);

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
