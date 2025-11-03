// src/pages/Search.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { nlkApi, stripHighlight } from "../api/nlk";
import { addBook } from "../api/book";

/* ───────────────── 스타일 유틸 ───────────────── */
const btn = ({ ghost, small, full } = {}) => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  boxSizing: "border-box",
  minHeight: small ? 34 : 44,        // 고정 height → minHeight
  padding: small ? "6px 10px" : "10px 14px",
  borderRadius: 10,
  border: ghost ? "1px solid #e5e7eb" : "1px solid transparent",
  background: ghost ? "#fff" : "#f5f6f8",
  color: "#111",
  cursor: "pointer",
  fontSize: small ? 12 : 14,
  lineHeight: 1.2,                    // 라인박스 안정화
  whiteSpace: "nowrap",               // 텍스트 줄바꿈 방지
  width: full ? "100%" : "auto",
  overflow: "hidden",                 // 라운드 클리핑(선택)
});

const chip = () => ({
  border: "1px solid #e5e7eb",
  background: "#fff",
  borderRadius: 999,
  padding: "6px 10px",
  cursor: "pointer",
  fontSize: 13,
});
const title = (lines = 2) => ({
  fontWeight: 700,
  fontSize: 14,
  lineHeight: 1.35,
  display: "-webkit-box",
  WebkitLineClamp: lines,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
});
const author = () => ({ color: "#6b7280", fontSize: 13, marginTop: 4 });

/* ───────────────── 상단 바 ───────────────── */
function TopBar() {
  const navigate = useNavigate();
  return (
    <div className="topbar">
      <div className="spacer" />
      <div className="actions">
        <button style={btn({ ghost: true })} onClick={() => navigate("/shelf")}>책장으로</button>
        <button style={btn()} onClick={() => navigate("/")}>처음으로</button>
      </div>
    </div>
  );
}

const SS_KEY = "search_snapshot_v1";

function saveSnapshot({ q, items, page, size, total, view, recent }) {
  try {
    const snap = {
      q, items, page, size, total, view, recent,
      scrollY: typeof window !== "undefined" ? window.scrollY : 0,
      ts: Date.now(),
    };
    sessionStorage.setItem(SS_KEY, JSON.stringify(snap));
  } catch {}
}

function loadSnapshot() {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}


