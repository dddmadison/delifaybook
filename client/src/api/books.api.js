import apiClient from "./client";
import { USE_MOCK } from "./runtime";
import { mockBooks } from "../mock/mockBooks";

function normalize(text) {
  return (text || "").toString().trim();
}

/**
 * 변경된 규칙:
 * - 모든 검색어(ISBN, 제목, 저자 등)를 /api/books/search로 전달
 * - 서버가 처리해서 결과를 반환함
 */
export async function searchBooks(query, page = 1, size = 10) {
  const q = normalize(query);

  // 항상 같은 형태로 반환
  if (!q) return { items: [], totalCount: 0, isLast: true, page: 1, size };

  // 1) Mock 모드
  if (USE_MOCK) {
    const nq = q.toLowerCase();
    const all = mockBooks.filter((b) => {
      const hay = `${b.title} ${b.author} ${b.isbn}`.toLowerCase();
      return hay.includes(nq);
    });

    const totalCount = all.length;
    const start = (page - 1) * size;
    const items = all.slice(start, start + size);
    const isLast = start + items.length >= totalCount;

    return { items, totalCount, isLast, page, size };
  }

  // 2) 서버 모드
  const res = await apiClient.get("/api/books/search", {
    params: { q, page, size },
  });

  // apiClient 인터셉터가 이미 벗겨줬을 수도 있고, 아닐 수도 있어 둘 다 대응
  const responseBody = res.data;
  const realData = responseBody?.data || responseBody;

  // 정상: { items, totalCount, isLast, page, size }
  if (realData && Array.isArray(realData.items)) {
    return {
      items: realData.items,
      totalCount: Number(realData.totalCount ?? realData.items.length),
      isLast: Boolean(realData.isLast ?? (realData.items.length < size)),
      page: Number(realData.page ?? page),
      size: Number(realData.size ?? size),
    };
  }

  // 방어: 리스트만 오는 케이스
  if (Array.isArray(realData)) {
    return { items: realData, totalCount: realData.length, isLast: true, page, size };
  }

  return { items: [], totalCount: 0, isLast: true, page, size };
}

export async function getBookByIsbn(isbn) {
  const q = normalize(isbn);
  if (!q) return null;

  if (USE_MOCK) {
    return mockBooks.find((b) => b.isbn === q) || null;
  }

  const res = await apiClient.get("/api/books/lookup", { params: { isbn: q } });

  // apiClient가 벗겨줬을 수도 있어서 둘 다 대응
  return res.data?.data || res.data || null;
}

export const addBookToShelf = async (bookData) => {
  // bookData에는 SearchPage에서 만든 custom-ISBN이 들어있습니다.
  const response = await fetch('/api/bookshelf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bookData),
  });

  if (!response.ok) {
    throw new Error('책 추가에 실패했습니다.');
  }
  return response.json();
};

export async function uploadAiCover(isbn, file) {
  const formData = new FormData();
  formData.append("file", file);

  // multipart/form-data로 전송
  const res = await apiClient.post(`/api/books/${isbn}/cover/ai`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  
  // 성공 시 새로운 이미지 URL 반환
  return res.data?.data || res.data; 
}