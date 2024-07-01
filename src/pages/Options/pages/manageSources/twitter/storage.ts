export const getLocalStorage = async <T>(key: string): Promise<T | null> => {
  try {
    const result = await chrome.storage.local.get(key);
    return result[key] || null;
  } catch (error) {
    console.error(`Error getting local storage key "${key}":`, error);
    return null;
  }
};

export const setLocalStorage = async <T>(key: string, value: T): Promise<void> => {
  try {
    await chrome.storage.local.set({ [key]: value });
  } catch (error) {
    console.error(`Error setting local storage key "${key}":`, error);
  }
};
