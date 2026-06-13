import { create } from 'zustand';
import { db, generateId } from '@/db';
import type { Book, BookStatus, Tag } from '@/types';
import dayjs from 'dayjs';

interface BookFilters {
  search: string;
  status: BookStatus | 'all';
  tagId: string | null;
  sortBy: 'title' | 'progress' | 'createdAt' | 'updatedAt';
  sortOrder: 'asc' | 'desc';
}

interface BookStore {
  books: Book[];
  tags: Tag[];
  currentBook: Book | null;
  filters: BookFilters;
  loading: boolean;

  loadBooks: () => Promise<void>;
  loadTags: () => Promise<void>;
  addBook: (book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'progress'>) => Promise<string>;
  updateBook: (id: string, changes: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  setCurrentBook: (book: Book | null) => void;
  setFilters: (filters: Partial<BookFilters>) => void;
  addTag: (name: string, color: string) => Promise<string>;
  deleteTag: (id: string) => Promise<void>;
  fetchMetadataByISBN: (isbn: string) => Promise<Partial<Book> | null>;
  getFilteredBooks: () => Book[];
}

export const useBookStore = create<BookStore>((set, get) => ({
  books: [],
  tags: [],
  currentBook: null,
  filters: {
    search: '',
    status: 'all',
    tagId: null,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  },
  loading: false,

  loadBooks: async () => {
    set({ loading: true });
    const books = await db.books.orderBy('updatedAt').reverse().toArray();
    set({ books, loading: false });
  },

  loadTags: async () => {
    const tags = await db.tags.toArray();
    set({ tags });
  },

  addBook: async (bookData) => {
    const id = generateId();
    const now = dayjs().toISOString();
    const progress = bookData.totalPages > 0
      ? Math.round((bookData.currentPage / bookData.totalPages) * 100)
      : 0;
    const book: Book = {
      ...bookData,
      id,
      progress,
      createdAt: now,
      updatedAt: now,
    };
    await db.books.add(book);
    set(state => ({ books: [book, ...state.books] }));
    return id;
  },

  updateBook: async (id, changes) => {
    const updated = { ...changes, updatedAt: dayjs().toISOString() };
    if (changes.currentPage !== undefined || changes.totalPages !== undefined) {
      const book = await db.books.get(id);
      if (book) {
        const cp = changes.currentPage ?? book.currentPage;
        const tp = changes.totalPages ?? book.totalPages;
        (updated as any).progress = tp > 0 ? Math.round((cp / tp) * 100) : 0;
      }
    }
    await db.books.update(id, updated);
    set(state => ({
      books: state.books.map(b => (b.id === id ? { ...b, ...updated } : b)),
      currentBook: state.currentBook?.id === id
        ? { ...state.currentBook, ...updated }
        : state.currentBook,
    }));
  },

  deleteBook: async (id) => {
    await db.books.delete(id);
    await db.notes.where('bookId').equals(id).delete();
    await db.readingSessions.where('bookId').equals(id).delete();
    set(state => ({
      books: state.books.filter(b => b.id !== id),
      currentBook: state.currentBook?.id === id ? null : state.currentBook,
    }));
  },

  setCurrentBook: (book) => set({ currentBook: book }),

  setFilters: (filters) =>
    set(state => ({ filters: { ...state.filters, ...filters } })),

  addTag: async (name, color) => {
    const id = generateId();
    const tag: Tag = { id, name, color, createdAt: dayjs().toISOString() };
    await db.tags.add(tag);
    set(state => ({ tags: [...state.tags, tag] }));
    return id;
  },

  deleteTag: async (id) => {
    await db.tags.delete(id);
    set(state => ({ tags: state.tags.filter(t => t.id !== id) }));
  },

  fetchMetadataByISBN: async (isbn) => {
    try {
      const cleanISBN = isbn.replace(/[-\s]/g, '');
      const resp = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanISBN}&langRestrict=zh`
      );
      const data = await resp.json();
      if (data.totalItems === 0) return null;
      const item = data.items[0];
      const info = item.volumeInfo;
      return {
        title: info.title || '',
        subtitle: info.subtitle || '',
        authors: info.authors || [],
        publisher: info.publisher || '',
        publishDate: info.publishedDate || '',
        category: info.categories?.[0] || '',
        totalPages: info.pageCount || 0,
        coverImage: info.imageLinks?.thumbnail?.replace('http:', 'https:') || '',
      } as Partial<Book>;
    } catch {
      return null;
    }
  },

  getFilteredBooks: () => {
    const { books, filters } = get();
    let result = [...books];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        b =>
          b.title.toLowerCase().includes(q) ||
          b.authors.some(a => a.toLowerCase().includes(q)) ||
          b.isbn13?.includes(q)
      );
    }

    if (filters.status !== 'all') {
      result = result.filter(b => b.status === filters.status);
    }

    if (filters.tagId) {
      result = result.filter(b => b.tagIds.includes(filters.tagId!));
    }

    result.sort((a, b) => {
      const valA = a[filters.sortBy];
      const valB = b[filters.sortBy];
      let cmp = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        cmp = valA.localeCompare(valB);
      } else {
        cmp = (valA as number) - (valB as number);
      }
      return filters.sortOrder === 'desc' ? -cmp : cmp;
    });

    return result;
  },
}));
