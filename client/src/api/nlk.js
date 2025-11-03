const BASE = process.env.REACT_APP_API_BASE || "";

function toQuery(params = {}) {
  const u = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    u.append(k, v);
  });
  return u.toString();
}

// NLK가 반환하는 하이라이트 태그 제거
export function stripHighlight(htmlLike) {
  if (!htmlLike) return "";
  return String(htmlLike).replace(/<span[^>]*class=["']?searching_txt["']?[^>]*>/gi, "").replace(/<\/span>/gi, "");
}

async function httpGet(path, params) {
  const qs = toQuery(params);
  const url = `${BASE}${path}${qs ? `?${qs}` : ""}`;

  const res = await fetch(url, {
    method: "GET",
    headers: { "Accept": "application/json" },
  });
  if (!res.ok) {
    const text = await res.text().catch(()=>"");
    throw new Error(`HTTP ${res.status} ${res.statusText} :: ${text}`);
  }
  // NLK가 가끔 text/plain으로 보내도 JSON 문자열임
  const raw = await res.text();
  try { return JSON.parse(raw); } catch { return raw; }
}

export const nlkApi = {
  search: (kwd, opts = {}) =>
    httpGet("/api/kr/nl/search", { kwd, pageNum: 1, pageSize: 10, ...opts }),
  isbn: (isbn, opts = {}) =>
    httpGet("/api/kr/nl/isbn", { isbn, pageNo: 1, pageSize: 10, ...opts }),
};
