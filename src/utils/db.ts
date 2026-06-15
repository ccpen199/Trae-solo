import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Resume } from '../types';

interface ResumeWorkbenchDB extends DBSchema {
  resumes: {
    key: string;
    value: Resume;
    indexes: { 'by-updatedAt': number };
  };
  settings: {
    key: string;
    value: { key: string; value: unknown };
  };
}

let dbPromise: Promise<IDBPDatabase<ResumeWorkbenchDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<ResumeWorkbenchDB>('resume-workbench', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('resumes')) {
          const resumesStore = db.createObjectStore('resumes', { keyPath: 'id' });
          resumesStore.createIndex('by-updatedAt', 'updatedAt');
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveResume(resume: Resume) {
  const db = await getDb();
  await db.put('resumes', resume);
  return resume;
}

export async function getResumes() {
  const db = await getDb();
  return db.getAllFromIndex('resumes', 'by-updatedAt');
}

export async function getResume(id: string) {
  const db = await getDb();
  return db.get('resumes', id);
}

export async function deleteResume(id: string) {
  const db = await getDb();
  await db.delete('resumes', id);
}

export async function saveSetting(key: string, value: unknown) {
  const db = await getDb();
  await db.put('settings', { key, value });
}

export async function getSetting(key: string) {
  const db = await getDb();
  const result = await db.get('settings', key);
  return result?.value;
}

export async function clearAllData() {
  const db = await getDb();
  const tx = db.transaction(['resumes', 'settings'], 'readwrite');
  await Promise.all([tx.objectStore('resumes').clear(), tx.objectStore('settings').clear()]);
  await tx.done;
}
