import { DestroyRef, effect, inject, signal, untracked, type WritableSignal } from '@angular/core';

import { StorageService } from './storage.service';

export const fromStorage = <TValue>(storageKey: string): WritableSignal<TValue | null> => {
  const storage = inject(StorageService);

  const initialValue = storage.getItem<TValue>(storageKey);

  const fromStorageSignal = signal<TValue | null>(initialValue);

  const writeToStorageOnUpdateEffect = effect(() => {
    const updated = fromStorageSignal();
    untracked(() => storage.setItem(storageKey, updated));
  });

  const storageEventListener = (event: StorageEvent) => {
    // storageArea should also be checked to avoid issue
    const isWatchedValueTargeted = event.key === storageKey;
    if (!isWatchedValueTargeted) {
      return;
    }

    const currentValue = fromStorageSignal();
    const newValue = storage.getItem<TValue>(storageKey);

    // if value type is not string but object it is failing here
    const hasValueChanged = JSON.stringify(newValue) !== JSON.stringify(currentValue);
    if (hasValueChanged) {
      fromStorageSignal.set(newValue);
    };
  }

  window.addEventListener('storage', storageEventListener);

  inject(DestroyRef).onDestroy(() => {
    window.removeEventListener('storage', storageEventListener);
  });

  return fromStorageSignal;
}
