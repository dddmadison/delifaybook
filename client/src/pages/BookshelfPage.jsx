import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBooks } from "../context/BooksContext";
import BookCard from "../components/common/BookCard";
import EmptyState from "../components/common/EmptyState";
import "../styles/bookshelf.css";

// 상수 정의
const VIEW_KEY = "bookshelf_view_v2";
const FILTER_KEY = "bookshelf_filter_v2";
const SORT_KEY = "bookshelf_sort_v2";

// 유틸리티
function safeStr(v) { return v == null ? "" : String(v); }
function parseTime(v) { return v ? Date.parse(String(v)) || 0 : 0; }
function normalizeProgress(p) {
  if (!p) return { current: 0, total: 0 };
  return {
    current: Number(p.current ?? 0),
    total: Number(p.total ?? 0),
    updatedAt: p.updatedAt
  };
}

// 리스트 뷰 전용 컴포넌트
function ListViewRow({ book, progress, onClick }) {
  const p = normalizeProgress(progress);
  const percent = p.total > 0 ? Math.round((p.current / p.total) * 100) : 0;
  // wish 상태거나 unread 상태면 진행도 바를 보여주지 않거나 0% 처리
  // 여기서는 단순히 percent > 0 일 때만 바를 보여줌
  const hasProgress = p.total > 0 && percent > 0;

  return (
    <button type="button" className="bsListRow" onClick={onClick}>
      <img src={book?.coverUrl || "/nocover.png"} alt="" className="bsListCover" />
      <div className="bsListInfo">
        <div className="bsListTitle">{book?.title || "제목 없음"}</div>
        <div className="bookAuthor">{book?.author || "저자 미상"}</div>
        <div className="bsListMeta">
          {hasProgress ? (
            <>
              <div className="bsListPct">{percent}%</div>
              <div className="bsListProgress">
                <div className="bsListFill" style={{ width: `${Math.min(percent, 100)}%` }} />
              </div>
            </>
          ) : (
            <span style={{ fontSize: 12, color: "var(--text-sub)" }}>읽고 싶음</span>
          )}
          <div className="bsListPages">{p.current} / {p.total || "-"} p</div>
        </div>
      </div>
    </button>
  );
}

export default function BookshelfPage() {
  const navigate = useNavigate();
  const { bookshelf, progressByIsbn, hydrated, loadingBooks } = useBooks();

  // 상태 관리
  const [view, setView] = useState("list");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recentAdded");
  
  // 검색어 상태
  const [searchTerm, setSearchTerm] = useState("");

  // 설정값 불러오기/저장
  useEffect(() => {
    const v = localStorage.getItem(VIEW_KEY);
    if (v === "grid" || v === "list") setView(v);
    const f = localStorage.getItem(FILTER_KEY);
    if (f) setFilter(f);
    const s = localStorage.getItem(SORT_KEY);
    if (s) setSort(s);
  }, []);

  useEffect(() => localStorage.setItem(VIEW_KEY, view), [view]);
  useEffect(() => localStorage.setItem(FILTER_KEY, filter), [filter]);
  useEffect(() => localStorage.setItem(SORT_KEY, sort), [sort]);

  // 데이터 정렬/필터링 로직
  const books = useMemo(() => {
    let list = Array.isArray(bookshelf) ? [...bookshelf] : [];

    // 1. 상태 필터 (핵심 수정 부분)
    if (filter !== "all") {
      list = list.filter(b => {
        const status = safeStr(b?.status);
        
        // ✨ [수정] 'wish' 필터 선택 시: status가 'wish'이거나 'unread'이거나 비어있으면 포함
        if (filter === "wish") {
          return status === "wish" || status === "unread" || status === "";
        }
        
        // 그 외(reading, done)는 정확히 일치하는 것만
        return status === filter;
      });
    }

    // 1-2. 검색어 필터
    if (searchTerm.trim() !== "") {
      const lowerQuery = searchTerm.toLowerCase();
      list = list.filter(b => 
        safeStr(b.title).toLowerCase().includes(lowerQuery) || 
        safeStr(b.author).toLowerCase().includes(lowerQuery)
      );
    }

    // 2. 정렬
    if (sort === "title") {
      list.sort((a, b) => safeStr(a.title).localeCompare(safeStr(b.title)));
    } else if (sort === "recentRead") {
      list.sort((a, b) => {
        const pa = progressByIsbn?.[a.isbn] || a.progress;
        const pb = progressByIsbn?.[b.isbn] || b.progress;
        return parseTime(pb?.updatedAt) - parseTime(pa?.updatedAt);
      });
    } else { // recentAdded (default)
      list.sort((a, b) => parseTime(b.createdAt) - parseTime(a.createdAt));
    }

    return list;
  }, [bookshelf, filter, sort, searchTerm, progressByIsbn]);

  const isLoading = !hydrated && loadingBooks;
  const hasBooks = books.length > 0;

  const handleOpen = (isbn) => {
    navigate(`/book/${isbn}`, { state: { from: "/bookshelf" } });
  };

  return (
    <div className="bsPage">
      {/* 헤더 */}
      <header className="bsHeader">
        <h1 className="bsTitle">책장</h1>
        <div className="bsViewToggle">
          <button className={`bsToggleBtn ${view === "list" ? "active" : ""}`} onClick={() => setView("list")}>리스트</button>
          <button className={`bsToggleBtn ${view === "grid" ? "active" : ""}`} onClick={() => setView("grid")}>격자</button>
        </div>
      </header>

      {/* 툴바 */}
      <div className="bsToolbar">
        {/* 왼쪽: 필터 그룹 */}
        <div className="bsFilterGroup">
          {["all", "reading", "done", "wish"].map((f) => (
            <button
              key={f}
              className={`bsFilterChip ${filter === f ? "active" : ""}`}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "전체" : f === "reading" ? "읽는중" : f === "done" ? "완독" : "읽고 싶음"}
            </button>
          ))}
        </div>
        
        {/* 오른쪽: 검색창 + 정렬 */}
        <div className="bsSearchSortGroup">
            <div className="bsSearchWrap">
                <input 
                    type="text" 
                    className="bsSearchInput"
                    placeholder="책 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <select className="bsSortSelect" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="recentAdded">최근 추가순</option>
                <option value="recentRead">최근 읽은순</option>
                <option value="title">제목순</option>
            </select>
        </div>
      </div>

      {/* 콘텐츠 */}
      <div className="bsContent">
        {isLoading ? (
          <div className="bsLoading">책장을 불러오고 있습니다...</div>
        ) : !hasBooks ? (
          <EmptyState 
            title={searchTerm ? "검색 결과가 없어요" : filter === "all" ? "책장이 비어있어요" : "해당하는 책이 없어요"}
            desc={searchTerm ? "다른 검색어로 찾아보세요." : "검색을 통해 읽고 있는 책을 추가해보세요."}
          />
        ) : view === "grid" ? (
          <div className="bsGrid">
            {books.map(book => (
              <BookCard 
                key={book.isbn} 
                book={book} 
                onClick={() => handleOpen(book.isbn)} 
              />
            ))}
          </div>
        ) : (
          <div className="bsList">
            {books.map(book => (
              <ListViewRow
                key={book.isbn}
                book={book}
                progress={progressByIsbn?.[book.isbn] || book.progress}
                onClick={() => handleOpen(book.isbn)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}