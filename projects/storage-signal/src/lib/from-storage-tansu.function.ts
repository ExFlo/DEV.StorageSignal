import { asWritable, computed, writable } from '@amadeus-it-group/tansu';
import type { WritableSignal } from '@amadeus-it-group/tansu';
import { inject } from '@angular/core';
import { STORAGE } from './storage.service';

// Tansu version
export const stringStorageStore = (storage: Storage, name: string) => {
	const innerStore = writable<string | null>(null, () => {
		window.addEventListener('storage', onStorage);
		innerStore.set(storage.getItem(name)); // read the value lazily
		return () => window.removeEventListener('storage', onStorage);
	});

	const onStorage = ({storageArea, key, newValue}: StorageEvent) => {
    // if storageArea.clear has been called the key will be null (and the value too)
		if (storageArea === storage && (key == name || key == null)) {
			innerStore.set(newValue);
		}
	};

	return asWritable(innerStore, (newValue) => {
    if(newValue == null) {
      storage.removeItem(name);
    } else {
      storage.setItem(name, newValue);
    }
    window.dispatchEvent(new StorageEvent('storage', {key: name, newValue, storageArea: storage}));
  });
};

export const deriveParsedStore = <TValue>(stringStore: WritableSignal<string | null>) => {
  // potential issue with the value is not parsable ?
	const computedStore = computed<TValue | null>(() => JSON.parse(stringStore() ?? 'null'));
  return asWritable(computedStore, (newValue) => {
    if (newValue == null) {
      stringStore.set(null);
    } else {
      stringStore.set(JSON.stringify(newValue));
    }
  });
};

export const fromStorageTansu = <TValue>(name: string) => deriveParsedStore<TValue>(
  stringStorageStore(inject(STORAGE), name)
);
