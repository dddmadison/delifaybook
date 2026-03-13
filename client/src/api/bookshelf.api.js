// client/src/api/bookshelf.api.js
import apiClient from "./client";
import { USE_MOCK } from "./runtime";
import {
  initialBookshelf,
  initialProgress,
  initialNotes,
  initialLogs,
} from "../mock/mockBookshelf";

const STORAGE_KEY = "delifaybook.bookshelf.v1";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStore(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function seedIfEmpty() {
  const existing = readStore();
  if (existing) return existing;

  const seeded = {
    bookshelf: initialBookshelf,
    progressByIsbn: initialProgress,
    notesByIsbn: initialNotes,
    logsByIsbn: initialLogs,
  };
  writeStore(seeded);
  return seeded;
}

function normalizeBook(b) {
  if (!b) return null;
  return {
    isbn: b.isbn,
    title: b.title,
    author: b.author,
    publisher: b.publisher,
    coverUrl: b.coverUrl,
    publishDate: b.publishDate,

    // ✅ 서버 BookshelfItemSnapshot / BookLookupResponse에 맞춤
    itemPage: b.itemPage ?? null,

    status: b.status,
    tags: b.tags || [],
    progress: b.progress ?? null,
  };
}

/**
 * mock(localStorage) 전용 "통짜 state" API
 */
export async function fetchBookshelfState() {
  if (!USE_MOCK) throw new Error("fetchBookshelfState is mock-only");
  return seedIfEmpty();
}

export async function saveBookshelfState(nextState) {
  if (!USE_MOCK) throw new Error("saveBookshelfState is mock-only");
  writeStore(nextState);
  return { ok: true };
}

/**
 * 서버 모드: 내 책장 목록
 * GET /api/bookshelf
 */
export async function fetchMyBookshelf() {
  if (USE_MOCK) {
    const st = seedIfEmpty();
    const list = Array.isArray(st.bookshelf) ? st.bookshelf : [];
    return list.map(normalizeBook).filter(Boolean);
  }

  const res = await apiClient.get("/api/bookshelf");
  const list = Array.isArray(res.data) ? res.data : [];
  return list.map(normalizeBook).filter(Boolean);
}


/**
 * 책장 추가
 * POST /api/bookshelf
 */
export async function addBookToBookshelf(book) {
  // book이 객체인지 문자열(ISBN)인지 확인하여 ISBN 추출
  const isbn = typeof book === 'string' ? book : book?.isbn;
  if (!isbn) throw new Error("missing isbn");

  // --- Mock 모드 로직 (기존 유지) ---
  if (USE_MOCK) {
    const st = seedIfEmpty();
    const exists = (st.bookshelf || []).some((b) => b.isbn === isbn);
    if (exists) return { created: false, isbn: isbn };

    // mock 데이터 생성 시에는 book 객체의 필드를 사용
    const inputBook = typeof book === 'object' ? book : { isbn };

    const next = {
      ...st,
      bookshelf: [
        normalizeBook({
          isbn: inputBook.isbn,
          title: inputBook.title || "제목 없음", // Fallback
          author: inputBook.author || "",
          publisher: inputBook.publisher || "",
          coverUrl: inputBook.coverUrl,
          publishDate: inputBook.publishDate,
          itemPage: inputBook.itemPage ?? null,
          status: "unread",
          tags: inputBook.tags || [],
          progress: null,
        }),
        ...(st.bookshelf || []),
      ],
    };
    writeStore(next);
    return { created: true, isbn: isbn };
  }
  // ------------------------------

  // ✅ [수정된 부분] 서버 전송 로직
  // book이 단순 ISBN 문자열이면 객체로 감싸고, 객체라면 그대로 전송
  const payload = typeof book === 'string' ? { isbn: book } : book;

  // 이제 title, author 등이 payload에 포함되어 서버로 전송됩니다.
  const res = await apiClient.post("/api/bookshelf", payload);
  return res.data;
}

/**
 * 책장 제거
 * DELETE /api/bookshelf/{isbn}
 */
export async function removeBookFromBookshelf(isbn) {
  if (!isbn) throw new Error("missing isbn");

  if (USE_MOCK) {
    const st = seedIfEmpty();
    const next = {
      ...st,
      bookshelf: (st.bookshelf || []).filter((b) => b.isbn !== isbn),
    };
    writeStore(next);
    return { deleted: true, isbn };
  }

  const res = await apiClient.delete(`/api/bookshelf/${encodeURIComponent(isbn)}`);
  return res.data;
}

/**
 * 진행도 업데이트 (upsert)
 * PATCH /api/bookshelf/{isbn}/progress
 *
 * ✅ 핵심 변경:
 * - totalPage는 기본적으로 보내지 않음
 * - (원하면) 3번째 인자로 total을 넘길 때만 totalPage 포함
 * - 서버가 total을 자동 결정(Progress.total 또는 Book.itemPage)
 */
export async function patchProgress(isbn, current, total) {
  if (!isbn) throw new Error("missing isbn");

  const currentPageRaw = Number.parseInt(current, 10);
  const currentPage = Number.isFinite(currentPageRaw) ? Math.max(0, currentPageRaw) : 0;

  // total이 "명시적으로" 들어온 경우에만 처리
  const totalRaw = total == null ? NaN : Number.parseInt(total, 10);
  const totalPage = Number.isFinite(totalRaw) && totalRaw > 0 ? totalRaw : null;

  // total을 보낼 때만 current를 clamp
  const safeCurrent = totalPage != null ? Math.min(currentPage, totalPage) : currentPage;

  if (USE_MOCK) {
    const st = seedIfEmpty();

    const updatedAt = new Date().toISOString();
    const progress = { current: safeCurrent, total: totalPage, updatedAt };

    const nextStatus =
      totalPage == null
        ? safeCurrent === 0
          ? "unread"
          : "reading"
        : totalPage === 0 || safeCurrent === 0
        ? "unread"
        : safeCurrent >= totalPage
        ? "done"
        : "reading";

    const nextBookshelf = (st.bookshelf || []).map((b) =>
      String(b.isbn) === String(isbn) ? { ...b, status: nextStatus, progress } : b
    );

    const next = {
      ...st,
      bookshelf: nextBookshelf,
      progressByIsbn: {
        ...(st.progressByIsbn || {}),
        [isbn]: progress,
      },
    };

    writeStore(next);

    const snap = nextBookshelf.find((b) => String(b.isbn) === String(isbn));
    return normalizeBook(snap);
  }

  // ✅ 서버 요청 payload: 기본은 currentPage만
  const payload = { currentPage: safeCurrent };
  if (totalPage != null) payload.totalPage = totalPage;

  const res = await apiClient.patch(
    `/api/bookshelf/${encodeURIComponent(isbn)}/progress`,
    payload
  );

  return normalizeBook(res.data);
}

/**
 * 노트 목록
 * GET /api/bookshelf/{isbn}/notes
 */
export async function fetchNotes(isbn) {
  if (!isbn) throw new Error("missing isbn");

  if (USE_MOCK) {
    const st = seedIfEmpty();
    const list = (st.notesByIsbn && st.notesByIsbn[isbn]) || [];
    return Array.isArray(list) ? list : [];
  }

  const res = await apiClient.get(`/api/bookshelf/${encodeURIComponent(isbn)}/notes`);
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * 노트 추가 후 최신 리스트 반환
 * POST /api/bookshelf/{isbn}/notes
 */
export async function postNote(isbn, content) {
  if (!isbn) throw new Error("missing isbn");

  const text = (content || "").trim();
  if (!text) throw new Error("empty content");

  if (USE_MOCK) {
    const st = seedIfEmpty();
    const list = (st.notesByIsbn && st.notesByIsbn[isbn]) || [];
    const note = {
      id: Date.now(),
      isbn,
      content: text,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const nextList = [note, ...list];
    const next = {
      ...st,
      notesByIsbn: {
        ...(st.notesByIsbn || {}),
        [isbn]: nextList,
      },
    };
    writeStore(next);
    return nextList;
  }

  const res = await apiClient.post(
    `/api/bookshelf/${encodeURIComponent(isbn)}/notes`,
    { content: text }
  );

  return Array.isArray(res.data) ? res.data : [];
}

/**
 * 노트 삭제 후 최신 리스트 반환
 * DELETE /api/bookshelf/{isbn}/notes/{noteId}
 */
export async function deleteNoteApi(isbn, noteId) {
  if (!isbn) throw new Error("missing isbn");
  if (noteId == null) throw new Error("missing noteId");

  if (USE_MOCK) {
    const st = seedIfEmpty();
    const list = (st.notesByIsbn && st.notesByIsbn[isbn]) || [];
    const nextList = list.filter((n) => n.id !== noteId);

    const next = {
      ...st,
      notesByIsbn: {
        ...(st.notesByIsbn || {}),
        [isbn]: nextList,
      },
    };
    writeStore(next);
    return nextList;
  }

  const res = await apiClient.delete(
    `/api/bookshelf/${encodeURIComponent(isbn)}/notes/${encodeURIComponent(String(noteId))}`
  );

  return Array.isArray(res.data) ? res.data : [];
}

const bookshelfApi = {
  fetchBookshelfState,
  saveBookshelfState,
  fetchMyBookshelf,
  addBookToBookshelf,
  removeBookFromBookshelf,
  patchProgress,
  fetchNotes,
  postNote,
  deleteNoteApi,
};

export default bookshelfApi;
