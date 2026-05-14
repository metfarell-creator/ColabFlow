/**
 * Safe storage layer for ColabFlow
 * Prevents app crashes on corrupted localStorage and handles basic versioning.
 */

const STORAGE_VERSION = '1.0.0';

export interface PersistedData<T> {
  version: string;
  data: T;
  lastSaved: number;
}

export function saveJson<T>(key: string, data: T): void {
  try {
    const wrapped: PersistedData<T> = {
      version: STORAGE_VERSION,
      data,
      lastSaved: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(wrapped));
  } catch (error) {
    console.error(`[Storage] Failed to save ${key}:`, error);
  }
}

export function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;

    const parsed = JSON.parse(raw);
    
    // Check if it's the new wrapped format
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'data' in parsed) {
      // Future migrations could go here based on parsed.version
      return parsed.data as T;
    }

    // Handle legacy format (unwrapped JSON)
    return parsed as T;
  } catch (error) {
    console.warn(`[Storage] Failed to load ${key}, using fallback:`, error);
    return fallback;
  }
}

export function clearStorage(key: string): void {
  localStorage.removeItem(key);
}

// Specific storage keys
export const STORAGE_KEYS = {
  PROJECTS: 'colabflow_projects',
  TEMPLATES: 'colabflow_templates',
  AUTOSAVE_ENABLED: 'colabflow_autosave_enabled',
  ERROR_LOGS: 'colabflow_error_logs',
};
