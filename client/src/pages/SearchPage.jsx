/* pages/SearchPage */
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import "../styles/search.css";
import { useBooks } from "../context/BooksContext";
import { searchBooks } from "../api/books.api";
import ManualRegisterForm from "../components/ManualRegisterForm";

const FALLBACK_COVER = "/nocover.png";
const PAGE_SIZE = 10;

// --- 헬퍼 함수 및 컴포넌트 ---

function SearchSkeleton() {
  return (
    <div className="searchResult">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="searchSkeleton">
          <div className="skCover" />
          <div className="skInfo">
            <div className="skLine" />
            <div className="skLine short" />
          </div>
        </div>
      ))}
    </div>
  );
}

function safeText(v) {
  return (v ?? "").toString().trim();
}

function buildStableKey(book, fallbackIdx) {
  const isbn = safeText(book?.isbn);
  if (isbn) return `isbn:${isbn}`;

  const title = safeText(book?.title);
  const author = safeText(book?.author);
  const publisher = safeText(book?.publisher);
  const publishDate = safeText(book?.publishDate);
  const composed = [title, author, publisher, publishDate]
    .filter(Boolean)
    .join("|");

  return composed ? `meta:${composed}` : `idx:${fallbackIdx}`;
}

// --- 메인 컴포넌트 ---

