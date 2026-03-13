import React, { useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/home.css";
import { useBooks } from "../context/BooksContext";
import { useAuth } from "../context/AuthContext";

function getPercent(current, total) {
  if (!total || total <= 0) return 0;
  return Math.min(100, Math.round((current / total) * 100));
}

function safeStr(v) {
  return v == null ? "" : String(v).trim();
}

function normalizeBookStatus(book, progressByIsbn) {
  const rawStatus = safeStr(book?.status).toLowerCase();
  const progress = progressByIsbn?.[book?.isbn] || book?.progress;

  const current = Number(progress?.current ?? 0);
  const total = Number(progress?.total ?? 0);

  if (total > 0) {
    if (current >= total) return "done";
    if (current > 0) return "reading";
  }

  if (rawStatus === "reading") return "reading";
  if (rawStatus === "done" || rawStatus === "completed") return "done";
  if (rawStatus === "wish" || rawStatus === "unread" || rawStatus === "") return "wish";

  return "wish";
}

export default function HomePage() {
  const navigate = useNavigate();
  const { bookshelf, progressByIsbn, reset } = useBooks();
  const { isAuthed, user, logout } = useAuth();

  const onLogout = useCallback(async () => {
    await logout();
    if (reset) reset();
    navigate("/login", { replace: true });
  }, [logout, reset, navigate]);

  const stats = useMemo(() => {
    if (!Array.isArray(bookshelf)) {
      return { reading: 0, done: 0, wish: 0 };
    }

    return bookshelf.reduce(
      (acc, book) => {
        const status = normalizeBookStatus(book, progressByIsbn);

        if (status === "reading") acc.reading += 1;
        else if (status === "done") acc.done += 1;
        else acc.wish += 1;

        return acc;
      },
      { reading: 0, done: 0, wish: 0 }
    );
  }, [bookshelf, progressByIsbn]);

  const continueReading = useMemo(() => {
    if (!Array.isArray(bookshelf)) return [];

    const active = bookshelf.filter((book) => {
      const status = normalizeBookStatus(book, progressByIsbn);
      return status === "reading";
    });

    active.sort((a, b) => {
      const pa = progressByIsbn?.[a.isbn] || a.progress;
      const pb = progressByIsbn?.[b.isbn] || b.progress;
      const dateA = pa?.updatedAt ? new Date(pa.updatedAt).getTime() : 0;
      const dateB = pb?.updatedAt ? new Date(pb.updatedAt).getTime() : 0;
      return dateB - dateA;
    });

    return active.slice(0, 10);
  }, [bookshelf, progressByIsbn]);

  const displayName = user?.nickname || user?.email?.split("@")[0] || "회원";

  return (
    <div className="homeContainer">
      <header className="homeHeader">
        <h2 className="homeGreeting">
          {isAuthed ? (
            <>
              반가워요, <span className="highlight">{displayName}</span>님 👋
            </>
          ) : (
            "나만의 독서 기록을 시작해보세요"
          )}
        </h2>
        {isAuthed ? (
          <button className="btn-text" onClick={onLogout}>
            로그아웃
          </button>
        ) : (
          <Link to="/login" className="btn btn-primary btn-sm">
            로그인
          </Link>
        )}
      </header>

      <section className="homeBanner">
        <div className="bannerContent">
          <h1 className="bannerTitle">
            기록은 가볍게,
            <br />
            성장은 선명하게
          </h1>
          <p className="bannerDesc">
            읽고 있는 책의 진행도와 메모를 한 곳에서 관리하세요.
          </p>
        </div>
      </section>

      {isAuthed && (
        <section className="statsSection">
          <div className="statCard">
            <span className="statLabel">읽는 중</span>
            <span className="statValue">{stats.reading}</span>
          </div>
          <div className="statCard">
            <span className="statLabel">다 읽음</span>
            <span className="statValue">{stats.done}</span>
          </div>
          <div className="statCard">
            <span className="statLabel">읽고 싶음</span>
            <span className="statValue">{stats.wish}</span>
          </div>
        </section>
      )}

      <section className="homeSection">
        <div className="sectionHead">
          <h3>이어서 읽기</h3>
          {isAuthed && continueReading.length > 0 && (
            <Link to="/bookshelf" className="moreLink">
              전체보기 →
            </Link>
          )}
        </div>

        {!isAuthed ? (
          <div className="emptyBox">
            <Link to="/login" className="link-text">
              로그인
            </Link>
            하고 책장을 확인해보세요.
          </div>
        ) : continueReading.length === 0 ? (
          <div className="emptyBox">
            아직 읽고 있는 책이 없어요.
            <br />
            <Link to="/search" className="link-primary">
              새로운 책을 찾아볼까요?
            </Link>
          </div>
        ) : (
          <div className="readingScroll">
            {continueReading.map((book) => {
              const p = progressByIsbn?.[book.isbn] || book.progress;
              const pct = getPercent(p?.current, p?.total);

              return (
                <Link key={book.isbn} to={`/book/${book.isbn}`} className="readingCard">
                  <div className="readingCoverWrap">
                    <img
                      src={book.coverUrl || "/nocover.png"}
                      alt={book.title}
                      className="readingCover"
                    />
                    <div className="readingOverlay">
                      <span className="readingPercent">{pct}%</span>
                    </div>
                  </div>
                  <div className="readingInfo">
                    <div className="readingTitle">{book.title}</div>
                    <div className="miniProgress">
                      <div className="miniFill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}