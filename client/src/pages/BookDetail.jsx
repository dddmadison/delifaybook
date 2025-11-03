// src/pages/BookDetail.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { ProgressEditor } from "../components/ProgressEditor.jsx"; // 슬라이더+퀵칩 컴포넌트
import { addBook } from "../api/book";


export default function BookDetail() {
  const navigate = useNavigate();
  const { id } = useParams(); // /book/:id 라우팅에서 id 사용
  const { state } = useLocation();
  const fromSearch = state?.book || null; // Search에서 navigate 시 state로 전달한 book

  // ---- 서버 엔드포인트 베이스(단/복수 스위치 한 곳에서) ----
  // 서버가 /api/books/:id 라우트라면 "/books" 유지
  // 서버가 /api/book/:id 라우트라면 "/book"으로만 바꾸면 됨
  const BOOKS_BASE = "/books";

  // ------ 상태 ------
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(fromSearch?.title ?? "");
  const [author, setAuthor] = useState(fromSearch?.author ?? "");
  const [publisher, setPublisher] = useState(fromSearch?.publisher ?? "");
  const [coverUrl, setCoverUrl] = useState(fromSearch?.cover ?? "");

  const [status, setStatus] = useState("안읽음");
  const [finishedAt, setFinishedAt] = useState(null); // ISO(UTC)
  const [updatedAt, setUpdatedAt] = useState(null); // ISO(UTC)

  const [progress, setProgress] = useState({
    current: 0,
    total: fromSearch?.total ?? 0,
  });
  const lastSavedCurrentRef = useRef(0); // 서버에 저장된 마지막 currentPage (로그 fromPage 계산용)

  const [tags, setTags] = useState([]);
  const [logs, setLogs] = useState([]); // 최신순 정렬 가정

  const [inDb, setInDb] = useState(true);

  // ------ 유틸 ------
  const clamp = (val, min, max) => Math.max(min, Math.min(val, max));
  const fmtKST = (iso) => {
    if (!iso) return "-";
    try {
      return new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });
    } catch {
      return iso;
    }
  };
  const percent = useMemo(() => {
    if (!progress.total || progress.total <= 0) return 0;
    return Math.round((progress.current / progress.total) * 100);
  }, [progress]);

  // ------ API 기본 설정 ------
  const api = React.useMemo(() => axios.create({ baseURL: "/api" }), []);

  // ISBN/제목/저자 기반으로 네이버 도서 표지 가져오기(서버 프록시 사용)
  const fetchCoverFromNaver = React.useCallback(async ({ maybeIsbn, title, author }) => {
    try {
      const res = await api.get("/kr/naver/cover", {
        params: { isbn: maybeIsbn, title, author },
      });
      return res?.data?.image || "";
    } catch {
      return "";
    }
  }, [api]);

  // 문자열이 ISBN처럼 보이는지(단순판별)
  function looksLikeIsbn(v = "") {
    const s = String(v).replace(/[-\s]/g, "");
    return /^\d{13}$/.test(s) || /^[0-9Xx]{10}$/.test(s);
  }

  // ------ 초기 로드 ------
  useEffect(() => {
    let mounted = true;
    async function fetchBook() {
      setLoading(true);
      setError("");
      try {
        const res = await api.get(`${BOOKS_BASE}/${id}`);
        const b = res.data;
        if (!mounted) return;

        setInDb(true);

        // 서버 값 우선, 없으면 검색결과(state) 폴백
        setTitle(b.title ?? fromSearch?.title ?? "");
        setAuthor(b.author ?? fromSearch?.author ?? "");
        setPublisher(b.publisher ?? fromSearch?.publisher ?? "");
        setCoverUrl(b.coverUrl ?? fromSearch?.cover ?? "");

        setStatus(b.status ?? "안읽음");
        setFinishedAt(b.finishedAt ?? null);
        setUpdatedAt(b.updatedAt ?? null);

        const totalPages = b.totalPages ?? fromSearch?.total ?? 0;
        const currentPage = clamp(b.currentPage ?? 0, 0, totalPages);
        setProgress({ current: currentPage, total: totalPages });
        lastSavedCurrentRef.current = currentPage;

        setTags(Array.isArray(b.tags) ? b.tags : []);
        setLogs(Array.isArray(b.readingLogs) ? b.readingLogs : []);
      } catch (err) {
        console.error(err);
        const status = err?.response?.status;
        if (status === 404 && fromSearch) {
          if (!mounted) return;
          setInDb(false);
          setTitle(fromSearch?.title ?? "");
          setAuthor(fromSearch?.author ?? "");
          setPublisher(fromSearch?.publisher ?? "");
          setCoverUrl(fromSearch?.cover ?? "");
          const totalPages = fromSearch?.total ?? 0;
          setProgress({ current: 0, total: totalPages });
          setTags([]);
          setLogs([]);
          setError("");
        } else {
          const msg = err?.response?.data?.message || "책 정보를 불러오지 못했습니다.";
          setError(msg);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }
    fetchBook();
    return () => {
      mounted = false;
    };
    // fromSearch는 초기 폴백 용도라 의존성에서 제외(라우팅 이동 시만 갱신)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 표지 최종 보강(서버/검색 둘 다 없을 때만 네이버 프록시 호출)
  useEffect(() => {
    if (coverUrl) return;
    let cancelled = false;
    (async () => {
      const img = await fetchCoverFromNaver({
        maybeIsbn: looksLikeIsbn(id) ? id : undefined,
        title,
        author,
      });
      if (!cancelled && img) setCoverUrl(img);
    })();
    return () => {
      cancelled = true;
    };
  }, [id, title, author, coverUrl, fetchCoverFromNaver]);

  // ------ 진행도 변경 헬퍼 (0~total 클램프) ------
  const setCurrent = (nextOrUpdater) =>
    setProgress((p) => {
      const next = typeof nextOrUpdater === "function" ? nextOrUpdater(p.current) : nextOrUpdater;
      const cur = clamp(next, 0, p.total);
      return { ...p, current: cur };
    });

  // ------ API: 진행 업데이트(읽기 로그 추가) ------
  const handleCommitProgress = async () => {
    const fromPage = lastSavedCurrentRef.current;
    const toPage = progress.current;
    if (fromPage === toPage) {
      alert("변경된 페이지가 없습니다.");
      return;
    }
    try {
      const payload = {
        fromPage,
        toPage,
        readDate: new Date().toISOString(),
      };
      const res = await api.post(`${BOOKS_BASE}/${id}/readinglogs`, payload);
      const b = res.data;

      // 서버가 최신 Book을 반환한다고 가정
      const totalPages = b.totalPages ?? progress.total;
      const currentPage = clamp(b.currentPage ?? toPage, 0, totalPages);
      setProgress({ current: currentPage, total: totalPages });
      lastSavedCurrentRef.current = currentPage;

      setLogs(Array.isArray(b.readingLogs) ? b.readingLogs : logs);
      setUpdatedAt(b.updatedAt ?? updatedAt);

      if (b.status && b.status !== status) setStatus(b.status);

      alert("진행도가 저장되었습니다.");
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "진행 업데이트 중 오류가 발생했습니다.";
      alert(msg);
    }
  };

  // ------ API: 상태 변경 ------
  const patchStatus = async (nextStatus) => {
    try {
      const res = await api.patch(`${BOOKS_BASE}/${id}/status`, { status: nextStatus });
      const b = res.data;
      setStatus(b.status ?? nextStatus);
      setFinishedAt(b.finishedAt ?? finishedAt);
      setUpdatedAt(b.updatedAt ?? updatedAt);

      // 서버가 currentPage를 조정했다면 반영(완독 처리 시 총페이지로 맞춤 등)
      const totalPages = b.totalPages ?? progress.total;
      const currentPage = clamp(b.currentPage ?? progress.current, 0, totalPages);
      setProgress({ current: currentPage, total: totalPages });
      lastSavedCurrentRef.current = currentPage;
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "상태 변경 중 오류가 발생했습니다.";
      alert(msg);
    }
  };

  const handleComplete = async () => {
    await patchStatus("완독");
  };

  const handleChangeStatusRadio = async (next) => {
    if (next === status) return;
    if (next === "완독") {
      const ok = window.confirm("상태를 '완독'으로 변경할까요? 진행도가 끝으로 맞춰질 수 있습니다.");
      if (!ok) return;
    }
    if (next === "안읽음") {
      const ok = window.confirm("상태를 '안읽음'으로 변경할까요? 진행도를 0으로 초기화할 수 있습니다.");
      if (!ok) return;
    }
    await patchStatus(next);
  };

 const handleAddFromFallback = async () => {
   try {
     const payload = {
       title: title || "제목 미상",
       author: author || "알 수 없음",
       publisher: publisher || "알 수 없음",
       totalPages: progress.total > 0 ? progress.total : 1,
       tags: ["검색추가"],
     };
     await addBook(payload);
     alert("책이 내 책장에 추가되었습니다.");
     // 방금 추가된 DB 데이터로 다시 불러오고 싶다면,
     // 1) 서버가 ID를 반환하는 API라면 거기로 navigate,
     // 2) 아니면 동일 경로에서 강제 리로드로 fetchBook 재시도
     window.location.reload();
   } catch (e) {
     console.error(e);
     alert("추가 중 오류가 발생했습니다.");
   }
};


  // ------ 스타일 토큰 ------
  const chip = {
    display: "inline-block",
    padding: "2px 8px",
    borderRadius: 8,
    background: "#f2f4f7",
    marginRight: 6,
    fontSize: 12,
  };
  const row = { display: "flex", gap: 16, flexWrap: "wrap" };
  const card = { border: "1px solid #e5e7eb", borderRadius: 12, padding: 16, marginTop: 12 };

  if (loading) {
    return (
      <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
        <div style={{ opacity: 0.6 }}>로딩 중…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
        <div style={{ color: "#b91c1c" }}>{error}</div>
        <button onClick={() => navigate(-1)} style={{ marginTop: 12 }}>뒤로가기</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => navigate(-1)}
            aria-label="뒤로가기"
            style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}
          >
            ←
          </button>
          <div>
            <b>내 책장</b> / <b>책 상세</b>
          </div>
        </div>
        <button aria-label="설정" style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>
          ⚙
        </button>
      </div>

      {/* 핵심 정보 */}
      <div style={{ ...row, marginTop: 16, alignItems: "flex-start" }}>
        <div style={{ width: 140, height: 200, background: "#e5e7eb", borderRadius: 8, overflow: "hidden" }}>
          <img
            src={coverUrl || "https://placehold.co/240x320?text=No+Cover"}
            alt="표지"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={(e) => (e.currentTarget.src = "https://placehold.co/240x320?text=No+Cover")}
          />
        </div>
        <div style={{ flex: 1, minWidth: 260 }}>
          <h2 style={{ margin: "0 0 8px" }}>{title || "제목 미상"}</h2>
          <div>
            저자 | 출판사: <b>{author || "-"}</b> | <b>{publisher || "-"}</b>
          </div>
          
          {/* 헤더 아래 안내 */}
          {!inDb && (
            <div style={{
              marginTop: 12, padding: "10px 12px",
              border: "1px dashed #cbd5e1", borderRadius: 10, background: "#f8fafc",
              display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8
            }}>
              <div style={{ fontSize: 13, color: "#334155" }}>
                이 책은 아직 <b>내 책장</b>에 없습니다. (검색 결과 폴백 보기)
              </div>
              <button onClick={handleAddFromFallback}
                style={{ border: "1px solid #e5e7eb", background: "#fff", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>
                내 책장에 추가
              </button>
            </div>
          )}


          {/* 상태 라디오 (수동 우선) */}
          <fieldset style={{ border: 0, padding: 0, marginTop: 8 }}>
            <legend style={{ position: "absolute", left: -9999 }}>읽기 상태</legend>
            {["안읽음", "진행중", "완독"].map((s) => (
              <label key={s} style={{ marginRight: 10 }}>
                <input type="radio" name="status" checked={status === s} onChange={() => handleChangeStatusRadio(s)} /> {s}
              </label>
            ))}
          </fieldset>

          {/* 태그 */}
          <div style={{ marginTop: 8 }}>
            태그:
            {tags && tags.length > 0 ? (
              tags.map((t) => (
                <span key={t} style={chip}>
                  #{t}
                </span>
              ))
            ) : (
              <span style={{ marginLeft: 6, color: "#6b7280" }}>없음</span>
            )}
          </div>

          {/* 진행도: 슬라이더 + 퀵칩(±1/±5/±10) */}
          <div style={{ marginTop: 12 }}>
            <ProgressEditor
              current={progress.current}
              total={progress.total}
              onChangeCurrent={setCurrent}
              disabled={progress.total <= 0}
            />
            <div style={{ marginTop: 6, fontSize: 13, color: "#374151" }} aria-live="polite">
              진행도: {percent}% ({progress.current} / {progress.total}쪽)
            </div>
            <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
              마지막 업데이트: {fmtKST(updatedAt)}
            </div>
          </div>
        </div>
      </div>

      {/* 완독 정보 */}
      <section style={card}>
        <h3 style={{ margin: 0 }}>완독 정보</h3>
        <div>- 완독일: {finishedAt ? fmtKST(finishedAt).slice(0, 13) : "-"}</div>
        {/* 리뷰/평점은 서버 필드 명세에 따라 추가 바인딩 가능 */}
        {/* <div>- 한줄리뷰: {shortReview || "-"}</div>
        <div>- 평점: {rating ? `★`.repeat(Math.floor(rating)) : "-"}</div> */}
      </section>

      {/* 기본 정보 (필드 존재 시 확장) */}
      <section style={card}>
        <h3 style={{ margin: 0 }}>기본 정보</h3>
        {/* 출간일, ISBN 등은 서버 응답 구조에 맞춰 바인딩 */}
        <div>- 메모: (추후 바인딩)</div>
      </section>

      {/* 읽기 기록 */}
      <section style={card}>
        <h3 style={{ margin: 0 }}>읽기 기록</h3>
        {logs && logs.length > 0 ? (
          <div style={{ marginTop: 6 }}>
            {logs.map((lg, idx) => (
              <div key={idx}>
                - {fmtKST(lg.readDate)}: {lg.fromPage} → {lg.toPage}쪽 ({(lg.toPage ?? 0) - (lg.fromPage ?? 0)}쪽)
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#6b7280", marginTop: 6 }}>기록 없음</div>
        )}
      </section>

      {/* 액션 버튼 */}
      <div style={{ ...row, marginTop: 12 }}>
        <button onClick={handleCommitProgress} disabled={!inDb}>[진행 업데이트]</button>
        <button onClick={handleComplete} disabled={!inDb}>[완독 처리]</button>
        <button onClick={() => alert("리뷰 편집 모달")}>[리뷰 편집]</button>
        <button onClick={() => setTags((ts) => (ts.includes("DB") ? ts : [...ts, "DB"]))}>[태그 편집(+DB)]</button>
      </div>
    </div>
  );
}