export default function SearchPage() {
  const { bookshelf, addToBookshelf } = useBooks();
  const location = useLocation();
  const navigate = useNavigate();

  const urlQ = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("q") || "";
  }, [location.search]);

  const [q, setQ] = useState(urlQ);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [isLast, setIsLast] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorText, setErrorText] = useState("");

  const [pendingByIsbn, setPendingByIsbn] = useState(() => new Set());
  const requestSeqRef = useRef(0);

  const observerTargetEl = useRef(null);

  useEffect(() => {
    setQ(urlQ);
  }, [urlQ]);

  const trimmedQ = (q || "").trim();
  const hasQuery = trimmedQ.length > 0;

  const onClear = () => {
    setQ("");
    setItems([]);
    setErrorText("");
    setPage(1);
    setIsLast(true);
    setTotalCount(0);
    navigate("/search");
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!hasQuery) {
      onClear();
      return;
    }
    navigate(`/search?q=${encodeURIComponent(trimmedQ)}`);
  };

  const isAdded = (isbn) =>
    (bookshelf || []).some((b) => String(b.isbn) === String(isbn));

  const isPending = (isbn) => pendingByIsbn.has(String(isbn));

  const goDetail = (book) => {
    const isbn = safeText(book.isbn);
    if (!isbn) {
      alert("ISBN 정보가 없어 상세 페이지로 이동할 수 없습니다.");
      return;
    }
    navigate(`/book/${isbn}`, {
      state: { from: location.pathname + location.search, book: book },
    });
  };

  const onAdd = async (e, book) => {
    e.stopPropagation();
    const isbnKey = String(book?.isbn ?? "");

    if (!isbnKey) {
      alert("ISBN 정보가 없어 책장에 추가할 수 없습니다.");
      return;
    }
    if (isAdded(isbnKey) || isPending(isbnKey)) return;

    setPendingByIsbn((prev) => {
      const next = new Set(prev);
      next.add(isbnKey);
      return next;
    });

    try {
      await addToBookshelf(book);
    } catch (err) {
      alert("책 추가 실패: " + err.message);
    } finally {
      setPendingByIsbn((prev) => {
        const next = new Set(prev);
        next.delete(isbnKey);
        return next;
      });
    }
  };

  const handleManualRegister = async (formData) => {
    const customIsbn = `custom-${Date.now()}`;

    const newBook = {
      isbn: customIsbn,
      title: formData.title,
      author: formData.author,
      publisher: formData.publisher,
      coverUrl: "",
      publishDate: new Date().getFullYear().toString(),
      description: "사용자가 직접 등록한 도서입니다.",
    };

    try {
      if (window.confirm(`'${newBook.title}' 책을 책장에 추가하시겠습니까?`)) {
        await addToBookshelf(newBook);
        alert("성공적으로 등록되었습니다!");
      }
    } catch (err) {
      alert("등록 실패: " + err.message);
    }
  };

  useEffect(() => {
    if (!urlQ) {
      setItems([]);
      setErrorText("");
      setPage(1);
      setIsLast(true);
      setTotalCount(0);
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const seq = ++requestSeqRef.current;

    const fetchFirst = async () => {
      setLoading(true);
      setErrorText("");
      setItems([]);
      setPage(1);
      setIsLast(true);
      setTotalCount(0);

      try {
        const data = await searchBooks(urlQ, 1, PAGE_SIZE);

        if (seq !== requestSeqRef.current) return;

        const list = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data)
          ? data
          : [];
        const serverTotal = Number(data?.totalCount ?? list.length);
        const serverIsLast = Boolean(data?.isLast ?? (list.length < PAGE_SIZE));
        const serverPage = Number(data?.page ?? 1);

        setItems(list);
        setPage(serverPage);
        setIsLast(serverIsLast);
        setTotalCount(serverTotal);
      } catch (e) {
        if (seq !== requestSeqRef.current) return;
        setErrorText(e?.message || "검색 중 오류가 발생했습니다.");
        setItems([]);
      } finally {
        if (seq !== requestSeqRef.current) return;
        setLoading(false);
      }
    };

    fetchFirst();
  }, [urlQ]);

  const onLoadMore = useCallback(async () => {
    if (!urlQ) return;
    if (loading || loadingMore) return;
    if (isLast) return;

    const nextPage = page + 1;
    const seq = ++requestSeqRef.current;

    setLoadingMore(true);
    setErrorText("");

    try {
      const data = await searchBooks(urlQ, nextPage, PAGE_SIZE);

      if (seq !== requestSeqRef.current) return;

      const nextItems = Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data)
        ? data
        : [];
      const serverIsLast = Boolean(
        data?.isLast ?? (nextItems.length < PAGE_SIZE)
      );
      const serverTotal = Number(data?.totalCount ?? 0);

      if (serverTotal > 0) setTotalCount(serverTotal);

      setItems((prev) => {
        const map = new Map();
        for (let i = 0; i < (prev || []).length; i++) {
          const b = prev[i];
          map.set(buildStableKey(b, i), b);
        }
        for (let j = 0; j < nextItems.length; j++) {
          const b = nextItems[j];
          map.set(buildStableKey(b, (prev || []).length + j), b);
        }
        return Array.from(map.values());
      });

      setPage(nextPage);
      setIsLast(serverIsLast);
    } catch (e) {
      if (seq !== requestSeqRef.current) return;
      setErrorText("더보기 중 오류가 발생했습니다.");
    } finally {
      if (seq !== requestSeqRef.current) return;
      setLoadingMore(false);
    }
  }, [urlQ, loading, loadingMore, isLast, page]);

  const canLoadMore = hasQuery && items.length > 0 && !isLast;

  useEffect(() => {
    const target = observerTargetEl.current;
    if (!target || !canLoadMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [canLoadMore, loadingMore, onLoadMore]);

  return (
    <div className="searchPage">
      <header className="searchHeader">
        <h1 className="searchTitle">도서 검색</h1>
        <p className="searchDesc">ISBN 또는 제목으로 읽고 싶은 책을 찾아보세요.</p>
      </header>

      <form className="searchForm" onSubmit={onSubmit}>
        <div className="searchPill">
          <input
            className="searchInput"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="예: 한강, 데미안..."
            aria-label="책 검색어"
          />
          {q && (
            <button type="button" className="searchClearBtn" onClick={onClear}>
              ×
            </button>
          )}
          <button
            type="submit"
            className="searchSubmitBtn"
            disabled={loading || !hasQuery}
          >
            검색
          </button>
        </div>
      </form>

      {!hasQuery && (
        <ManualRegisterForm
          searchKeyword={trimmedQ}
          onRegister={handleManualRegister}
        />
      )}

      {hasQuery && !loading && !errorText && (
        <div className="searchMessage" style={{ marginTop: 10, padding: "20px 0" }}>
          <span>📚</span> 현재 {items.length.toLocaleString()}개 표시 중
          {totalCount > 0 && ` / 전체 ${totalCount.toLocaleString()}개`}
        </div>
      )}

      <div className="searchResult">
        {loading ? (
          <SearchSkeleton />
        ) : errorText ? (
          <div className="searchMessage" style={{ color: "var(--error)" }}>
            <span>⚠️</span> {errorText}
          </div>
        ) : !hasQuery ? (
          <div className="searchMessage">
            <span>🔍</span> 찾으시는 책의 제목, 저자 또는 ISBN을 입력해주세요.
          </div>
        ) : items.length === 0 ? (
          <div className="searchMessage">
            <span>😢</span> 검색 결과가 없습니다.
          </div>
        ) : (
          <>
            {items.map((b, idx) => {
              const isbn = String(b.isbn ?? "").trim();
              const uniqueKey = buildStableKey(b, idx);
              const added = isbn ? isAdded(isbn) : false;
              const pending = isbn ? isPending(isbn) : false;

              return (
                <div
                  key={uniqueKey}
                  className="searchItem"
                  onClick={() => goDetail(b)}
                >
                  <img
                    src={b.coverUrl || FALLBACK_COVER}
                    alt={b.title}
                    className="itemCover"
                  />
                  <div className="itemInfo">
                    <div className="itemTitle">{b.title || "제목 없음"}</div>
                    <div className="itemAuthor">{b.author || "저자 미상"}</div>
                    <div className="itemMeta">
                      {b.publisher} {b.publisher && "·"} {b.publishDate}
                    </div>
                    {!isbn && (
                      <span
                        style={{
                          fontSize: "11px",
                          color: "red",
                          marginTop: "4px",
                        }}
                      >
                        ISBN 없음
                      </span>
                    )}
                  </div>
                  <div className="itemAction">
                    <button
                      type="button"
                      className="addBtn"
                      disabled={!isbn || added || pending}
                      onClick={(e) => onAdd(e, b)}
                    >
                      {added ? "추가됨" : pending ? "..." : "추가"}
                    </button>
                  </div>
                </div>
              );
            })}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "16px 0",
                minHeight: "40px",
              }}
            >
              {canLoadMore ? (
                <div
                  ref={observerTargetEl}
                  style={{
                    width: "100%",
                    textAlign: "center",
                    color: "var(--text-sub)",
                  }}
                >
                  {loadingMore ? "더 불러오는 중..." : ""}
                </div>
              ) : hasQuery && items.length > 0 ? (
                <div className="searchMessage">마지막 페이지입니다.</div>
              ) : null}
            </div>
          </>
        )}
      </div>
    </div>
  );
}