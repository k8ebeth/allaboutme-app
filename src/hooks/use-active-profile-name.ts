import { useSyncExternalStore } from 'react';

let activeProfileName = 'Daybook';
const listeners = new Set<() => void>();

export function setActiveProfileName(name: string) {
  activeProfileName = name.trim() || 'Daybook';
  listeners.forEach((listener) => listener());
}

export function useActiveProfileName() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => activeProfileName,
    () => 'Daybook',
  );
}
