// src/api/book.js
const BASE = process.env.REACT_APP_API_BASE || "/api";

export async function addBook(data) {
  const res = await fetch(`${BASE}/api/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`책 추가 실패: ${res.status} ${msg}`);
  }
  return res.json();
}
