// src/pages/BookShelf.jsx
import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const books = [
  { id: 1, title: "JAVA 마스터", author: "송미영", status: "진행중", tags: ["개발","DB"],
    cover: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=800" },
  { id: 2, title: "에세이 모음", author: "김작가", status: "완독", tags: ["에세이"],
    cover: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?q=80&w=800" },
  { id: 3, title: "소크라테스의 변명", author: "플라톤", status: "안읽음", tags: ["철학","고전"],
    cover: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=800" },
  { id: 4, title: "ML 논문 리딩", author: "Various", status: "진행중", tags: ["ML","논문"],
    cover: "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?q=80&w=800" },
  { id: 5, title: "자기계발 바이블", author: "홍성장", status: "완독", tags: ["자기계발"],
    cover: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?q=80&w=800" },
  { id: 6, title: "단편선 모음", author: "이소설", status: "안읽음", tags: ["소설"],
    cover: "https://images.unsplash.com/photo-1519682577862-22b62b24e493?q=80&w=800" },
];

const STATUS_COLOR = { "완독": "#059669", "진행중": "#4f46e5", "안읽음": "#334155" };
const STATUS_ORDER = { "진행중": 0, "안읽음": 1, "완독": 2 };

const rem = (n) => `${n}rem`;

/* 인라인 + 클래스 혼합: focus/클램프는 클래스에서 처리 */
const S = {
  // 하단에 "가로형 추가바" + 바텀탭 2겹이 생기므로 패딩 여유를 더 줌
  page: { maxWidth: rem(70), margin: "0 auto", padding: `${rem(1)} ${rem(1)} calc(${rem(9)} + env(safe-area-inset-bottom))` },

  head: {
    display: "grid",
    gridTemplateColumns: "2.5rem 1fr 2.5rem",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.5rem 0",
    marginBottom: "0.75rem",
    minHeight: "3.5rem",
  },
  backBtn: {
    width: "2.5rem",
    height: "2.5rem",
    borderRadius: "0.6rem",
    border: "1px solid #e5e7eb",
    background: "#fff",
    cursor: "pointer",
    fontSize: "1.1rem",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    gridColumn: "2 / 3",
    textAlign: "center",
    lineHeight: 1.2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0 0.5rem",
  },
  sub: { color: "#6b7280", margin: 0, fontSize: "0.85rem", wordBreak: "keep-all", overflowWrap: "anywhere" },

  bar: { display: "flex", flexWrap: "wrap", gap: rem(0.5), alignItems: "center", margin: `${rem(0.5)} 0 ${rem(0.75)}` },
  filterGroup: { display: "flex", gap: rem(0.4) },
  chip: (active) => ({
    padding: `${rem(0.6)} ${rem(0.9)}`,
    minHeight: rem(2.5),
    borderRadius: 9999,
    border: `1px solid ${active ? "#4f46e5" : "#e5e7eb"}`,
    background: active ? "rgba(79,70,229,0.08)" : "#fff",
    color: active ? "#312e81" : "#374151",
    fontSize: rem(0.95),
    cursor: "pointer",
  }),
  sort: {
    marginLeft: "auto",
    border: "1px solid #e5e7eb",
    borderRadius: rem(0.6),
    padding: `${rem(0.6)} ${rem(0.9)}`,
    minHeight: rem(2.5),
    background: "#fff",
    fontSize: rem(0.95),
  },

  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(10rem, 1fr))", gap: rem(0.75) },

  cardLink: { textDecoration: "none", color: "inherit", display: "block" },
  card: {
    border: "1px solid #e5e7eb",
    borderRadius: rem(0.9),
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 0.06rem 0.12rem rgba(0,0,0,0.05)",
  },

  coverBox: { position: "relative", width: "100%", aspectRatio: "2 / 3" },
  cover: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  badge: { position: "absolute", top: rem(0.5), left: rem(0.5), fontSize: rem(0.75), color: "#fff", padding: `${rem(0.25)} ${rem(0.5)}`, borderRadius: rem(0.5), background: "rgba(37, 99, 235, 0.9)" },

  body: { padding: rem(0.5) },
  title: { fontSize: "clamp(0.95rem, 2.5vw, 1.05rem)", fontWeight: 700, color: "#111827", lineHeight: 1.2 },
  author: { fontSize: rem(0.9), color: "#6b7280", marginTop: rem(0.25) },

  tags: { display: "flex", gap: rem(0.4), flexWrap: "wrap", marginTop: rem(0.5) },
  tagChip: { fontSize: rem(0.8), background: "#f1f5f9", color: "#374151", padding: `${rem(0.25)} ${rem(0.6)}`, borderRadius: 9999 },

  empty: {
    border: "1px dashed #e5e7eb",
    borderRadius: rem(0.9),
    padding: rem(1),
    textAlign: "center",
    color: "#6b7280",
    background: "#fafafa",
  },

  // 🔄 기존 원형 FAB → 가로형 고정 바
  addBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: `calc(${rem(3.5)} + env(safe-area-inset-bottom))`, // 바텀탭 위에 겹치지 않게 배치
    padding: `${rem(0.5)} ${rem(1)}`,
    background: "#fff",
    borderTop: "1px solid #e5e7eb",
    boxShadow: "0 -0.25rem 1rem rgba(0,0,0,0.04)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  addBtn: {
    width: "100%",
    maxWidth: rem(40),
    height: rem(3),
    borderRadius: rem(0.8),
    border: "1px solid #4f46e5",
    background: "#4f46e5",
    color: "#fff",
    fontSize: rem(1.0),
    fontWeight: 600,
    letterSpacing: "0.02em",
    cursor: "pointer",
  },

  bottomNav: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    height: `calc(${rem(3.5)} + env(safe-area-inset-bottom))`,
    paddingBottom: "env(safe-area-inset-bottom)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-around",
    borderTop: "1px solid #e5e7eb",
    background: "#fff",
    zIndex: 4,
  },
  navLink: { fontSize: rem(0.95), textDecoration: "none", color: "#6b7280", padding: `${rem(0.5)} ${rem(0.8)}`, borderRadius: rem(0.6) },
  navLinkActive: { color: "#111827", background: "rgba(79,70,229,0.08)", fontWeight: 600 },
};

export default function BookShelf({ data = books }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = (p) => pathname === p || pathname.startsWith(`${p}/`);

  const [filter, setFilter] = useState("전체"); // 전체 | 안읽음 | 진행중 | 완독
  const [sort, setSort] = useState("recent"); // recent | title | titleDesc | status

  const filtered = useMemo(() => {
    if (filter === "전체") return data;
    return data.filter((b) => b.status === filter);
  }, [data, filter]);

  const arranged = useMemo(() => {
    const arr = [...filtered];
    if (sort === "recent") arr.sort((a, b) => b.id - a.id);
    else if (sort === "title") arr.sort((a, b) => a.title.localeCompare(b.title, "ko", { sensitivity: "base" }));
    else if (sort === "titleDesc") arr.sort((a, b) => b.title.localeCompare(a.title, "ko", { sensitivity: "base" }));
    else if (sort === "status") {
      arr.sort((a, b) => {
        const sa = STATUS_ORDER[a.status] ?? 99;
        const sb = STATUS_ORDER[b.status] ?? 99;
        if (sa !== sb) return sa - sb;
        return a.title.localeCompare(b.title, "ko", { sensitivity: "base" });
      });
    }
    return arr;
  }, [filtered, sort]);

  // focus-visible & text clamp 전역 스타일 주입
  const injectedCSS = `
    .focusable:focus-visible { outline: 2px solid #4f46e5; outline-offset: 3px; }
    .card-link:focus-visible .card { box-shadow: 0 0 0 3px rgba(79,70,229,0.35); }
    .clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .clamp-1 { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `;

  return (
    <div style={S.page}>
      <style>{injectedCSS}</style>

      {/* 상단 헤더 */}
      <div style={S.head}>
        <button
          type="button"
          className="focusable"
          style={S.backBtn}
          aria-label="뒤로 가기"
          onClick={() => navigate(-1)}
          title="뒤로 가기"
        >
          ←
        </button>
        <div style={S.titleWrap}>
          <h1 style={{ margin: 0 }}>책장</h1>
          {/* 선택 요약 */}
          <p style={S.sub} aria-live="polite">
            {filter === "전체" ? `총 ${arranged.length}권` : `${filter} · ${arranged.length}권`}
          </p>
        </div>
        <div aria-hidden="true" />
      </div>

      {/* 필터/정렬 바 */}
      <div style={S.bar}>
        <div style={S.filterGroup}>
          {["전체","안읽음","진행중","완독"].map((s) => (
            <button
              key={s}
              className="focusable"
              style={S.chip(filter === s)}
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
            >
              {s}
            </button>
          ))}
        </div>
        <select
          aria-label="정렬"
          className="focusable"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          style={S.sort}
        >
          <option value="recent">최근 추가순</option>
          <option value="title">제목순</option>
          <option value="titleDesc">제목 내림차순</option>
          <option value="status">상태순 (진행중→안읽음→완독)</option>
        </select>
      </div>

      {/* 빈 상태 */}
      {arranged.length === 0 ? (
        <div style={S.empty} role="status" aria-live="polite">
          <p style={{ margin: 0, marginBottom: rem(0.5) }}>해당 조건의 책이 없습니다.</p>
          <button
            type="button"
            className="focusable"
            style={S.chip(false)}
            onClick={() => setFilter("전체")}
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div style={S.grid}>
          {arranged.map((b) => (
            <Link
              key={b.id}
              to={`/book/${b.id}`}
              style={S.cardLink}
              className="card-link focusable"
              aria-label={`${b.title} 상세로 이동`}
            >
              <article style={S.card} className="card">
                <div style={S.coverBox}>
                  <img
                    alt={`${b.title} 표지`}
                    src={b.cover}
                    style={S.cover}
                    loading="lazy"
                    onError={(e) => { e.currentTarget.src = "https://placehold.co/400x600?text=No+Cover"; }}
                  />
                  <span style={{ ...S.badge, background: STATUS_COLOR[b.status] || "#334155" }}>
                    {b.status}
                  </span>
                </div>
                <div style={S.body}>
                  <div style={S.title} className="clamp-2">{b.title}</div>
                  <div style={S.author} className="clamp-1">{b.author}</div>
                  <div style={S.tags}>
                    {(b.tags || []).slice(0, 4).map((t, i) => (
                      <span key={`${b.id}-${t}-${i}`} style={S.tagChip}>#{t}</span>
                    ))}
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>
      )}

      {/* ⬛ 가로형 "책 추가" 바 (바텀탭 위) */}
      <div style={S.addBar} role="region" aria-label="책 추가 영역">
        <button
          type="button"
          className="focusable"
          style={S.addBtn}
          onClick={() => alert("책 추가")}
          aria-label="새 책 추가"
          title="책을 추가합니다"
        >
          [+] 책 추가
        </button>
      </div>

      {/* 하단 네비 */}
      <nav style={S.bottomNav} aria-label="하단 탐색">
        <Link to="/"          aria-current={isActive("/") ? "page" : undefined}
          className="focusable" style={{ ...S.navLink, ...(isActive("/") ? S.navLinkActive : {}) }}>홈</Link>
        <Link to="/bookshelf" aria-current={isActive("/bookshelf") ? "page" : undefined}
          className="focusable" style={{ ...S.navLink, ...(isActive("/bookshelf") ? S.navLinkActive : {}) }}>책장</Link>
        <Link to="/search"    aria-current={isActive("/search") ? "page" : undefined}
          className="focusable" style={{ ...S.navLink, ...(isActive("/search") ? S.navLinkActive : {}) }}>검색</Link>
      </nav>
    </div>
  );
}
