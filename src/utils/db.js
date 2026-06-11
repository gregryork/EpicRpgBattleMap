const DB_NAME = 'DndBattlemapDB';
const DB_VERSION = 1;
const STORE_NAME = 'maps';

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const saveMapToDB = async (mapId, file) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(file, `mapImage_${mapId}`);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
};

export const getMapFromDB = async (mapId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(`mapImage_${mapId}`);
    request.onsuccess = async (e) => {
      const result = e.target.result;
      // Migration check: If looking for default map and it is empty, check for legacy 'currentMap'
      if (!result && mapId === 'map-default') {
        const legacyRequest = store.get('currentMap');
        legacyRequest.onsuccess = async (le) => {
          const legacyFile = le.target.result;
          if (legacyFile) {
            // Migrate legacy map image to the new key
            await saveMapToDB('map-default', legacyFile);
            await clearMapFromDB('currentMap');
            resolve(legacyFile);
          } else {
            resolve(null);
          }
        };
        legacyRequest.onerror = (le) => reject(le.target.error);
      } else {
        resolve(result);
      }
    };
    request.onerror = (e) => reject(e.target.error);
  });
};

export const clearMapFromDB = async (mapId) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(mapId.startsWith('mapImage_') ? mapId : `mapImage_${mapId}`);
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
};
