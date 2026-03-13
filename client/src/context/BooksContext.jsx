// client/src/context/BooksContext.jsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  fetchMyBookshelf,
  addBookToBookshelf,
  removeBookFromBookshelf,
  patchProgress,
  fetchNotes,
  postNote,
  deleteNoteApi,
} from "../api/bookshelf.api";

const BooksContext = createContext(null);

function normalizeProgressSnapshot(p) {
  if (!p) return { current: 0, total: 0, updatedAt: "-" };
  return {
    current: Number(p.current ?? 0),
    total: p.total == null ? 0 : Number(p.total),
    updatedAt: p.updatedAt ?? "-",
  };
}

function buildProgressMapFromBooks(books) {
  const map = {};
  if (!Array.isArray(books)) return map;

  for (const b of books) {
    if (!b?.isbn) continue;
    if (b.progress) map[b.isbn] = normalizeProgressSnapshot(b.progress);
  }
  return map;
}

export function BooksProvider({ children }) {
  const [bookshelf, setBookshelf] = useState([]);
  const [progressByIsbn, setProgressByIsbn] = useState({});
  const [notesByIsbn, setNotesByIsbn] = useState({});
  const [logsByIsbn] = useState({});

  const [hydrated, setHydrated] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [booksError, setBooksError] = useState(null);

  const { isAuthed, isLoading } = useAuth();

  const notesInFlightRef = useRef(new Map());
  const notesCacheRef = useRef(new Map());

  const reset = useCallback(() => {
    setBookshelf([]);
    setProgressByIsbn({});
    setNotesByIsbn({});
    setBooksError(null);
    setLoadingBooks(false);

    notesCacheRef.current.clear();
    notesInFlightRef.current.clear();

    setHydrated(false);
  }, []);

  const refreshBookshelf = useCallback(async () => {
    setLoadingBooks(true);
    setBooksError(null);

    try {
      const list = await fetchMyBookshelf();
      setBookshelf(Array.isArray(list) ? list : []);
      setProgressByIsbn(buildProgressMapFromBooks(list));
    } catch (e) {
      setBooksError(e);
    } finally {
      setLoadingBooks(false);
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (isAuthed) {
      refreshBookshelf();
      return;
    }

    reset();
  }, [isAuthed, isLoading, refreshBookshelf, reset]);

  const addBook = useCallback(
    async (book) => {
      await addBookToBookshelf(book);
      await refreshBookshelf();
    },
    [refreshBookshelf]
  );

  const removeBook = useCallback(
    async (isbn) => {
      await removeBookFromBookshelf(isbn);
      await refreshBookshelf();
    },
    [refreshBookshelf]
  );

  // total은 서버가 자동 채우므로 current만 받는다
  const updateProgress = useCallback(async (isbn, current, total) => {
    const snapshot = await patchProgress(isbn, current, total);
    if (!snapshot?.isbn) return;

    const key = String(snapshot.isbn);

    setBookshelf((prev) =>
      Array.isArray(prev) ? prev.map((b) => (String(b.isbn) === key ? snapshot : b)) : prev
    );

    setProgressByIsbn((prev) => {
      const next = { ...prev };
      if (snapshot.progress) next[key] = normalizeProgressSnapshot(snapshot.progress);
      else delete next[key];
      return next;
    });
  }, []);

  const loadNotes = useCallback(async (isbn) => {
    if (!isbn) return [];

    const cached = notesCacheRef.current.get(isbn);
    if (cached) {
      setNotesByIsbn((prev) => (prev[isbn] ? prev : { ...prev, [isbn]: cached }));
      return cached;
    }

    const inflight = notesInFlightRef.current.get(isbn);
    if (inflight) return inflight;

    const p = (async () => {
      const list = await fetchNotes(isbn);
      const normalized = Array.isArray(list) ? list : [];

      notesCacheRef.current.set(isbn, normalized);
      setNotesByIsbn((prev) => ({ ...prev, [isbn]: normalized }));
      return normalized;
    })().finally(() => {
      notesInFlightRef.current.delete(isbn);
    });

    notesInFlightRef.current.set(isbn, p);
    return p;
  }, []);

  const addNote = useCallback(async (isbn, content) => {
    if (!isbn) return;
    const list = await postNote(isbn, content);
    const normalized = Array.isArray(list) ? list : [];

    notesCacheRef.current.set(isbn, normalized);
    setNotesByIsbn((prev) => ({ ...prev, [isbn]: normalized }));
  }, []);

  const deleteNote = useCallback(async (isbn, noteId) => {
    if (!isbn) return;
    const list = await deleteNoteApi(isbn, noteId);
    const normalized = Array.isArray(list) ? list : [];

    notesCacheRef.current.set(isbn, normalized);
    setNotesByIsbn((prev) => ({ ...prev, [isbn]: normalized }));
  }, []);

  const value = useMemo(
    () => ({
      bookshelf,
      progressByIsbn,
      notesByIsbn,
      logsByIsbn,
      hydrated,
      loadingBooks,
      booksError,
      refreshBookshelf,
      addBook,
      addToBookshelf: addBook,
      removeBook,
      updateProgress,
      loadNotes,
      addNote,
      deleteNote,
      removeNote: deleteNote,
      reset,
      clearAll: reset,
    }),
    [
      bookshelf,
      progressByIsbn,
      notesByIsbn,
      logsByIsbn,
      hydrated,
      loadingBooks,
      booksError,
      refreshBookshelf,
      addBook,
      removeBook,
      updateProgress,
      loadNotes,
      addNote,
      deleteNote,
      reset,
    ]
  );

  return <BooksContext.Provider value={value}>{children}</BooksContext.Provider>;
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error("useBooks must be used within BooksProvider");
  return ctx;
}