/* ───────────────── 상단 검색바 ───────────────── */
function SearchBar({ value, onChange, onSearch, onClear, recent = [], onPickRecent }) {
  const inputRef = useRef(null);
  const hasText = value.trim().length > 0;

  return (
    <>
      <style>{`
        .page { max-width: 960px; margin: 0 auto; padding: 12px; overflow-x: hidden; }
        .topbar { display:flex; align-items:center; justify-content:flex-end; gap:8px; margin-bottom:8px; }
        .topbar .spacer { flex:1; }
        .sb { display:flex; gap:8px; border:1px solid #e6e8eb; border-radius:12px; background:#fff; padding:6px; flex-wrap:wrap; }
        .sb-left { display:grid; place-items:center; width:44px; height:44px; color:#6b7280; flex:0 0 auto; }
        .sb-input { flex:1 1 220px; min-width:140px; height:44px; border:none; outline:none; font-size:16px; color:#111; padding:0 12px; }
        .sb-actions { display:flex; gap:8px; align-items:center; }
        .controls { display:flex; flex-wrap:wrap; gap:8px; justify-content:space-between; margin-top:10px; }
        .controls-left { display:flex; flex-wrap:wrap; gap:8px; min-width:0; }
        .select { height:44px; border:1px solid #e5e7eb; border-radius:10px; background:#fff; padding:0 10px; font-size:14px; min-width:120px; }
        .view { display:flex; align-items:center; gap:6px; }
        .iconbtn { display:inline-flex; align-items:center; justify-content:center; box-sizing:border-box; min-height:44px; border:1px solid #e5e7eb; background:#fff; border-radius:10px; padding:0 10px; line-height:1.2; white-space:nowrap;}

        /* 카드 그리드: auto-fit으로 1~2열 자동, 가로 스크롤 없음 */
        .grid { display:grid; gap:12px; margin-top:12px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); }
        .card { border:1px solid #eee; border-radius:12px; padding:12px; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.03); display:flex; flex-direction:column; gap:10px; }
        .cover { width:100%; aspect-ratio:3/4; border-radius:8px; object-fit:cover; background:linear-gradient(135deg,rgba(200,200,255,.5),rgba(220,240,255,.5)); }
        .actions { display:flex; gap:6px; margin-top:auto; padding-top:8px; }
        /* 리스트 모드 */
        .list { display:flex; flex-direction:column; gap:10px; margin-top:12px; }
        .row { display:flex; gap:12px; border:1px solid #eee; border-radius:12px; padding:10px; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.03); }
        .row .thumb { width:88px; height:118px; border-radius:8px; object-fit:cover; background:#f2f4f7; flex:0 0 auto; }
        .row .meta { flex:1 1 auto; min-width:0; display:flex; flex-direction:column; }
        .row .meta-title { ${Object.entries(title(2)).map(([k,v])=>`${k}:${typeof v==="number"?v+"px":v}`).join(";")} }
        .row .meta-author { ${Object.entries(author()).map(([k,v])=>`${k}:${typeof v==="number"?v+"px":v}`).join(";")} }
        .row .meta-actions { margin-top:auto; display:flex; gap:6px; flex-wrap:wrap; }
        /* 아주 좁은 폭에서의 안전 처리 */
        @media (max-width: 360px) {
          .sb-actions { width:100%; justify-content:flex-end; }
          .actions { flex-wrap:wrap; }
        }
      `}</style>

      <div className="sb">
        <div className="sb-left" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27a6 6 0 1 0-.71.71l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-5.5 1a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9z" fill="currentColor" />
          </svg>
        </div>

        <input
          className="sb-input"
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSearch(value);
            if (e.key === "Escape") { onClear(); inputRef.current?.focus(); }
          }}
          placeholder="책 제목·저자 검색"
          aria-label="검색어 입력"
        />

        <div className="sb-actions">
          {hasText && (
            <button type="button" onClick={onClear} style={btn({ ghost: true })} title="지우기 (Esc)">
              지우기
            </button>
          )}
          <button type="button" onClick={() => onSearch(value)} style={btn()}>
            검색
          </button>
        </div>
      </div>

      {recent.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
          {recent.map((r, i) => (
            <button key={i} style={chip()} onClick={() => { onPickRecent(r); onSearch(r); }}>
              {r}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

/* ───────────────── 카드(격자) ───────────────── */
function Card({ book, onAdd, onDetail }) {
  return (
    <div className="card">
      <img
        className="cover"
        src={book.cover}
        alt={`${book.title} 표지`}
        onError={(e) => (e.currentTarget.src = "https://placehold.co/240x320?text=No+Cover")}
      />
      <div style={title(2)}>{book.title}</div>
      <div style={author()}>{book.author}</div>
      <div className="actions">
        <button style={btn({ small: true })} onClick={() => onAdd(book)}>내 책장에 추가</button>
        <button style={btn({ small: true, ghost: true })} onClick={onDetail}>자세히</button>
      </div>
    </div>
  );
}

/* ───────────────── 행(리스트) ───────────────── */
function Row({ book, onAdd, onDetail }) {
  return (
    <div className="row">
      <img
        className="thumb"
        src={book.cover}
        alt={`${book.title} 표지`}
        onError={(e) => (e.currentTarget.src = "https://placehold.co/176x236?text=No+Cover")}
      />
      <div className="meta">
        <div className="meta-title">{book.title}</div>
        <div className="meta-author">{book.author}</div>
        <div className="meta-actions">
          <button style={btn({ small: true })} onClick={() => onAdd(book)}>내 책장에 추가</button>
          <button style={btn({ small: true, ghost: true })} onClick={onDetail}>자세히</button>
        </div>
      </div>
    </div>
  );
}

/* ───────────────── 메인 페이지 ───────────────── */
export default function Search() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState([]);
  const [view, setView] = useState("grid"); // grid | list

  // 페이지네이션
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [total, setTotal] = useState(0);
  const hasMore = items.length < total;

  // 최근검색 로드
  useEffect(() => {
    try {
      const raw = localStorage.getItem("search_recent") || "[]";
      setRecent(JSON.parse(raw));
    } catch { setRecent([]); }
  }, []);
  
  // 페이지 첫 마운트 시 세션 스냅샷 복원
  useEffect(() => {
    const snap = loadSnapshot();
    if (!snap) return;
    // 상태 복원
    setQ(snap.q ?? "");
    setItems(Array.isArray(snap.items) ? snap.items : []);
    setPage(Number.isFinite(snap.page) ? snap.page : 1);
    setTotal(Number.isFinite(snap.total) ? snap.total : 0);
    setView(snap.view === "list" ? "list" : "grid");
    if (Array.isArray(snap.recent) && snap.recent.length) setRecent(snap.recent);
   // 스크롤 복원 (레이아웃 그려진 뒤)
   requestAnimationFrame(() => {
     window.scrollTo(0, Number.isFinite(snap.scrollY) ? snap.scrollY : 0);
   });
 }, []);

  const mapResults = useCallback((list) => {
    return list.map((b, idx) => ({
      id: b.isbn || b.id || `${b.controlNo || ""}-${idx}`,
      title: stripHighlight(b.titleInfo ?? b.title ?? ""),
      author: stripHighlight(b.authorInfo ?? b.author ?? ""),
      cover: b.imageUrl || "https://placehold.co/240x320?text=No+Cover",
      publisher: b.pubInfo || b.publisher,
      total: b.page || b.totalPages,
    }));
  }, []);

  const handleSearch = useCallback(async (term, resetPage = true) => {
    const keyword = (term ?? q).trim();
    if (!keyword) return;
    
    
    setLoading(true);
    try {
      const nextPage = resetPage ? 1 : page;
      const res = await nlkApi.search(keyword, { pageNum: nextPage, pageSize: size });
      const list = res?.result ?? res?.items ?? [];
      const mapped = mapResults(list);
      setItems((prev) => {
        const merged = resetPage ? mapped : [...prev, ...mapped];
        setTotal(Number(res?.total ?? merged.length));
        return merged;
      });

      setPage(Number(res?.pageNum ?? nextPage));
      setQ(keyword);

      // 최근 검색어
      const next = [keyword, ...recent.filter((r) => r !== keyword)].slice(0, 8);
      setRecent(next);
      localStorage.setItem("search_recent", JSON.stringify(next));
    } catch (e) {
      console.error("검색 실패:", e);
      alert("검색 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [q, page, size, mapResults, recent]);

  const handleClear = () => setQ("");
  const goDetail = (book) => {
    saveSnapshot({ q, items, page, size, total, view, recent });
    navigate(`/book/${book.id}`, { state: { book } });
  };
  const handleAdd = async (book) => {
    try {
      const payload = {
        title: book.title,
        author: book.author || "알 수 없음",
        publisher: book.publisher || "알 수 없음",
        totalPages: book.total && book.total > 0 ? book.total : 1,
        tags: ["검색추가"],
      };
      await addBook(payload);
      alert("책이 추가되었습니다.");
    } catch (error) {
      console.error(error);
      alert("책 추가 중 오류가 발생했습니다.");
    }
  };

  const handleLoadMore = async () => {
  if (!hasMore || loading) return;

  const keyword = q.trim();
  if (!keyword) return;

  const nextPage = page + 1;
  setLoading(true);
  try {
    const res = await nlkApi.search(keyword, { pageNum: nextPage, pageSize: size });
    const list = res?.result ?? res?.items ?? [];
    const mapped = mapResults(list);

    setItems(prev => {
      const merged = [...prev, ...mapped];
      setTotal(Number(res?.total ?? merged.length));
      return merged;
    });

    setPage(Number(res?.pageNum ?? nextPage));
  } catch (e) {
    console.error(e);
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="page">
      {/* 상단: [책장으로] [처음으로] */}
      <TopBar />

      {/* 1) 상단 검색바 */}
      <SearchBar
        value={q}
        onChange={setQ}
        onSearch={(t) => handleSearch(t, true)}
        onClear={handleClear}
        recent={recent}
        onPickRecent={(v) => setQ(v)}
      />

      {/* 2) 보조 컨트롤 라인 (최근/인기/필터/정렬 + 보기) */}
      <div className="controls">
        <div className="controls-left">
          <select className="select" aria-label="최근 검색">
            <option>최근</option>
            {recent.map((r, i) => <option key={i}>{r}</option>)}
          </select>

          <select className="select" aria-label="인기 검색">
            <option>인기</option>
            <option>AI</option>
            <option>Spring</option>
          </select>
          <button style={btn()} onClick={() => alert("필터는 다음 단계에서!")}>필터</button>
          <button style={btn()} onClick={() => alert("정렬은 다음 단계에서!")}>정렬</button>
        </div>
        <div className="view">
          <span style={{ fontSize: 13, color: "#6b7280" }}>보기:</span>
          <button className="iconbtn" aria-pressed={view==="grid"} onClick={() => setView("grid")} title="격자 보기">🔳</button>
          <button className="iconbtn" aria-pressed={view==="list"} onClick={() => setView("list")} title="리스트 보기">☰</button>
        </div>
      </div>

      {/* 3) 결과 영역 */}
      {loading && (
        <div style={{ textAlign: "center", marginTop: 24 }}>검색 중…</div>
      )}

      {!loading && items.length === 0 && (
        <div style={{ textAlign: "center", color: "#666", marginTop: 24 }}>
          검색 결과가 없습니다. 키워드를 입력해 검색하세요.
        </div>
      )}

      {!loading && items.length > 0 && (
        view === "grid" ? (
          <div className="grid">
            {items.map((b) => (
              <Card key={b.id} book={b} onAdd={handleAdd} onDetail={() => goDetail(b)} />
            ))}
          </div>
        ) : (
          <div className="list">
            {items.map((b) => (
              <Row key={b.id} book={b} onAdd={handleAdd} onDetail={() => goDetail(b)} />
            ))}
          </div>
        )
      )}

      {/* 4) 더 보기 */}
      {!loading && items.length > 0 && (
        <div style={{ textAlign: "center", margin: "16px 0 8px" }}>
          {hasMore ? (
            <button style={btn()} onClick={handleLoadMore}>더 보기</button>
          ) : (
            <span style={{ color: "#6b7280", fontSize: 13 }}>모든 결과를 확인했습니다</span>
          )}
        </div>
      )}
    </div>
  );
}
