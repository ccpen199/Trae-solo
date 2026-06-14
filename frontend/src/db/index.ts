import Dexie, { type Table } from 'dexie';
import type {
  Tag,
  Book,
  ReadingSession,
  Note,
  NoteParagraph,
  PageAnchor,
  Entity,
  EntityRelation,
  OCRImage,
} from '@/types';

export class ReaderDatabase extends Dexie {
  tags!: Table<Tag, string>;
  books!: Table<Book, string>;
  readingSessions!: Table<ReadingSession, string>;
  notes!: Table<Note, string>;
  noteParagraphs!: Table<NoteParagraph, string>;
  pageAnchors!: Table<PageAnchor, string>;
  entities!: Table<Entity, string>;
  entityRelations!: Table<EntityRelation, string>;
  ocrImages!: Table<OCRImage, string>;

  constructor() {
    super('reader_knowledge_db');
    this.version(1).stores({
      tags: 'id, name, createdAt',
      books: 'id, title, isbn10, isbn13, category, status, progress, createdAt, updatedAt',
      readingSessions: 'id, bookId, mode, startTime, endTime, durationSeconds',
      notes: 'id, bookId, sourceType, createdAt, updatedAt',
      noteParagraphs: 'id, noteId, orderIndex',
      pageAnchors: 'id, noteId, pageNumber',
      entities: 'id, name, type, createdAt',
      entityRelations: 'id, sourceEntityId, targetEntityId, noteId, relationType',
      ocrImages: 'id, noteId, hash, createdAt',
    });
  }
}

export const db = new ReaderDatabase();

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxx-xxxx-xxxx'.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  );
}

export async function createItem<T extends { id: string }>(
  table: Table<T, string>,
  item: Omit<T, 'id'> & { id?: string }
): Promise<string> {
  const id = item.id || generateId();
  await table.add({ ...item, id } as T);
  return id;
}

export async function updateItem<T extends { id: string }>(
  table: Table<T, string>,
  id: string,
  changes: Partial<T>
): Promise<number> {
  return table.update(id, changes as any);
}

export async function deleteItem<T extends { id: string }>(
  table: Table<T, string>,
  id: string
): Promise<void> {
  await table.delete(id);
}

export async function getById<T extends { id: string }>(
  table: Table<T, string>,
  id: string
): Promise<T | undefined> {
  return table.get(id);
}

export async function listAll<T extends { id: string }>(
  table: Table<T, string>
): Promise<T[]> {
  return table.toArray();
}
